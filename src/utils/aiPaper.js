export const PAPER_QUESTION_TYPES = [
  { value: 'SINGLE_CHOICE', label: '单选题' },
  { value: 'MULTIPLE_CHOICE', label: '多选题' },
  { value: 'JUDGMENT', label: '判断题' }
]

const LEARNING_SCOPES = {
  0: 'OTHER_STAGES',
  1: 'K9_K12',
  2: 'FUJIAN_COLLEGE_UPGRADE'
}

export function normalizeOptions(rows, childKey = 'children') {
  const list = Array.isArray(rows) ? rows : []
  const byId = new Map()
  const normalized = list.filter(item => item && item.id != null).map(item => {
    const node = {
      id: String(item.id),
      name: String(item.name || item.otherName || ''),
      children: normalizeOptions(item[childKey] || item.children || [], childKey)
    }
    byId.set(node.id, node)
    return { node, parentId: item.parentId == null ? '' : String(item.parentId) }
  })
  if (normalized.some(item => item.node.children.length)) return normalized.map(item => item.node)
  const roots = []
  normalized.forEach(({ node, parentId }) => {
    const parent = parentId && parentId !== '0' && byId.get(parentId)
    if (parent && parent !== node) parent.children.push(node)
    else roots.push(node)
  })
  return roots
}

export function normalizeSubjects(rows, standardType) {
  const tree = normalizeOptions(rows, 'subjectList')
  if (Number(standardType) === 2) return tree
  const flattenLeaves = nodes => nodes.flatMap(node => node.children.length ? flattenLeaves(node.children) : [node])
  return flattenLeaves(tree)
}

export function buildPaperTitle(subjectName) {
  const subject = String(subjectName || '')
  return subject ? `${subject}试卷` : 'AI 生成试卷'
}

export function buildPaperPayload(stage, form) {
  const standardType = Number(stage.standardType)
  const scope = LEARNING_SCOPES[standardType]
  if (!scope || !form.subject || !form.subject.id) throw new Error('请选择学科')

  const selectedTypes = [...new Set(form.questionTypes)]
  const questionCount = Number(form.questionCount)
  if (!selectedTypes.length) throw new Error('请至少选择一种题型')
  if (!Number.isInteger(questionCount) || questionCount < selectedTypes.length || questionCount > 15) {
    throw new Error(`题数须在 ${selectedTypes.length} 到 15 题之间`)
  }
  if (standardType === 1 && (!form.book || !form.grade)) throw new Error('请选择教材版本和年级')

  const range = option => {
    if (!option) return null
    const id = String(option.id == null ? '' : option.id).trim()
    const name = String(option.name || '').trim()
    return id ? { id } : name ? { name } : null
  }
  const chapter = range(form.chapter)
  const knowledgePoint = range(form.knowledgePoint)
  if (!chapter) throw new Error('请选择章节')
  if (!knowledgePoint) throw new Error('请选择知识点')

  const payload = {
    subjectId: form.subject.id,
    stageName: stage.name,
    learningScope: scope,
    questionTypes: selectedTypes,
    questionCount,
    chapter,
    knowledgePoint,
    difficultyId: form.difficulty && form.difficulty.id || undefined,
    // 完整生成答案详情，便于出题完成后随时切换预览及导出的显示开关。
    showAnswer: true,
    showAnalysis: true,
    showKnowledgePoint: true,
    showDifficulty: Boolean(form.showDifficulty),
    separateAnswers: form.separateAnswers,
    // questionPrefix: String(form.questionPrefix || '').trim(),  //题目来源暂时去掉，避免导出时重复展示题目来源
    personalizedRequirements: String(form.personalizedRequirements || '').trim() || undefined
  }
  if (standardType === 1) {
    payload.bookId = form.book.id
    payload.gradeId = form.grade.id
  }
  return payload
}

const typeLabel = type => PAPER_QUESTION_TYPES.find(item => item.value === type)?.label || String(type || '题目')

/** 生成接口没有题目 ID 时，沿用旧组卷页的 UUID／时间戳方案补齐。 */
export function createPaperQuestionId() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeQuestion(question, fallbackSection, existingId = '') {
  const source = question || {}
  return {
    ...source,
    id: String(source.id || source.questId || existingId || createPaperQuestionId()),
    order: Number(source.order || source.number || 0),
    section: source.section || fallbackSection || typeLabel(source.type),
    stem: source.stem || source.question || source.content || '',
    options: Array.isArray(source.options) ? source.options : [],
    answer: source.answer == null ? [] : source.answer,
    analysis: source.analysis || '',
    knowledgePoint: source.knowledgePoint || ''
  }
}

export function emptyPaper(title = '') {
  return { title, groups: [], answers: [], questionCount: 0 }
}

export function normalizePaper(result, previousPaper = null) {
  const source = result && (result.paper || result) || {}
  const groups = Array.isArray(source.groups) ? source.groups : []
  const output = emptyPaper(source.title || '')
  const previousIds = new Map((previousPaper && previousPaper.groups || []).flatMap(group => group.questions || [])
    .filter(question => question.id)
    .map(question => [Number(question.order), question.id]))
  groups.forEach(group => {
    const name = group.name || group.section || typeLabel(group.type)
    const questions = Array.isArray(group.questions) ? group.questions : group.items || []
    output.groups.push({ name, questions: questions.map(question => normalizeQuestion(question, name, previousIds.get(Number(question.order || question.number)))) })
  })
  if (!output.groups.length && Array.isArray(source.questions)) {
    source.questions.forEach(question => {
      const normalized = normalizeQuestion(question, '', previousIds.get(Number(question.order || question.number)))
      let group = output.groups.find(item => item.name === normalized.section)
      if (!group) {
        group = { name: normalized.section, questions: [] }
        output.groups.push(group)
      }
      group.questions.push(normalized)
    })
  }
  output.groups.forEach(group => group.questions.sort((a, b) => a.order - b.order))
  output.answers = Array.isArray(source.answers) ? source.answers : Array.isArray(source.answerSection?.answers) ? source.answerSection.answers : []
  output.questionCount = Number(source.questionCount) || output.groups.reduce((sum, group) => sum + group.questions.length, 0)
  return output
}

export function applyPaperEvent(paper, event, data) {
  const next = {
    ...paper,
    groups: paper.groups.map(group => ({ ...group, questions: [...group.questions] })),
    answers: [...paper.answers]
  }
  if (event === 'paper_header') {
    next.title = data.title || next.title
    next.questionCount = Number(data.requestedCount) || next.questionCount
  } else if (event === 'section') {
    if (data.name && !next.groups.some(group => group.name === data.name)) next.groups.push({ name: data.name, questions: [] })
  } else if (event === 'question') {
    const existing = next.groups.flatMap(group => group.questions).find(item => item.order === Number(data.question && (data.question.order || data.question.number)))
    const question = normalizeQuestion(data.question, data.section, existing && existing.id)
    let group = next.groups.find(item => item.name === question.section)
    if (!group) {
      group = { name: question.section, questions: [] }
      next.groups.push(group)
    }
    group.questions = [...group.questions.filter(item => item.order !== question.order), question].sort((a, b) => a.order - b.order)
  } else if (event === 'answer_section') {
    next.answers = Array.isArray(data.answers) ? data.answers : []
  } else if (event === 'complete' && data.paper) {
    const complete = normalizePaper(data.paper, next)
    if (complete.groups.some(group => group.questions.length)) {
      complete.answers = complete.answers.length ? complete.answers : next.answers
      return complete
    }
    next.title = complete.title || next.title
    next.questionCount = complete.questionCount || next.questionCount
  }
  return next
}

export function createPaperSseParser(onEvent) {
  let buffer = ''
  let trailingCarriageReturn = false
  return (chunk = '', flush = false) => {
    const text = (trailingCarriageReturn ? '\r' : '') + chunk
    trailingCarriageReturn = !flush && text.endsWith('\r')
    buffer += (trailingCarriageReturn ? text.slice(0, -1) : text).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    if (flush && trailingCarriageReturn) {
      buffer += '\n'
      trailingCarriageReturn = false
    }
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() || ''
    if (flush && buffer.trim()) blocks.push(buffer)
    if (flush) buffer = ''
    blocks.forEach(block => {
      let event = 'message'
      const dataLines = []
      block.split('\n').forEach(line => {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart())
      })
      if (!dataLines.length) return
      const data = JSON.parse(dataLines.join('\n'))
      onEvent(event === 'message' ? data.type : event, data)
    })
  }
}
