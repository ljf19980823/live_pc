# 课堂回放 OSS 切换与前端联调指南

## 1. 本次交付与适用范围

后端统一生成课堂回放地址：保留现有接口和 `fileList[].filePath`，增加稳定视频 ID 与签名到期时间。前端使用完整 URL 播放，并按本文处理刷新。

- 数据库路径和视频元数据保持不变，不需要执行数据库迁移。
- 默认仍为 MinIO。确认当前 profile 的 OSS 凭证并设置 `VIDEO_PLAYBACK_PROVIDER=oss`、重启应用后，课堂视频返回 OSS 私有 GET 签名链接。
- 只切换课堂录制及历史视频。课程树中的资料资源、共享资料、图片、封面、二维码仍使用原逻辑。
- `POST /edu/history/save` 继续保存原相对路径。
- 回放时使用返回的 `duration`。不要将 OSS 签名地址传入 `/edu/minio/videoDuration`，该接口仍用于 MinIO 上传辅助场景。
- 不新增刷新或任意路径签名接口；重新请求原业务接口即可获得有效链接。

## 2. 接口清单及视频位置

下表路径均为 GET，未包含部署环境的外部网关前缀。业务鉴权、`appVersion` 等既有请求要求不变。`data` 指 `CommonResult` 的数据字段；应先检查业务 `code`，不能仅依据 HTTP 200 判断成功。

| 接口 | 视频位置 | 刷新时保留的上下文 |
|---|---|---|
| `/edu/history/list` | `data.list[].fileList[]` | 原筛选条件、页码、每页条数 |
| `/edu/history/note-list` | `data.list[].fileList[]` | 原笔记筛选条件和分页 |
| `/edu/course/detail` | `data.detailTree` 递归节点的 `liveInfo.fileList[]` 或 `historyLesson.fileList[]` | 原 `classId`、`courseId` |
| `/edu/recentView/view` | `data[].fileList[]` 中的课堂视频 | 原关键词等参数 |
| `/edu/recentView/collect` | `data[].fileList[]` 中的课堂视频 | 原关键词等参数 |
| `/edu/schedule/list` | `data[].lives[].fileList[]` | 原年份、月份 |
| `/edu/schedule/list-by-range` | `data[].lives[].fileList[]` | 原起止日期 |
| `/edu/after/quiz/list` | `data[].fileList[]` | 原学生、班级、学科、测验时间等筛选参数 |
| `/edu/after/quiz/teacher/list` | `data[].fileList[]` | 原教师、班级、学科、测验时间等筛选参数 |
| `/edu/live/list` | `data[].fileList[]` | 原页面上下文 |
| `/edu/live/latest` | `data.fileList[]`，`data` 可能为空 | 原页面上下文 |

课程树必须递归遍历 `children`，只处理课堂节点的 `liveInfo`、`historyLesson`。不要把 `resource.fileList` 的资料地址一起替换。最近观看、收藏中的资料条目也不属于此次切换。

## 3. 字段约定与返回示例

| 字段 | 类型 | 说明 |
|---|---|---|
| `videoId` | String | `business_video_data.id`；同一课堂视频刷新前后不变；资料条目可能为空或缺省 |
| `filePath` | String，可空 | 完整播放 URL；OSS 模式包含临时签名；空路径不应发起播放 |
| `urlExpireAt` | Long，可空 | Unix **毫秒**时间戳；OSS 签名到期时间；MinIO、外部固定链接和空路径为 `null` |
| `fileName` | String | 原有文件名，仅展示使用，不用于拼接地址 |
| `fileSize` | String | 原有文件大小字段 |
| `duration` | String | 原有时长，单位秒 |
| `videoType` | String | 原有主/辅视频类型，保持现有前端业务解释 |

OSS 模式示例（URL 中的签名是占位值，不可实际访问；时间戳仅作字段示例）：

```json
{
  "videoId": "video-001",
  "fileName": "lesson.mp4",
  "filePath": "https://lisheng-edu-live-test.oss-cn-shenzhen.aliyuncs.com/live-video/org/campus/record/lesson/video.mp4?x-oss-signature-version=OSS4-HMAC-SHA256&x-oss-date=20261108T020000Z&x-oss-expires=7200&x-oss-credential=EXAMPLE&x-oss-signature=EXAMPLE",
  "urlExpireAt": 1794110400000,
  "fileSize": "104857600",
  "duration": "3600",
  "videoType": "1"
}
```

MinIO 模式返回相同结构，示例：

```json
{
  "videoId": "video-001",
  "fileName": "lesson.mp4",
  "filePath": "https://test.live.fjlsjy123.com/livefile/live-video/org/campus/record/lesson/video.mp4",
  "urlExpireAt": null,
  "fileSize": "104857600",
  "duration": "3600",
  "videoType": "1"
}
```

`urlExpireAt=null` 表示不执行签名到期检查，不保证固定链接永久存在或可访问。迁移前后文件名可能相同，必须按 `videoId` 匹配，不能依靠数组下标、文件名或旧 URL。

## 4. 前端播放和刷新规则

1. 使用后端返回的完整 `filePath`。不截断 `?` 后的内容、不替换域名、不重复 URL 编码，不自行追加业务参数。
2. 业务接口继续携带原登录凭证和版本请求头；直接请求 OSS 时不要附加业务 `Authorization`、登录 Cookie 或版本请求头。
3. 视频播放使用 GET，播放器可发送 Range 请求以拖动进度。不要拿 GET 签名链接发送 HEAD 探测；GET 签名不授权 HEAD。
4. 开始或恢复播放前，若 `urlExpireAt` 非空且剩余时间不足 60 秒，先刷新。签名默认两小时有效；客户端时间需正常，允许利用业务 HTTP Date 估算服务器时钟偏差。
5. 保存原接口、原参数、所选 `videoId`；重新请求原接口，从相应层级取出新视频列表并匹配 ID。不要修改原筛选条件扩大权限范围。
6. 播放中发生疑似签名过期的 403 或播放器错误时，保存 `currentTime`、倍速和播放/暂停状态，刷新地址，等新资源 `loadedmetadata` 后恢复。不能仅凭播放器通用错误断定是过期。
7. 每次连续错误最多自动刷新一次；刷新失败或刷新后仍不可播放，停止自动重试并提示。只有新地址已实际稳定播放后才重新开放下一轮错误恢复，不能在 `loadedmetadata` 时就重置重试次数。
8. 原接口拒绝访问、登录失效、业务 `code` 非成功，或新结果找不到 `videoId`：停止自动恢复，提示重新进入页面或处理登录。分页内容变化也可能导致视频移出当前页，不自动跨页查找或继续使用失效地址。
9. 明确的 OSS 404 表示文件不存在，不循环刷新签名；提示并向后端报告 `videoId`、时间、状态码及可获得的 Request ID。不要上报完整签名 URL。
10. 不将签名地址永久写入本地数据库或跨页面长期缓存。保存学习进度时使用业务 ID；重新进入页面重新查询。

### 框架无关伪代码

`requestOriginal` 必须检查业务 `code`、使用原参数，并返回响应；`extractClassroomVideos` 按上表提取课堂视频（课程树需递归）。播放器装载函数应等待元数据且有超时、失败处理。

```javascript
function createPlaybackSession(initialVideo, requestOriginal, extractClassroomVideos, player) {
  const videoId = initialVideo.videoId;
  let current = initialVideo;
  let disposed = false;
  let refreshing = null;
  let errorRefreshUsed = false;

  async function refresh() {
    if (refreshing) return refreshing; // 合并播放器同时产生的多次错误
    refreshing = (async () => {
      const response = await requestOriginal(); // 原接口、原查询参数、业务登录信息
      const next = extractClassroomVideos(response).find(v => v.videoId === videoId);
      if (!next || !next.filePath) throw new Error('视频不可用，请重新进入页面');
      if (!disposed) current = next;
    })();
    try { await refreshing; } finally { refreshing = null; }
  }

  async function beforeStartOrResume() {
    if (current.urlExpireAt != null && current.urlExpireAt - Date.now() < 60_000) {
      await refresh();
    }
    if (!disposed) await player.useUrlAndStartOrResume(current.filePath);
  }

  async function onMediaError(error) {
    if (disposed || refreshing) return;
    if (error.status === 404 || current.urlExpireAt == null || errorRefreshUsed) {
      player.showError('视频暂时无法播放，请重试或联系管理员');
      return;
    }
    errorRefreshUsed = true; // 请求开始前设置，避免并发错误触发循环
    const state = player.captureState(); // 时间、倍速、暂停状态
    try {
      await refresh();
      if (disposed) return;
      await player.loadUrlAndWaitForMetadata(current.filePath);
      if (!disposed) await player.restoreState(state);
    } catch (failure) {
      if (!disposed) player.showError('刷新播放地址失败，请重新进入页面');
    }
  }

  return {
    beforeStartOrResume,
    onMediaError,
    onStablePlayback() { errorRefreshUsed = false; }, // 已确认持续正常播放后调用
    dispose() { disposed = true; } // 切换视频/销毁页面时调用，忽略旧异步请求
  };
}
```

上例不对所有 403 无限重试。403 也可能是存储权限、签名地域或系统时间错误；一次刷新后仍失败应交由后端排查。浏览器播放器未暴露 HTTP 状态时，通过播放器事件及网络面板定位，不能改用 HEAD 探测。

## 5. 后端与部署配置

| 配置项 | 环境变量 | 默认值/说明 |
|---|---|---|
| `video.playback.provider` | `VIDEO_PLAYBACK_PROVIDER` | `minio`；切换填写小写 `oss` |
| `video.playback.bucket` | `VIDEO_PLAYBACK_OSS_BUCKET` | dev：`lisheng-edu-live-test`；prod：`lisheng-edu-live` |
| `video.playback.region` | `VIDEO_PLAYBACK_OSS_REGION` | `cn-shenzhen` |
| `video.playback.endpoint` | `VIDEO_PLAYBACK_OSS_ENDPOINT` | `https://oss-cn-shenzhen.aliyuncs.com`，必须是匹配地域的标准HTTPS外网Endpoint |
| `video.playback.expiration-seconds` | `VIDEO_PLAYBACK_EXPIRATION_SECONDS` | 当前应用配置 `86400`，允许 `60`～`86400` |
| `video.playback.access-key-id` | `VIDEO_PLAYBACK_OSS_ACCESS_KEY_ID` | OSS 模式必填，默认取当前 dev/prod 配置，环境变量可覆盖 |
| `video.playback.access-key-secret` | `VIDEO_PLAYBACK_OSS_ACCESS_KEY_SECRET` | OSS 模式必填，默认取当前 dev/prod 配置，环境变量可覆盖 |
| `video.playback.legacy-minio-url-prefixes` | 部署配置文件或Spring列表索引绑定 | 当前profile默认包含 `minio.pathPrefix` 与 `minio.endpoint`；多个前缀按最长路径优先匹配 |

`application-dev.yml`、`application-prod.yml` 分别使用 auikits 对应环境 `oss-sync.oss` 的凭证作为默认值；同名环境变量优先覆盖默认值，部署时通过 `spring.profiles.active` 选择环境。公共 `application.yml` 不再配置这两个凭证项。

签名凭证须能读取本环境课堂视频对象，实际 GET 权限由 OSS 校验。创建签名链接本身不探测文件是否存在，也不验证云端权限；需通过联调确认。凭证在当前实现中启动时加载，轮换后需重启。

### 迁移路径与地址映射

```text
数据库：live-video/org/campus/record/lesson/video.mp4
测试OSS桶：lisheng-edu-live-test
目标Object Key：live-video/org/campus/record/lesson/video.mp4
签名URL：https://lisheng-edu-live-test.oss-cn-shenzhen.aliyuncs.com/live-video/org/campus/record/lesson/video.mp4?签名参数
```

- 原始相对路径不进行百分号解码；完整 URL 只解码路径一次，然后交由 SDK 编码。
- 仅转换已配置的旧 MinIO 前缀或当前目标 OSS 桶 URL。其他外部 HTTP(S) URL 原样返回，过期时间为空。
- SDK使用V4签名，GET请求不签入某个固定Range，允许播放器随后发起不同字节范围的GET请求。
- 服务只在响应中生成链接，不更新数据库、不跨请求缓存链接，不逐文件执行OSS HEAD。
- 签名/路径解析失败返回统一业务错误“视频播放地址生成失败，请稍后重试”，不会自动返回MinIO地址。
- 生产环境需核对课堂对象有效读取权限为私有，不要为此次切换将整个桶或其他资料资源统一公开。

## 6. 联调验收与发布

### 测试清单

- 核对上述11个接口的课堂视频字段；历史课堂分页总数、顺序和封面地址不变。
- 课程树递归节点正确取视频，资料节点仍走原逻辑；空列表、空路径和外部固定链接正常展示。
- 测试桶和生产桶不串用，`live-video/` 前缀不丢失、不重复。
- 迁移旧视频、新录制视频和已迁移手动视频可播放，中文、空格、加号和百分号文件名正常。
- 验证大视频首次播放、拖动、倍速、暂停恢复及Range响应；按实际前端来源核对OSS跨域配置。
- 签名到期前刷新、到期后刷新恢复进度、并发错误合并及视频切换时旧请求失效。
- 登录失效、无权访问、视频移出原分页、404、刷新后仍403均不会循环请求。
- 前端及后端业务日志不记录凭证或完整签名URL。
- 回退MinIO后 `urlExpireAt=null`，原链接正常播放。

### 发布和回退

1. 部署后端，默认 `VIDEO_PLAYBACK_PROVIDER=minio`，此时不要求OSS凭证。
2. 前端完成本文刷新流程，部署测试环境。
3. 测试环境配置OSS凭证和 `VIDEO_PLAYBACK_PROVIDER=oss`，重启后联合验收。可在测试环境调低有效期测试过期场景，完成后恢复部署配置的有效期（当前默认86400秒）。
4. 生产环境确认 prod 配置或环境变量中的本环境凭证、确认目标桶，切换为 `oss` 并重启；观察播放成功、403、404及业务错误。
5. 回退时改为 `minio` 并重启，不回滚数据库、不搬迁文件。前端已有页面需要重新查询业务接口才能取得回退后的地址。

配置变更不是在线热更新。MinIO存储与上传链路继续保留。生产切换需等待前端刷新能力及实际播放联调完成；本次后端实现和单元测试不代表云端权限、跨域及播放器联调已验收。

OSS/CDN下载流量统计是独立后续任务；客户端直连OSS后原MinIO/Nginx统计不会自动覆盖这部分下载。
