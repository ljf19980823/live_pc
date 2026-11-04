import pkg from '../../package.json'

/** 将宿主版本放在 hash 路由之前，供课堂子项目在首次请求前读取。 */
export function withClassroomAppVersion(url) {
  if (!url) return url

  const classroomUrl = new URL(url, window.location.href)
  classroomUrl.searchParams.set('appVersion', pkg.version)
  // Opt in desktop teachers only. Publishing after-class tests uses a teacher
  // URL too, but must not open capture or block on a microphone.
  const hashParams = new URLSearchParams(classroomUrl.hash.split('?')[1] || '')
  if (classroomUrl.searchParams.get('role') === '1' &&
      !classroomUrl.searchParams.get('afterClassTest') &&
      !hashParams.get('afterClassTest')) {
    classroomUrl.searchParams.set('precheck', '1')
  }
  return classroomUrl.toString()
}
