export function normalizeZsbSubjectOptions(groups, { keepEmpty = false } = {}) {
  const options = (Array.isArray(groups) ? groups : []).filter(group => group && group.id != null).map(group => ({
    value: String(group.id),
    label: group.name || '',
    children: (Array.isArray(group.subjectList) ? group.subjectList : [])
      .filter(subject => subject && subject.id != null)
      .map(subject => ({
        ...subject,
        value: String(subject.id),
        label: subject.name || subject.otherName || ''
      }))
  }))
  return keepEmpty ? options : options.filter(group => group.children.length)
}

export function findZsbSubjectPath(options, subjectId) {
  for (const group of options) {
    const subject = group.children.find(item => item.value === String(subjectId))
    if (subject) return [group.value, subject.value]
  }
  return []
}

export function getZsbSubject(options, path) {
  if (!Array.isArray(path) || path.length !== 2) return null
  const group = options.find(item => item.value === String(path[0]))
  return group && group.children.find(item => item.value === String(path[1])) || null
}
