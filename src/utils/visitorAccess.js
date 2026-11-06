// 访客被拦截后只恢复直播入口参数，不透传业务页面的 redirect 等参数。
export function getVisitorEntryLocation(userInfo = {}, query = {}) {
  const entryQuery = {}
  const liveId = query.liveid || userInfo.liveId
  const classroomId = query.classroomId || userInfo.classroomId
  if (typeof liveId === 'string' && liveId) entryQuery.liveid = liveId
  if (typeof classroomId === 'string' && classroomId) entryQuery.classroomId = classroomId
  return { path: '/visitorLogin', query: entryQuery, replace: true }
}
