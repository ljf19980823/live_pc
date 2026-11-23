# iOS 点播：播放地址过期怎么处理

供 Android / Web / 鸿蒙对照。依据当前 edu-live iOS 代码，不是设计稿。

这里的「视频过期」指回放 / 课程视频的播放地址带签名（MinIO `X-Amz-*`、OSS `auth_key` 等），签名过期后同一条视频的 URL 会变，旧链接请求会失败。

接口模型里没有单独的「视频过期时间」字段。`EduHistoryLessonFileItem` 只有 `fileName`、`fileSize`、`filePath`、`videoType`、`duration`。班级「已过期」是另一套逻辑，不拦点播，见文末。

## 结论（先看这个）

1. 点播用的就是进页时接口下发的完整 `filePath`（含 query）。播放器不解析过期时间，也不在失败后重新请求接口换新签名。
2. 认「是不是同一条视频」时丢掉 `?` / `#` 后面的签名。课堂视频（路径里有 `live-video/`）再丢掉域名和 `/livefile/`，MinIO 和 OSS 算同一个对象。
3. 已在「我的下载」里下完、文件还在，横屏点播直接播本地 `file://`，不再打过期链接。
4. 播放失败只对**当前这条 URL** 重试。重试完仍失败，提示用户手动重试；手动重试还是这条 URL，不会刷新签名。
5. 阿里云播放器按完整 URL 做的本地整文件缓存关掉。签名一变缓存对不上，重复看走「我的下载」。

用户要拿到新签名，只能离开页面再进，让列表 / 详情重新拉接口。播放器内部不会做这件事。

## 地址从哪来

播放地址来自课程详情、历史课堂、学习中心最近观看 / 收藏等接口，不经过阿里云 PlayAuth。

| 路 | 新结构 | 旧结构 |
|---|---|---|
| 主路（白板 / 内容，`videoType == 1`） | `fileList` 里主路的 `filePath` | 顶层 `filePath` |
| 副路（摄像头，`videoType == 2`） | `fileList` 里副路的 `filePath` | 顶层 `sub_video_url` |

`fileList` 只有一个有效文件时，不管 `videoType`，都当主路，不建副路。多个文件时主路优先 `videoType == 1`，副路优先 `videoType == 2`。

真正起播把完整字符串塞进阿里云 `AVPUrlSource`，query 原样保留。空地址或解析失败：横屏提示「播放地址无效」，内嵌提示「播放地址无效」。

## 同一条视频怎么认（签名可以变）

实现：`DownloadURLNormalizer`。

1. trim，没有 `://` 则补 `https://`，host 为空则整段无效。
2. 课堂笔记伪地址 `class-notes.edulive.local` 整段保留（query 是身份，不裁）。
3. 其它地址截到第一个 `?` 或 `#` 之前。
4. 若 path 含 `live-video/`，稳定键改成从 `live-video/` 起到 path 结束（不含 query）。`/livefile/` 不进键。键长度必须大于 `live-video/`。
5. 不含 `live-video/` 的地址，稳定键是去掉 query 后的完整 URL（含 scheme 和 host）。

示例（两条是同一条课堂视频）：

```
https://minio.example/livefile/live-video/2026/a.mp4?X-Amz-Signature=old
https://oss.example/live-video/2026/a.mp4?auth_key=new
稳定键：live-video/2026/a.mp4
```

这条键用于：

- 「我的下载」去重、断点身份、已完成文件匹配（主路 `remoteURL`、副路 `subRemoteURL` 都比）
- 点播续播进度（按登录用户分桶）
- 判断主路和副路是不是同一条，避免双路叠音

续播读进度时：先读稳定键，没有再读旧键 `scheme://host/path`（兼容 MinIO 时期写入的记录）。新写入只用稳定键。

本地 `file://` 的续播键是 `file:` + 路径，不走上面的 http 规则。

## 已下载则不走网络地址

横屏播放器 `AliyunVodPlayerViewController` 构造时：

- 已经是 `file://`：直接用。
- 否则查当前登录用户「我的下载」里 status 已完成、本地文件仍可播、稳定键相同的记录。
- 主路命中用主文件，副路命中用副文件，返回本地 `file://`。
- 主路和副路解析后稳定键相同：丢掉副路，只播一路。

因此签名过期不影响「已经下完」的横屏播放。

内嵌播放器（AI 笔记录播详情小窗）用的是进页时的网络地址，构造时不改成本地文件。从小窗放大到横屏是把正在播的播放器交出去，不会为了换本地文件重载。之后在横屏里点「重试」，会按横屏规则重新解析，这时才可能改播本地文件。

离线且主路、副路都是本地文件时，不监听网络，也不出「网络不可用」条。

## 播放器对过期链接的重试

底层 `AUIRoomVodPlayer`（阿里云 AliPlayer）：

| 项 | 值 | 作用 |
|---|---|---|
| `networkTimeout` | 15000 ms | 首包超时 |
| `networkRetryCount` | 2 | SDK 内部网络重试次数 |
| `startBufferDuration` | 500 ms | 起播缓冲 |
| `highBufferDuration` | 3000 ms | 高缓冲水位 |
| `maxBufferDuration` | 10000 ms | 最多预读约 10 秒，避免把大 MP4 一次拉满 |
| `enableLocalCache` | NO | 不按完整 URL 做整文件缓存 |

`onError` 不看错误码，不区分 403、签名过期、断网、404。外层再起播：

1. 已重试次数 `< 2`：回调 `willRetry = true`，1.5 秒后 `stop`，再用**同一条** `play_url` `prepare`。
2. 两次都失败：`stop`，回调 `willRetry = false`。
3. `PrepareDone` 成功后把外层计数清零。

外层以前是 10 次、间隔 0.5 秒。双路会把同一段 MP4 重复打到源站，所以改成现在的 2 次、1.5 秒。

UI：

| 场景 | 自动重试过程中 | 重试耗尽 |
|---|---|---|
| 横屏主路 | 保持缓冲菊花，暂停副路，不弹错误 | 「播放失败，请重试」+「重试」 |
| 内嵌主路 | 继续转圈，不切失败条 | 「播放失败」+「重试」 |
| 副路 | 副路维持缓冲，必要时暂停主路 | 拆掉副路，只留主路，不弹整页错误 |

手动「重试」会拆掉旧播放器再 `prepare` 一次。地址仍是进播放器时那条（横屏若当时已解析成 `file://`，则重试本地文件）。不会调详情接口。

## 下载侧和播放的差别

播放失败不会触发重新下载，也不会拿新签名续传。

预览缓存 / PDF 缓存的**已完成文件**按稳定键命中，签名变了仍用本地文件。

断点 `resumeData` 绑的是当次完整 URL（含 query）。换签名后不复用旧断点，避免用过期链接续传；会按新 URL 重新下。

## 其它端建议对齐的行为

1. 播放用接口下发的完整 URL，不要自己改 query。
2. 去重、续播、已下载命中用上面的稳定键，不要用整段签名 URL 当主键。
3. 课堂视频把 MinIO（带 `/livefile/`）和 OSS 收成同一个 `live-video/...` 对象键。
4. 已下载完成且文件在，优先本地播放。
5. 失败只重试当前 URL，次数要有上限；不要在失败回调里立刻再请求同一签名几十次。
6. 不要按完整 URL 做播放器整文件缓存。
7. 签名过期后要新地址：重新进页拉接口。播放器内重试解决不了 403。
8. 副路失败可以降成单路，主路失败才出错误页。

## 不要和这些混在一起

- **班级有效期「已过期」**：班级列表 / 成员页的状态。注释写「过期后班级关联内容全部不可看」，但点播播放器不读这个状态，也不拦截播放。
- **登录 token 过期**：`401` / `4011`，清会话回登录页。文案「登录已过期，请重新登录」。和视频地址无关。
- **直播拉流 `auth_key` 滚动**：直播间比较拉流地址时会剥掉 `auth_key`，避免同一路流被拆掉重建。点播不走这套，点播是直接丢掉整个 query。
- **阿里云 License 过期**：直播 CDN 播放器才有降级。点播 `onError` 不识别 License 错误码。

## 代码位置

| 行为 | 文件 |
|---|---|
| 稳定键、去掉签名 | `EduLive/Services/Download/DownloadURLNormalizer.swift` |
| 已下载改播本地 | `EduLive/Services/Download/DownloadManager.swift` `preferredLocalPlayURLStringIfDownloaded` |
| 横屏起播、错误页、手动重试 | `EduLive/UI/Components/AliyunVodPlayerViewController.swift` |
| 内嵌起播、失败条 | `EduLive/Modules/AIListening/RecordedLessonInlineVodPlayerView.swift` |
| 续播键 | `EduLive/Core/Utilities/VodLocalPlaybackProgressStore.swift` |
| SDK 缓冲、关本地缓存、外层重试 2 次 | `AUIInteractionLive/Source/Core/Player/AUIRoomVodPlayer.m` |
| 主副路选择 | `EduLive/Core/Network/StudyCenterAPIModels.swift` `EduHistoryLessonFileItem` |
| 断点不复用过期链接 | `EduLive/Services/DocumentViewer/PreviewDocumentFetcher.swift` |
