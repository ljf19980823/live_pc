# 资料 OSS 改造前端对接说明

共享资料、个人资料和教研组资料的上传仍通过后端业务接口。预览、下载和播放改用接口返回的 OSS 签名 URL。请求参数和登录方式沿用现有业务接口，前端需要处理地址到期，以及区分访问地址和持久化路径。

## 涉及的接口

下表的响应字段从 `CommonResult.data` 开始读取。`urlExpireAt` 和对应 URL 在同一层。

| 方法与接口 | 请求参数 | 前端读取或处理 |
| --- | --- | --- |
| `POST /edu/resource/upload` | 表单 `file`，以及 `liveId`、`historyLessonId` 二选一。可选 `name`、`sortId`、`label` | `data.fileUrl`、`data.urlExpireAt`。新资料 ID 为 `data.id` |
| `POST /edu/resource/update` | 表单 `resourceId`，以及 `liveId`、`historyLessonId` 二选一。换文件时传 `file`，只改信息时省略 `file` | `data.fileUrl`、`data.urlExpireAt`。用新响应替换页面中的旧地址 |
| `GET /edu/resource/list` | `liveId`、`historyLessonId` 二选一。分页 `pageNum` 默认 1，`pageSize` 默认 20 | `data.list[].fileUrl`、`data.list[].urlExpireAt` |
| `GET /edu/resource/detail` | `resourceId` | `data.fileUrl`、`data.urlExpireAt` |
| `POST /edu/resource/delete` | JSON `resourceId`，以及 `liveId`、`historyLessonId` 二选一 | 成功时 `data: true`。刷新共享列表。该接口只解除共享关联，原件保留 |
| `GET /edu/course/detail` | `courseId`，可选 `classId` | 遍历 `data.detailTree` 及各节点的 `children`，读取资料节点的 `resource.fileList[].filePath` 和同项 `urlExpireAt` |
| `GET /edu/recentView/view` | 可选 `keyword` | 最近观看中资料项的 `data[].fileList[].filePath` 和同项 `urlExpireAt` |
| `GET /edu/recentView/collect` | 可选 `keyword` | 收藏中资料项的 `data[].fileList[].filePath` 和同项 `urlExpireAt` |
| `POST /edu/minio/upload?scene=PAID_RESOURCE` | 表单 `file` | `data.filePath`、`data.urlExpireAt` 用于访问，`data.bucket` 和 `data.objectKey` 用于保存路径 |
| `POST /edu/businessFile/upload` | 表单参数见下文 | 成功后返回 `data: null`，重新请求列表获取文件 ID 和访问地址 |
| `GET /edu/businessFile/list` | `type`，可选 `parentId`，`type=2` 时必传 `userGroupId` | `data[].fileUrl`、`data[].urlExpireAt` |
| `POST /edu/businessFile/delete` | 请求参数 `id`，取列表项的 `data[].id` | 成功后刷新列表。删除文件夹会递归删除子文件，OSS 删除报错时按接口失败处理 |

上传和编辑文件使用 `multipart/form-data`。浏览器用 `FormData` 提交时由浏览器生成带 boundary 的 `Content-Type`。共享资料的 `liveId` 是直播业务 ID，历史课堂页面可以直接传 `historyLessonId`，由后端解析来源直播。

课程详情、最近观看和收藏的资料条目使用上表的资料字段。直播和历史课堂的回放条目继续按原回放接口约定处理。

## 预览、下载和播放

- 将完整的 `fileUrl` 或 `filePath` 交给预览器、下载请求或播放器。保留所有查询参数与原始编码，避免去掉签名、拼接域名或重新编码整条 URL。
- `urlExpireAt` 是 Unix 毫秒，可以直接与 `Date.now()` 比较。字段为空或缺失时按普通链接处理，例如外链、范围外的 MinIO 文件。资料原件的 `type="6"` 表示链接资料，直接使用返回的原地址。
- 打开或下载前，如果地址已过期或即将过期（例如剩余不足 30 秒），重新调用当前页面对应的 GET 接口，替换 URL 和到期时间。共享资料也可以用原件 ID 调用 `GET /edu/resource/detail?resourceId=…`。个人／教研组资料按原目录参数刷新列表。上传完成后的刷新走查询接口，避免重复提交上传或替换。
- 视频拖动或续播可能发起新的 Range GET 请求。签名到期时先获取新地址，再恢复原播放进度。继续遵守页面原有的下载、快进等业务权限。
- 签名用于 GET。前端无需携带业务登录凭证访问 OSS，也不要用 HEAD 探测这条签名地址。业务接口返回成功表示已生成访问地址，文件是否可读取以实际 GET 响应为准。刷新后仍读取失败时，按文件访问失败提示。

## 保存资料路径

`/edu/resource/upload` 上传文件并关联直播或历史课堂，`/edu/resource/update` 编辑或替换已关联的资料。页面预览使用 `data.fileUrl`，业务引用使用 `data.id`，`data.resourceUrl` 继续表示原始资料路径或外链。

`/edu/minio/upload?scene=PAID_RESOURCE` 用于仅上传文件，由调用方完成后续业务保存。以下为成功响应的相关字段节选：

```json
{
  "code": 200,
  "data": {
    "fileName": "resource-id.pdf",
    "bucket": "mall",
    "objectKey": "org/campus/resource/document/paid/2026/11/11/resource-id.pdf",
    "filePath": "https://example.oss-cn-shenzhen.aliyuncs.com/mall/org/campus/resource/document/paid/2026/11/11/resource-id.pdf?signature=example",
    "urlExpireAt": 1794387600000
  }
}
```

- 需要持久化路径时保存 `bucket + "/" + objectKey`，示例为 `mall/org/campus/resource/document/paid/2026/11/11/resource-id.pdf`。`bucket` 是逻辑目录前缀，实际访问域名已包含在签名 URL 中。
- `filePath` 在有效期内可用于访问。地址到期后，从已建档的资料业务接口重新获取地址。通用上传没有按路径单独刷新签名的接口。
- 需要资料上传时显式传 `scene=PAID_RESOURCE`。不传 `scene` 时使用 `DEFAULT_UPLOAD`，文件类型不会触发自动切换。
- 当前通用上传会为所有场景透传 `bucket` 和 `objectKey`。同时传 `liveId`、`historyLessonId` 也不会自动创建视频业务记录，响应中的 `id` 不再提供原先的视频记录 ID。依赖该行为的调用方需要单独核对视频建档流程。

## 个人资料和教研组资料

使用 `POST /edu/businessFile/upload`，由后端根据 `type` 选择上传场景。前端不需要传 `scene`。

| 表单字段 | 传法 |
| --- | --- |
| `type` | `1` 为个人资料，`2` 为教研组资料 |
| `userGroupId` | `type=2` 时必传 |
| `fileType` | `1` 文件夹、`2` 图片、`3` 文档、`4` 视频、`5` PPT、`6` PDF、`7` 其他 |
| `files` | 上传文件时使用。批量上传时对每个文件追加一个同名 `files` 字段 |
| `folderName` | 创建文件夹时必传，此时不传文件 |
| `parentId`、`level`、`serialNumber` | 沿用现有目录、层级与排序参数。根目录可省略 `parentId` |

上传成功后按同一个 `type`、`parentId` 和 `userGroupId` 请求列表，用返回的 `fileUrl` 打开文件。手动上传的 PPT 与其他资料文件一样使用 OSS。列表中的系统自动生成 PPT 仍可能返回 MinIO URL，文件夹也可能没有地址，页面按每一项的字段处理。

## 联调验收

- 从共享列表、详情、课程节点、最近观看和收藏打开资料，验证正确读取各层级的 URL 和到期时间。用早期存量资料及中文文件名验证完整 URL 可用。
- 上传共享资料并替换文件，确认页面使用最新地址。解除共享后刷新列表，核对该关联已移除。
- 分别上传个人资料和教研组资料，再从列表预览、下载和删除。确认列表中的文件夹及系统生成 PPT 仍可正常处理。
- 使用测试环境检查浏览器跨域访问、视频 Range 播放及拖动，并验证签名到期后能从原 GET 接口取得新地址并继续使用。
