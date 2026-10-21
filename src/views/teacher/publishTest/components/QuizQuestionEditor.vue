<template>
  <section class="question-editor-page">
    <header class="editor-header">
      <div class="header-left">
        <button class="back-button" type="button" @click="$emit('back')">
          <i class="el-icon-back"></i>
          返回题目列表
        </button>
        <span class="header-divider"></span>
        <h2>题目{{ editing ? '编辑' : '新增' }}</h2>
      </div>
      <p>{{ eduType === '专升本' ? '维护题目信息与答案解析' : '维护题目信息与答案解析' }}</p>
    </header>

    <div v-if="!businessMode && eduType === '专升本' && !zsbEditorReady" v-loading="true" class="editor-loading-panel">
      <span>题目信息加载中...</span>
    </div>

    <div v-if="!businessMode && eduType === 'K9K12' && !k12EditorReady" v-loading="true" class="editor-loading-panel">
      <span>题目信息加载中...</span>
    </div>

    <el-form v-if="!businessMode && eduType === '专升本' && zsbEditorReady" class="editor-form" label-width="88px">
      <div class="form-block">
        <h3>专升本题目信息</h3>
        <div class="form-grid">
          <el-form-item label="科目" required>
            <el-cascader
              v-model="localEditor.subjectPath"
              :options="zsbSubjectOptions"
              :props="{ expandTrigger: 'hover', checkStrictly: false }"
              clearable
              filterable
              placeholder="请选择科目"
              @change="handleSubjectChange"
            />
          </el-form-item>
          <el-form-item label="章节" required>
            <el-cascader
              v-model="localEditor.pointPath"
              :options="pointOptions"
              :props="{ expandTrigger: 'hover', checkStrictly: true }"
              popper-class="quiz-question-taxonomy-popper"
              clearable
              filterable
              placeholder="请选择章节"
              @change="handlePointChange"
            >
              <template slot-scope="{ node }">
                <span class="quiz-taxonomy-label" @click.stop="handleTaxonomyLabelClick(node, $event)">{{ node.label }}</span>
              </template>
            </el-cascader>
          </el-form-item>
          <el-form-item label="知识点" required>
            <el-cascader
              v-model="localEditor.knowledgePath"
              :options="knowledgeOptions"
              :props="{ expandTrigger: 'hover', checkStrictly: true }"
              popper-class="quiz-question-taxonomy-popper"
              clearable
              filterable
              placeholder="请选择知识点"
              @change="handleKnowledgeChange"
            >
              <template slot-scope="{ node }">
                <span class="quiz-taxonomy-label" @click.stop="handleTaxonomyLabelClick(node, $event)">{{ node.label }}</span>
              </template>
            </el-cascader>
          </el-form-item>
          <el-form-item label="题型" required>
            <el-select v-model="localEditor.questTemplateId" clearable filterable placeholder="请选择题型" @change="handleQuestTemplateChange">
              <el-option v-for="item in questTypeOptions" :key="item.id" :label="item.name" :value="String(item.id)" />
            </el-select>
          </el-form-item>
          <el-form-item label="难度" required>
            <el-select v-model="localEditor.difficulty" clearable filterable placeholder="请选择难度">
              <el-option v-for="item in difficultyOptions" :key="item.id" :label="item.name" :value="String(item.id)" />
            </el-select>
          </el-form-item>
          <!-- <el-form-item label="排序号" required>
            <el-input
              v-model="localEditor.serialNumber"
              inputmode="numeric"
              placeholder="请输入排序号"
              @input="handleSerialNumberInput"
            />
          </el-form-item> -->
        </div>
      </div>

      <div class="form-block">
        <h3>题目内容</h3>
        <el-form-item label="题目" required>
          <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.name" />
        </el-form-item>
        <template v-if="showOptionEditors">
          <el-form-item label="选项A" required>
            <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.optionA" :minHeight="120" />
          </el-form-item>
          <el-form-item label="选项B" required>
            <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.optionB" :minHeight="120" />
          </el-form-item>
          <el-form-item label="选项C">
            <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.optionC" :minHeight="120" />
          </el-form-item>
          <el-form-item label="选项D">
            <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.optionD" :minHeight="120" />
          </el-form-item>
          <el-form-item label="选项E">
            <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.optionE" :minHeight="120" />
          </el-form-item>
        </template>
        <el-form-item label="答案" required>
          <p v-if="selectedQuestType === '3'" class="answer-tip">提示：请填写 A 或 B，A 代表对，B 代表错。</p>
          <editor :key="selectedQuestType === '3'" :true-false-only="selectedQuestType === '3'" :enable-formula="formulaEditingEnabled" v-model="localEditor.answer" />
        </el-form-item>
        <el-form-item label="解析" required>
          <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.analysis" />
        </el-form-item>
      </div>
    </el-form>

    <el-form v-if="!businessMode && eduType === 'K9K12' && k12EditorReady" class="editor-form" label-width="88px">
      <div class="form-block">
        <h3>题目信息</h3>
        <div class="form-grid">
          <el-form-item label="科目" required>
            <el-cascader
              v-model="localEditor.subjectPath"
              :options="k12SubjectOptions"
              :props="{ expandTrigger: 'hover' }"
              clearable
              filterable
              placeholder="请选择科目"
              @change="handleK12SubjectChange"
            />
          </el-form-item>
          <el-form-item label="教材版本" required>
            <el-select v-model="localEditor.bookId" clearable filterable placeholder="请选择教材版本" @change="handleK12BookChange">
              <el-option v-for="item in k12BookOptions" :key="item.id" :label="item.name" :value="String(item.id)" />
            </el-select>
          </el-form-item>
          <el-form-item label="年级" required>
            <el-select v-model="localEditor.typeId" clearable filterable placeholder="请选择年级" @change="handleK12LevelChange">
              <el-option v-for="item in k12LevelOptions" :key="item.id || item.name" :label="item.name" :value="String(item.id || item.name)" />
            </el-select>
          </el-form-item>
          <el-form-item label="章节" required>
            <el-cascader
              v-model="localEditor.pointPath"
              :options="k12PointOptions"
              :props="{ expandTrigger: 'hover', checkStrictly: true }"
              popper-class="quiz-question-taxonomy-popper"
              clearable
              filterable
              placeholder="请选择章节"
              @change="handleK12PointChange"
            >
              <template slot-scope="{ node }">
                <span class="quiz-taxonomy-label" @click.stop="handleTaxonomyLabelClick(node, $event)">{{ node.label }}</span>
              </template>
            </el-cascader>
          </el-form-item>
          <el-form-item label="知识点" required>
            <el-cascader
              v-model="localEditor.knowledgePath"
              :options="k12KnowledgeOptions"
              :props="{ expandTrigger: 'hover', checkStrictly: true }"
              popper-class="quiz-question-taxonomy-popper"
              clearable
              filterable
              placeholder="请选择知识点"
              @change="handleKnowledgeChange"
            >
              <template slot-scope="{ node }">
                <span class="quiz-taxonomy-label" @click.stop="handleTaxonomyLabelClick(node, $event)">{{ node.label }}</span>
              </template>
            </el-cascader>
          </el-form-item>
          <el-form-item label="题型" required>
            <el-select v-model="localEditor.questTemplateId" clearable filterable placeholder="请选择题型" @change="handleQuestTemplateChange">
              <el-option v-for="item in k12QuestTypeOptions" :key="item.id" :label="item.name" :value="String(item.id)" />
            </el-select>
          </el-form-item>
          <el-form-item label="难度" required>
            <el-select v-model="localEditor.difficulty" clearable filterable placeholder="请选择难度">
              <el-option v-for="item in difficultyOptions" :key="item.id" :label="item.name" :value="String(item.id)" />
            </el-select>
          </el-form-item>
          <!-- <el-form-item label="排序号" required>
            <el-input
              v-model="localEditor.serialNumber"
              inputmode="numeric"
              placeholder="请输入排序号"
              @input="handleSerialNumberInput"
            />
          </el-form-item> -->
        </div>
      </div>

      <div class="form-block">
        <h3>题目内容</h3>
        <el-form-item label="题目" required>
          <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.name"/>
        </el-form-item>
        <template v-if="showOptionEditors">
          <el-form-item label="选项A" required>
            <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.optionA" :minHeight="120" />
          </el-form-item>
          <el-form-item label="选项B" required>
            <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.optionB" :minHeight="120" />
          </el-form-item>
          <el-form-item label="选项C">
            <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.optionC" :minHeight="120" />
          </el-form-item>
          <el-form-item label="选项D">
            <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.optionD" :minHeight="120" />
          </el-form-item>
          <el-form-item label="选项E">
            <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.optionE" :minHeight="120" />
          </el-form-item>
        </template>
        <el-form-item label="答案" required>
          <p v-if="selectedQuestType === '3'" class="answer-tip">提示：请填写 A 或 B，A 代表对，B 代表错。</p>
          <editor :key="selectedQuestType === '3'" :true-false-only="selectedQuestType === '3'" :enable-formula="formulaEditingEnabled" v-model="localEditor.answer" />
        </el-form-item>
        <el-form-item label="解析" required>
          <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.analysis" />
        </el-form-item>
      </div>
    </el-form>

    <!-- 当前课后测入口启用独立学段表单；上面的原表单供旧组卷入口使用。 -->
    <el-form v-if="businessMode" v-loading="businessInitializing || saving" :disabled="saving" class="editor-form" label-width="88px">
      <div class="form-block">
        <h3>题目信息</h3>
        <div class="form-grid">
          <el-form-item label="学段" required>
            <el-select :key="businessPickerKey" v-model="localEditor.businessId" clearable filterable placeholder="请选择学段" @change="handleBusinessChange">
              <el-option v-for="item in businessOptions" :key="item.id" :label="item.name" :value="String(item.id)" />
            </el-select>
            <el-button v-if="!businessOptions.length" type="text" @click="loadBusinessBase">重新加载学段</el-button>
          </el-form-item>
          <el-form-item label="科目" required>
            <el-cascader ref="business-subject" :key="businessSubjectPickerKey" v-model="localEditor.subjectPath" :options="businessSubjectOptions" :props="businessSubjectProps" :disabled="!selectedBusiness || businessTreeLoading" clearable filterable placeholder="请选择科目" popper-class="practice-filter-taxonomy-popper" @change="handleBusinessSubjectChange" @visible-change="handleBusinessPopperVisible($event, 'business-subject')" @expand-change="updateBusinessPopper('business-subject')" />
            <el-button v-if="businessTreeError" type="text" @click="retryBusinessTree">重新加载科目</el-button>
          </el-form-item>
          <template v-if="businessSubject">
            <template v-if="businessStandardType === 1">
              <el-form-item label="教材版本" required>
                <el-select v-model="localEditor.bookId" clearable filterable placeholder="请选择教材版本" @change="handleBusinessBookChange">
                  <el-option v-for="item in businessBookOptions" :key="item.id" :label="item.name" :value="String(item.id)" />
                </el-select>
              </el-form-item>
              <el-form-item label="年级" required>
                <el-select v-model="localEditor.typeId" :disabled="!localEditor.bookId" clearable filterable placeholder="请选择年级" @change="handleBusinessLevelChange">
                  <el-option v-for="item in businessLevelOptions" :key="item.id || item.name" :label="item.name" :value="String(item.id || item.name)" />
                </el-select>
              </el-form-item>
            </template>
            <el-form-item label="章节" required>
              <el-select v-if="businessStandardType === 2" :value="businessPointSelection" value-key="id" clearable filterable allow-create default-first-option placeholder="请选择或输入创建章节" @change="handleBusinessGeneralPointChange">
                <el-option v-for="item in businessGeneralPoints" :key="item.id" :label="item.label" :value="item" />
              </el-select>
              <el-cascader v-else ref="business-point" v-model="localEditor.pointPath" :options="businessPointOptions" :props="businessTaxonomyProps" :disabled="businessStandardType === 1 && (!localEditor.bookId || !localEditor.typeId)" clearable filterable placeholder="请选择章节" popper-class="practice-filter-taxonomy-popper" @change="handleBusinessPointChange" @visible-change="handleBusinessPopperVisible($event, 'business-point')" @expand-change="updateBusinessPopper('business-point')">
                <template slot-scope="{ node }"><span class="practice-taxonomy-label" @click.stop="handleTaxonomyLabelClick(node, $event)">{{ node.label }}</span></template>
              </el-cascader>
            </el-form-item>
            <el-form-item label="知识点" required>
              <el-select v-if="businessStandardType === 2" :value="businessKnowledgeSelection" value-key="id" clearable filterable allow-create default-first-option placeholder="请选择或输入创建知识点" @change="handleBusinessGeneralKnowledgeChange">
                <el-option v-for="item in businessGeneralKnowledge" :key="item.id" :label="item.label" :value="item" />
              </el-select>
              <el-cascader v-else ref="business-knowledge" v-model="localEditor.knowledgePath" :options="businessKnowledgeOptions" :props="businessTaxonomyProps" :disabled="businessStandardType === 0 && !localEditor.pointId" clearable filterable placeholder="请选择知识点" popper-class="practice-filter-taxonomy-popper" @change="handleKnowledgeChange" @visible-change="handleBusinessPopperVisible($event, 'business-knowledge')" @expand-change="updateBusinessPopper('business-knowledge')">
                <template slot-scope="{ node }"><span class="practice-taxonomy-label" @click.stop="handleTaxonomyLabelClick(node, $event)">{{ node.label }}</span></template>
              </el-cascader>
            </el-form-item>
            <el-form-item label="题型" required>
              <el-select v-model="localEditor.questTemplateId" clearable filterable placeholder="请选择题型" @change="handleQuestTemplateChange">
                <el-option v-for="item in businessQuestTypeOptions" :key="item.id" :label="item.name" :value="String(item.id)" />
              </el-select>
            </el-form-item>
            <el-form-item label="难度" required>
              <el-select v-model="localEditor.difficulty" clearable filterable placeholder="请选择难度">
                <el-option v-for="item in difficultyOptions" :key="item.id" :label="item.name" :value="String(item.id)" />
              </el-select>
            </el-form-item>
          </template>
        </div>
        <el-button v-if="businessOptionsError && businessSubject" type="text" @click="retryBusinessSubjectOptions">重新加载分类选项</el-button>
        <el-button v-if="businessDetailError" type="text" @click="retryBusinessDetails">重新加载题目详情</el-button>
      </div>
      <div class="form-block">
        <h3>题目内容</h3>
        <el-form-item label="题目" required>
          <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.name" />
        </el-form-item>
        <template v-if="showOptionEditors">
          <el-form-item label="选项A" required>
            <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.optionA" :minHeight="120" />
          </el-form-item>
          <el-form-item label="选项B" required>
            <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.optionB" :minHeight="120" />
          </el-form-item>
          <el-form-item label="选项C">
            <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.optionC" :minHeight="120" />
          </el-form-item>
          <el-form-item label="选项D">
            <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.optionD" :minHeight="120" />
          </el-form-item>
          <el-form-item label="选项E">
            <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.optionE" :minHeight="120" />
          </el-form-item>
        </template>
        <el-form-item label="答案" required>
          <p v-if="selectedQuestType === '3'" class="answer-tip">提示：请填写 A 或 B，A 代表对，B 代表错。</p>
          <editor :key="selectedQuestType === '3'" :true-false-only="selectedQuestType === '3'" :enable-formula="formulaEditingEnabled" v-model="localEditor.answer" />
        </el-form-item>
        <el-form-item label="解析" required>
          <editor :enable-formula="formulaEditingEnabled" v-model="localEditor.analysis" />
        </el-form-item>
      </div>
    </el-form>

    <footer class="editor-footer">
      <el-button @click="$emit('back')">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="businessMode && (businessInitializing || businessPending > 0 || businessTreeLoading || businessDetailError)" @click="handleSave">保存</el-button>
    </footer>
  </section>
</template>

<script>
import Editor from '@/components/Editor'
import { getAuthInfo } from '@/utils/auth'
import { getTrueFalseAnswer } from '@/utils/trueFalseAnswer'
import { normalizeZsbSubjectOptions, findZsbSubjectPath, getZsbSubject } from '@/utils/zsbSubjects'


import {
  addTopic,
  getTeachingCloudOptions,
  getTopicDetail,
  getTopicBookList,
  getTopicCompulsorySubjectList,
  getTopicUnCompulsorySubjectList,
  getTopicDictItemList,
  getTopicKnowledgeCompulsoryList,
  getTopicKnowledgeList,
  getTopicQuestTypeTemplates,
  getTopicSubjectPointCompulsoryList,
  getTopicSubjectPointList,
  getTopicTypeListByBook,
  updateTopic
} from '@/api/quizBuilder'

const TOPIC_DIFFICULTY_DICT_ID = '2'
const TOPIC_KNOWLEDGE_DICT_ID = '1'

const emptyEditor = () => ({
  name: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  optionE: '',
  answer: '',
  analysis: '',
  businessId: '',
  businessName: '',
  compulsory: '',
  areaPath: [],
  typeId: '',
  subjectId: '',
  pointId: '',
  treeId: '',
  pointPath: [],
  knowledgePath: [],
  subjectPath: [],
  questTemplateId: '',
  questType: '',
  difficulty: '',
  knowledge: '',
  knowledgeId: '',
  bookId: '',
  serialNumber: '1',
  subjectName: '',
  pointName: '',
  knowledgeName: '',
  questTypeName: '',
  difficultyName: '',
  bookName: '',
  typeName: '',
  levelName: ''
})

export default {
  name: 'QuizQuestionEditor',
  components: {
    Editor
  },
  props: {
    value: {
      type: Object,
      default: () => ({})
    },
    businessMode: {
      type: Boolean,
      default: false
    },
    eduType: {
      type: String,
      required: true
    },
    editing: {
      type: Boolean,
      default: false
    },
    questId: {
      type: [String, Number],
      default: ''
    }
  },
  data() {
    return {
      // 后续重新开放公式编辑时，将此开关设为 true。
      formulaEditingEnabled: true,
      localEditor: emptyEditor(),
      businessOptions: [],
      businessSubjectTrees: {},
      businessBookOptions: [],
      businessLevelOptions: [],
      businessPointOptions: [],
      businessKnowledgeOptions: [],
      businessQuestTypeOptions: [],
      businessPickerKey: 0,
      businessSubjectPickerKey: 0,
      businessInitializing: false,
      businessTreeLoading: false,
      businessTreeError: false,
      businessOptionsError: false,
      businessDetailError: false,
      businessDetailFallback: {},
      businessPending: 0,
      businessRevision: 0,
      businessRequestSequences: {},
      businessDestroyed: false,
      businessInitialQuestId: '',

      subjectOptions: [],
      zsbSubjectOptions: [],
      pointOptions: [],
      knowledgeOptions: [],
      questTypeOptions: [],
      k12SubjectGroups: [],
      k12SubjectRaw: [],
      k12SubjectOptions: [],
      k12BookOptions: [],
      k12LevelOptions: [],
      k12PointOptions: [],
      k12KnowledgeOptions: [],
      k12QuestTypeOptions: [],
      difficultyOptions: [],
      optionsLoading: false,
      saving: false,
      detailLoading: false,
      detailRequestSeq: 0,
      zsbOptionsReady: false,
      zsbOptionsRequestSeq: 0,
      k12OptionsReady: false,
      k12OptionsRequestSeq: 0,
      editorOptions: {
        theme: 'snow',
        placeholder: '请输入内容',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ color: [] }, { background: [] }],
            ['link', 'image'],
            ['clean']
          ]
        }
      },
      compactEditorOptions: {
        theme: 'snow',
        placeholder: '请输入内容',
        modules: {
          toolbar: [['bold', 'italic', 'underline'], ['image'], ['clean']]
        }
      }
    }
  },
  watch: {
    value: {
      immediate: true,
      deep: true,
      handler(value) {
        if (this.businessMode) {
          this.initializeBusinessEditor(value)
          return
        }
        this.localEditor = {
          ...emptyEditor(),
          ...(value || {})
        }
        this.prepareZsbOptions()
        this.prepareK12Options()
      }
    },
    questId: {
      immediate: true,
      handler() {
        if (this.businessMode) {
          if (String(this.questId || '') !== this.businessInitialQuestId) this.initializeBusinessEditor(this.value)
          return
        }
        this.loadTopicDetail()
      }
    }
  },
  mounted() {
    if (this.businessMode) return
    this.prepareZsbOptions()
    this.prepareK12Options()
  },
  beforeDestroy() {
    this.businessDestroyed = true
    this.businessRevision += 1
    this.detailRequestSeq += 1
  },
  computed: {
    selectedBusiness() {
      const businessId = this.normalizeBusinessId(this.localEditor.businessId)
      if (!businessId) return null
      return this.businessOptions.find(item => this.normalizeBusinessId(item.id) === businessId) || null
    },
    businessStandardType() {
      // 编辑题目的模式由详情 compulsory 决定，学段项只负责 ID 和名称回显。
      if (this.selectedBusiness && String(this.localEditor.compulsory) === '1') return 1
      if (this.selectedBusiness && String(this.localEditor.compulsory) === '0') return 2
      return this.selectedBusiness ? this.selectedBusiness.standardType : -1
    },
    businessSubjectOptions() {
      return this.businessSubjectTrees[this.localEditor.businessId] || []
    },
    businessSubject() {
      if (!this.selectedBusiness) return null
      let nodes = this.businessSubjectOptions
      let selected = null
      for (const value of this.localEditor.subjectPath || []) {
        selected = nodes.find(item => item.value === value)
        if (!selected) return null
        nodes = selected.children || []
      }
      return selected && selected.leaf ? selected : null
    },
    businessSubjectProps() { return { expandTrigger: 'click', checkStrictly: false } },
    businessTaxonomyProps() { return { expandTrigger: 'hover', checkStrictly: true } },
    businessGeneralPoints() { return this.flattenBusinessTaxonomy(this.businessPointOptions) },
    businessGeneralKnowledge() { return this.flattenBusinessTaxonomy(this.businessKnowledgeOptions) },
    // 有 ID 时回显选项对象；无 ID 时直接回显自定义名称，不按同名选项自动匹配。
    businessPointSelection() {
      return this.localEditor.pointId
        ? this.businessGeneralPoints.find(item => item.id === this.localEditor.pointId) || ''
        : this.localEditor.pointName
    },
    businessKnowledgeSelection() {
      return this.localEditor.knowledge
        ? this.businessGeneralKnowledge.find(item => item.id === this.localEditor.knowledge) || ''
        : this.localEditor.knowledgeName
    },
    activeQuestTypeOptions() {
      if (this.businessMode) return this.businessQuestTypeOptions
      return this.eduType === '专升本' ? this.questTypeOptions : this.k12QuestTypeOptions
    },
    selectedQuestType() {
      const template = this.activeQuestTypeOptions.find(item => String(item.id) === String(this.localEditor.questTemplateId)) || {}
      return String(template.questType || this.localEditor.questType || '')
    },
    showOptionEditors() {
      return ['1', '2', '8'].includes(this.selectedQuestType)
    },
    zsbEditorReady() {
      return this.zsbOptionsReady && !this.detailLoading
    },
    k12EditorReady() {
      return this.k12OptionsReady && !this.detailLoading
    }
  },
  methods: {
    normalizeBusinessId(value) {
      return value == null ? '' : String(value).trim()
    },
    captureBusinessRequest(kind, dependencies = []) {
      const sequence = (this.businessRequestSequences[kind] || 0) + 1
      this.businessRequestSequences[kind] = sequence
      // 学段表单完全不依赖 eduType；同类请求和关联条件必须仍是当前版本。
      const context = () => JSON.stringify([this.businessRevision, this.localEditor.businessId, ...dependencies.map(field => this.localEditor[field])])
      const original = context()
      return () => !this.businessDestroyed && this.businessMode && this.businessRequestSequences[kind] === sequence && context() === original
    },
    async waitBusinessOptions(request) {
      this.businessPending += 1
      try { return await request } finally { this.businessPending -= 1 }
    },
    businessTeachingCloudParams(params = {}) {
      return {
        ...params,
        isHome: 0,
        institutionId: this.currentInstitutionId()
      }
    },
    currentInstitutionId() {
      const authInfo = getAuthInfo() || {}
      return localStorage.getItem('teaching_cloud_institution_id') || authInfo.institutionId || ''
    },
    normalizeBusinessSubjects(rows, prefix) {
      return (Array.isArray(rows) ? rows : []).map(item => {
        const itemId = item.id != null && String(item.id).trim() !== '' ? item.id : item.subjectId
        const id = String(itemId == null ? '' : itemId).trim()
        const value = prefix + '/' + encodeURIComponent(id)
        const childRows = [item.subjectList, item.children, item.childList]
          .find(list => Array.isArray(list) && list.length) || []
        const children = this.normalizeBusinessSubjects(childRows, value)
        return { ...item, id, value, label: item.name || item.otherName || '', leaf: !children.length, ...(children.length ? { children } : {}) }
      })
    },
    normalizeBusinessKnowledge(rows) {
      const list = Array.isArray(rows) ? rows : []
      return list.some(item => Array.isArray(item.children) && item.children.length)
        ? this.normalizeTree(list) : this.normalizeFlatTree(list)
    },
    businessSeed(value) {
      const seed = JSON.parse(JSON.stringify(value || {}))
      const context = seed._questionContext || {}
      const typeName = seed.typeName || seed.levelName || ''
      return {
        ...emptyEditor(), ...seed,
        id: String(seed.id || seed.questId || ''),
        businessId: this.normalizeBusinessId(
          seed.businessId != null && String(seed.businessId).trim() !== ''
            ? seed.businessId
            : context.businessId
        ),
        subjectId: String(seed.subjectId || context.subjectId || '').trim(),
        subjectPath: Array.isArray(seed.subjectPath) ? seed.subjectPath : [],
        pointId: String(seed.pointId || seed.treeId || this.lastValue(seed.pointPath) || ''),
        knowledge: String(seed.knowledge || seed.knowledgeId || this.lastValue(seed.knowledgePath) || ''),
        difficulty: String(seed.difficulty || seed.difficultyId || ''),
        questTemplateId: String(seed.questTemplateId || context.questTemplateId || seed.questTypeTemplateId || seed.questTypeId || seed.questType || ''),
        questType: String(seed.questType || ''),
        bookId: String(seed.bookId || ''), typeId: String(seed.typeId || ''),
        typeName,
        levelName: typeName,
        serialNumber: seed.serialNumber || '1'
      }
    },
    clearBusinessClassification() {
      Object.assign(this.localEditor, {
        subjectId: '', subjectPath: [], pointId: '', treeId: '', pointPath: [], knowledge: '', knowledgeId: '', knowledgePath: [],
        bookId: '', typeId: '', questTemplateId: '', difficulty: '',
        subjectName: '', pointName: '', knowledgeName: '', bookName: '', typeName: '', levelName: '', questTypeName: '', difficultyName: ''
      })
      this.businessBookOptions = []
      this.businessLevelOptions = []
      this.businessPointOptions = []
      this.businessKnowledgeOptions = []
      this.businessQuestTypeOptions = []
      this.businessOptionsError = false
    },
    async loadBusinessBase() {
      const isCurrent = this.captureBusinessRequest('base')
      const authInfo = getAuthInfo() || {}
      const institutionId = localStorage.getItem('teaching_cloud_institution_id') || authInfo.institutionId || ''
      const [businesses, difficulties] = await this.waitBusinessOptions(Promise.allSettled([
        getTeachingCloudOptions('/home/getBusinessAll', { institutionId }),
        getTeachingCloudOptions('/dict/getAll', { id: TOPIC_DIFFICULTY_DICT_ID })
      ]))
      if (!isCurrent()) return false
      if (businesses.status === 'fulfilled') {
        this.businessOptions = (Array.isArray(businesses.value) ? businesses.value : [])
          .filter(item => item && this.normalizeBusinessId(item.id))
          .map(item => ({
            ...item,
            id: this.normalizeBusinessId(item.id),
            standardType: item.standardType == null ? -1 : Number(item.standardType)
          }))
        // 加载下拉数据不修改题目字段；空 ID 保持未选，详情 ID 也不会被清空或猜测替换。
        this.businessPickerKey += 1
      } else {
        this.businessOptions = []
        this.$message.warning('学段加载失败，请重新加载学段')
      }
      if (difficulties.status === 'fulfilled') this.difficultyOptions = difficulties.value || []
      else this.$message.warning('难度加载失败，请重新加载学段重试')
      return businesses.status === 'fulfilled'
    },
    async ensureBusinessSubjects() {
      const business = this.selectedBusiness
      if (!business) return null
      if (this.businessSubjectTrees[business.id]) return this.businessSubjectTrees[business.id]
      const isCurrent = this.captureBusinessRequest('tree:' + business.id)
      this.businessTreeLoading = true
      this.businessTreeError = false
      try {
        const authInfo = getAuthInfo() || {}
        const institutionId = localStorage.getItem('teaching_cloud_institution_id') || authInfo.institutionId || ''
        const rows = await getTeachingCloudOptions('/home/getSubjectByBusiness', {
          institutionId,
          id: business.id,
          standardType: this.businessStandardType
        })
        if (!isCurrent()) return null
        const tree = this.normalizeBusinessSubjects(rows, 'business:' + business.id)
        this.$set(this.businessSubjectTrees, business.id, tree)
        if (!tree.length) this.$message.warning('该学段暂无可选科目')
        return tree
      } catch (error) {
        if (isCurrent()) {
          this.businessTreeError = true
          this.$message.warning('科目加载失败，请重新加载科目')
        }
        return null
      } finally { if (isCurrent()) this.businessTreeLoading = false }
    },
    async retryBusinessTree() {
      const tree = await this.ensureBusinessSubjects()
      if (tree && this.localEditor.subjectId) await this.restoreBusinessSubject()
    },
    restoreDetailBusiness(detail) {
      if (!detail) return false
      const compulsory = this.normalizeBusinessId(detail.compulsory)
      const detailBusinessId = this.normalizeBusinessId(detail.businessId)
      if (['0', '1'].includes(compulsory)) this.$set(this.localEditor, 'compulsory', compulsory)
      if (!detailBusinessId) return false
      const business = this.businessOptions.find(item => (
        item.id === detailBusinessId
      ))
      this.$set(this.localEditor, 'businessId', detailBusinessId)
      if (!business) return false
      this.$set(this.localEditor, 'businessName', business.name || '')
      this.businessPickerKey += 1
      return true
    },
    async initializeBusinessEditor(value) {
      const revision = ++this.businessRevision
      const isCurrent = () => !this.businessDestroyed && this.businessMode && revision === this.businessRevision
      this.businessInitialQuestId = String(this.questId || '')
      this.localEditor = this.businessSeed(value)
      if (!this.editing && !this.businessInitialQuestId) {
        // 新增题目必须由用户主动选择学段，不能沿用列表筛选或外部传入的学段上下文。
        this.localEditor.businessId = ''
        this.localEditor.businessName = ''
        this.localEditor.compulsory = ''
      }
      this.businessDetailFallback = { ...this.localEditor }
      this.businessInitializing = true
      this.businessTreeLoading = false
      this.businessTreeError = false
      this.businessDetailError = false
      this.businessOptionsError = false
      this.businessBookOptions = []
      this.businessLevelOptions = []
      this.businessPointOptions = []
      this.businessKnowledgeOptions = []
      this.businessQuestTypeOptions = []
      let loadedDetail = null
      try {
        if (this.editing && this.businessInitialQuestId) {
          try {
            const detail = await getTopicDetail(this.businessInitialQuestId)
            if (!isCurrent()) return
            loadedDetail = detail
            const seed = this.localEditor
            // 详情缺少学段时用列表上下文；知识点、难度别名不能被列表旧值遮盖。
            this.localEditor = this.businessSeed({ ...seed, ...(detail || {}),
              businessId: detail && detail.businessId != null && String(detail.businessId).trim() !== ''
                ? detail.businessId
                : seed.businessId,
              pointId: detail && (detail.pointId || detail.treeId) || seed.pointId,
              knowledge: detail && (detail.knowledge || detail.knowledgeId) || seed.knowledge,
              difficulty: detail && (detail.difficulty || detail.difficultyId) || seed.difficulty,
              questTemplateId: detail && (detail.questTemplateId || detail.questTypeTemplateId || detail.questTypeId || detail.questType) || seed.questTemplateId
            })
          } catch (error) {
            if (!isCurrent()) return
            this.businessDetailError = true
            this.$message.warning('题目详情加载失败，请重新加载后保存')
          }
        }
        await this.loadBusinessBase()
        if (!isCurrent()) return
        // 详情的 compulsory 决定题目模式，学段严格使用详情 businessId 在选项加载完成后回显。
        if (loadedDetail) this.restoreDetailBusiness(loadedDetail)
        if (this.businessStandardType === 2 && loadedDetail) {
          // 加载学段后才能确认是否支持自定义；详情只有名称时，清除列表带入的旧 ID、别名和路径。
          if (loadedDetail.pointName != null && !loadedDetail.pointId && !loadedDetail.treeId) {
            this.handleBusinessGeneralPointChange(loadedDetail.pointName)
          }
          if (loadedDetail.knowledgeName != null && !loadedDetail.knowledge && !loadedDetail.knowledgeId) {
            this.handleBusinessGeneralKnowledgeChange(loadedDetail.knowledgeName)
          }
        }
        if (!this.selectedBusiness) {
          if (!this.localEditor.businessId) this.clearBusinessClassification()
          return
        }
        const tree = await this.ensureBusinessSubjects()
        if (!isCurrent() || tree === null) return
        await this.restoreBusinessSubject()
      } finally { if (isCurrent()) this.businessInitializing = false }
    },
    async retryBusinessDetails() {
      // 详情失败后用户补写的正文不能被重试覆盖；未改动的字段仍取服务端详情。
      const fields = ['name', 'optionA', 'optionB', 'optionC', 'optionD', 'optionE', 'answer', 'analysis']
      const changes = fields.reduce((result, field) => {
        if (this.localEditor[field] !== this.businessDetailFallback[field]) result[field] = this.localEditor[field]
        return result
      }, {})
      const revision = this.businessRevision + 1
      await this.initializeBusinessEditor(this.localEditor)
      if (!this.businessDestroyed && revision === this.businessRevision) Object.assign(this.localEditor, changes)
    },
    async restoreBusinessSubject() {
      const subjectId = String(this.localEditor.subjectId || '')
      const matches = []
      const collect = (nodes, path = []) => (nodes || []).forEach(node => {
        const next = [...path, node.value]
        if (node.leaf && node.id === subjectId) matches.push(next)
        collect(node.children, next)
      })
      collect(this.businessSubjectOptions)
      // 科目树已按 businessId 加载；同一学段内重复出现的 subjectId 代表同一科目，取首条有效路径回显。
      const selected = this.businessSubject
      const path = selected && selected.id === subjectId ? [...this.localEditor.subjectPath] : matches[0] || []
      if (!path.length) {
        this.clearBusinessClassification()
        if (subjectId) this.$message.warning('科目已不可用，请手动选择科目')
        return
      }
      this.localEditor.subjectPath = path
      this.localEditor.subjectId = this.businessSubject.id
      this.businessSubjectPickerKey += 1
      await this.loadBusinessSubjectOptions(true)
    },
    async handleBusinessChange() {
      this.businessRevision += 1
      this.businessInitializing = false
      this.businessTreeLoading = false
      this.businessTreeError = false
      // 用户切换学段后，后续联动使用新学段的模式，不沿用原题目 compulsory。
      this.localEditor.compulsory = ''
      this.localEditor.businessName = this.selectedBusiness ? this.selectedBusiness.name : ''
      this.clearBusinessClassification()
      this.businessSubjectPickerKey += 1
      await this.ensureBusinessSubjects()
    },
    async handleBusinessSubjectChange() {
      const path = [...this.localEditor.subjectPath]
      const subject = this.businessSubject
      this.businessRevision += 1
      this.businessInitializing = false
      this.clearBusinessClassification()
      if (!subject) return
      this.localEditor.subjectPath = path
      this.localEditor.subjectId = subject.id
      await this.loadBusinessSubjectOptions()
    },
    restoreBusinessTreeChoice(field, pathField, options) {
      const value = this.localEditor[field]
      const path = value ? this.findTreePath(options, value) : []
      this.localEditor[pathField] = path
      if (this.businessStandardType === 2) {
        // 重载选项时保留无 ID 的自定义名称；已有 ID 失效时仍要求重新选择，不降级为自定义。
        const nameField = field === 'pointId' ? 'pointName' : 'knowledgeName'
        this.localEditor[field === 'pointId' ? 'treeId' : 'knowledgeId'] = field === 'pointId' ? '' : (path.length ? value : '')
        this.localEditor[nameField] = value
          ? (this.findTreeNode(options, value) || {}).label || ''
          : String(this.localEditor[nameField] || '').trim()
      }
      if (value && !path.length) {
        this.localEditor[field] = ''
        const nameField = field === 'pointId' ? 'pointName' : 'knowledgeName'
        this.localEditor[nameField] = ''
        this.$message.warning('原章节或知识点已不可用，请重新选择')
      }
    },
    restoreBusinessSelect(field, options) {
      const value = this.localEditor[field]
      if (value && !(options || []).some(item => String(item.id || item.name) === String(value))) {
        this.localEditor[field] = ''
        this.$message.warning('原分类选项已不可用，请重新选择')
      }
    },
    async retryBusinessSubjectOptions() {
      await this.loadBusinessSubjectOptions(true)
    },
    async loadBusinessQuestTypes(subject) {
      const businessId = this.localEditor.businessId
      const subjectId = String(subject.id)
      const subjectPath = JSON.stringify(this.localEditor.subjectPath || [])
      const isCurrentSubject = () => {
        const current = this.businessSubject
        return !this.businessDestroyed && this.businessMode &&
          this.localEditor.businessId === businessId &&
          JSON.stringify(this.localEditor.subjectPath || []) === subjectPath &&
          current && current.id === subjectId
      }
      if (!subject.questType) {
        if (isCurrentSubject()) this.businessQuestTypeOptions = []
        return []
      }
      try {
        const institutionId = localStorage.getItem('teaching_cloud_institution_id') || ''
        const templates = await this.waitBusinessOptions(getTeachingCloudOptions('/questTypeTemplate/getAll', {
          id: subject.questType,
          isHome: 0,
          institutionId
        }))
        if (!isCurrentSubject()) return null
        const options = (Array.isArray(templates) ? templates : []).map(item => ({
          ...item,
          id: String(item.id),
          questType: String(item.questType || '')
        }))
        this.businessQuestTypeOptions = options
        return options
      } catch (error) {
        if (isCurrentSubject()) {
          this.businessQuestTypeOptions = []
          this.businessOptionsError = true
          this.$message.warning('题型加载失败，请重新加载分类选项')
        }
        return null
      }
    },
    async loadBusinessSubjectOptions(restore = false) {
      if (!this.businessSubject) return
      const subject = this.businessSubject
      const type = this.businessStandardType
      const isCurrent = this.captureBusinessRequest('subject', ['subjectPath'])
      const questTypesRequest = this.loadBusinessQuestTypes(subject)
      this.businessOptionsError = false
      try {
        const [first, knowledge] = await this.waitBusinessOptions(Promise.all([
          type === 1
            ? getTeachingCloudOptions('/dict/getAll', this.businessTeachingCloudParams({ id: '22', subjectId: subject.id }))
            : getTeachingCloudOptions('/subjectPoint/getAll', { id: subject.id }),
          type === 1
            ? getTeachingCloudOptions('/knowledgeCompulsory/getList', this.businessTeachingCloudParams({ subjectId: subject.id }))
            : Promise.resolve([])
        ]))
        if (!isCurrent()) return
        if (type === 1) this.businessBookOptions = first || []
        else {
          this.localEditor.bookId = ''
          this.localEditor.typeId = ''
          this.businessPointOptions = this.normalizeBusinessKnowledge(first)
        }
        this.businessKnowledgeOptions = this.normalizeBusinessKnowledge(knowledge)
        const questTypes = await questTypesRequest
        if (!isCurrent()) return
        if (!restore) return
        if (questTypes !== null) this.restoreBusinessSelect('questTemplateId', this.businessQuestTypeOptions)
        this.restoreBusinessSelect('difficulty', this.difficultyOptions)
        if (type === 1) {
          this.restoreBusinessSelect('bookId', this.businessBookOptions)
          if (this.localEditor.bookId) await this.loadBusinessLevels()
          if (!isCurrent()) return
          this.restoreBusinessSelect('typeId', this.businessLevelOptions)
          if (this.localEditor.bookId && this.localEditor.typeId) await this.loadBusinessPoints()
          if (!isCurrent()) return
        }
        this.restoreBusinessTreeChoice('pointId', 'pointPath', this.businessPointOptions)
        if (type !== 1 && this.localEditor.pointId) await this.loadBusinessKnowledge()
        else if (type === 1) this.restoreBusinessTreeChoice('knowledge', 'knowledgePath', this.businessKnowledgeOptions)
        else this.restoreBusinessTreeChoice('knowledge', 'knowledgePath', [])
      } catch (error) {
        if (isCurrent()) {
          this.businessOptionsError = true
          this.$message.warning('分类选项加载失败，请重新加载分类选项')
        }
      }
    },
    async loadBusinessLevels() {
      const isCurrent = this.captureBusinessRequest('levels', ['subjectPath', 'bookId'])
      if (!this.businessSubject || !this.localEditor.bookId) return
      try {
        const rows = await this.waitBusinessOptions(getTeachingCloudOptions('/book/getTypeByBook', this.businessTeachingCloudParams({
          subjectId: this.businessSubject.id,
          bookId: this.localEditor.bookId
        })))
        if (isCurrent()) this.businessLevelOptions = rows || []
      } catch (error) { if (isCurrent()) this.$message.warning('年级加载失败，请重新选择教材重试') }
    },
    async loadBusinessPoints() {
      const isCurrent = this.captureBusinessRequest('points', ['subjectPath', 'bookId', 'typeId'])
      if (!this.businessSubject || !this.localEditor.bookId || !this.localEditor.typeId) return
      try {
        const rows = await this.waitBusinessOptions(getTeachingCloudOptions('/subjectPointCompulsory/getList', this.businessTeachingCloudParams({
          subjectId: this.businessSubject.id,
          bookId: this.localEditor.bookId,
          level: this.localEditor.typeId
        })))
        if (isCurrent()) this.businessPointOptions = this.normalizeFlatTree(rows || [])
      } catch (error) { if (isCurrent()) this.$message.warning('章节加载失败，请重新选择年级重试') }
    },
    async loadBusinessKnowledge() {
      const isCurrent = this.captureBusinessRequest('knowledge', ['subjectPath', 'pointId'])
      if (!this.businessSubject || !this.localEditor.pointId) return
      try {
        const rows = await this.waitBusinessOptions(getTeachingCloudOptions('/dict/getAll', {
          id: TOPIC_KNOWLEDGE_DICT_ID,
          subjectId: this.businessSubject.id,
          pointId: this.localEditor.pointId
        }))
        if (!isCurrent()) return
        this.businessKnowledgeOptions = this.normalizeBusinessKnowledge(rows)
        this.restoreBusinessTreeChoice('knowledge', 'knowledgePath', this.businessKnowledgeOptions)
      } catch (error) { if (isCurrent()) this.$message.warning('知识点加载失败，请重新选择章节重试') }
    },
    async handleBusinessBookChange() {
      this.localEditor.typeId = ''
      this.localEditor.pointId = ''
      this.localEditor.pointPath = []
      this.localEditor.pointName = ''
      this.businessLevelOptions = []
      this.businessPointOptions = []
      await this.loadBusinessLevels()
    },
    async handleBusinessLevelChange() {
      this.localEditor.pointId = ''
      this.localEditor.pointPath = []
      this.localEditor.pointName = ''
      this.businessPointOptions = []
      await this.loadBusinessPoints()
    },
    async handleBusinessPointChange(path) {
      this.localEditor.pointId = this.lastValue(path)
      if (this.businessStandardType === 1) return
      this.localEditor.knowledge = ''
      this.localEditor.knowledgeId = ''
      this.localEditor.knowledgePath = []
      this.localEditor.knowledgeName = ''
      this.businessKnowledgeOptions = []
      await this.loadBusinessKnowledge()
    },
    // label 展示完整层级以区分同名项；name 保留节点原名，path 用于恢复原级联路径。
    flattenBusinessTaxonomy(nodes, labels = [], path = []) {
      return (nodes || []).flatMap(node => {
        const nextLabels = [...labels, node.label]
        const nextPath = [...path, node.value]
        return [{ id: node.value, name: node.label, label: nextLabels.join(' / '), path: nextPath },
          ...this.flattenBusinessTaxonomy(node.children, nextLabels, nextPath)]
      })
    },
    // 两个通用下拉框都用对象表示已有项、字符串表示自定义输入，避免名称与 ID 文本混淆。
    async handleBusinessGeneralPointChange(value) {
      const existing = value && typeof value === 'object'
      // 自定义或清空时同步清除 ID 和路径，防止保存或再次初始化时恢复旧章节。
      Object.assign(this.localEditor, {
        pointId: existing ? value.id : '', treeId: '',
        pointPath: existing ? [...value.path] : [],
        pointName: existing ? value.name : String(value || '').trim(),
        knowledge: '', knowledgeId: '', knowledgePath: [], knowledgeName: ''
      })
      this.businessKnowledgeOptions = []
      if (this.localEditor.pointId) await this.loadBusinessKnowledge()
    },
    handleBusinessGeneralKnowledgeChange(value) {
      const existing = value && typeof value === 'object'
      // knowledgeId 是 knowledge 的回显别名，选择或清空时必须同步更新。
      Object.assign(this.localEditor, {
        knowledge: existing ? value.id : '', knowledgeId: existing ? value.id : '',
        knowledgePath: existing ? [...value.path] : [],
        knowledgeName: existing ? value.name : String(value || '').trim()
      })
    },
    updateBusinessPopper(key) {
      this.$nextTick(() => {
        const picker = this.$refs[key]
        if (picker && !picker._isDestroyed && picker.dropDownVisible && typeof picker.updatePopper === 'function') picker.updatePopper()
      })
    },
    handleBusinessPopperVisible(visible, key) {
      if (visible) this.updateBusinessPopper(key)
    },
    validateBusinessEditor(editor) {
      const checks = [
        { valid: this.selectedBusiness, message: '请选择学段' },
        { valid: this.businessSubject && this.businessSubject.id === editor.subjectId, message: '请选择科目（最后一级）' },
        { valid: !this.businessOptionsError && !this.businessDetailError, message: '分类选项或题目详情加载失败，请重试后保存' },
        ...(this.businessStandardType === 1 ? [
          { valid: this.businessBookOptions.some(item => String(item.id) === editor.bookId), message: '请选择教材版本' },
          { valid: this.businessLevelOptions.some(item => String(item.id || item.name) === editor.typeId), message: '请选择年级' }
        ] : []),
        { valid: this.businessStandardType === 2 && !editor.pointId ? String(editor.pointName || '').trim() : this.findTreeNode(this.businessPointOptions, editor.pointId), message: this.businessStandardType === 2 ? '请选择或输入章节' : '请选择章节' },
        { valid: this.businessStandardType === 2 && !editor.knowledge ? String(editor.knowledgeName || '').trim() : this.findTreeNode(this.businessKnowledgeOptions, editor.knowledge), message: this.businessStandardType === 2 ? '请选择或输入知识点' : '请选择知识点' },
        { valid: this.businessQuestTypeOptions.some(item => String(item.id) === editor.questTemplateId), message: '请选择题型' },
        { valid: this.difficultyOptions.some(item => String(item.id) === editor.difficulty), message: '请选择难度' },
        { valid: !this.isBlank(editor.name), message: '请输入题目内容' },
        ...(this.showOptionEditors ? [
          { valid: !this.isBlank(editor.optionA), message: '请输入选项A' },
          { valid: !this.isBlank(editor.optionB), message: '请输入选项B' }
        ] : []),
        { valid: !this.isBlank(editor.answer), message: '请输入答案' },
        { valid: !this.isBlank(editor.analysis), message: '请输入解析' }
      ]
      const invalid = checks.find(item => !item.valid)
      if (invalid) { this.$message.warning(invalid.message); return false }
      if (this.selectedQuestType === '3' && !getTrueFalseAnswer(editor.answer)) {
        this.$message.warning('判断题答案只能输入 A 或 B')
        return false
      }
      return true
    },
    withBusinessDisplayNames(editor) {
      const subject = this.businessSubject
      const point = this.findTreeNode(this.businessPointOptions, editor.pointId)
      const knowledge = this.findTreeNode(this.businessKnowledgeOptions, editor.knowledge)
      const type = this.businessStandardType
      const context = {
        businessId: this.selectedBusiness.id, businessName: this.selectedBusiness.name,
        subjectId: subject.id, subjectName: subject.label,
        pointId: editor.pointId, pointName: point ? point.label : type === 2 && !editor.pointId ? String(editor.pointName || '').trim() : '',
        knowledge: editor.knowledge, knowledgeId: editor.knowledge, knowledgeName: knowledge ? knowledge.label : type === 2 && !editor.knowledge ? String(editor.knowledgeName || '').trim() : '',
        questTemplateId: editor.questTemplateId, questTemplateName: this.optionName(this.businessQuestTypeOptions, editor.questTemplateId),
        questType: this.selectedQuestType, difficulty: editor.difficulty, difficultyId: editor.difficulty,
        difficultyName: this.optionName(this.difficultyOptions, editor.difficulty),
        bookId: type === 1 ? editor.bookId : '', bookName: type === 1 ? this.optionName(this.businessBookOptions, editor.bookId) : '',
        typeId: type === 1 ? editor.typeId : '', typeName: type === 1 ? this.optionName(this.businessLevelOptions, editor.typeId) : '',
        compulsory: type === 1 ? '1' : '0'
      }
      return { ...editor, ...context, questTypeName: context.questTemplateName, levelName: context.typeName,
        _questionEduType: type === 1 ? 'K9K12' : '专升本', _ownStandardType: type, _questionContext: context }
    },
    async saveBusinessEditor() {
      if (this.businessInitializing || this.businessPending > 0 || this.businessTreeLoading) return
      const editor = { ...this.localEditor, subjectId: this.businessSubject ? this.businessSubject.id : '' }
      if (!this.validateBusinessEditor(editor)) return
      const type = this.businessStandardType
      const payload = this.editing
        ? this.buildEditTopicPayload(editor, type === 1)
        : this.buildAddTopicPayload(editor, type === 1)
      const display = this.withBusinessDisplayNames(editor)
      const revision = this.businessRevision
      this.saving = true
      try {
        const saved = this.editing ? await updateTopic(payload) : await addTopic(payload)
        if (this.businessDestroyed || revision !== this.businessRevision) return
        const result = { ...display, ...(saved && typeof saved === 'object' ? saved : {}),
          _questionContext: display._questionContext, _ownStandardType: type, _questionEduType: display._questionEduType }
        Object.keys(display._questionContext).forEach(field => {
          if (result[field] === undefined || result[field] === null || result[field] === '') result[field] = display._questionContext[field]
        })
        this.$message.success(this.editing ? '编辑题目成功' : '新增题目成功')
        this.$emit('save', result)
      } catch (error) {
        if (!this.businessDestroyed && revision === this.businessRevision) this.$message.error(error.message || '题目保存失败，请稍后重试')
      } finally { this.saving = false }
    },
    handleTaxonomyLabelClick(node, event) {
      if (node.isDisabled || node.loading) return
      const row = event.currentTarget.closest('.el-cascader-node')
      const input = row && row.querySelector('input[type="radio"], input[type="checkbox"]')
      // 复用组件原有的选择事件，保持字段更新及章节、知识点联动一致。
      if (input && !input.disabled) input.click()
    },
    normalizeTree(list) {
      return (list || []).map(item => {
        const isPrimitive = typeof item !== 'object'
        const children = isPrimitive
          ? []
          : item.children || item.childList || item.childrenList || item.childs || item.sonList || item.subList || []

        return {
          value: String(isPrimitive ? item : (item.id ?? item.value ?? item.pointId ?? item.subjectPointId ?? '')),
          label: isPrimitive ? String(item) : (item.name || item.title || item.label || item.pointName || item.chapterName || ''),
          children: this.normalizeTree(children)
        }
      }).map(item => {
        if (!item.children.length) delete item.children
        return item
      })
    },
    normalizeKnowledgeTree(list) {
      const rows = Array.isArray(list) ? list : []
      const hasChildren = rows.some(item => item && (
        item.children || item.childList || item.childrenList || item.childs || item.sonList || item.subList
      ))
      if (hasChildren) return this.normalizeTree(rows)

      const nodeMap = new Map()
      const roots = []

      rows.forEach(item => {
        const value = String(item.id ?? item.value ?? '')
        if (!value) return
        nodeMap.set(value, {
          value,
          label: item.name || item.title || item.label || '',
          parentId: item.parentId === undefined || item.parentId === null ? '' : String(item.parentId),
          children: []
        })
      })

      nodeMap.forEach(node => {
        const parent = node.parentId && node.parentId !== '0' ? nodeMap.get(node.parentId) : null
        if (parent) {
          parent.children.push(node)
        } else {
          roots.push(node)
        }
      })

      const cleanup = nodes => nodes.map(node => {
        const result = {
          value: node.value,
          label: node.label
        }
        if (node.children.length) result.children = cleanup(node.children)
        return result
      })

      return cleanup(roots)
    },
    normalizeFlatTree(list) {
      const nodeMap = new Map()
      const roots = []

      ;(list || []).forEach(item => {
        const id = String(item.id ?? item.value ?? '')
        if (!id) return
        nodeMap.set(id, {
          value: id,
          label: item.name || item.title || item.label || '',
          parentId: item.parentId === undefined || item.parentId === null ? '' : String(item.parentId),
          children: []
        })
      })

      nodeMap.forEach(node => {
        const parent = node.parentId && node.parentId !== '0' ? nodeMap.get(node.parentId) : null
        if (parent) {
          parent.children.push(node)
        } else {
          roots.push(node)
        }
      })

      const cleanup = nodes => nodes.map(node => {
        const result = {
          value: node.value,
          label: node.label
        }
        if (node.children.length) result.children = cleanup(node.children)
        return result
      })

      return cleanup(roots)
    },
    lastValue(value) {
      return value && value.length ? value[value.length - 1] : ''
    },
    isBlank(value) {
      const html = value === null || value === undefined ? '' : String(value)
      const hasMedia = /<(img|video|audio|iframe|embed|object|svg|canvas)\b/i.test(html)
      if (hasMedia) return false

      const text = html
        .replace(/<[^>]*>/g, '')
        .replace(/&(?:nbsp|ensp|emsp|thinsp|zwnj|zwj);|&#(?:160|8203);|&#x(?:a0|200b);/gi, '')
        .trim()
      return !text
    },
    removeEmptyParams(params) {
      return Object.keys(params).reduce((result, key) => {
        if (params[key] !== '') result[key] = params[key]
        return result
      }, {})
    },
    normalizeTopicDetail(detail) {
      const stringValue = value => value == null ? '' : String(value)
      const businessId = stringValue(detail.businessId || this.localEditor.businessId)
      const pointId = stringValue(detail.pointId || this.lastValue(detail.pointPath))
      const knowledge = stringValue(detail.knowledge || this.lastValue(detail.knowledgePath))
      // 详情未返回地区/学段时，保留列表传入的路径；空数组不能覆盖已有值。
      const areaPath = Array.isArray(detail.areaPath) && detail.areaPath.length > 1
        ? detail.areaPath
        : detail.areaId && businessId
          ? [detail.areaId, businessId]
          : this.localEditor.areaPath || []
      const subjectId = stringValue(detail.subjectId || this.lastValue(detail.subjectPath))
      const typeName = detail.typeName || detail.levelName || this.localEditor.typeName || this.localEditor.levelName || ''
      return {
        ...emptyEditor(),
        ...this.localEditor,
        ...(detail || {}),
        id: stringValue(detail.id || detail.questId || this.questId),
        businessId,
        areaPath: areaPath.map(String),
        subjectId,
        subjectPath: detail.subjectPath || (subjectId ? [String(subjectId)] : []),
        questTemplateId: stringValue(detail.questTemplateId),
        questType: stringValue(detail.questType),
        pointId,
        pointPath: detail.pointPath || (pointId ? [String(pointId)] : []),
        knowledge,
        knowledgePath: detail.knowledgePath || (knowledge ? [String(knowledge)] : []),
        difficulty: stringValue(detail.difficulty),
        bookId: stringValue(detail.bookId),
        typeId: stringValue(detail.typeId),
        typeName,
        levelName: typeName,
        serialNumber: detail.serialNumber || '1'
      }
    },
    optionName(list, value) {
      const item = (list || []).find(option => String(option.id) === String(value))
      return item ? item.name : ''
    },
    findTreeNode(list, value) {
      for (const item of list || []) {
        if (String(item.value) === String(value)) return item
        const child = this.findTreeNode(item.children, value)
        if (child) return child
      }
      return null
    },
    findTreePath(list, value, path = []) {
      for (const item of list || []) {
        const nextPath = [...path, item.value]
        if (String(item.value) === String(value)) return nextPath
        const childPath = this.findTreePath(item.children, value, nextPath)
        if (childPath.length) return childPath
      }
      return []
    },
    findK12Subject(subjectId) {
      for (const group of this.k12SubjectGroups) {
        const children = group.subjectList || group.children || []
        const result = children.find(item => String(item.id) === String(subjectId))
        if (result) return result
      }
      return this.k12SubjectRaw.find(item => String(item.id) === String(subjectId)) || {}
    },
    findK12SubjectPath(subjectId) {
      for (const group of this.k12SubjectGroups) {
        const children = group.subjectList || group.children || []
        const subject = children.find(item => String(item.id) === String(subjectId))
        if (subject) return [String(group.name), String(subject.id)]
      }
      return subjectId ? [String(subjectId)] : []
    },
    async prepareZsbOptions() {
      if (this.eduType !== '专升本') {
        this.zsbOptionsReady = true
        return
      }
      const requestSeq = ++this.zsbOptionsRequestSeq
      this.zsbOptionsReady = false
      try {
        if (!this.localEditor.serialNumber) this.localEditor.serialNumber = '1'
        if (!this.zsbSubjectOptions.length || !this.difficultyOptions.length) {
          await this.loadBaseOptions()
        }
        const subjectId = this.localEditor.subjectId || this.lastValue(this.localEditor.subjectPath)
        this.localEditor.subjectPath = findZsbSubjectPath(this.zsbSubjectOptions, subjectId)
        const subject = getZsbSubject(this.zsbSubjectOptions, this.localEditor.subjectPath)
        if (subject) {
          this.localEditor.subjectId = subject.value
          this.localEditor.typeId = subject.typeId == null ? this.localEditor.typeId : String(subject.typeId)
          this.localEditor.bookId = subject.bookId == null ? this.localEditor.bookId : String(subject.bookId)
        }
        if (this.localEditor.subjectId && (!this.pointOptions.length || !this.questTypeOptions.length)) {
          await this.loadSubjectDetailOptions(this.localEditor.subjectId)
        }
        if (this.localEditor.subjectId && this.localEditor.pointId && !this.knowledgeOptions.length) {
          await this.loadKnowledgeOptions(this.localEditor.subjectId, this.localEditor.pointId)
        }
      } catch (error) {
        this.$message.warning('题目字段数据加载失败，请稍后重试')
      } finally {
        if (requestSeq === this.zsbOptionsRequestSeq) this.zsbOptionsReady = true
      }
    },
    async prepareK12Options() {
      if (this.eduType !== 'K9K12') {
        this.k12OptionsReady = true
        return
      }
      const requestSeq = ++this.k12OptionsRequestSeq
      this.k12OptionsReady = false
      try {
        if (!this.localEditor.serialNumber) this.localEditor.serialNumber = '1'
        if (!this.k12SubjectOptions.length || !this.difficultyOptions.length) {
          await this.loadK12BaseOptions()
        }
        const subjectId = this.localEditor.subjectId || this.lastValue(this.localEditor.subjectPath)
        if (subjectId) {
          this.localEditor.subjectId = subjectId
          const subjectPath = this.findK12SubjectPath(subjectId)
          if (subjectPath.length) this.localEditor.subjectPath = subjectPath
          await this.loadK12SubjectOptions(subjectId)
          if (this.localEditor.bookId) {
            await this.loadK12LevelOptions(subjectId, this.localEditor.bookId)
          }
        }
        if (this.localEditor.subjectId && this.localEditor.bookId && this.localEditor.typeId) {
          await this.loadK12PointOptions()
        }
      } catch (error) {
        this.$message.warning('题目字段数据加载失败，请稍后重试')
      } finally {
        if (requestSeq === this.k12OptionsRequestSeq) this.k12OptionsReady = true
      }
    },
    async loadTopicDetail() {
      const questId = String(this.questId || '')
      if (!this.editing || !questId) return
      const requestSeq = ++this.detailRequestSeq
      this.detailLoading = true
      try {
        const detail = await getTopicDetail(questId)
        if (requestSeq !== this.detailRequestSeq) return
        this.localEditor = this.normalizeTopicDetail(detail || {})
        if (this.eduType === '专升本') {
          await this.prepareZsbOptions()
        } else {
          await this.prepareK12Options()
        }
      } catch (error) {
        this.$message.error(error.message || '题目详情加载失败，请稍后重试')
      } finally {
        if (requestSeq === this.detailRequestSeq) this.detailLoading = false
      }
    },
    async loadBaseOptions() {
      this.optionsLoading = true
      try {
        const [subjects, difficulties] = await Promise.all([
          getTopicUnCompulsorySubjectList(),
          getTopicDictItemList(TOPIC_DIFFICULTY_DICT_ID)
        ])
        this.zsbSubjectOptions = normalizeZsbSubjectOptions(subjects)
        this.subjectOptions = this.zsbSubjectOptions.flatMap(group => group.children)
        this.difficultyOptions = difficulties || []
      } finally {
        this.optionsLoading = false
      }
    },
    async loadK12BaseOptions() {
      this.optionsLoading = true
      try {
        const [subjects, difficulties] = await Promise.all([
          getTopicCompulsorySubjectList(),
          getTopicDictItemList(TOPIC_DIFFICULTY_DICT_ID)
        ])
        this.k12SubjectGroups = subjects || []
        this.k12SubjectRaw = (subjects || []).flatMap(group => group.subjectList || [])
        this.k12SubjectOptions = (subjects || []).map(group => ({
          value: String(group.name),
          label: group.name,
          children: (group.subjectList || []).map(subject => ({
            value: String(subject.id),
            label: subject.otherName || subject.name
          }))
        }))
        this.difficultyOptions = difficulties || []
      } finally {
        this.optionsLoading = false
      }
    },
    async loadSubjectDetailOptions(subjectId) {
      if (!subjectId) {
        this.pointOptions = []
        this.knowledgeOptions = []
        this.questTypeOptions = []
        return
      }
      const subject = this.subjectOptions.find(item => String(item.id) === String(subjectId)) || {}
      const [points, questTypes] = await Promise.all([
        getTopicSubjectPointList(subjectId),
        subject.questType ? getTopicQuestTypeTemplates(subject.questType) : Promise.resolve([])
      ])
      this.pointOptions = this.normalizeTree(points)
      this.questTypeOptions = questTypes || []

      const pointId = this.localEditor.pointId || this.lastValue(this.localEditor.pointPath)
      const pointPath = this.findTreePath(this.pointOptions, pointId)
      if (pointPath.length) this.localEditor.pointPath = pointPath
    },
    async loadKnowledgeOptions(subjectId, pointId) {
      if (!subjectId || !pointId) {
        this.knowledgeOptions = []
        return
      }
      const knowledge = await getTopicKnowledgeList(subjectId, pointId)
      this.knowledgeOptions = this.normalizeKnowledgeTree(knowledge)
      const knowledgeId = this.localEditor.knowledge || this.lastValue(this.localEditor.knowledgePath)
      const knowledgePath = this.findTreePath(this.knowledgeOptions, knowledgeId)
      if (knowledgePath.length) this.localEditor.knowledgePath = knowledgePath
    },
    async loadK12SubjectOptions(subjectId) {
      if (!subjectId) {
        this.k12BookOptions = []
        this.k12LevelOptions = []
        this.k12KnowledgeOptions = []
        this.k12QuestTypeOptions = []
        return
      }
      const subject = this.findK12Subject(subjectId)
      const [books, knowledge, questTypes] = await Promise.all([
        getTopicBookList(subjectId),
        getTopicKnowledgeCompulsoryList(subjectId),
        subject.questType ? getTopicQuestTypeTemplates(subject.questType) : Promise.resolve([])
      ])
      this.k12BookOptions = books || []
      this.k12KnowledgeOptions = this.normalizeFlatTree(knowledge)
      this.k12QuestTypeOptions = questTypes || []

      const knowledgeId = this.localEditor.knowledge || this.lastValue(this.localEditor.knowledgePath)
      const knowledgePath = this.findTreePath(this.k12KnowledgeOptions, knowledgeId)
      if (knowledgePath.length) this.localEditor.knowledgePath = knowledgePath
    },
    async loadK12LevelOptions(subjectId, bookId) {
      this.k12LevelOptions = subjectId && bookId
        ? await getTopicTypeListByBook(subjectId, bookId)
        : []
    },
    async loadK12PointOptions() {
      const subjectId = this.localEditor.subjectId || this.lastValue(this.localEditor.subjectPath)
      this.k12PointOptions = []
      if (!subjectId || !this.localEditor.bookId || !this.localEditor.typeId) return
      const rows = await getTopicSubjectPointCompulsoryList(subjectId, this.localEditor.typeId, this.localEditor.bookId)
      this.k12PointOptions = this.normalizeFlatTree(rows)

      const pointId = this.localEditor.pointId || this.lastValue(this.localEditor.pointPath)
      const pointPath = this.findTreePath(this.k12PointOptions, pointId)
      if (pointPath.length) this.localEditor.pointPath = pointPath
    },
    async handleSubjectChange(path) {
      const subject = getZsbSubject(this.zsbSubjectOptions, path)
      this.localEditor.subjectId = subject ? subject.value : ''
      this.localEditor.typeId = subject && subject.typeId != null ? String(subject.typeId) : ''
      this.localEditor.bookId = subject && subject.bookId != null ? String(subject.bookId) : ''
      this.localEditor.pointPath = []
      this.localEditor.pointId = ''
      this.localEditor.knowledgePath = []
      this.localEditor.knowledge = ''
      this.localEditor.questTemplateId = ''
      this.pointOptions = []
      this.knowledgeOptions = []
      this.questTypeOptions = []
      await this.loadSubjectDetailOptions(this.localEditor.subjectId)
    },
    async handlePointChange(value) {
      const pointId = this.lastValue(value)
      this.localEditor.pointId = pointId
      this.localEditor.knowledgePath = []
      this.localEditor.knowledge = ''
      await this.loadKnowledgeOptions(this.localEditor.subjectId, pointId)
    },
    handleKnowledgeChange(value) {
      this.localEditor.knowledge = this.lastValue(value)
    },
    async handleK12SubjectChange(value) {
      const subjectId = this.lastValue(value)
      this.localEditor.subjectId = subjectId
      this.localEditor.bookId = ''
      this.localEditor.typeId = ''
      this.localEditor.pointPath = []
      this.localEditor.pointId = ''
      this.localEditor.knowledgePath = []
      this.localEditor.knowledge = ''
      this.localEditor.questTemplateId = ''
      this.k12BookOptions = []
      this.k12LevelOptions = []
      this.k12PointOptions = []
      this.k12KnowledgeOptions = []
      this.k12QuestTypeOptions = []
      await this.loadK12SubjectOptions(subjectId)
    },
    async handleK12BookChange(bookId) {
      this.localEditor.typeId = ''
      this.localEditor.pointPath = []
      this.localEditor.pointId = ''
      await this.loadK12LevelOptions(this.localEditor.subjectId, bookId)
      await this.loadK12PointOptions()
    },
    async handleK12LevelChange() {
      this.localEditor.pointPath = []
      this.localEditor.pointId = ''
      await this.loadK12PointOptions()
    },
    handleK12PointChange(value) {
      this.localEditor.pointId = this.lastValue(value)
    },
    handleQuestTemplateChange() {
      const scrollX = window.pageXOffset
      const scrollY = window.pageYOffset
      this.$nextTick(() => {
        window.scrollTo(scrollX, scrollY)
      })
    },
    handleSerialNumberInput(value) {
      this.localEditor.serialNumber = String(value || '')
        .replace(/\D/g, '')
        .replace(/^0+/, '')
    },
    buildAddTopicPayload(editor, isK12) {
      const pointId = editor.pointId || this.lastValue(editor.pointPath)
      const knowledge = editor.knowledge || this.lastValue(editor.knowledgePath)
      const payload = {
        institutionId: this.currentInstitutionId(),
        subjectId: editor.subjectId || this.lastValue(editor.subjectPath),
        name: editor.name,
        answer: editor.answer,
        analysis: editor.analysis,
        questTemplateId: editor.questTemplateId,
        pointId,
        knowledge,
        difficulty: editor.difficulty,
        isTrue: 0,
        isMember: 0,
        isMemberAnalysis: 0
      }

      if (['1', '2'].includes(this.selectedQuestType)) {
        Object.assign(payload, {
          optionA: editor.optionA,
          optionB: editor.optionB,
          optionC: editor.optionC,
          optionD: editor.optionD,
          optionE: editor.optionE
        })
      }
      if (isK12) {
        payload.bookId = editor.bookId
        payload.typeId = editor.typeId
      }
      return this.removeEmptyParams(payload)
    },
    buildEditTopicPayload(editor, isK12) {
      return {
        ...this.buildAddTopicPayload(editor, isK12),
        id: editor.id || editor.questId || this.questId || this.businessInitialQuestId
      }
    },
    withDisplayNames(editor) {
      const pointId = editor.pointId || this.lastValue(editor.pointPath)
      const knowledge = editor.knowledge || this.lastValue(editor.knowledgePath)
      const isZsb = this.eduType === '专升本'
      const pointOptions = isZsb ? this.pointOptions : this.k12PointOptions
      const knowledgeOptions = isZsb ? this.knowledgeOptions : this.k12KnowledgeOptions
      const questTypeOptions = isZsb ? this.questTypeOptions : this.k12QuestTypeOptions
      const k12Subject = isZsb ? {} : this.findK12Subject(editor.subjectId || this.lastValue(editor.subjectPath))
      const point = this.findTreeNode(pointOptions, pointId)
      const knowledgeNode = this.findTreeNode(knowledgeOptions, knowledge)
      return {
        ...this.localEditor,
        ...editor,
        pointId,
        knowledge,
        subjectName: isZsb
          ? this.optionName(this.subjectOptions, this.localEditor.subjectId) || this.localEditor.subjectName
          : (k12Subject.otherName || k12Subject.name || this.localEditor.subjectName),
        pointName: (point && (point.name || point.label)) || this.localEditor.pointName,
        knowledgeName: (knowledgeNode && knowledgeNode.label) || this.localEditor.knowledgeName,
        questTypeName: this.optionName(questTypeOptions, this.localEditor.questTemplateId) || this.localEditor.questTypeName,
        difficultyName: this.optionName(this.difficultyOptions, this.localEditor.difficulty) || this.localEditor.difficultyName,
        bookName: this.optionName(this.k12BookOptions, this.localEditor.bookId) || this.localEditor.bookName,
        levelName: this.optionName(this.k12LevelOptions, this.localEditor.typeId) || this.localEditor.levelName
      }
    },
    validateZsbEditor(editor) {
      const requiredFields = [
        { valid: getZsbSubject(this.zsbSubjectOptions, editor.subjectPath), message: '请选择科目（最后一级）' },
        { valid: editor.pointId, message: '请选择章节' },
        { valid: editor.knowledge, message: '请选择知识点' },
        { valid: editor.questTemplateId, message: '请选择题型' },
        { valid: editor.difficulty, message: '请选择难度' },
        // { valid: String(editor.serialNumber || '').trim(), message: '请输入排序号' },
        // { valid: /^[1-9]\d*$/.test(String(editor.serialNumber || '').trim()), message: '排序号只能输入正整数' },
        { valid: !this.isBlank(editor.name), message: '请输入题目内容' }
      ]

      if (this.showOptionEditors) {
        requiredFields.push(
          { valid: !this.isBlank(editor.optionA), message: '请输入选项A' },
          { valid: !this.isBlank(editor.optionB), message: '请输入选项B' }
        )
      }

      requiredFields.push(
        { valid: !this.isBlank(editor.answer), message: '请输入答案' },
        { valid: !this.isBlank(editor.analysis), message: '请输入解析' }
      )

      const invalidField = requiredFields.find(item => !item.valid)
      if (invalidField) {
        this.$message.warning(invalidField.message)
        return false
      }
      return true
    },
    validateK12Editor(editor) {
      const requiredFields = [
        { valid: editor.subjectId || this.lastValue(editor.subjectPath), message: '请选择科目' },
        { valid: editor.bookId, message: '请选择教材版本' },
        { valid: editor.typeId, message: '请选择年级' },
        { valid: editor.pointId, message: '请选择章节' },
        { valid: editor.knowledge, message: '请选择知识点' },
        { valid: editor.questTemplateId, message: '请选择题型' },
        { valid: editor.difficulty, message: '请选择难度' },
        // { valid: String(editor.serialNumber || '').trim(), message: '请输入排序号' },
        // { valid: /^[1-9]\d*$/.test(String(editor.serialNumber || '').trim()), message: '排序号只能输入正整数' },
        { valid: !this.isBlank(editor.name), message: '请输入题目内容' }
      ]

      if (this.showOptionEditors) {
        requiredFields.push(
          { valid: !this.isBlank(editor.optionA), message: '请输入选项A' },
          { valid: !this.isBlank(editor.optionB), message: '请输入选项B' }
        )
      }

      requiredFields.push(
        { valid: !this.isBlank(editor.answer), message: '请输入答案' },
        { valid: !this.isBlank(editor.analysis), message: '请输入解析' }
      )

      const invalidField = requiredFields.find(item => !item.valid)
      if (invalidField) {
        this.$message.warning(invalidField.message)
        return false
      }
      return true
    },
    async handleSave() {
      if (this.saving) return
      if (this.businessMode) return this.saveBusinessEditor()
      if (this.selectedQuestType === '3' && !getTrueFalseAnswer(this.localEditor.answer)) {
        this.$message.warning('判断题答案只能输入 A 或 B')
        return
      }
      const nextEditor = {
        ...this.localEditor,
        subjectId: this.localEditor.subjectId || this.lastValue(this.localEditor.subjectPath),
        pointId: this.localEditor.pointId || this.lastValue(this.localEditor.pointPath),
        knowledge: this.localEditor.knowledge || this.lastValue(this.localEditor.knowledgePath)
      }
      if (this.eduType !== '专升本') {
        if (!this.validateK12Editor(nextEditor)) {
          return
        }
        this.saving = true
        try {
          const saved = this.editing
            ? await updateTopic(this.buildEditTopicPayload(nextEditor, true))
            : await addTopic(this.buildAddTopicPayload(nextEditor, true))
          const result = this.withDisplayNames({
            ...nextEditor,
            ...(saved && typeof saved === 'object' ? saved : {})
          })
          this.$message.success(this.editing ? '编辑题目成功' : '新增题目成功')
          this.$emit('save', result)
        } catch (error) {
          this.$message.error(error.message || '题目保存失败，请稍后重试')
        } finally {
          this.saving = false
        }
        return
      }
      if (!this.validateZsbEditor(nextEditor)) {
        return
      }
      this.saving = true
      try {
        const saved = this.editing
          ? await updateTopic(this.buildEditTopicPayload(nextEditor, false))
          : await addTopic(this.buildAddTopicPayload(nextEditor, false))
        const result = this.withDisplayNames({
          ...nextEditor,
          ...(saved && typeof saved === 'object' ? saved : {})
        })
        this.$message.success(this.editing ? '编辑题目成功' : '新增题目成功')
        this.$emit('save', result)
      } catch (error) {
        this.$message.error(error.message || '题目保存失败，请稍后重试')
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.question-editor-page {
  /* min-height: 100vh; */
  /* padding: 13px 17px 28px; */
  box-sizing: border-box;
  color: #485064;
  background: #fff;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;

}

button {
  font-family: inherit;
}

.editor-header {
  display: flex;
  align-items: center;
  height: 27px;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 5px 8px;
}

.header-left {
  display: flex;
  height: 100%;
  align-items: center;
}

.back-button {
  padding: 0;
  border: 0;
  color: #657288;
  background: transparent;
  font-size: 13px;
  cursor: pointer;
}

.header-divider {
  width: 1px;
  height: 17px;
  margin: 0 12px;
  background: #e2e6ed;
}

h2,
h3,
p {
  margin: 0;
}

h2 {
  color: #343b4a;
  font-size: 16px;
  line-height: 24px;
}

.editor-header p {
  color: #8b94a5;
  font-size: 13px;
  line-height: 20px;
}

.editor-form {
  max-width: 100%;
}

.answer-tip {
  margin: 0 0 8px;
  color: #e6a23c;
  font-size: 13px;
  line-height: 20px;
}

.editor-loading-panel {
  display: flex;
  height: 100vh;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  border: 1px solid #dfe5ed;
  border-radius: 8px;
  color: #8b94a5;
  background: #fff;
  font-size: 13px;
}

.form-block {
  margin-bottom: 12px;
  padding: 14px 14px 4px;
  border: 1px solid #dfe5ed;
  border-radius: 8px;
  background: #fff;
}

.form-block h3 {
  margin-bottom: 12px;
  color: #4a5262;
  font-size: 14px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 14px;
}

.form-grid ::v-deep .el-select,
.form-grid ::v-deep .el-cascader {
  width: 100%;
}

::v-deep .editor {
  background: #fff;
}

::v-deep .ql-toolbar.ql-snow {
  border-color: #dbe2ec;
  border-radius: 6px 6px 0 0;
}

::v-deep .ql-container.ql-snow {
  min-height: 110px;
  border-color: #dbe2ec;
  border-radius: 0 0 6px 6px;
  color: #394354;
  font-size: 13px;
}

.editor-footer {
  display: flex;
  max-width: 920px;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

@media (max-width: 720px) {
  .question-editor-page {
    padding: 12px;
  }

  .editor-header {
    height: auto;
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
.quiz-question-taxonomy-popper .quiz-taxonomy-label {
  display: block;
}

.quiz-question-taxonomy-popper .el-cascader-menu__wrap {
  height: 340px;
  max-height: calc(100vh - 180px);
}

.quiz-question-taxonomy-popper .el-cascader__suggestion-list {
  max-height: calc(100vh - 180px);
  height: 340px;
}
</style>
