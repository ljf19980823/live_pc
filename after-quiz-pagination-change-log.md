# 课后测分页接口改造说明

## 改造依据与范围

本次按 `after-quiz-pagination-api.md` 的接口约定调整前端调用。文档中的接口、参数、响应字段和刷新时机是接口要求；本说明记录代码中落实的页面和行为。

课后测列表接口的分页数据统一从 `data.list` 读取，`data.total` 作为记录总数，`data.totalPage` 作为总页数。页面默认传 `pageNum: 1`、`pageSize: 20`。切换筛选条件或考试范围时回到第一页；翻页时仅重新请求当前列表。

## 页面改动明细

### 1. 学生端「班级」课后测列表

文件：`src/views/Student/Class/index.vue`

- 课后测列表请求增加 `pageNum` 和 `pageSize`，响应改从 `data.list` 取卡片数据。
- 新增分页总数、总页数和当前页状态，并在列表下方增加页码控件。
- 修改班级、科目、课后测、老师或发布时间筛选时页码回到第 1 页。
- 首次切换到课后测标签、切换班级时也从第 1 页加载。
- 该页仍保留原有班级、科目、时间、课后测、老师筛选参数。

### 2. 学生端「在线课堂」课后测试列表

文件：`src/views/Student/Online/index.vue`

- 学生课后测列表请求增加分页参数，改为读取 `data.list`。
- 增加分页控件，展示接口返回的提交记录总数和总页数。
- 首次进入课后测试、切换班级或调整筛选后从第 1 页加载；翻页只重新请求列表。
- 自动刷新回放视频时继续沿用当前查询参数和分页范围。

### 3. 教师端「班级」课后测列表

文件：`src/views/teacher/Class/index.vue`

- 教师课后测列表请求增加分页参数，改为读取 `data.list`。
- 课后测卡片列表下方新增分页控件，使用接口返回的 `total` 和 `totalPage`。
- 修改班级、科目、时间、课后测、老师筛选，执行筛选重置或切换班级时回到第 1 页。
- 查看某场课后测的学生详情时，继续传递当前课后测和班级范围。

### 4. 教师端「在线课堂」课后测试列表

文件：`src/views/teacher/Online/index.vue`

- 教师课后测列表请求增加分页参数，响应改从 `data.list` 读取。
- 列表下方新增分页控件。
- 首次进入课后测试、切换班级或调整筛选后从第 1 页开始；翻页只重新请求列表。
- 视频回放的地址刷新请求保留本页筛选和分页参数。

### 5. 学生端排行榜

文件：`src/views/Student/Class/RankingPage.vue`

- 榜单改为分页请求，数据从 `data.list` 读取；行号按全局页码连续显示。
- 响应解析兼容业务响应外层包装、旧版 `leaderboardItems` 字段和 `records` 列表，避免有效响应被误判为空；分页接口仍优先使用 `list`、`total`、`totalPage`。
- 打开排行榜或切换考试/班级范围时，将排行榜和外层页面滚动位置重置到顶部；排行榜固定覆盖主内容区，避免课后测列表透出。容器按视口高度布局，由排行榜自身内容决定是否出现纵向滚动。
- 排行榜统计改为单独调用统计接口，不再从榜单响应读取统计字段。
- 总人数使用统计响应中的 `totalStudentCount`；当前排名使用 `currentRank`；超越比例直接展示 `surpassPercentage`。
- `currentRank` 为 `null` 时显示“暂无排名”。
- 首次打开、切换考试或班级时重置页码并同时请求榜单和统计；只翻页时仅请求榜单。
- 增加榜单提交记录数展示。该数值读取分页榜单的 `total`，不作为学生人数使用。

### 6. 教师端课后测「学生做题情况」详情

文件：`src/views/teacher/Class/AfterClassTestDetail.vue`

- 已做题榜单和未提交学生名单分别改为分页请求，均从响应的 `data.list` 读取数据。
- 两个列表分别维护当前页、总记录数和总页数；行号按页码连续计算。
- 完成数、未完成人数、总人数和完成率改为从独立的排行榜统计接口读取。
- 首次进入或更换考试/班级时重置页码并刷新榜单、统计和未提交名单；在已做题与未做题标签间切换时加载对应列表。
- Excel 导出仍调用原全量导出接口，未增加分页参数。

### 7. 学生端考试记录

文件：`src/views/Student/Class/ExamRecordPage.vue`

- 考试记录请求增加 `pageNum`、`pageSize`，改为读取 `data.list`。
- 增加分页控件，考试次数显示接口的 `total`；考试序号和做题详情中的尝试序号按全量记录位置计算。
- 接口约定未提供跨页最高分、最高正确题数统计，因此这两个数值按当前加载页计算，标签明确显示为“当前页最高分”和“当前页最佳作答”。

## 接口封装改动

### `src/api/modules/teacher.js`

- 教师榜单、未提交名单方法接受分页查询参数。
- 根据是否提供 `classId` 调用带班级或不限班级的路径。
- 新增 `/edu/after/quiz/leaderboard/statistics/{examConfigId}[/{classId}]` 统计接口封装。
- 原 Excel 导出封装保持原样。

### `src/api/modules/student.js`

- 学生榜单方法接受分页查询参数，并按班级范围选择接口路径。
- 新增学生排行榜统计接口封装；统计请求只使用考试和可选班级路径参数。

## 接口与页面调用对应

| 接口 | 前端页面 |
| --- | --- |
| `/edu/after/quiz/list` | 学生端班级、在线课堂课后测列表 |
| `/edu/after/quiz/teacher/list` | 教师端班级、在线课堂课后测列表 |
| `/edu/after/quiz/record/list` | 学生端考试记录 |
| `/edu/after/quiz/leaderboard/{examConfigId}[/{classId}]` | 学生排行榜、教师详情中的已做题榜单 |
| `/edu/after/quiz/student/unSubmit/list/{examConfigId}[/{classId}]` | 教师详情中的未提交名单 |
| `/edu/after/quiz/leaderboard/statistics/{examConfigId}[/{classId}]` | 学生排行榜和教师详情统计栏 |

## 其他说明

- `src/utils/classroomVideoPlayback.js` 原本已支持从分页对象的 `list` 字段提取回放文件，本次无需修改。
- `src/views/Student/Class/oldClass.vue` 和 `src/views/teacher/Class/oldClass.vue` 是旧页面副本；当前路由指向各自的 `index.vue`，旧页面不在本次运行页面改造范围内。
- 本次未运行构建或测试；已检查变更差异的空白格式。
