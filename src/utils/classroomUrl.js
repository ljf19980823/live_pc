import pkg from '../../package.json'

/** 将宿主版本放在 hash 路由之前，供课堂子项目在首次请求前读取。 */
export function withClassroomAppVersion(url) {
  if (!url) return url

  const classroomUrl = new URL(url, window.location.href)
  classroomUrl.searchParams.set('appVersion', pkg.version)
  return classroomUrl.toString()
}
