# 课后测前端对接调整

以下接口均为 **GET**，登录方式及原有业务参数不变。

## 1. 七个列表接口增加分页参数

| 接口 | 原有必传参数 |
| --- | --- |
| `/edu/after/quiz/list` | 查询参数 `studentId` |
| `/edu/after/quiz/teacher/list` | 查询参数 `teacherId` |
| `/edu/after/quiz/record/list` | 查询参数 `examId` |
| `/edu/after/quiz/student/unSubmit/list/{examConfigId}/{classId}` | 路径参数 `examConfigId`、`classId` |
| `/edu/after/quiz/student/unSubmit/list/{examConfigId}` | 路径参数 `examConfigId` |
| `/edu/after/quiz/leaderboard/{examConfigId}/{classId}` | 路径参数 `examConfigId`、`classId` |
| `/edu/after/quiz/leaderboard/{examConfigId}` | 路径参数 `examConfigId` |

统一增加查询参数：`pageNum`（默认 `1`）、`pageSize`（默认 `20`），均为正整数。不传参数也默认分页。原班级、科目、时间等可选筛选参数继续使用。

响应 JSON 的 `data` 改为：

```json
{
  "pageNum": 1,
  "pageSize": 20,
  "totalPage": 0,
  "total": 0,
  "list": []
}
```

前端统一从 **`data.list`** 读取记录，用 `data.total`、`data.totalPage` 控制分页。排行榜原来的 `data.leaderboardItems` 不再返回。越界页返回空数组，总数仍是实际总数。

## 2. 排行榜统计改为单独请求

- 按班级：`/edu/after/quiz/leaderboard/statistics/{examConfigId}/{classId}`
- 不限班级：`/edu/after/quiz/leaderboard/statistics/{examConfigId}`

仅传路径参数，无需分页参数或 `studentId`；排名对应当前登录学生。统计字段从这个接口的 `data` 中读取：

| 字段 | 用途 |
| --- | --- |
| `finishedStudentCount` | 已完成学生数 |
| `unFinishedStudentCount` | 未完成学生数 |
| `totalStudentCount` | 总学生数 |
| `finishedPercentage` | 完成率，整数，直接加 `%` 展示 |
| `surpassPercentage` | 超越比例，整数，直接加 `%` 展示 |
| `currentRank` | 我的排名，从 1 开始；为 `null` 时展示“暂无排名” |

榜单 `total` 是提交记录数，学生人数读取 `totalStudentCount`。`currentRank` 按每个学生的最佳提交去重计算，不要使用当前页行号替代。非学生、未有效提交或不在查询范围时，排名为 `null`，超越比例为 `0`。

超越比例沿用旧口径 `(总人数 + 1 - 排名) × 100 / 总人数`，取整数、包含本人和未完成学生，例如 5 人中第 3 名为 `60%`。前端直接展示返回值。

## 3. 调用时机

- 首次进入、切换考试或班级：页码重置为 1，同时请求相同范围的榜单和统计。
- 仅翻页：只请求榜单。
- 提交成绩后或主动刷新：同时刷新榜单和统计。
- 原 Excel 导出接口不变，仍导出全量。
