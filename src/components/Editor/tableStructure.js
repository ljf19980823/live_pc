// 按实际占用的网格定位，不能直接使用 cellIndex：它不包含合并格占据的列。
export function getTableGrid(table) {
  const rows = Array.from(table.rows)
  const grid = rows.map(() => [])
  const cells = []
  rows.forEach((row, r) => {
    let c = 0
    Array.from(row.cells).forEach(cell => {
      while (grid[r][c]) c++
      let groupEnd = r + 1
      while (groupEnd < rows.length && rows[groupEnd].parentNode === row.parentNode) groupEnd++
      const height = cell.rowSpan === 0 ? groupEnd - r : Math.min(cell.rowSpan || 1, groupEnd - r)
      const width = cell.colSpan || 1
      const entry = { cell, row: r, col: c, height, width }
      cells.push(entry)
      for (let y = r; y < r + height; y++) {
        for (let x = c; x < c + width; x++) grid[y][x] = entry
      }
      c += width
    })
  })
  return { rows, grid, cells, width: Math.max(0, ...grid.map(row => row.length)) }
}

function setSpan(cell, name, value) {
  if (value > 1) cell.setAttribute(name, String(value))
  else cell.removeAttribute(name)
}

function emptyCell(table, source) {
  const cell = source ? source.cloneNode(false) : table.ownerDocument.createElement('td')
  ;['id', 'rowspan', 'colspan', 'headers', 'data-editor-table-active'].forEach(name => cell.removeAttribute(name))
  const paragraph = table.ownerDocument.createElement('p')
  const style = source && source.querySelector('p')?.getAttribute('style')
  if (style) paragraph.setAttribute('style', style)
  paragraph.appendChild(table.ownerDocument.createElement('br'))
  cell.appendChild(paragraph)
  return cell
}

// colgroup 的宽度定义也要同步，否则插删后列样式会错位。
function updateColumns(table, index, inserting) {
  let start = 0
  Array.from(table.children).filter(node => node.tagName === 'COLGROUP').forEach(group => {
    const cols = Array.from(group.children).filter(node => node.tagName === 'COL')
    ;(cols.length ? cols : [group]).forEach(node => {
      const span = node.span || 1
      if (index >= start && index < start + span) {
        if (inserting) node.span = span + 1
        else if (span > 1) node.span = span - 1
        else node.remove()
      }
      start += span
    })
    if (cols.length && !group.children.length) group.remove()
  })
}

// 返回下一选中格；删除最后一行/列返回 null，由调用方删除整个表格。
export function changeTableStructure(table, selectedCell, action) {
  const layout = getTableGrid(table)
  const selected = layout.cells.find(entry => entry.cell === selectedCell)
  if (!selected) return selectedCell
  const { rows, grid, cells, width } = layout
  const row = selected.row
  const col = selected.col
  if (action === 'row-before' || action === 'row-after') {
    const index = action === 'row-before' ? row : row + selected.height
    const section = rows[row].parentNode
    const next = rows[index] && rows[index].parentNode === section ? rows[index] : null
    const added = table.ownerDocument.createElement('tr')
    const covered = new Set()
    cells.forEach(entry => {
      if (entry.row < index && entry.row + entry.height > index && rows[entry.row].parentNode === section) {
        if (entry.cell.rowSpan !== 0) setSpan(entry.cell, 'rowspan', entry.height + 1)
        for (let c = entry.col; c < entry.col + entry.width; c++) covered.add(c)
      } else if (entry.cell.rowSpan === 0 && entry.row < index && rows[entry.row].parentNode === section) {
        for (let c = entry.col; c < entry.col + entry.width; c++) covered.add(c)
      }
    })
    for (let c = 0; c < width; c++) {
      if (!covered.has(c)) added.appendChild(emptyCell(table, grid[row][c]?.cell))
    }
    section.insertBefore(added, next)
    return added.cells[0] || selectedCell
  }
  if (action === 'row-delete') {
    if (rows.length === 1) return null
    cells.forEach(entry => {
      if (entry.row < row && entry.row + entry.height > row) {
        if (entry.cell.rowSpan !== 0) setSpan(entry.cell, 'rowspan', entry.height - 1)
      } else if (entry.row === row && entry.height > 1) {
        // 合并格起点被删除时，把内容移到下一行，保持列顺序。
        if (entry.cell.rowSpan !== 0) setSpan(entry.cell, 'rowspan', entry.height - 1)
        const reference = cells.find(item => item.row === row + 1 && item.col > entry.col)
        rows[row + 1].insertBefore(entry.cell, reference ? reference.cell : null)
      }
    })
    rows[row].remove()
  } else if (action === 'column-before' || action === 'column-after') {
    const index = action === 'column-before' ? col : col + selected.width
    const extended = new Set()
    rows.forEach((tr, r) => {
      const crossing = grid[r][index]
      if (crossing && crossing.col < index) {
        if (!extended.has(crossing.cell)) {
          setSpan(crossing.cell, 'colspan', crossing.width + 1)
          extended.add(crossing.cell)
        }
      } else {
        const reference = cells.find(entry => entry.row === r && entry.col >= index)
        tr.insertBefore(emptyCell(table, (grid[r][Math.min(index, width - 1)] || selected).cell), reference ? reference.cell : null)
      }
    })
    updateColumns(table, Math.min(index, width - 1), true)
    return getTableGrid(table).grid[row][index].cell
  } else if (action === 'column-delete') {
    if (width === 1) return null
    cells.forEach(entry => {
      if (entry.col <= col && entry.col + entry.width > col) {
        if (entry.width > 1) setSpan(entry.cell, 'colspan', entry.width - 1)
        else entry.cell.remove()
      }
    })
    updateColumns(table, col, false)
  }
  const updated = getTableGrid(table)
  return updated.grid[Math.min(row, updated.rows.length - 1)]?.[Math.min(col, updated.width - 1)]?.cell || updated.cells[0]?.cell || null
}
