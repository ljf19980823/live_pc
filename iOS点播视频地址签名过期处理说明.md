# iOS 点播「播放地址签名过期」处理说明（供其他端对照）

> 适用范围：EduLive iOS 端「点播 / 回放 / 课程视频」播放链路（`AliyunVodPlayerViewController` 全屏点播、`RecordedLessonInlineVodPlayerView` AI 听记内嵌小窗）。
> 结论时间：基于当前 `dev_1106` 分支源码整理，代码位置见文末索引。
> 说明：「视频过期」在本文中特指**播放地址（带签名的 URL）过期**，不是班级/回放业务有效期到期。

---

## 一、结论速览（先看这张表）

| 维度 | iOS 当前行为 |
| --- | --- |
| 是否解析签名有效期 | 否。不解析 URL 里的 `X-Amz-Expires` / `X-Amz-Date` / `Expires` 等参数，客户端不预判过期 |
| 是否在播放中自动续签 / 刷新 URL | 否。没有“过期前回调刷新播放地址”的实现 |
| 地址来源 | 全部由服务端接口下发（`filePath` / `fileList[].filePath` / `sub_video_url`），客户端不生成、不续签签名 |
| 过期后的实际恢复方式 | 退出播放器 → 重新进入列表/详情（重新请求接口拿新签名）；或命中「我的下载」本地文件直接离线播放 |
| 播放失败的重试 | 网络层重试 2 次 + 播放器实例最多再重启 2 次（间隔 1.5s），全部失败后展示「播放失败，请重试」 |
| 重试按钮是否会换新签名 | 否。重试只是用**同一个 URL** 重建播放器/重新起播，签名已过期时仍会失败 |
| 是否按错误码区分“签名过期”与“网络错误” | 否。AUI 播放器只回调 `willRetry`，错误码未透传到业务层，所有终态错误文案统一 |
| 播放器本地缓存 | 关闭（`enableLocalCache = NO`），原因就是签名 URL 变化导致缓存 key 对不上 |
| 与签名变化相关的数据一致性 | 续播进度、下载去重/断点、本地文件命中，均使用**去掉签名 query 的稳定 key**，签名刷新不影响这些能力 |

一句话总结：
**iOS 对“签名过期”没有专门处理，属于通用播放失败链路——重试不换地址，靠用户重新拉接口/走本地下载恢复；但所有与 URL 绑定的缓存、续播、下载去重都做了“去签名”的稳定化处理，避免签名变化引发副作用。**

---

## 二、播放地址从哪来、为什么带签名

1. 回放/课程视频地址由接口下发：
   - 单路回放：`filePath`（新结构优先 `fileList[0].filePath`）
   - 双路回放：主路 `fileList[].videoType == 1`，副路 `videoType == 2`；旧结构为 `filePath` + `sub_video_url`
2. 地址指向 MinIO/OSS 的课堂视频对象，**带签名 query**。源码注释明确写了这一点：

   > `AliyunVodPlayerViewController.swift` 头部注释：历史回放 / 课程视频地址带签名，整文件缓存对不上。

3. 客户端不参与签名生成、不解析过期时间、不刷新签名；地址在进入播放器前就已确定（列表/详情接口下发的值）。

关键点：**同一视频每次请求接口拿到的签名 URL 可能不同，但去掉 query 后指向同一个视频对象。**

---

## 三、播放链路处理（全屏点播）

### 3.1 起播前的第一道“过期规避”：本地下载优先

全屏播放器在 `init` 阶段就会做一次本地命中：

- `playURL` 先走 `resolvePlayURLPreferringLocalDownload()`；
- 若当前登录用户在「我的下载」中已有该视频的**已完成可播放本地文件**，则直接把 `playURL` 替换成 `file://`；
- 匹配规则不是字符串完全相等，而是**去签名的资源 key 相等**（见第五节），因此即使接口下发的是新签名 URL，也能命中旧下载；
- 副路 `subVideoURL` 同样处理；若主副路解析后实质相同，则不创建副路（避免同源叠音）。

效果：**只要用户下载过，签名是否过期都不影响播放。**

### 3.2 起播与重试策略（重点）

播放器底层封装为 `AUIRoomVodPlayer`（AUI 源码在仓库内），其点播配置：

- `startBufferDuration = 500ms`、`highBufferDuration = 3000ms`、`maxBufferDuration = 10000ms`
- `networkTimeout = 15000ms`
- `networkRetryCount = 2`（AliPlayer 网络层重试）
- `enableLocalCache = NO`（关闭按完整 URL 的本地整文件缓存）

播放器错误处理（`AUIRoomVodPlayer.m - onError:errorModel:`）：

- SDK 层面最多再起播 **2 次**，间隔 **1.5s**；
- 每次准备重试时回调 `onPlayErrorBlock(YES)`；
- 重试次数用尽后 `stop` + `onPlayErrorBlock(NO)`，由业务层展示错误。

业务层（全屏播放器）回调行为：

| 回调 | iOS 行为 |
| --- | --- |
| `onPlayErrorBlock(YES)` | 维持“缓冲中”菊花态，并暂停副路；不弹错，避免页面闪烁 |
| `onPlayErrorBlock(NO)` | 清空主/副路缓冲态，展示错误浮层「播放失败，请重试」 |
| 点击「重试」 | `retryTapped()` → 重新 `setupVodPlayer()`，**仍使用同一个 `playURL`**（不会重新请求接口换签名） |

副路（双路场景）：

| 回调 | iOS 行为 |
| --- | --- |
| 副路 `willRetry = YES` | 标记副路缓冲中，并按既有策略暂停主路等待 |
| 副路最终失败 | `fallbackToMainRouteOnly()`：拆掉画中画副路，Toast「副路异常，已切换单路播放」，主路继续播 |

### 3.3 内嵌小窗（AI 听记）链路差异

`RecordedLessonInlineVodPlayerView`：

- 使用 `configuration.playURL` 直接起播，**不做全屏播放器那套“本地下载优先”替换**；
- 错误回调同样只区分 `willRetry`：`willRetry == true` 时静默保持 loading；最终失败展示「播放失败」错误条 + 重试按钮；
- 重试 = `stopPlaybackIfNeeded()` + `startInlinePlayback()`，**仍用原 URL**；
- 从内嵌点“放大”进入全屏时走 handoff（移交同一播放器实例），不会因为切全屏而重新拉签名。

因此：**AI 详情页停留很久后再点播放，若签名已过期，小窗会直接失败；退出重进详情/列表才能恢复。**

### 3.4 错误码层面的事实

AliPlayer 的 `AVPErrorCode` 中与“签名/鉴权/过期”相关的错误码确实存在，例如：

| 错误码 | 含义 |
| --- | --- |
| `0x2001010D` `ERROR_SERVER_POP_TOKEN_EXPIRED` | Token 过期 |
| `0x20010206` `ERROR_SERVER_VOD_INVALIDAUTHINFO_EXPIRETIME` | AuthInfo 过期 |
| `0x2001031A` `ERROR_SERVER_MPS_SIGNATURE_CHECK_EXPIREDTIME_FAILED` | 指定到期时间值已过期 |
| `0x20050005` `ERROR_NETWORK_HTTP_403` | HTTP 403（签名失效常见表现） |
| `0x2005000D/0x2005000E` | 刷新 URL 失败 / 刷新重试超限 |

但 iOS 当前实现中：

- `AUIRoomVodPlayer` 的 `onError` **没有把 `errorModel` 透传给业务层**；
- 业务层只收到 `willRetry` 布尔值；
- 因此**无法区分“签名过期”“403”“网络超时”“解码失败”**，统一走「播放失败，请重试」。

如果其他端需要“识别签名过期并静默换地址”，iOS 目前不具备该能力，需要新增错误码透传。

---

## 四、签名过期后的恢复路径（实际可用）

按优先级：

1. **命中本地下载（最优先）**：全屏点播入口自动替换为 `file://`，与签名无关。
2. **退出重进 / 下拉刷新列表或详情**：重新请求接口 → 拿到新签名 URL → 重新创建播放器即可正常播放。
   - 注意：学习中心 / 课表 / 课程树这类**列表型入口**点播放时，iOS 不会在点击瞬间再请求一次详情，直接使用列表里已缓存的 URL；页面停留时间超过签名有效期就会出现“首次起播即失败”。（独立共享资料例外：打开前会请求 `GET /edu/resource/detail` 取最新地址。）
3. **页面内点「重试」**：只重建播放器，不换 URL，签名已过期时无效（但仍可覆盖网络抖动场景）。
4. **播放中签名过期**：无续签机制；SDK 重试用尽后进入错误态，只能退出重进（或已下载则本地播放）。

**不存在的能力（其他端不要误以为 iOS 有）**：
- 播放前预判 URL 是否过期；
- 播放中刷新播放地址（类似直播 CDN 的 URL 刷新）；
- 出错后自动请求详情接口换新签名并原位恢复；
- 针对签名过期的专属文案/弹窗。

---

## 五、与“签名变化”相关的数据一致性策略（其他端重点对照）

这一节是 iOS 已经做过的、与签名相关的稳定性处理，建议各端对齐。

### 5.1 稳定资源 key（去签名）

`DownloadURLNormalizer.stableResourceKey`：

- `http(s)` 地址去掉 `?` / `#` 之后的全部 query（即去掉签名）；
- 课堂视频路径含 `live-video/` 时，进一步去掉域名与 `/livefile/` 前缀，只保留 `live-video/...` 对象路径；
- MinIO 与 OSS 的同一对象得到同一个 key；
- 课堂笔记伪地址（`class-notes.edulive.local`）例外：query 是身份，不裁剪。

用途：下载去重、断点身份、本地文件命中、续播进度 key。

### 5.2 播放续播进度

`VodLocalPlaybackProgressStore`：

- 进度按「登录用户 + 稳定资源 key」本地持久化；
- 读取时先按稳定 key，再回退旧的 `scheme://host/path` key（兼容历史数据）；
- 因此**接口换了新签名 URL，用户仍能从上次位置续播**；
- 自然播完（≥97%）标记完成，下次从头播。

### 5.3 下载去重 / 断点续传

`DownloadManager.startDownload`：

- 记录身份用稳定 key 匹配（`resourceKeysMatch`），不比较完整 URL；
- 若本次传入的 URL（新签名）与记录中的旧 URL 不同：
  - 把记录里的 `remoteURL` / `tiercelTaskId` 更新为新 URL；
  - **清理旧 URL 对应的 Tiercel 缓存**（`purgeTiercelCacheCompletely`），避免旧签名残留导致“假成功/坏缓存”；
  - 副路同理；
- 下载失败按底层错误归类：`URLError` 的网络类错误记为 `networkError`，其余（含 HTTP 状态类失败）记为 `failed`，Toast 展示系统错误文案；**不会自动重新拉接口换签名**，需要用户从入口重新发起下载，此时才会带入新 URL。

### 5.4 播放器本地缓存

`AUIRoomVodPlayer.prepare` 显式关闭：

```objc
// 关闭按完整 URL 的本地整文件缓存。回放地址带签名，缓存对不上；重复观看走「我的下载」本地文件。
config.enableLocalCache = NO;
```

原因：AliPlayer 的本地缓存按完整 URL 做 key，签名一变就命中不了，还会造成重复下载。iOS 的替代方案是**「我的下载」本地文件优先**。

---

## 六、iOS 端到端时序（签名已过期场景）

```
用户停留列表较久（签名过期）
        │
        ▼
点击播放 → 列表缓存中的旧签名 URL
        │
        ├─ 已有本地下载？ ──是──► 直接播 file://（成功）
        │
        否
        ▼
AUIRoomVodPlayer 起播（enableLocalCache=NO）
        │
        ├─ 403/鉴权过期 → AliPlayer 网络层重试 2 次
        │
        ├─ 仍失败 → SDK 再起播 2 次（间隔 1.5s，onPlayErrorBlock(YES) 维持菊花）
        │
        └─ 终态失败 → onPlayErrorBlock(NO) → 「播放失败，请重试」
                          │
                          ├─ 点重试：同 URL 重建播放器（仍失败）
                          └─ 退出重进/刷新列表：请求接口拿新签名（恢复）
```

---

## 七、其他端对照清单（建议逐项确认）

| 项目 | iOS 现状 | 其他端需确认/对齐 |
| --- | --- | --- |
| 过期预判 | 无 | 是否解析签名有效期，做提前刷新 |
| 播放中续签 | 无 | 是否有 URL 刷新能力；若没有，需接受同样的失败重进 |
| 失败重试次数 | 网络层 2 次 + 实例重启 2 次（1.5s） | 重试次数、间隔、是否暂停对侧（双路） |
| 重试是否换签名 | 否 | 若换签名，属于 iOS 未实现的增强能力 |
| 错误码识别 | 不透传，统一文案 | 是否按 403 / AuthInfo 过期做专属处理 |
| 本地下载优先 | 全屏点播入口自动 `file://` | 是否有同等离线兜底 |
| 资源身份 key | 去 query + `live-video/` 对象路径 | 下载去重、续播、断点是否同样去签名 |
| 播放器缓存 | 关闭 | 是否开启；开启时如何避免签名变化导致缓存击穿 |
| 下载 URL 更新 | 新签名替换旧 URL 并清旧 Tiercel 缓存 | 是否清理旧任务缓存，避免坏缓存 |
| 过期提示文案 | 「播放失败，请重试」 | 是否需要更明确的“地址已失效，请刷新”提示 |

---

## 八、已知风险 / 可改进点（供后续迭代参考）

1. **长停留 → 首次起播失败**：列表页不刷新时，签名过期会直接导致起播失败，用户只能退出重进。
2. **错误文案无指向性**：签名过期与网络抖动文案一致，用户不知道“刷新即可”。
3. **重试无效感**：签名过期场景点「重试」必然再次失败（因为不换 URL）。
4. **可考虑的增强**（iOS 当前均未实现）：
   - 在终态失败回调中回查详情接口，拿到新 URL 后原位重建播放器（需接口支持按 lessonId/liveId 取播放地址）；
   - 将 `AVPErrorCode` 透传到业务层，命中 403 / AuthInfo 过期时直接走“刷新地址”而不是普通重试；
   - 起播前做一次轻量详情刷新（成本较高，需权衡）。

---

## 九、关键代码索引

| 文件 | 关键位置 | 说明 |
| --- | --- | --- |
| `EduLive/UI/Components/AliyunVodPlayerViewController.swift` | L10-16、L467、L519-530 | 全屏点播、签名 URL 说明、本地下载优先 |
| 同上 | L588-597 | `resolvePlayURLPreferringLocalDownload` |
| 同上 | L947-966 | 主路错误：`willRetry` 维持菊花 / 终态展示「播放失败，请重试」 |
| 同上 | L1352-1370、L1141-1150 | 副路错误与降级单路 |
| 同上 | L1652-1660、L2579-2587 | 错误浮层与重试（同 URL 重建） |
| 同上 | L538-564 | 本地续播进度读取（稳定 key） |
| `AUIInteractionLive/Source/Core/Player/AUIRoomVodPlayer.m` | L480-504 | 点播配置：缓冲、超时、重试、`enableLocalCache=NO` |
| 同上 | L743-762 | `onError`：最多重启 2 次、1.5s 间隔、`onPlayErrorBlock` |
| `EduLive/Modules/AIListening/RecordedLessonInlineVodPlayerView.swift` | L527-550、L888-924 | AI 内嵌小窗起播与错误处理（同 URL 重试） |
| `EduLive/Services/Download/DownloadURLNormalizer.swift` | L21-56 | 去签名稳定 key、课堂视频对象路径 |
| `EduLive/Services/Download/DownloadManager.swift` | L688-760 | 本地文件命中、`?` 前地址匹配 |
| 同上 | L256-292 | 新签名替换旧 URL、清理旧 Tiercel 缓存 |
| `EduLive/Core/Utilities/VodLocalPlaybackProgressStore.swift` | L34-76 | 续播进度稳定 key 与旧 key 兼容 |
| `Pods/.../Headers/AVPErrorCode.h` | L45、L61、L117、L226-245 | 过期/鉴权/403 相关错误码定义 |
