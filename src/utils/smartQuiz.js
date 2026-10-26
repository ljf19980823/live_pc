const SMART_EXAM_TRANSFER_PREFIX = 'teacherone_smart_exam_'
const SMART_EXAM_TRANSFER_TTL = 10 * 60 * 1000

function getEntityValue(entity, field) {
  return entity && entity[field] != null ? entity[field] : ''
}

function buildOptions(question) {
  if (Array.isArray(question && question.options)) {
    return question.options
      .map((option, index) => ({
        key: String((option && option.key) || String.fromCharCode(65 + index)).toUpperCase(),
        text: option && (option.content != null || option.text != null)
          ? String(option.content != null ? option.content : option.text)
          : ''
      }))
      .filter(option => option.text.trim())
  }

  return ['A', 'B', 'C', 'D', 'E']
    .map(key => ({ key, text: question && question[`option${key}`] }))
    .filter(option => option.text != null && String(option.text).trim())
}

function getQuestionScore(question, index, total) {
  if (question && question.score != null && question.score !== '') {
    return Number(question.score) || 0
  }

  if (!total) return 0
  const baseScore = Math.floor(100 / total)
  return baseScore + (index < 100 % total ? 1 : 0)
}

function normalizeCorrectAnswer(question, questType) {
  const answer = question.answer
  const answerKeys = answer && Array.isArray(answer.keys)
    ? answer.keys.map(key => String(key).toUpperCase())
    : []
  let answerText = answer && typeof answer === 'object'
    ? (answer.content != null ? answer.content : (answer.text || ''))
    : (answer || question.correctAnswer || '')

  if ((questType === '1' || questType === '2') && answerKeys.length) {
    return answerKeys.join(',')
  }

  if (questType === '3') {
    const normalized = String(answerText).trim().toLowerCase()
    if (['正确', '对', 'true', 't', 'a'].includes(normalized)) return 'A'
    if (['错误', '错', 'false', 'f', 'b'].includes(normalized)) return 'B'
  }

  return answerText == null ? '' : String(answerText)
}

export function normalizeT1AiQuestions(questions, generation = {}) {
  const list = Array.isArray(questions)
    ? questions.filter(question => question && typeof question === 'object')
    : []
  const source = generation.source || {}
  const sourceSubject = source.subject || {}
  const sourceBook = source.book || {}
  const sourceGrade = source.grade || {}
  const sourceQuestTemplate = source.questTemplate || {}

  return list.map((question, index) => {
    const options = buildOptions(question)
    const optionMap = options.reduce((result, option) => {
      result[`option${option.key}`] = option.text
      return result
    }, {})
    const type = question.type || {}
    const questType = String(getEntityValue(type, 'id') || question.questType || '5')
    const answerText = normalizeCorrectAnswer(question, questType)
    const difficulty = question.difficulty || {}
    const knowledge = question.knowledge || {}
    const chapter = question.chapter || {}
    const book = question.book || {}

    return Object.assign({}, question, optionMap, {
      id: question.topicId || question.id || `generated-${index + 1}`,
      topicId: question.topicId || question.id || `generated-${index + 1}`,
      name: question.stem || question.name || '',
      material: question.material || '',
      questType,
      questTypeName: getEntityValue(type, 'name') || question.questTypeName || '',
      answer: answerText,
      analysis: question.analysis || '',
      score: getQuestionScore(question, index, list.length),
      serialNumber: Number(question.order || question.serialNumber || index + 1),
      subjectId: getEntityValue(sourceSubject, 'id') || question.subjectId,
      subjectName: getEntityValue(sourceSubject, 'name') || question.subjectName,
      difficultyId: question.difficultyId || getEntityValue(difficulty, 'id'),
      difficultyName: question.difficultyName || getEntityValue(difficulty, 'name'),
      knowledgeId: question.knowledgeId || getEntityValue(knowledge, 'id'),
      knowledgeName: question.knowledgeName || getEntityValue(knowledge, 'name'),
      pointId: question.pointId || getEntityValue(chapter, 'id'),
      pointName: question.pointName || getEntityValue(chapter, 'name'),
      bookId: getEntityValue(sourceBook, 'id') || question.bookId || getEntityValue(book, 'id'),
      bookName: getEntityValue(sourceBook, 'name') || question.bookName || getEntityValue(book, 'name'),
      typeId: getEntityValue(sourceGrade, 'id') || question.typeId,
      typeName: getEntityValue(sourceGrade, 'name') || question.typeName,
      questTemplateId: getEntityValue(sourceQuestTemplate, 'id') || question.questTemplateId,
      questTemplateName: getEntityValue(sourceQuestTemplate, 'name') || question.questTemplateName,
      evidenceText: question.evidence
        ? (question.evidence.content != null ? question.evidence.content : (question.evidence.text || ''))
        : ''
    })
  })
}

export function storeSmartExamPayload(payload) {
  const transferKey = `${SMART_EXAM_TRANSFER_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  try {
    window.localStorage.setItem(transferKey, JSON.stringify({
      createdAt: Date.now(),
      payload
    }))
    return transferKey
  } catch (error) {
    // WebView 禁用存储或空间不足时，由答题页从服务端恢复题目。
    return ''
  }
}

export function readSmartExamPayload(transferKey) {
  if (!transferKey || !String(transferKey).startsWith(SMART_EXAM_TRANSFER_PREFIX)) return null

  try {
    const raw = window.localStorage.getItem(transferKey)
    if (!raw) return null
    const stored = JSON.parse(raw)
    if (!stored.createdAt || Date.now() - stored.createdAt > SMART_EXAM_TRANSFER_TTL) {
      window.localStorage.removeItem(transferKey)
      return null
    }
    // 授权刷新会重新挂载答题组件，不能在第一次读取时删除题目。
    return stored.payload || null
  } catch (error) {
    return null
  }
}
