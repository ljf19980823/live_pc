// 展示值带路径前缀；下载快照始终使用接口的原始 ID、名称和 parentId。
export function normalizeImportCatalog(rows, prefix, stripChildren = false) {
  const records = new Map()
  const visit = (items, parentId = '') => (items || []).forEach(item => {
    const id = String(item.id ?? item.value ?? item.pointId ?? '')
    if (!id || records.has(id)) return
    records.set(id, {
      id, name: item.name ?? item.label ?? item.title ?? '',
      parentId: String(item.parentId ?? parentId), children: []
    })
    if (!stripChildren) visit(item.children || item.childList || item.childrenList || [], id)
  })
  visit(Array.isArray(rows) ? rows : [])
  const roots = []
  records.forEach(node => {
    const parent = node.parentId !== '0' && records.get(node.parentId)
    const seen = new Set([node.id])
    let ancestor = parent
    while (ancestor && !seen.has(ancestor.id)) {
      seen.add(ancestor.id)
      ancestor = records.get(ancestor.parentId)
    }
    if (parent && !ancestor) parent.children.push(node)
    else roots.push(node)
  })
  const decorate = (nodes, path) => nodes.map(node => {
    const value = path + '/' + encodeURIComponent(node.id)
    const { children, ...record } = node
    // Element UI 非懒加载目录用 children 字段是否为数组判断父节点。
    // 叶子不能带 children: []，否则多选标签拿不到已选叶子，输入框不会回显。
    return { ...record, value, label: node.name, ...(children.length ? { children: decorate(children, value) } : {}) }
  })
  return decorate(roots, prefix)
}

export function flattenImportCatalog(nodes, ancestors = []) {
  return (nodes || []).flatMap(node => {
    const path = [...ancestors, node]
    return [{ ...node, pathLabel: path.map(item => item.name).join(' / '), ancestors: ancestors.map(item => item.value) },
      ...flattenImportCatalog(node.children, path)]
  })
}

export function expandImportSelection(nodes, values) {
  const selected = new Set(values)
  const visit = (items, included = false) => (items || []).forEach(node => {
    const active = included || selected.has(node.value)
    if (active) selected.add(node.value)
    visit(node.children, active)
  })
  visit(nodes)
  return flattenImportCatalog(nodes).filter(node => selected.has(node.value))
}

export function serializeImportCatalog(nodes, values) {
  const selected = expandImportSelection(nodes, values)
  const keys = new Set(selected.flatMap(node => [node.value, ...node.ancestors]))
  const ids = new Set()
  return flattenImportCatalog(nodes).filter(node => {
    if (!keys.has(node.value) || ids.has(node.id)) return false
    ids.add(node.id)
    return true
  }).map(({ id, name, parentId }) => ({ id, name, parentId }))
}
