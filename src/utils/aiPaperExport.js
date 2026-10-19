const TYPE_CODES = {
  SINGLE_CHOICE: '1', MULTIPLE_CHOICE: '2', JUDGMENT: '3',
  '单选题': '1', '单项选择题': '1', '多选题': '2', '多项选择题': '2', '判断题': '3'
}

export function normalizeExportTitle(value, fileType) {
  const extension = fileType === 'PDF' ? 'pdf' : 'docx'
  const title = String(value || '').trim().replace(new RegExp(`\\.${extension}$`, 'i'), '').trim()
  if (!title) throw new Error('请输入文件名')
  if (/[\\/:*?"<>|\x00-\x1f]/.test(title) || /[. ]$/.test(title)) throw new Error('文件名包含不支持的字符')
  if (title.length > 200) throw new Error('文件名不能超过 200 个字符')
  return title
}

function textValue(value) {
  if (Array.isArray(value)) return value.join('、')
  if (value && typeof value === 'object') return value.name || value.content || value.text || ''
  return String(value == null ? '' : value)
}

function optionContent(option, index) {
  const raw = textValue(option && typeof option === 'object' ? option.content || option.text || option.value : option)
  return raw.replace(new RegExp(`^\\s*${String.fromCharCode(65 + index)}[.．、:：)）]\\s*`, 'i'), '')
}

function questionType(question) {
  const candidates = [question.type, question.questType, question.section]
  const code = candidates.map(value => String(value || '').trim()).map(type => TYPE_CODES[type] || (/^[1-8]$/.test(type) ? type : '')).find(Boolean)
  if (!code) throw new Error(`第 ${question.order || '?'} 题的题型无法导出`)
  return code
}

export function buildExportPayload({ paper, config, stageName = '', subjectName = '', difficultyName = '', fileType, title, render = textValue }) {
  const normalizedTitle = normalizeExportTitle(title, fileType)
  if (!['DOCX', 'PDF'].includes(fileType)) throw new Error('不支持的导出格式')
  const groups = Array.isArray(paper && paper.groups) ? paper.groups : []
  const questions = groups.flatMap(group => Array.isArray(group.questions) ? group.questions : [])
    .sort((a, b) => Number(a.order) - Number(b.order))
  if (!questions.length) throw new Error('试卷没有可导出的题目')
  if (questions.length > 200) throw new Error('每次最多导出 200 题')
  const answers = Array.isArray(paper.answers) ? paper.answers : []
  const snapshot = questions.map((question, index) => {
    const details = answers.find(item => Number(item.order) === Number(question.order)) || {}
    const pick = key => textValue(details[key]) || textValue(question[key])
    const stem = textValue(question.stem)
    if (!stem.trim()) throw new Error(`第 ${question.order || index + 1} 题缺少题干`)
    const type = questionType(question)
    const row = {
      name: render(stem), questType: type,
      questTemplateName: question.type || question.section || '',
      stageName, subjectName,
      pointName: textValue(config.chapter && config.chapter.name),
      difficultyName,
      answer: render(pick('answer')),
      analysis: render(pick('analysis')),
      knowledgeName: pick('knowledgePoint')
    }
    if (question.id) row.id = String(question.id)
    ;(Array.isArray(question.options) ? question.options : []).slice(0, 5).forEach((option, optionIndex) => {
      row[`option${String.fromCharCode(65 + optionIndex)}`] = render(optionContent(option, optionIndex))
    })
    return row
  })
  return {
    options: {
      title: normalizedTitle, fileType,
      showAnswer: Boolean(config.showAnswer),
      showAnalysis: Boolean(config.showAnalysis),
      showKnowledge: Boolean(config.showKnowledgePoint),
      showDifficulty: Boolean(config.showDifficulty),
      separateAnswerSection: Boolean(config.separateAnswers),
      questionPrefix: String(config.questionPrefix || '').trim()
    },
    questions: snapshot
  }
}

// 仅适配接口字段；题干、选项、答案和解析保留 AI 原文，不渲染公式或富文本。
export function snapshotAiExportQuestion(source, context = {}) {
  const row = {}
  const fields = ['name', 'optionA', 'optionB', 'optionC', 'optionD', 'optionE', 'answer', 'analysis',
    'knowledgeName', 'difficultyName', 'stageName', 'subjectName', 'pointName', 'questTemplateName']
  fields.forEach(field => {
    const value = source[field] == null ? context[field] : source[field]
    if (value != null) row[field] = textValue(value)
  })
  row.name = textValue(source.name == null ? source.stem : source.name)
  row.questType = textValue(source.questType == null ? source.type && source.type.id : source.questType) || textValue(context.questType)
  const id = source.topicId == null ? source.id : source.topicId
  if (id != null && String(id).trim()) row.id = String(id)
  if (source.answer && typeof source.answer === 'object' && !Array.isArray(source.answer)) {
    row.answer = textValue(source.answer.content == null ? source.answer.text : source.answer.content) ||
      (Array.isArray(source.answer.keys) ? source.answer.keys.join(',') : '')
  }
  if (Array.isArray(source.options)) {
    source.options.forEach((option, index) => {
      const key = String(option && option.key || String.fromCharCode(65 + index)).toUpperCase()
      if (!/^[A-E]$/.test(key) || source[`option${key}`] != null) return
      row[`option${key}`] = textValue(option && typeof option === 'object'
        ? (option.content == null ? option.text : option.content) : option)
    })
  }
  return row
}

export function buildQuestionListExportPayload({ questions, options = {}, fileType, title }) {
  const normalizedTitle = normalizeExportTitle(title, fileType)
  if (Array.from(normalizedTitle).length > 30) throw new Error('标题不能超过 30 个字符')
  if (!['DOCX', 'PDF'].includes(fileType)) throw new Error('不支持的导出格式')
  const prefix = String(options.questionPrefix || '').trim()
  if (Array.from(prefix).length > 30) throw new Error('题目前缀不能超过 30 个字符')
  if (!Array.isArray(questions) || !questions.length) throw new Error('没有可导出的题目')
  if (questions.length > 200) throw new Error('每次最多导出 200 题')
  const snapshot = questions.map((question, index) => {
    const row = snapshotAiExportQuestion(question)
    if (!row.name.trim()) throw new Error(`第 ${index + 1} 题缺少题干`)
    if (!/^[1-8]$/.test(row.questType)) throw new Error(`第 ${index + 1} 题的题型无法导出`)
    return row
  })
  return {
    options: {
      title: normalizedTitle, fileType, questionPrefix: prefix,
      ...['showAnswer', 'showAnalysis', 'showKnowledge', 'showDifficulty', 'separateAnswerSection']
        .reduce((result, key) => { result[key] = options[key] == null ? true : Boolean(options[key]); return result }, {})
    },
    questions: snapshot
  }
}
