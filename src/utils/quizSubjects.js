export function buildBankSubjectOptions(k12Options, zsbOptions) {
  const k12 = k12Options.map(group => ({
    ...group,
    value: `k12:${group.value}`,
    eduType: 'K9K12',
    originalValue: group.value
  }))
  const zsb = zsbOptions.length ? [{
    value: 'zsb',
    label: '专升本',
    eduType: '专升本',
    children: zsbOptions.map(group => ({
      ...group,
      value: `zsb:${group.value}`,
      originalValue: group.value,
      isSubjectGroup: true
    }))
  }] : []
  return [...k12, ...zsb]
}

export function normalizeK12SubjectOptions(groups) {
  return (groups || []).map(group => ({
    value: String(group.name),
    label: group.name,
    children: (group.subjectList || group.children || group.childList || []).map(subject => ({
      ...subject,
      value: String(subject.id),
      label: subject.otherName || subject.name
    }))
  }))
}
