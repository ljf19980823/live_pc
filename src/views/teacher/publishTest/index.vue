<template>
  <div class="practice-config-page">
    <quiz-question-editor
      v-if="bankEditorVisible"
      :value="bankEditor"
      :quest-id="bankEditorQuestId"
      :edu-type="eduType"
      :business-mode="sourceTab === '自有题库'"
      :editing="bankEditingIndex !== null"
      @back="closeBankEditor"
      @save="saveBankEditor"
    />
    <template v-else>
    <header class="config-header">
      <button class="back-button" type="button" @click="handleBack">
        <i class="el-icon-back"></i>
        {{ backButtonText }}
      </button>
      <span class="header-divider"></span>
      <strong>课后测配置</strong>
      <span class="header-tip">配置题目并确认发布给学生</span>
    </header>

    <main class="config-layout">
      <section class="question-bank-panel">
        <section class="filter-card">
          <!-- <div v-if="eduTypes.length > 1" class="switch-row edu-type-row">
            <span class="row-label">学习赛道</span>
            <div class="segmented">
              <button
                v-for="item in eduTypes"
                :key="item"
                type="button"
                :class="{ active: eduType === item }"
                :disabled="sourceTabSwitchLocked"
                @click="changeEduType(item)"
              >{{ item }}</button>
            </div>
          </div> -->

          <div class="switch-row source-row">
            <span class="row-label">题目来源</span>
            <div class="segmented source-segmented">
              <button
                v-for="item in sourceTabs"
                :key="item"
                type="button"
                :class="{ active: sourceTab === item }"
                :disabled="sourceTabSwitchLocked"
                @click="changeSource(item)"
              >{{ item }}</button>
            </div>
            <button
              class="filter-toggle"
              type="button"
              :aria-expanded="String(!filtersCollapsed)"
              aria-controls="practice-filter-content"
              @click="filtersCollapsed = !filtersCollapsed"
            >
              <span class="filter-toggle-action">
                {{ filtersCollapsed ? '展开筛选' : '收起筛选' }}
                <i class="el-icon-arrow-up" :class="{ 'is-collapsed': filtersCollapsed }" aria-hidden="true"></i>
              </span>
            </button>
          </div>

          <el-collapse-transition>
            <div id="practice-filter-content" v-show="!filtersCollapsed" class="filter-content">
          <p class="source-description" aria-live="polite">{{ sourceDescription }}</p>

          <div class="filter-divider"></div>

          <div class="condition-row" :class="{ 'ai-mode': sourceTab === 'AI出题' }">
            <span class="row-label" style="line-height: 30px;">{{ sourceTab === 'AI出题' ? '出题条件' : '筛选条件' }}</span>

            <div v-if="sourceTab === 'AI出题'" class="condition-grid ai-grid">
              <div v-if="showAiMinutesSwitch" class="minutes-content-switch">
                <span>根据当前听记内容出题</span>
                <el-switch v-model="useMinutesContent" active-color="#1F7CFF" @change="handleMinutesContentChange" />
              </div>
              <el-cascader
                ref="ai-subject"
                :key="aiSubjectPickerKey"
                v-model="aiFilters.subjectPath"
                :options="aiBusinessOptions"
                :props="aiSubjectCascaderProps"
                :disabled="sourceSwitching"
                popper-class="practice-filter-taxonomy-popper"
                clearable filterable placeholder="学段 / 科目"
                @change="handleAiSubjectChange"
                @visible-change="handleTaxonomyVisibleChange($event, 'ai-subject')"
                @expand-change="updateTaxonomyPopper('ai-subject')"
              />
              <button v-if="!aiBusinessOptions.length" class="reset-button" type="button" :disabled="sourceSwitching" @click="loadAiBase">重新加载学段</button>
              <template>
                <template v-if="aiDisplayStandardType === 1">
                  <el-select v-model="aiFilters.bookId" clearable filterable placeholder="教材版本" @change="handleAiBookChange">
                    <el-option v-for="item in aiOptions.books" :key="item.id" :label="item.name" :value="String(item.id)" />
                  </el-select>
                  <el-select v-model="aiFilters.level" clearable filterable placeholder="年级" @change="loadAiChapters">
                    <el-option v-for="item in aiOptions.levels" :key="item.id" :label="item.name" :value="String(item.id)" />
                  </el-select>
                </template>
                <template v-if="aiDisplayStandardType === 0">
                  <el-select :key="'ai-general-chapter-' + useAiMinutesContent" v-model="aiFilters.chapterSelection" :multiple="useAiMinutesContent" :allow-create="allowAiCustomNames" clearable filterable default-first-option collapse-tags placeholder="章节">
                    <el-option v-for="item in aiGeneralChapters" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                  <el-select v-model="aiFilters.knowledgeSelection" :allow-create="allowAiCustomNames" clearable filterable default-first-option :placeholder="useAiMinutesContent ? '知识点（可选）' : '知识点'">
                    <el-option v-for="item in aiGeneralKnowledge" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </template>
                <template v-else>
                  <el-cascader :key="'ai-chapter-' + useAiMinutesContent" ref="ai-chapter" v-model="aiFilters.pointPath" :options="aiOptions.chapters" :props="pointCascaderProps" clearable filterable collapse-tags placeholder="章节" popper-class="practice-filter-taxonomy-popper" @change="handleAiChapterChange" @visible-change="handleTaxonomyVisibleChange($event, 'ai-chapter')" @expand-change="updateTaxonomyPopper('ai-chapter')">
                    <template slot-scope="{ node }"><span class="practice-taxonomy-label" @click.stop="handleTaxonomyLabelClick(node, $event)">{{ node.label }}</span></template>
                  </el-cascader>
                  <el-cascader ref="ai-knowledge" v-model="aiFilters.knowledgePath" :options="aiOptions.knowledge" :props="k12KnowledgeCascaderProps" clearable filterable :placeholder="useAiMinutesContent ? '知识点（可选）' : '知识点'" popper-class="practice-filter-taxonomy-popper" @visible-change="handleTaxonomyVisibleChange($event, 'ai-knowledge')" @expand-change="updateTaxonomyPopper('ai-knowledge')">
                    <template slot-scope="{ node }"><span class="practice-taxonomy-label" @click.stop="handleTaxonomyLabelClick(node, $event)">{{ node.label }}</span></template>
                  </el-cascader>
                </template>
                <el-select v-model="aiFilters.questType" clearable filterable placeholder="题型">
                  <el-option v-for="item in aiQuestTypeOptions" :key="item.id" :label="item.name" :value="String(item.id)" />
                </el-select>
                <el-select v-model="aiFilters.difficulty" clearable filterable placeholder="难度">
                  <el-option v-for="item in aiOptions.difficulties" :key="item.id" :label="item.name" :value="String(item.id)" />
                </el-select>
                <el-input-number v-model="aiCount" :min="1" :max="aiCountMax" :controls="false" placeholder="出题数量" />
              </template>
            </div>
            <div v-else-if="sourceTab === '自有题库'" class="condition-grid own-grid">
              <el-cascader
                ref="own-subject"
                :key="ownSubjectPickerKey"
                v-model="ownFilters.subjectPath"
                :options="ownBusinessOptions"
                :props="ownSubjectCascaderProps"
                :disabled="sourceSwitching || autoImportLoading"
                popper-class="practice-filter-taxonomy-popper"
                clearable filterable placeholder="学段 / 科目"
                @change="handleOwnSubjectChange"
                @visible-change="handleTaxonomyVisibleChange($event, 'own-subject')"
                @expand-change="updateTaxonomyPopper('own-subject')"
              />
              <button v-if="!ownBusinessOptions.length" class="reset-button" type="button" :disabled="sourceSwitching" @click="loadOwnBase">重新加载学段</button>
              <template>
                <template v-if="ownDisplayStandardType === 1">
                  <div v-if="!isOwnChineseSubject" class="filter-mode">
                    <button type="button" :class="{ active: ownFilterMode === 'chapter' }" @click="changeOwnMode('chapter')">按章节筛选</button>
                    <button type="button" :class="{ active: ownFilterMode === 'knowledge' }" @click="changeOwnMode('knowledge')">按知识点筛选</button>
                  </div>
                  <template v-if="ownFilterMode === 'chapter'">
                    <el-select v-model="ownFilters.bookId" clearable filterable placeholder="教材版本" @change="handleOwnBookChange">
                      <el-option v-for="item in ownOptions.books" :key="item.id" :label="item.name" :value="String(item.id)" />
                    </el-select>
                    <el-select v-model="ownFilters.level" clearable filterable placeholder="年级" @change="loadOwnChapters">
                      <el-option v-for="item in ownOptions.levels" :key="item.id || item.name" :label="item.name" :value="String(item.id || item.name)" />
                    </el-select>
                  </template>
                </template>
                <el-cascader v-if="ownDisplayStandardType !== 1 || ownFilterMode === 'chapter'" ref="own-chapter" v-model="ownFilters.pointPath" :options="ownOptions.chapters" :props="{ expandTrigger: 'hover', checkStrictly: true }" clearable filterable placeholder="章节" popper-class="practice-filter-taxonomy-popper" @visible-change="handleTaxonomyVisibleChange($event, 'own-chapter')" @expand-change="updateTaxonomyPopper('own-chapter')">
                  <template slot-scope="{ node }"><span class="practice-taxonomy-label" @click.stop="handleTaxonomyLabelClick(node, $event)">{{ node.label }}</span></template>
                </el-cascader>
                <el-cascader v-else ref="own-knowledge" v-model="ownFilters.knowledgePath" :options="ownOptions.knowledge" :props="k12KnowledgeCascaderProps" clearable filterable placeholder="知识点" popper-class="practice-filter-taxonomy-popper" @visible-change="handleTaxonomyVisibleChange($event, 'own-knowledge')" @expand-change="updateTaxonomyPopper('own-knowledge')">
                  <template slot-scope="{ node }"><span class="practice-taxonomy-label" @click.stop="handleTaxonomyLabelClick(node, $event)">{{ node.label }}</span></template>
                </el-cascader>
                <el-select v-model="ownFilters.questType" clearable filterable placeholder="题型">
                  <el-option v-for="item in ownOptions.questTypes" :key="item.id" :label="item.name" :value="String(item.id)" />
                </el-select>
                <el-select v-model="ownFilters.difficulty" clearable filterable :placeholder="ownDisplayStandardType === 1 ? '难度' : '难易程度'">
                  <el-option v-for="item in ownOptions.difficulties" :key="item.id" :label="item.name" :value="String(item.id)" />
                </el-select>
                <el-input v-model="ownFilters.name" class="question-content-input" clearable placeholder="题目内容/题目id" />
              </template>
            </div>
            <div v-else-if="activeFilterEduType === '专升本'" class="condition-grid zsb-grid">
            <div v-if="showAiMinutesSwitch" class="minutes-content-switch">
              <span>根据当前听记内容出题</span>
              <el-switch
                v-model="useMinutesContent"
                active-color="#1F7CFF"
                @change="handleMinutesContentChange"
              />
            </div>
            <el-cascader
              v-if="sourceTab === '云端题库'"
              v-model="cloudSubjectPath"
              :options="cloudSubjectOptions"
              :props="{ expandTrigger: 'hover' }"
              :disabled="sourceSwitching || autoImportLoading"
              clearable
              filterable
              placeholder="学段 / 科目"
              @change="handleCloudSubjectChange"
            />
            <el-cascader
              v-else
              v-model="zsb.subjectPath"
              :options="zsbSubjectOptions"
              :props="{ expandTrigger: 'hover', checkStrictly: false }"
              clearable
              filterable
              placeholder="科目"
              @change="handleZsbSubjectPathChange"
            />
            <el-cascader
              ref="zsb-chapter"
              v-model="zsb.pointPath"
              :options="chapterFilterOptions"
              :props="pointCascaderProps"
              popper-class="practice-filter-taxonomy-popper"
              clearable
              filterable
              collapse-tags
              placeholder="章节"
              @change="handleZsbPointChange"
              @visible-change="handleTaxonomyVisibleChange($event, 'zsb-chapter')"
              @expand-change="updateTaxonomyPopper('zsb-chapter')"
            >
              <template slot-scope="{ node }">
                <span class="practice-taxonomy-label" @click.stop="handleTaxonomyLabelClick(node, $event)">{{ node.label }}</span>
              </template>
            </el-cascader>
            <el-cascader
              ref="zsb-knowledge"
              v-if="sourceTab === 'AI出题' && !useAiMinutesContent"
              v-model="zsb.knowledgePath"
              :options="knowledgeFilterOptions"
              :props="{ expandTrigger: 'hover', checkStrictly: true }"
              popper-class="practice-filter-taxonomy-popper"
              clearable
              filterable
              placeholder="知识点"
              @visible-change="handleTaxonomyVisibleChange($event, 'zsb-knowledge')"
              @expand-change="updateTaxonomyPopper('zsb-knowledge')"
            >
              <template slot-scope="{ node }">
                <span class="practice-taxonomy-label" @click.stop="handleTaxonomyLabelClick(node, $event)">{{ node.label }}</span>
              </template>
            </el-cascader>
            <el-select v-model="zsb.difficulty" clearable filterable placeholder="难易程度">
              <el-option v-for="item in difficultyOptions" :key="item.id" :label="item.name" :value="String(item.id)" />
            </el-select>
            <el-select v-model="zsb.questType" clearable filterable placeholder="题型">
              <el-option v-for="item in sourceTab === 'AI出题' ? aiQuestTypeOptions : questTypeOptions" :key="item.id" :label="item.name" :value="String(item.id)" />
            </el-select>
            <el-input-number
              v-if="sourceTab === 'AI出题'"
              v-model="aiCount"
              :min="1"
              :max="aiCountMax"
              :controls="false"
              placeholder="出题数量"
            />
            <el-input
              v-else
              v-model="zsb.name"
              class="question-content-input"
              clearable
              placeholder="题目内容/题目id"
            />
          </div>

            <div v-else class="condition-grid k12-grid">
            <div v-if="showAiMinutesSwitch" class="minutes-content-switch">
              <span>根据当前听记内容出题</span>
              <el-switch
                v-model="useMinutesContent"
                active-color="#1F7CFF"
                @change="handleMinutesContentChange"
              />
            </div>
            <el-cascader
              v-if="sourceTab === '云端题库'"
              v-model="cloudSubjectPath"
              :options="cloudSubjectOptions"
              :props="{ expandTrigger: 'hover' }"
              :disabled="sourceSwitching || autoImportLoading"
              clearable
              filterable
              placeholder="学段 / 科目"
              @change="handleCloudSubjectChange"
            />
            <el-cascader
              v-else
              v-model="k12.subjectPath"
              :options="k12SubjectOptions"
              :props="{ expandTrigger: 'hover' }"
              clearable
              filterable
              placeholder="科目"
              @change="handleK12SubjectChange"
            />
            <template v-if="sourceTab !== 'AI出题' && !isK12ChineseSubject">
              <div class="filter-mode">
                <button
                  type="button"
                  :class="{ active: k12.mode === 'chapter' }"
                  @click="changeK12Mode('chapter')"
                >按章节筛选</button>
                <button
                  type="button"
                  :class="{ active: k12.mode === 'knowledge' }"
                  @click="changeK12Mode('knowledge')"
                >按知识点筛选</button>
              </div>
            </template>
            <el-select v-if="sourceTab === 'AI出题' || k12FilterMode === 'chapter'" v-model="k12.bookId" clearable filterable placeholder="教材版本" @change="handleK12BookChange">
              <el-option v-for="item in bookOptions" :key="item.id" :label="item.name" :value="String(item.id)" />
            </el-select>
            <el-select v-if="sourceTab === 'AI出题' || k12FilterMode === 'chapter'" v-model="k12.level" clearable filterable placeholder="年级" @change="loadK12Points">
              <el-option v-for="item in levelOptions" :key="item.id || item.name" :label="item.name" :value="String(item.id || item.name)" />
            </el-select>
            <el-cascader
              ref="k12-chapter"
              v-if="sourceTab === 'AI出题' || k12FilterMode === 'chapter'"
              v-model="k12.pointPath"
              :options="chapterFilterOptions"
              :props="pointCascaderProps"
              popper-class="practice-filter-taxonomy-popper"
              clearable
              filterable
              class="question-content-chapt"
              collapse-tags
              placeholder="章节"
              @visible-change="handleTaxonomyVisibleChange($event, 'k12-chapter')"
              @expand-change="updateTaxonomyPopper('k12-chapter')"
            >
              <template slot-scope="{ node }">
                <span class="practice-taxonomy-label" @click.stop="handleTaxonomyLabelClick(node, $event)">{{ node.label }}</span>
              </template>
            </el-cascader>
            <el-cascader
              ref="k12-knowledge"
              v-if="(sourceTab === 'AI出题' && !useAiMinutesContent) || (sourceTab !== 'AI出题' && k12FilterMode === 'knowledge')"
              v-model="k12.knowledgePath"
              :options="knowledgeFilterOptions"
              :props="k12KnowledgeCascaderProps"
              popper-class="practice-filter-taxonomy-popper"
              clearable
              filterable
              placeholder="知识点"
              @visible-change="handleTaxonomyVisibleChange($event, 'k12-knowledge')"
              @expand-change="updateTaxonomyPopper('k12-knowledge')"
            >
              <template slot-scope="{ node }">
                <span class="practice-taxonomy-label" @click.stop="handleTaxonomyLabelClick(node, $event)">{{ node.label }}</span>
              </template>
            </el-cascader>
            <el-select v-model="k12.questType" clearable filterable placeholder="题型">
              <el-option v-for="item in sourceTab === 'AI出题' ? aiQuestTypeOptions : k12QuestTypeOptions" :key="item.id" :label="item.name" :value="String(item.id)" />
            </el-select>
            <el-select v-if="sourceTab !== '云端题库'" v-model="k12.difficulty" clearable filterable placeholder="难度">
              <el-option v-for="item in difficultyOptions" :key="item.id" :label="item.name" :value="String(item.id)" />
            </el-select>
            <el-input-number
              v-if="sourceTab === 'AI出题'"
              v-model="aiCount"
              :min="1"
              :max="aiCountMax"
              :controls="false"
              placeholder="出题数量"
            />
            <el-input
              v-else
              v-model="k12.name"
              class="question-content-input"
              clearable
              placeholder="题目内容/题目id"
            />
          </div>

            <div class="condition-actions">
            <button class="reset-button" type="button" @click="resetAndSearch"  v-if="sourceTab !== 'AI出题'">重置</button>
            <button
              v-if="sourceTab === 'AI出题'"
              class="primary-action"
              type="button"
              :disabled="loading || sourceSwitching || filterOptionsLoading > 0"
              @click="generateQuestions"
            >{{ loading ? '出题中...' : '开始出题' }}</button>
            <button  v-if="sourceTab !== 'AI出题'" class="primary-action" type="button" :disabled="loading" @click="runSearch">
              {{ loading && sourceTab !== 'AI出题' ? '查询中...' : '查询' }}
            </button>
            <button
              class="condition-collapse-button"
              type="button"
              aria-expanded="true"
              aria-controls="practice-filter-content"
              @click="filtersCollapsed = true"
            >
              <span class="filter-toggle-action">
                收起
              </span>
            </button>
          </div>
        </div>
        <!-- <div v-if="showAiChapterSummary" class="ai-chapter-summary">
          <span v-if="aiGenerationMeta.matchedChapters.length" class="matched-chapters">
            已参与出题：{{ chapterSummaryNames(aiGenerationMeta.matchedChapters) }}
          </span>
          <span v-if="aiGenerationMeta.unavailableChapters.length" class="unavailable-chapters">
            未覆盖：{{ chapterSummaryNames(aiGenerationMeta.unavailableChapters) }}
          </span>
        </div> -->
            </div>
          </el-collapse-transition>
        </section>

        <section
          v-loading="loading || sourceSwitching"
          class="question-section"
          :element-loading-text="isAiGenerating ? 'AI 正在生成试题，请稍等' : ''"
        >
          <div class="list-heading">
            <div>
              <strong>题目列表</strong>
              <span v-if="sourceTab !== '云端题库' && !sourceSwitching && total">共 <em>{{ total }}</em> 道</span>
            </div>
            <div v-if="isSmartEditable" class="list-actions">
              <button type="button" @click="openBankEditor()">新增</button>
              <button type="button" @click="openImportDialog">导入</button>
            </div>
          </div>

          <div v-if="showAiExport && sourceTab === 'AI出题' && questions.length && !sourceSwitching" class="ai-export-toolbar">
            <el-checkbox
              :value="aiExportAllSelected"
              :indeterminate="aiExportPartiallySelected"
              :disabled="loading || sourceSwitching || !questions.length"
              @change="toggleAllAiExportQuestions"
            >全选</el-checkbox>
            <span class="ai-export-count">已选 {{ aiExportSelectedQuestions.length }} 道</span>
            <div class="ai-export-actions">
              <button type="button" :disabled="aiExportDisabled" @click="openAiExport('DOCX')">导出 Word</button>
              <button type="button" :disabled="aiExportDisabled" @click="openAiExport('PDF')">导出 PDF</button>
            </div>
          </div>

          <div
            ref="questionList"
            class="question-list"
            :class="{ 'is-scroll-locked': isAiGenerating }"
            @wheel="preventQuestionListScroll"
            @touchmove="preventQuestionListScroll"
          >
            <article
              v-for="(question, index) in questions"
              :key="questionKey(question, index)"
              class="question-card"
              draggable="true"
              @dragstart="handleQuestionDragStart(question, index, $event)"
              @dragend="handleQuestionDragEnd"
            >
              <div class="question-main">
                <div class="question-leading">
                <el-checkbox
                  v-if="showAiExport && sourceTab === 'AI出题'"
                  class="ai-export-checkbox"
                  :value="aiExportSelectedKeys.includes(question._aiExportKey)"
                  :disabled="loading || sourceSwitching"
                  :aria-label="`选择第 ${index + 1} 题用于导出`"
                  @change="toggleAiExportQuestion(question, $event)"
                  @click.native.stop
                  @mousedown.native.stop
                  @dragstart.native.stop.prevent
                />
                <span class="question-index">{{ String(index + 1).padStart(2, '0') }}</span>
                </div>
                <div class="question-content">
                  <div v-if="question.isImg === '1'" class="question-title">
                    <img :src="question.name" alt="题目">
                  </div>
                  <div v-else class="question-title rich-content" v-rich-html="question.name"></div>
                  <div
                    v-if="getOptions(question).length"
                    v-adaptive-question-options
                    class="question-options"
                  >
                    <span v-for="option in getOptions(question)" :key="option.key" class="question-option">
                      {{ option.key }}. <span class="rich-content" v-rich-html="option.value"></span>
                    </span>
                  </div>
                </div>
              </div>

              <div class="question-footer">
                <div class="question-tags">
                  <span class="tag subject-tag">{{ question.subjectName || (questionEduType(question) === '专升本' ? '数学' : '科目') }}</span>
                  <span class="tag type-tag">{{  question.questTemplateName ||question.questTypeName || '单选题' }}</span>
                  <span class="tag difficulty-tag">{{ question.difficultyName || '中等' }}</span>
                  <span v-if="question.knowledgeName" class="tag knowledge-tag">
                    {{  question.knowledgeName }}
                  </span>
                  <template v-if="sourceTab === '云端题库' || sourceTab === '自有题库'">
                    <span v-if="question.bookName" class="tag book-tag">{{ question.bookName }}</span>
                    <span v-if="question.typeName" class="tag grade-tag">{{ question.typeName }}</span>
                  </template>
                </div>
                <div class="question-actions">
                  <button
                    v-if="sourceTab === '云端题库' || sourceTab === '自有题库'"
                    class="copy-id-action"
                    type="button"
                    @click="copyQuestionId(question)"
                  >复制ID</button>
                  <template v-if="isSmartEditable">
                    <button class="text-action edit" type="button" @click="openBankEditor(question, index)">编辑</button>
                    <button class="text-action delete" type="button" @click="deleteBankQuestion(index)">删除</button>
                  </template>
                  <button
                    v-if="sourceTab !== '自有题库'"
                    class="outline-action"
                    type="button"
                    :disabled="question._bankLoading || question._banked"
                    @click="saveToSmartBank(question)"
                  >
                    {{ question._bankLoading ? '加入中...' : (question._banked ? '已加入' : '加入自有题库') }}
                  </button>
                  <button
                    v-if="hasQuestionKnowledge(question)"
                    class="mother-import-action"
                    type="button"
                    @click="importAsMother(question)"
                  >导入母题</button>
                  <button
                    class="child-import-action"
                    type="button"
                    @click="importAsChild(question)"
                  >导入子题</button>
                  <button class="analysis-action" type="button" @click="toggleAnalysis(question)">
                    {{ question._showAnalysis
                      ? (sourceTab === 'AI出题' ? '收起详情' : '收起解析')
                      : (sourceTab === 'AI出题' ? '查看详情' : '答案解析') }}
                  </button>
                  <button
                    v-if="sourceTab === '云端题库' && String(question.hasErrorReport) !== '1'"
                    class="error-correction-action"
                    :class="{ active: question._showErrorCorrection }"
                    type="button"
                    @click="toggleErrorCorrection(question)"
                  >{{ question._showErrorCorrection ? '取消纠错' : '纠错' }}</button>
                </div>
              </div>

              <div v-if="question._showAnalysis" class="analysis-panel">
                <div v-if="sourceTab === 'AI出题' && questionEduType(question) === 'K9K12'" class="ai-detail-grid">
                  <div v-for="item in aiQuestionDetails(question)" :key="item.label" class="ai-detail-item">
                    <span class="ai-detail-label">{{ item.label }}：</span>
                    <span class="ai-detail-value">{{ item.value }}</span>
                  </div>
                </div>
                 <div v-if="sourceTab === 'AI出题' && questionEduType(question) !== 'K9K12'" class="ai-detail-grid">
                  <div v-for="item in aiQuestionDetailsZsb(question)" :key="item.label" class="ai-detail-item">
                    <span class="ai-detail-label">{{ item.label }}：</span>
                    <span class="ai-detail-value">{{ item.value }}</span>
                  </div>
                </div>
                <div>答案：</div>
                <div class="rich-content" v-rich-html="question.answer"></div>
                <div>解析：</div>
                <div class="rich-content" v-rich-html="question.analysis || '暂无解析'"></div>
              </div>

              <div
                v-if="question._showErrorCorrection && question._errorCorrection"
                class="error-correction-panel"
                @dragstart.stop.prevent
              >
                <div class="error-correction-row reason-row">
                  <span class="error-correction-label required">纠错类型</span>
                  <div v-loading="errorReasonLoading" class="error-reason-content">
                    <el-radio-group v-model="question._errorCorrection.reason">
                      <el-radio
                        v-for="item in errorReasonOptions"
                        :key="item.value"
                        :label="item.value"
                      >{{ item.label }}</el-radio>
                    </el-radio-group>
                    <button
                      v-if="!errorReasonLoading && !errorReasonOptions.length"
                      class="error-reason-retry"
                      type="button"
                      @click="loadErrorReasonOptions"
                    >重新加载纠错类型</button>
                  </div>
                </div>

                <div class="error-correction-row">
                  <span class="error-correction-label">描述</span>
                  <el-input
                    v-model="question._errorCorrection.content"
                    type="textarea"
                    :rows="3"
                    :maxlength="500"
                    show-word-limit
                    resize="none"
                    placeholder="请填写错误描述（选填）"
                  />
                </div>

                <div class="error-correction-row upload-row">
                  <span class="error-correction-label">上传图片</span>
                  <div class="error-image-content">
                    <div class="error-image-list">
                      <label
                        v-if="question._errorCorrection.files.length < 5"
                        class="error-image-picker"
                      >
                        <i class="el-icon-plus"></i>
                        <span>上传图片</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                          multiple
                          @change="selectErrorImages(question, $event)"
                        >
                      </label>
                      <div
                        v-for="(image, imageIndex) in question._errorCorrection.files"
                        :key="image.uid"
                        class="error-image-item"
                      >
                        <img :src="image.url" :alt="image.name">
                        <button
                          type="button"
                          title="移除图片"
                          @click="removeErrorImage(question, imageIndex)"
                        ><i class="el-icon-close"></i></button>
                      </div>
                    </div>
                    <p>支持 jpg/png，最多上传 5 张</p>
                  </div>
                </div>

                <div class="error-correction-footer">
                  <button
                    class="error-submit-button"
                    type="button"
                    :disabled="question._errorCorrection.submitting"
                    @click="submitErrorCorrection(question)"
                  >{{ question._errorCorrection.submitting ? '提交中...' : '确定' }}</button>
                  <button
                    class="error-cancel-button"
                    type="button"
                    :disabled="question._errorCorrection.submitting"
                    @click="closeErrorCorrection(question)"
                  >取消</button>
                </div>
              </div>
            </article>

            <empty-state
              v-if="!loading && !sourceSwitching && !questions.length"
              :title="sourceTab !== 'AI出题' && !hasSearched ? '请选择筛选条件' : '暂无题目'"
              :description="sourceTab === 'AI出题' ? '请调整条件后开始出题' : (hasSearched ? '请调整筛选条件后重新查询' : '选择所需条件后，点击「查询」查看题目')"
            />
          </div>
          <div v-if="sourceTab === '云端题库' && hasSearched && questions.length" class="question-pagination">
            <button
              class="primary-action next-batch-button"
              type="button"
              :disabled="loading || sourceSwitching"
              @click="changeBatch"
            >换一批</button>
          </div>
          <el-pagination
            v-else-if="sourceTab !== 'AI出题' && !sourceSwitching && total > pageSize"
            class="question-pagination"
            background
            layout="prev, pager, next"
            :current-page="page"
            :page-size="pageSize"
            :total="total"
            @current-change="changePage"
          />
        </section>
      </section>

      <aside
        v-loading="autoImportLoading"
        class="paper-panel"
        element-loading-text="正在导入子题，请稍候..."
      >
        <div class="paper-summary">
          <span>母题 {{ motherCount }}/{{ motherLimit }}，子题 {{ childCount }}/{{ childLimit }}</span>
          <div class="paper-summary-actions">
            <el-tooltip content="一键清空所有选择的母题和子题" placement="top">
              <button
                class="clear-paper-button"
                type="button"
                aria-label="一键清空所有选择的母题和子题"
                :disabled="!hasSelectedQuestions"
                @click="clearAllSelectedQuestions"
              >
                <i class="el-icon-delete"></i>
              </button>
            </el-tooltip>
            <button type="button" @click="autoImportQuestions">导入全部子题</button>
          </div>
        </div>
        <div class="import-match-type">
          <span class="import-match-type-label">是否仅导入母题相同题型</span>
          <el-switch v-model="matchQuestType" />
        </div>
        <div class="import-match-type">
          <span class="import-match-type-label">是否允许一道子题重复出现</span>
          <el-switch v-model="allowRepeat" />
        </div>
        <div class="question-type-help">
          <p><strong>母题：</strong>组成课后测，发布后由学生直接作答</p>
          <p><strong>子题：</strong>母题答错后，用于后续错题巩固练习</p>
        </div>
       

        <div class="paper-content">
          <section v-for="(group, groupIndex) in paperGroups" :key="group.id" class="mother-group">
            <button class="mother-heading" type="button" @click="group.expanded = !group.expanded">
              <strong>母题 {{ groupIndex + 1 }}</strong>
              <i :class="group.expanded ? 'el-icon-caret-top' : 'el-icon-caret-bottom'"></i>
            </button>

            <template v-if="group.expanded">
              <div
                v-if="group.mother"
                class="selected-mother"
                @dragover.prevent
                @drop.prevent.stop="dropQuestionAsMother(groupIndex, $event)"
              >
                <div class="selected-title rich-content" v-rich-html="group.mother.name || '未命名题目'"></div>
                <div class="selected-actions">
                  <button type="button" @click="previewQuestion(group.mother)">预览</button>
                  <button type="button" @click="openQuestionEditor(group.mother, 'mother', groupIndex)">编辑</button>
                  <button class="delete-button" type="button" @click="removeMother(groupIndex)">删除</button>
                </div>
              </div>
              <button
                v-else
                class="mother-empty"
                :class="{ targeted: isMotherTarget(groupIndex) }"
                type="button"
                @click="selectMotherTarget(groupIndex)"
                @dragover.prevent
                @drop.prevent.stop="dropQuestionAsMother(groupIndex, $event)"
              >
                点击选中后导入母题
              </button>

              <div class="children-title">子题：</div>
              <div
                v-for="(child, childIndex) in group.children"
                :key="childIndex"
                class="child-item"
              >
                <div
                  v-if="child"
                  class="selected-mother selected-child"
                  @dragover.prevent
                  @drop.prevent.stop="dropQuestionAsChild(groupIndex, childIndex, $event)"
                >
                  <div class="selected-title rich-content" v-rich-html="child.name || `子题 ${childIndex + 1}`"></div>
                  <div class="selected-actions">
                    <button type="button" @click="previewQuestion(child)">预览</button>
                    <button
                      type="button"
                      @click="openQuestionEditor(child, 'child', groupIndex, childIndex)"
                    >编辑</button>
                    <button
                      class="delete-button"
                      type="button"
                      @click="removeChild(groupIndex, childIndex)"
                    >删除</button>
                  </div>
                </div>
                <button
                  v-else
                  class="child-slot"
                  :class="{ targeted: isChildTarget(groupIndex, childIndex) }"
                  type="button"
                  @click="handleChildSlot(groupIndex, childIndex, child)"
                  @dragover.prevent
                  @drop.prevent.stop="dropQuestionAsChild(groupIndex, childIndex, $event)"
                >
                  子题 {{ childIndex + 1 }}（点击选中后导入）
                </button>
              </div>
              <button
                class="import-group-children"
                type="button"
                @click="autoImportGroupChildren(groupIndex)"
              >
                一键导入该母题的子题
              </button>
            </template>
          </section>
        </div>

        <div class="paper-footer-actions">
          <button class="add-question-button" type="button" @click="addMotherQuestion">新增母题</button>
          <button class="add-question-button" type="button" @click="addChildQuestion">新增子题</button>
          <button class="publish-button" type="button" :disabled="publishing" @click="publishPractice">
            {{ publishing ? '发布中...' : '确认发布' }}
          </button>
        </div>
      </aside>
    </main>

    <el-dialog
      title="导入题目"
      :visible.sync="importVisible"
      width="540px"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="!importLoading"
      :before-close="beforeImportClose"
      custom-class="question-import-dialog"
      @close="invalidateImportDialog"
      @closed="handleImportClosed"
    >
      <div class="import-form">
        <div class="import-form-row">
          <label>学段 / 科目</label>
          <el-cascader ref="import-subject" :key="importSubjectPickerKey" v-model="importForm.subjectPath"
            :options="importBusinessOptions" :props="importSubjectProps" :disabled="importLoading || importBaseLoading"
            clearable filterable placeholder="请选择学段及科目" popper-class="practice-filter-taxonomy-popper"
            @change="handleImportSubjectChange()" @visible-change="handleImportPopperVisible($event, 'import-subject')"
            @expand-change="updateTaxonomyPopper('import-subject')" />
        </div>
        <button v-if="importBaseError" type="button" class="import-template-button" :disabled="importBaseLoading || importLoading" @click="loadImportBusinesses">重新加载学段</button>
        <template v-if="importSubject">
          <template v-if="importStandardType === 1">
            <div class="import-form-row">
              <label>教材版本</label>
              <el-select v-model="importForm.bookId" clearable filterable :loading="importBooksLoading" :disabled="importLoading || importBooksLoading" @change="handleImportBookChange()">
                <el-option v-for="item in importBooks" :key="item.id" :label="item.name" :value="String(item.id)" />
              </el-select>
            </div>
            <div class="import-form-row">
              <label>年级</label>
              <el-select v-model="importForm.typeId" clearable filterable :loading="importLevelsLoading" :disabled="importLoading || !importForm.bookId || importLevelsLoading" @change="handleImportLevelChange">
                <el-option v-for="item in importLevels" :key="item.id" :label="item.name" :value="String(item.id)" />
              </el-select>
            </div>
          </template>
          <p class="import-directory-hint">章节、知识点仅用于下载模板，可筛选或清空；导入使用文件内的目录。</p>
          <template v-if="importStandardType === 2">
            <div class="import-form-row">
              <label>章节</label>
              <el-select v-model="importForm.chapterValues" multiple filterable collapse-tags clearable popper-class="practice-import-select-popper" :loading="importCatalogLoading" :disabled="importLoading || importCatalogLoading" @change="handleImportChapterChange">
                <el-option v-for="item in importChapterItems" :key="item.value" :value="item.value" :label="item.pathLabel" />
              </el-select>
            </div>
            <div class="import-form-row">
              <label>知识点</label>
              <import-knowledge-tree-picker v-model="importForm.knowledgeValues" :options="importKnowledgeTree"
                :loading="importKnowledgeLoading" :disabled="importLoading || importCatalogLoading || !importForm.chapterValues.length" />
            </div>
          </template>
          <template v-else>
            <div class="import-form-row">
              <label>章节</label>
              <el-cascader ref="import-chapter" v-model="importForm.chapterValues" :options="importChapters" :props="importCatalogProps" collapse-tags clearable filterable :disabled="importLoading || importCatalogLoading" popper-class="practice-filter-taxonomy-popper" @visible-change="handleImportPopperVisible($event, 'import-chapter')" @expand-change="updateTaxonomyPopper('import-chapter')" />
            </div>
            <div class="import-form-row">
              <label>知识点</label>
              <el-cascader ref="import-knowledge" v-model="importForm.knowledgeValues" :options="importKnowledge" :props="importCatalogProps" collapse-tags clearable filterable :disabled="importLoading || importCatalogLoading" popper-class="practice-filter-taxonomy-popper" @visible-change="handleImportPopperVisible($event, 'import-knowledge')" @expand-change="updateTaxonomyPopper('import-knowledge')" />
            </div>
          </template>
          <button v-if="importOptionsError" type="button" class="import-template-button" :disabled="importLoading || importCatalogLoading || importKnowledgeLoading || importBooksLoading || importLevelsLoading" @click="retryImportOptions">{{ importOptionsError }}，点击重试</button>
        </template>
        <div class="import-form-row">
          <label>导入文件</label>
          <div class="import-file-actions">
            <button class="import-file-picker" type="button" :disabled="importLoading || importDownloadLoading" @click="$refs.importInput.click()">
              {{ importForm.fileName || '选择文件' }}
            </button>
            <button class="import-template-button" type="button" :disabled="importLoading || importDownloadLoading" @click="downloadImportTemplate">{{ importDownloadLoading ? '下载中...' : '下载模板' }}</button>
          </div>
          <input ref="importInput" type="file" accept=".xlsx,.xls,.json" :disabled="importLoading || importDownloadLoading" hidden @change="selectImportFile">
        </div>
      </div>
      <template slot="footer">
        <button class="import-cancel-button" type="button" :disabled="importLoading" @click="importVisible = false">取消</button>
        <button class="import-confirm-button" type="button" :disabled="importLoading || importDownloadLoading" @click="confirmImport">
          {{ importLoading ? '导入中...' : '确定' }}
        </button>
      </template>
    </el-dialog>

    <el-dialog
      title="导入失败明细"
      :visible.sync="importResultVisible"
      width="680px"
      custom-class="question-import-result-dialog"
    >
      <div class="import-result-summary">
        <span>总行数：{{ importResult.totalRows }}</span>
        <span>成功：{{ importResult.successCount }}</span>
        <span>失败：{{ importResult.failureCount }}</span>
      </div>
      <el-table
        :data="importResult.failures"
        border
        size="small"
        max-height="360"
        empty-text="暂无失败明细"
      >
        <el-table-column prop="rowNumber" label="Excel 行号" width="110" />
        <el-table-column prop="reason" label="失败原因" min-width="260" show-overflow-tooltip />
      </el-table>
      <template slot="footer">
        <button class="import-confirm-button" type="button" @click="importResultVisible = false">知道了</button>
      </template>
    </el-dialog>

    <div v-if="previewVisible" class="preview-mask" :style="{ zIndex: previewZIndex }" @click.self="previewVisible = false">
      <section class="preview-dialog">
        <header>
          <strong>题目预览</strong>
          <button type="button" @click="previewVisible = false">×</button>
        </header>
        <div class="preview-body">
          <div class="preview-title rich-content" v-rich-html="previewQuestionData.name"></div>
          <div v-for="option in getOptions(previewQuestionData)" :key="option.key" class="preview-option">
            {{ option.key }}. <span class="rich-content" v-rich-html="option.value"></span>
          </div>
          <div class="preview-answer">
            <strong>答案：</strong>
            <div class="rich-content" v-rich-html="previewQuestionData.answer || '暂无'"></div>
          </div>
          <div class="preview-answer">
            <strong>解析：</strong>
            <div class="rich-content" v-rich-html="previewQuestionData.analysis || '暂无'"></div>
          </div>
          <div class="preview-answer">
            <strong>章节：</strong>
            <div class="rich-content" v-rich-html="previewQuestionData.chapterName || previewQuestionData.pointName || '暂无'"></div>
          </div>
          <div class="preview-answer">
            <strong>知识点：</strong>
            <div class="rich-content" v-rich-html="previewQuestionData.knowledgeName || '暂无'"></div>
          </div>
        </div>
      </section>
    </div>

    <div v-if="editVisible" class="preview-mask" :style="{ zIndex: editZIndex }">
      <section class="edit-dialog">
        <header>
          <div class="edit-dialog-title">
            <strong>{{ ['cloudBank', 'aiBank'].includes(editingTarget.type) ? '编辑题目并加入自有题库' : (editingTarget.type === 'mother' ? '编辑母题' : '编辑子题') }}</strong>
            <span>{{ editingQuestionTypeName }}</span>
          </div>
          <button type="button" :disabled="bankAddSaving" @click="closeQuestionEditor">×</button>
        </header>
        <div class="edit-form">
          <div class="edit-field">
            <span>题目</span>
            <Editor
              v-model="editingQuestion.name"
              :min-height="100"
             
            />
          </div>
          <div v-if="showEditingOptionEditors" class="edit-options">
            <div v-for="optionKey in ['A', 'B', 'C', 'D', 'E']" :key="optionKey" class="edit-field">
              <span>选项 {{ optionKey }}</span>
              <Editor
                v-model="editingQuestion['option' + optionKey]"
                :min-height="70"
               
              />
            </div>
          </div>
          <div class="edit-field">
            <span>答案</span>
            <p v-if="editingQuestionTypeCode === '3'" class="answer-tip">提示：请填写 A 或 B，A 代表对，B 代表错。</p>
            <Editor
              v-model="editingQuestion.answer"
              :min-height="70"
            
            />
          </div>
          <div class="edit-field">
            <span>解析</span>
            <Editor
              v-model="editingQuestion.analysis"
              :min-height="100"
             
            />
          </div>
          <div v-if="!['cloudBank', 'aiBank'].includes(editingTarget.type)" class="edit-field">
            <span>知识点</span>
            <Editor
              v-model="editingQuestion.knowledgeName"
              :min-height="70"
              
            />
          </div>
        </div>
        <footer>
          <button class="edit-cancel" type="button" :disabled="bankAddSaving" @click="closeQuestionEditor">取消</button>
          <button class="edit-confirm" type="button" :disabled="bankAddSaving" @click="saveEditedQuestion">{{ bankAddSaving ? '加入中...' : '确定' }}</button>
        </footer>
      </section>
    </div>

    <publish-after-quiz-dialog
      v-if="publishConfirmVisible"
      :initial-config="publishConfirmConfig"
      :show-title="practiceEntrySource === 'teacher-home'"
      :show-numbers="false"
      require-students
      :submitting="publishing"
      dialog-title="确认发布课后测"
      @close="closePublishConfirmation"
      @confirm="confirmPublishPractice"
    />
    <ai-paper-export-dialog
      v-if="showAiExport && aiExportFileType"
      :questions="aiExportQuestionsSnapshot"
      :subject-name="aiExportSubjectName"
      :initial-settings="aiExportSettings"
      :file-type="aiExportFileType"
      configurable
      @settings-change="aiExportSettings = $event"
      @close="aiExportFileType = ''"
    />
    </template>
  </div>
</template>

<script>
import {
  addTeachingCloudError,
  addTopicByAi,
  addTopicByTeaching,
  deleteTopic,
  downloadTopicCompulsoryTemplateWithCatalog,
  downloadTopicTemplateWithCatalog,
  downloadTopicGeneralTemplate,
  generateAfterQuizQuestions,
  generatePartQuest,
  getMinutesSubject,
  getBusinessSubjectTree,
  getBusinessSubjects,
  getBusinessChapters,
  getBusinessKnowledgePoints,
  getQuestListByKnowledge,
  getQuestListByKnowledgeByUpgrade,
  getTeachingCloudOptions,
  getTeachingCloudQuestions,
  getTopicAreaBusiness,
  getTopicBookList,
  getTopicCompulsoryQuestList,
  getTopicCompulsorySubjectList,
  getTopicUnCompulsorySubjectList,
  getTopicDictItemList,
  getTopicKnowledgeCompulsoryList,
  getTopicQuestList,
  getTopicGeneralQuestList,
  getTopicQuestTypeTemplates,
  getTopicSubjectListByType,
  getTopicSubjectPointCompulsoryList,
  getTopicSubjectPointList,
  getTopicSubjectPointTree,
  getTopicKnowledgeList,
  getTopicTypeListByBook,
  getTopicTypeListByBusiness,
  importTopicCompulsoryQuestions,
  importTopicQuestions,
  importTopicGeneralQuestions,
  publishAfterQuiz
} from '@/api/quizBuilder'
import Editor from '@/components/Editor'
import EmptyState from '@/components/EmptyState.vue'
import { PopupManager } from 'element-ui/lib/utils/popup'
import { getAuthInfo } from '@/utils/auth'
import PublishAfterQuizDialog from '@/views/teacher/publishTest/components/PublishAfterQuizDialog.vue'
import QuizQuestionEditor from './components/QuizQuestionEditor.vue'
import ImportKnowledgeTreePicker from './components/ImportKnowledgeTreePicker.vue'
import AiPaperExportDialog from './components/AiPaperExportDialog.vue'
import { snapshotAiExportQuestion } from '@/utils/aiPaperExport'
import { clearPracticeRouteConfig, savePracticeRouteConfig } from '@/utils/practiceRoute'
import { normalizeT1AiQuestions } from '@/utils/smartQuiz'
import { normalizeZsbSubjectOptions, getZsbSubject } from '@/utils/zsbSubjects'
import adaptiveQuestionOptions from '@/utils/adaptiveQuestionOptions'
import richHtml from '@/utils/richTextHtml'
import { normalizeImportCatalog, flattenImportCatalog, expandImportSelection, serializeImportCatalog } from '@/utils/topicImportCatalog'

const TOPIC_DIFFICULTY_DICT_ID = '2'
const TEACHING_CLOUD_ERROR_DICT_ID = '23'
const FILTER_OPTION_FIELDS = [
  'areaOptions', 'typeOptions', 'subjectOptions', 'zsbSubjectOptions',
  'pointOptions', 'knowledgeOptions', 'questTypeOptions', 'difficultyOptions',
  'k12SubjectGroups', 'k12SubjectRaw', 'k12SubjectOptions', 'bookOptions',
  'levelOptions', 'k12PointOptions', 'k12KnowledgeOptions', 'k12QuestTypeOptions'
]

const emptyZsb = () => ({
  areaPath: [],
  subjectPath: [],
  typeId: '',
  subjectId: '',
  pointPath: [],
  knowledgePath: [],
  questType: '',
  difficulty: '',
  name: ''
})

const emptyK12 = () => ({
  subjectPath: [],
  mode: 'chapter',
  bookId: '',
  level: '',
  pointPath: [],
  knowledgePath: [],
  questType: '',
  difficulty: '',
  name: ''
})

const emptyImportForm = () => ({
  bookId: '',
  typeId: '',
  subjectPath: [],
  chapterValues: [],
  knowledgeValues: [],
  file: null,
  fileName: ''
})

const CHILDREN_PER_MOTHER = 5

// AI 请求的赛道枚举由科目所属学段决定，与顶部学习赛道选择无关。
const AI_LEARNING_TRACKS = { 0: 'OTHER_STAGES', 1: 'K9_K12', 2: 'FUJIAN_COLLEGE_UPGRADE' }
const emptyAiFilters = () => ({ subjectPath: [], bookId: '', level: '', pointPath: [], knowledgePath: [], chapterSelection: '', knowledgeSelection: '', questType: '', difficulty: '' })
const emptyAiOptions = () => ({ books: [], levels: [], chapters: [], knowledge: [], difficulties: [] })
const emptyOwnFilters = () => ({ subjectPath: [], mode: 'chapter', bookId: '', level: '', pointPath: [], knowledgePath: [], questType: '', difficulty: '', name: '' })
const emptyOwnOptions = () => ({ books: [], levels: [], chapters: [], knowledge: [], questTypes: [], difficulties: [] })

const createPaperGroup = id => ({
  id,
  mother: null,
  children: Array(CHILDREN_PER_MOTHER).fill(null),
  expanded: true
})

export default {
  name: 'CreatePrectice',
  directives: {
    adaptiveQuestionOptions,
    'rich-html': richHtml
  },
  components: {
    Editor,
    EmptyState,
    PublishAfterQuizDialog,
    QuizQuestionEditor,
    ImportKnowledgeTreePicker,
    AiPaperExportDialog
  },
  props: {
    practiceConfig: {
      type: Object,
      default: () => ({})
    },
    entrySource: {
      type: String,
      default: ''
    },
    // 通用非听记模式允许自定义名称，通过 chapter.name / knowledgePoint.name 提交。
    enableAiCustomNames: {
      type: Boolean,
      default: true
    }
  },
  data() {
    const authInfo = getAuthInfo() || {}
    return {
      eduTypes: String(authInfo.isInternalOrganization) !== '1' ? ['K9K12', '专升本'] : ['K9K12'],
      sourceTabs: ['云端题库', 'AI出题', '自有题库'],
      eduType: 'K9K12',
      sourceTab: '云端题库',
      filtersCollapsed: false,
      bankTabSnapshots: {},
      hasSearched: false,
      // 云端科目单独保存，切换学习赛道不会改变这条选择路径。
      cloudSubjectPath: [],
      filterStateSequence: 0,
      filterRequestSequences: {},
      zsb: emptyZsb(),
      k12: emptyK12(),
      useMinutesContent: true,
      aiCount: 2,
      aiQuestTypeOptions: [
        { id: '1', name: '单选题', questType: '1' },
        { id: '2', name: '多选题', questType: '2' },
        { id: '3', name: '判断题', questType: '3' },
        // { id: '4', name: '填空题', questType: '4' }
      ],
      aiGenerationMeta: {
        matchedChapters: [],
        unavailableChapters: []
      },
      areaOptions: [],
      typeOptions: [],
      subjectOptions: [],
      zsbSubjectOptions: [],
      pointOptions: [],
      knowledgeOptions: [],
      questTypeOptions: [],
      difficultyOptions: [],
      errorReasonOptions: [],
      errorReasonLoading: false,
      errorReasonLoaded: false,
      k12SubjectGroups: [],
      k12SubjectRaw: [],
      k12SubjectOptions: [],
      bookOptions: [],
      levelOptions: [],
      k12PointOptions: [],
      k12KnowledgeOptions: [],
      k12QuestTypeOptions: [],
      questions: [],
      aiQuestionRows: [],
      // 暂时隐藏课后测 AI 题目导出入口及勾选，恢复时统一开启。
      showAiExport: false,
      aiExportSelectedKeys: [],
      aiExportFileType: '',
      aiExportQuestionsSnapshot: [],
      aiExportSubjectName: '',
      aiExportSettings: null,
      aiExportSettingsSubjectKey: '',
      aiGenerationSnapshots: {},
      aiFilters: emptyAiFilters(),
      aiOptions: emptyAiOptions(),
      aiBusinessOptions: [],
      aiSubjectTrees: {},
      aiSubjectPickerKey: 0,
      ownFilters: emptyOwnFilters(),
      ownOptions: emptyOwnOptions(),
      ownBusinessOptions: [],
      ownSubjectTrees: {},
      ownSubjectPickerKey: 0,
      total: 0,
      page: 1,
      pageSize: 10,
      loading: false,
      filterOptionsLoading: 0,
      sourceSwitching: true,
      requestSequence: 0,
      aiRequestSequence: 0,
      minutesSubjectRequestSequence: 0,
      importVisible: false,
      importResultVisible: false,
      importLoading: false,
      importForm: emptyImportForm(),
      importResult: {
        totalRows: 0,
        successCount: 0,
        failureCount: 0,
        failures: []
      },
      importDownloadLoading: false,
      importRevision: 0,
      importSequences: {},
      importBusinessOptions: [],
      importSubjectTrees: {},
      importTreeRequests: {},
      importSubjectPickerKey: 0,
      importBooks: [],
      importLevels: [],
      importChapters: [],
      importKnowledge: [],
      importKnowledgeCache: {},
      importPreviousChapters: [],
      importBaseLoading: false,
      importBaseError: false,
      importBooksLoading: false,
      importLevelsLoading: false,
      importCatalogLoading: false,
      importKnowledgeLoading: false,
      importCatalogReady: false,
      importOptionsError: '',
      bankEditorVisible: false,
      bankEditingIndex: null,
      bankEditorQuestId: '',
      bankEditor: {},
      bankAddQuestion: null,
      bankAddSaving: false,
      paperTabSnapshots: {},
      paperGroups: [],
      activeTarget: {
        type: 'mother',
        groupIndex: 0,
        childIndex: -1
      },
      draggingQuestion: null,
      autoImportLoading: false,
      matchQuestType: false,
      allowRepeat: false,
      publishing: false,
      publishConfirmVisible: false,
      publishConfirmConfig: {},
      previewVisible: false,
      previewZIndex: 0,
      previewQuestionData: {},
      editVisible: false,
      editZIndex: 0,
      editingQuestion: {},
      editingTarget: {
        type: '',
        groupIndex: -1,
        childIndex: -1
      },
      richEditorOptions: {
        placeholder: '请输入内容',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ color: [] }, { background: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean']
          ]
        }
      }
    }
  },
  computed: {
    aiExportSelectedQuestions() {
      const selected = new Set(this.aiExportSelectedKeys)
      return this.questions.filter(question => question._aiExportKey && selected.has(question._aiExportKey))
    },
    aiExportAllSelected() {
      return this.questions.length > 0 && this.aiExportSelectedQuestions.length === this.questions.length
    },
    aiExportPartiallySelected() {
      return this.aiExportSelectedQuestions.length > 0 && !this.aiExportAllSelected
    },
    aiExportDisabled() {
      return this.sourceTab !== 'AI出题' || this.loading || this.sourceSwitching || !this.aiExportSelectedQuestions.length
    },
    cloudSubjectOptions() {
      // 小初高保持“学段 → 科目”，专升本展示“专升本 → 类别 → 科目”。
      // 分组值加前缀用于区分两套数据，originalValue 保留原值供接口使用。
      const k12 = this.k12SubjectOptions.map(group => ({
        ...group,
        value: `k12:${group.value}`,
        eduType: 'K9K12',
        originalValue: group.value
      }))
      const zsb = this.eduTypes.includes('专升本') && this.zsbSubjectOptions.length ? [{
        value: 'zsb',
        label: '专升本',
        eduType: '专升本',
        children: this.zsbSubjectOptions.map(group => ({
          ...group,
          value: `zsb:${group.value}`,
          originalValue: group.value
        }))
      }] : []
      return [...k12, ...zsb]
    },
    activeFilterEduType() {
      if (this.sourceTab === 'AI出题') return this.aiStandardType === 1 ? 'K9K12' : '专升本'
      if (this.sourceTab === '自有题库') return this.ownStandardType === 1 ? 'K9K12' : '专升本'
      // 云端按所选科目决定筛选类型，不读取顶部学习赛道。
      if (this.sourceTab !== '云端题库') return this.eduType
      const group = this.cloudSubjectOptions.find(item => item.value === this.cloudSubjectPath[0])
      return group ? group.eduType : 'K9K12'
    },
    sourceDescription() {
      return {
        '云端题库': '源自立升教研云题库，包含真题和练习题',
        '自有题库': '老师个人上传、收藏或编辑的题目集合，支持Excel导入',
        'AI出题': '由AI模型实时生成的题目'
      }[this.sourceTab] || ''
    },
    ownBusiness() {
      return this.ownBusinessOptions.find(item => item.value === this.ownFilters.subjectPath[0]) || null
    },
    importBusiness() {
      return this.importBusinessOptions.find(item => item.value === this.importForm.subjectPath[0]) || null
    },
    importStandardType() {
      return this.importBusiness ? this.importBusiness.standardType : -1
    },
    importSubject() {
      return this.findBusinessSubject(this.importBusiness, this.importSubjectTrees, this.importForm.subjectPath)
    },
    importSubjectProps() {
      return { expandTrigger: 'click', lazy: true, checkStrictly: false, lazyLoad: this.loadImportSubjectNode }
    },
    importCatalogProps() {
      return { multiple: true, emitPath: false, checkStrictly: false, expandTrigger: 'click' }
    },
    importChapterItems() {
      return flattenImportCatalog(this.importChapters)
    },
    importKnowledgeGroups() {
      // 扁平索引仅用于验证/清理选择，界面展示使用保留完整层级的 importKnowledgeTree。
      return expandImportSelection(this.importChapters, this.importForm.chapterValues).map(chapter => ({
        value: chapter.value, label: chapter.pathLabel,
        items: flattenImportCatalog(this.importKnowledgeCache[chapter.id] || [])
      })).filter(group => group.items.length)
    },
    importKnowledgeTree() {
      // 保留知识点原有层级；章节根用于全选该章，内部值不能进入下载快照。
      return expandImportSelection(this.importChapters, this.importForm.chapterValues).map(chapter => ({
        value: 'group:' + chapter.value, name: chapter.pathLabel, label: chapter.pathLabel, group: true,
        children: this.importKnowledgeCache[chapter.id] || [],
        disabled: !(this.importKnowledgeCache[chapter.id] || []).length
      }))
    },
    ownStandardType() {
      return this.ownBusiness ? this.ownBusiness.standardType : -1
    },
    ownSubject() {
      return this.findBusinessSubject(this.ownBusiness, this.ownSubjectTrees, this.ownFilters.subjectPath)
    },
    ownDisplayStandardType() {
      // 未选有效科目时只默认展示 K9K12 条件，接口仍使用真实科目类型。
      return this.ownSubject ? this.ownStandardType : 1
    },
    ownSubjectCascaderProps() {
      return { expandTrigger: 'click', lazy: true, checkStrictly: false, lazyLoad: this.loadOwnSubjectNode }
    },
    isOwnChineseSubject() {
      if (this.ownStandardType !== 1 || !this.ownSubject) return false
      const names = [this.ownSubject.name, this.ownSubject.otherName, this.ownSubject.label].map(name => String(name || '').replace(/\s+/g, ''))
      if (names.some(name => ['小学语文', '初中语文', '高中语文'].includes(name))) return true
      // 懒加载子树存放在独立缓存中，不能依赖根 options 是否已有 children。
      let nodes = this.ownSubjectTrees[this.ownBusiness.id] || []
      const ancestorNames = [this.ownBusiness.label]
      for (const value of this.ownFilters.subjectPath.slice(1, -1)) {
        const node = nodes.find(item => item.value === value)
        if (!node) break
        ancestorNames.push(node.label)
        nodes = node.children || []
      }
      const ancestors = ancestorNames.join('/')
      return names.includes('语文') && ['小学', '初中', '高中'].some(stage => ancestors.includes(stage))
    },
    ownFilterMode() {
      return this.isOwnChineseSubject ? 'knowledge' : this.ownFilters.mode
    },
    aiBusiness() {
      return this.aiBusinessOptions.find(item => item.value === this.aiFilters.subjectPath[0]) || null
    },
    aiStandardType() {
      return this.aiBusiness ? this.aiBusiness.standardType : -1
    },
    aiSubject() {
      return this.findBusinessSubject(this.aiBusiness, this.aiSubjectTrees, this.aiFilters.subjectPath)
    },
    aiDisplayStandardType() {
      return this.aiSubject ? this.aiStandardType : 1
    },
    aiSubjectCascaderProps() {
      return { expandTrigger: 'click', lazy: true, checkStrictly: false, lazyLoad: this.loadAiSubjectNode }
    },
    allowAiCustomNames() {
      return this.enableAiCustomNames && this.aiStandardType === 0 && !this.useAiMinutesContent
    },
    aiGeneralChapters() {
      return this.flattenAiTaxonomy(this.aiOptions.chapters)
    },
    aiGeneralKnowledge() {
      return this.flattenAiTaxonomy(this.aiOptions.knowledge)
    },
    practiceEntrySource() {
      return this.entrySource || this.practiceConfig.entrySource || 'homework'
    },
    backButtonText() {
      return this.practiceEntrySource === 'teacher-home' ? '返回教师主页' : '返回课后作业'
    },
    showAiMinutesSwitch() {
      return this.practiceEntrySource === 'homework' && this.sourceTab === 'AI出题'
    },
    useAfterQuizAiApi() {
      return ['homework', 'teacher-home'].includes(this.practiceEntrySource) &&
        this.sourceTab === 'AI出题'
    },
    useAiMinutesContent() {
      return this.showAiMinutesSwitch && this.useMinutesContent
    },
    isK12ChineseSubject() {
      const subjectId = this.lastValue(this.k12.subjectPath)
      if (!subjectId) return false

      const subject = this.findK12Subject(subjectId)
      const subjectNames = [subject.otherName, subject.name, subject.label]
        .map(name => String(name || '').replace(/\s+/g, ''))
        .filter(Boolean)
      const chineseSubjectNames = ['小学语文', '初中语文', '高中语文']
      if (subjectNames.some(name => chineseSubjectNames.includes(name))) return true

      const stageName = String(this.k12.subjectPath[0] || this.k12StageName(subjectId) || '')
        .replace(/\s+/g, '')
      return subjectNames.includes('语文') && ['小学', '初中', '高中'].some(stage => stageName.includes(stage))
    },
    k12FilterMode() {
      return this.sourceTab !== 'AI出题' && this.isK12ChineseSubject
        ? 'knowledge'
        : this.k12.mode
    },
    chapterFilterOptions() {
      return this.getTaxonomyFilterOptions(this.activeFilterEduType === '专升本' ? this.pointOptions : this.k12PointOptions)
    },
    knowledgeFilterOptions() {
      return this.getTaxonomyFilterOptions(this.activeFilterEduType === '专升本' ? this.knowledgeOptions : this.k12KnowledgeOptions)
    },
    pointCascaderProps() {
      return {
        expandTrigger: 'hover',
        multiple: this.useAiMinutesContent,
        emitPath: true,
        checkStrictly: !this.useAiMinutesContent
      }
    },
    k12KnowledgeCascaderProps() {
      return {
        expandTrigger: 'hover',
        checkStrictly: true
      }
    },
    aiCountMax() {
      return 10
    },
    showAiChapterSummary() {
      return this.showAiMinutesSwitch && (
        this.aiGenerationMeta.matchedChapters.length ||
        this.aiGenerationMeta.unavailableChapters.length
      )
    },
    motherLimit() {
      const count = Number(this.practiceConfig.originalCount)
      const configLimit = Number.isFinite(count) && count > 0 ? Math.floor(count) : 1
      return Math.max(configLimit, this.paperGroups.length)
    },
    childLimit() {
      return this.paperGroups.reduce((count, group) => count + group.children.length, 0)
    },
    isZsbSmartBank() {
      return [0, 2].includes(this.ownStandardType) && this.sourceTab === '自有题库'
    },
    usesZsbSubjectCascader() {
      return this.eduType === '专升本'
    },
    usesZsbTopicOptions() {
      // 新增、编辑、导入尚未学段化，其旧选项接口继续读取顶部学习赛道。
      return this.eduType === '专升本' && (this.sourceTab === '自有题库' || this.sourceTab === 'AI出题')
    },
    isK12SmartBank() {
      return this.ownStandardType === 1 && this.sourceTab === '自有题库'
    },
    usesK12TopicOptions() {
      return this.eduType === 'K9K12' && (this.sourceTab === '自有题库' || this.sourceTab === 'AI出题')
    },
    isSmartEditable() {
      return this.sourceTab === '自有题库'
    },
    isAiGenerating() {
      return this.sourceTab === 'AI出题' && this.loading
    },
    sourceTabSwitchLocked() {
      return this.sourceSwitching || this.autoImportLoading || (this.sourceTab !== '自有题库' && this.filterOptionsLoading > 0) || (!['AI出题', '自有题库'].includes(this.sourceTab) && this.loading)
    },
    motherCount() {
      return this.paperGroups.filter(group => group.mother).length
    },
    childCount() {
      return this.paperGroups.reduce(
        (count, group) => count + group.children.filter(Boolean).length,
        0
      )
    },
    hasSelectedQuestions() {
      return this.motherCount > 0 || this.childCount > 0
    },
    editingQuestionTypeCode() {
      return this.resolveQuestionTypeCode(this.editingQuestion)
    },
    editingQuestionTypeName() {
      return this.resolveQuestionTypeName(this.editingQuestion, this.editingQuestionTypeCode)
    },
    showEditingOptionEditors() {
      if (['1', '2', '8'].includes(this.editingQuestionTypeCode)) return true
      if (this.editingQuestionTypeCode) return false
      return ['optionA', 'optionB', 'optionC', 'optionD', 'optionE']
        .some(field => !this.isBlankContent(this.editingQuestion[field]))
    }
  },
  created() {
    this.initializePaperGroups()
  },
  async mounted() {
    try {
      await this.loadCurrentBase()
    } finally {
      this.sourceSwitching = false
    }
  },
  beforeDestroy() {
    this.importRevision += 1
    this.filterStateSequence += 1
    this.requestSequence += 1
    this.aiRequestSequence += 1
    this.minutesSubjectRequestSequence += 1
    this.releaseErrorImageUrls(this.questions)
    Object.values(this.bankTabSnapshots).forEach(snapshot => {
      this.releaseErrorImageUrls(snapshot.questions)
    })
  },
  beforeRouteLeave(to, from, next) {
    this.confirmAiGenerationInterruption().then(confirmed => {
      if (confirmed) next()
      else next(false)
    })
  },
  methods: {
    findBusinessSubject(business, trees, path) {
      if (!business || path.length < 2) return null
      let nodes = trees[business.id] || []
      let selected = null
      for (const value of path.slice(1)) {
        selected = nodes.find(item => item.value === value)
        if (!selected) return null
        nodes = selected.children || []
      }
      return selected && selected.leaf ? selected : null
    },
    businessTrackOptions(rows) {
      const internal = String((getAuthInfo() || {}).isInternalOrganization) === '1'
      return (Array.isArray(rows) ? rows : [])
        .filter(item => item.standardType != null && [0, 1, 2].includes(Number(item.standardType)) && (internal || Number(item.standardType) !== 2))
        .map(item => ({ id: String(item.id), value: 'business:' + item.id, label: item.name, standardType: Number(item.standardType), leaf: false }))
    },
    captureOwnFilterRequest(kind) {
      const key = 'own-' + kind
      const sequence = (this.filterRequestSequences[key] || 0) + 1
      this.filterRequestSequences[key] = sequence
      // 自有筛选上下文不包含 eduType，顶部切赛道不使联动失效。
      // 科目基础选项同时加载教材和知识点，切换筛选方式不使这批选项失效。
      // 教材、章节请求则必须核对当前联动条件，避免隐藏模式回写旧选项。
      const context = () => JSON.stringify([
        this.filterStateSequence, this.sourceTab, this.ownFilters.subjectPath,
        ...(kind === 'subject' ? [] : [this.ownFilters.bookId, this.ownFilters.level, this.ownFilterMode])
      ])
      const original = context()
      return () => this.filterRequestSequences[key] === sequence && context() === original
    },
    async loadOwnBase() {
      const revision = this.filterStateSequence
      const sequence = (this.filterRequestSequences['own-base'] || 0) + 1
      this.filterRequestSequences['own-base'] = sequence
      const [businesses, difficulties] = await Promise.allSettled([getBusinessSubjectTree(), getTopicDictItemList(TOPIC_DIFFICULTY_DICT_ID)])
      if (this.sourceTab !== '自有题库' || revision !== this.filterStateSequence || sequence !== this.filterRequestSequences['own-base']) return
      this.ownBusinessOptions = businesses.status === 'fulfilled' ? this.businessTrackOptions(businesses.value) : []
      if (businesses.status !== 'fulfilled') this.$message.warning('学段赛道加载失败，请重新加载学段')
      if (difficulties.status === 'fulfilled') this.ownOptions.difficulties = difficulties.value || []
      else this.$message.warning('难度选项加载失败，请重新选择科目重试')
    },
    async ensureOwnBusinessSubjects(business) {
      if (this.ownSubjectTrees[business.id]) return this.ownSubjectTrees[business.id]
      const revision = this.filterStateSequence
      const key = 'own-tree:' + business.id
      const sequence = (this.filterRequestSequences[key] || 0) + 1
      this.filterRequestSequences[key] = sequence
      const rows = await getBusinessSubjects(business.id)
      if (this.sourceTab !== '自有题库' || revision !== this.filterStateSequence || sequence !== this.filterRequestSequences[key]) return null
      const tree = this.normalizeBusinessSubjectTree(rows, business.value)
      this.$set(this.ownSubjectTrees, business.id, tree)
      return tree
    },
    async loadOwnSubjectNode(node, resolve) {
      const revision = this.filterStateSequence
      if (node.root) { resolve(this.ownBusinessOptions); return }
      if (node.level !== 1 || (node.children && node.children.length)) { resolve([]); return }
      const business = this.ownBusinessOptions.find(item => item.value === node.value)
      if (!business) { resolve([]); return }
      try {
        const children = await this.ensureOwnBusinessSubjects(business)
        if (children === null) { node.loading = false; return }
        node.data.leaf = false
        resolve(children)
        this.updateTaxonomyPopper('own-subject')
        if (!children.length) this.$message.warning('该学段暂无可选科目')
      } catch (error) {
        node.loading = false
        node.loaded = false
        if (this.sourceTab === '自有题库' && revision === this.filterStateSequence) this.$message.warning('科目加载失败，请重新展开学段重试')
      }
    },
    async handleOwnSubjectChange() {
      // 仅清空自有题库左侧状态，已导入的母题、子题继续保留。
      const path = [...this.ownFilters.subjectPath]
      this.filterStateSequence += 1
      this.requestSequence += 1
      this.ownFilters = { ...emptyOwnFilters(), subjectPath: path }
      this.ownOptions = { ...emptyOwnOptions(), difficulties: this.ownOptions.difficulties }
      this.loading = false
      this.releaseErrorImageUrls(this.questions)
      this.questions = []
      this.total = 0
      this.page = 1
      this.hasSearched = false
      if (!this.ownSubject) return
      const subject = this.ownSubject
      const isCurrent = this.captureOwnFilterRequest('subject')
      try {
        const first = this.ownStandardType === 1 ? getTopicBookList(subject.id)
          : this.ownStandardType === 0 ? getBusinessChapters(subject.id) : getTopicSubjectPointTree(subject.id)
        const [options, knowledge, questTypes, difficulties] = await this.waitForFilterOptions(Promise.all([
          first,
          this.ownStandardType === 1 ? getTopicKnowledgeCompulsoryList(subject.id) : Promise.resolve([]),
          subject.questType ? getTopicQuestTypeTemplates(subject.questType) : Promise.resolve([]),
          this.ownOptions.difficulties.length ? Promise.resolve(this.ownOptions.difficulties) : getTopicDictItemList(TOPIC_DIFFICULTY_DICT_ID)
        ]))
        if (!isCurrent()) return
        if (this.ownStandardType === 1) this.ownOptions.books = options || []
        else if (this.ownStandardType === 0) {
          // 通用章节 children 是知识点；章节按 parentId 还原，查询只提交所选 pointId。
          this.ownOptions.chapters = this.normalizeFlatTree((options || []).map(({ children, ...item }) => item))
        } else this.ownOptions.chapters = this.normalizeTree(options || [])
        this.ownOptions.knowledge = this.normalizeAiKnowledgeTree(knowledge)
        this.ownOptions.questTypes = questTypes || []
        this.ownOptions.difficulties = difficulties || []
      } catch (error) { if (isCurrent()) this.$message.warning('筛选条件加载失败，请重新选择科目重试') }
    },
    async handleOwnBookChange() {
      this.ownFilters.level = ''
      this.ownFilters.pointPath = []
      this.ownOptions.levels = []
      this.ownOptions.chapters = []
      const isCurrent = this.captureOwnFilterRequest('book')
      if (!this.ownSubject || !this.ownFilters.bookId || this.ownFilterMode !== 'chapter') return
      try {
        const levels = await this.waitForFilterOptions(getTopicTypeListByBook(this.ownSubject.id, this.ownFilters.bookId))
        if (isCurrent()) this.ownOptions.levels = levels || []
      } catch (error) { if (isCurrent()) this.$message.warning('年级加载失败，请重新选择教材重试') }
    },
    async loadOwnChapters() {
      this.ownFilters.pointPath = []
      this.ownOptions.chapters = []
      const isCurrent = this.captureOwnFilterRequest('chapter')
      if (!this.ownSubject || !this.ownFilters.bookId || !this.ownFilters.level || this.ownFilterMode !== 'chapter') return
      try {
        const rows = await this.waitForFilterOptions(getTopicSubjectPointCompulsoryList(this.ownSubject.id, this.ownFilters.level, this.ownFilters.bookId))
        if (isCurrent()) this.ownOptions.chapters = this.normalizeFlatTree(rows)
      } catch (error) { if (isCurrent()) this.$message.warning('章节加载失败，请重新选择年级重试') }
    },
    changeOwnMode(mode) {
      if (!['chapter', 'knowledge'].includes(mode) || this.isOwnChineseSubject || mode === this.ownFilters.mode) return
      this.filterRequestSequences['own-book'] = (this.filterRequestSequences['own-book'] || 0) + 1
      this.filterRequestSequences['own-chapter'] = (this.filterRequestSequences['own-chapter'] || 0) + 1
      this.ownFilters.mode = mode
      this.ownFilters.pointPath = []
      this.ownFilters.knowledgePath = []
      this.ownFilters.bookId = ''
      this.ownFilters.level = ''
      this.ownOptions.levels = []
      this.ownOptions.chapters = []
    },
    buildOwnQueryParams() {
      const filters = this.ownFilters
      const params = { pageNo: this.page, pageSize: this.pageSize, subjectId: this.ownSubject ? this.ownSubject.id : '', questTemplateId: filters.questType, difficulty: filters.difficulty, name: filters.name }
      if (this.ownStandardType === 0) {
        params.businessId = this.ownBusiness.id
        params.pointId = this.lastValue(filters.pointPath)
      } else if (this.ownStandardType === 2) params.treeId = this.lastValue(filters.pointPath)
      else if (this.ownStandardType === 1 && this.ownFilterMode === 'chapter') {
        params.bookId = filters.bookId
        params.typeId = filters.level
        params.pointId = this.lastValue(filters.pointPath)
      } else if (this.ownStandardType === 1) params.knowledge = this.lastValue(filters.knowledgePath)
      return this.removeEmptyParams(params)
    },
    buildOwnQuestionContext() {
      const filters = this.ownFilters
      const chapterMode = this.ownStandardType !== 1 || this.ownFilterMode === 'chapter'
      const pointId = chapterMode ? this.lastValue(filters.pointPath) : ''
      const knowledgeId = chapterMode ? '' : this.lastValue(filters.knowledgePath)
      return this.removeEmptyParams({
        businessId: this.ownBusiness ? this.ownBusiness.id : '', businessName: this.ownBusiness ? this.ownBusiness.label : '',
        subjectId: this.ownSubject ? this.ownSubject.id : '', subjectName: this.ownSubject ? this.ownSubject.label : '',
        pointId, pointName: pointId ? this.treeName(this.ownOptions.chapters, filters.pointPath) : '',
        knowledge: knowledgeId, knowledgeId, knowledgeName: knowledgeId ? this.treeName(this.ownOptions.knowledge, filters.knowledgePath) : '',
        bookId: this.ownStandardType === 1 && chapterMode ? filters.bookId : '', bookName: this.ownStandardType === 1 && chapterMode ? this.optionName(this.ownOptions.books, filters.bookId) : '',
        typeId: this.ownStandardType === 1 && chapterMode ? filters.level : '', typeName: this.ownStandardType === 1 && chapterMode ? this.optionName(this.ownOptions.levels, filters.level) : '',
        questTemplateId: filters.questType, questTemplateName: this.optionName(this.ownOptions.questTypes, filters.questType),
        questType: this.optionItem(this.ownOptions.questTypes, filters.questType).questType || '', difficulty: filters.difficulty,
        difficultyName: this.optionName(this.ownOptions.difficulties, filters.difficulty), compulsory: this.ownStandardType === 1 ? '1' : '0'
      })
    },
    restoreOwnBankSnapshot() {
      const snapshot = this.bankTabSnapshots.own
      const selected = snapshot && snapshot.businesses.find(item => item.value === snapshot.filters.subjectPath[0])
      const allowed = selected && this.ownBusinessOptions.find(item => item.id === selected.id && item.standardType === selected.standardType)
      // 权限或学段类型变化后不能恢复旧科目；重新选科目不会影响当前组卷。
      if (!snapshot || (selected && !allowed)) {
        this.$delete(this.bankTabSnapshots, 'own')
        this.ownFilters = emptyOwnFilters()
        this.ownOptions = { ...emptyOwnOptions(), difficulties: this.ownOptions.difficulties }
        this.ownSubjectTrees = {}
        this.ownSubjectPickerKey += 1
        this.questions = []
        this.total = 0
        this.page = 1
        this.hasSearched = false
        return false
      }
      this.ownFilters = this.cloneAiSnapshotValue(snapshot.filters)
      this.ownOptions = { ...this.cloneAiSnapshotValue(snapshot.options), difficulties: this.ownOptions.difficulties }
      this.ownSubjectTrees = this.cloneAiSnapshotValue(snapshot.subjectTrees)
      this.ownBusinessOptions = this.ownBusinessOptions.map(item => ({ ...item, ...(this.ownSubjectTrees[item.id] ? { children: this.ownSubjectTrees[item.id] } : {}) }))
      this.ownSubjectPickerKey += 1
      this.questions = snapshot.questions
      this.total = snapshot.total
      this.page = snapshot.page
      this.hasSearched = snapshot.hasSearched
      this.$nextTick(() => { if (this.$refs.questionList) this.$refs.questionList.scrollTop = snapshot.scrollTop })
      return true
    },
    captureAiFilterRequest(kind) {
      // 同类请求只接受最新响应；上下文不包含 eduType，切换学习赛道不会使 AI 请求失效。
      const sequence = (this.filterRequestSequences['ai-' + kind] || 0) + 1
      this.filterRequestSequences['ai-' + kind] = sequence
      const context = () => JSON.stringify([
        this.filterStateSequence, this.sourceTab, this.aiFilters.subjectPath,
        this.aiFilters.bookId, this.aiFilters.level,
        // 听记开关只影响知识点，不能使正在加载的教材或章节选项失效。
        ...(kind === 'knowledge' ? [this.useAiMinutesContent, this.aiFilters.pointPath, this.aiFilters.chapterSelection] : [])
      ])
      const original = context()
      return () => this.filterRequestSequences['ai-' + kind] === sequence && original === context()
    },
    flattenAiTaxonomy(nodes, path = []) {
      // 完整路径用于区分同名节点；id: 前缀用于区分已有选项与自行输入的名称。
      return (nodes || []).flatMap(node => {
        const labels = [...path, node.label]
        return [{ value: 'id:' + node.value, id: node.value, name: node.label, label: labels.join(' / ') }, ...this.flattenAiTaxonomy(node.children, labels)]
      })
    },
    normalizeBusinessSubjectTree(rows, prefix) {
      // 级联值带学段及祖先路径，避免不同学段的重复 ID 冲突；接口请求仍使用原始 id。
      return (Array.isArray(rows) ? rows : []).map(item => {
        const value = prefix + '/' + encodeURIComponent(String(item.id))
        const children = this.normalizeBusinessSubjectTree(item.subjectList || [], value)
        return { ...item, id: String(item.id), value, label: item.name || item.otherName || '', leaf: !children.length, ...(children.length ? { children } : {}) }
      })
    },
    normalizeAiKnowledgeTree(rows) {
      // 部分接口返回空 children 的扁平列表，此时需按 parentId 还原层级。
      const list = Array.isArray(rows) ? rows : []
      return list.some(item => Array.isArray(item.children) && item.children.length)
        ? this.normalizeTree(list)
        : this.normalizeFlatTree(list)
    },
    mergeAiKnowledgeTrees(trees) {
      const nodes = new Map()
      const merged = []
      const append = (items, target) => {
        for (const item of items) {
          let node = nodes.get(item.value)
          if (!node) {
            node = { ...item, children: [] }
            nodes.set(item.value, node)
            target.push(node)
          }
          append(item.children || [], node.children)
        }
      }
      trees.forEach(tree => append(tree, merged))
      // Element UI 将存在 children 数组的节点视为可展开，叶节点不能保留空数组。
      nodes.forEach(node => { if (!node.children.length) delete node.children })
      return merged
    },
    async loadAiBase() {
      const revision = this.filterStateSequence
      const sequence = (this.filterRequestSequences['ai-base'] || 0) + 1
      this.filterRequestSequences['ai-base'] = sequence
      const isCurrent = () => this.sourceTab === 'AI出题' && revision === this.filterStateSequence && sequence === this.filterRequestSequences['ai-base']
      const [businesses, difficulties] = await Promise.allSettled([
        getBusinessSubjectTree(), getTopicDictItemList(TOPIC_DIFFICULTY_DICT_ID)
      ])
      if (!isCurrent()) return
      if (businesses.status === 'fulfilled') {
        this.aiBusinessOptions = this.businessTrackOptions(businesses.value)
      } else this.$message.warning('学段赛道加载失败，请重试')
      if (difficulties.status === 'fulfilled') this.aiOptions.difficulties = difficulties.value || []
      else this.$message.warning('难度选项加载失败，请重试')
    },
    async ensureAiBusinessSubjects(business) {
      if (this.aiSubjectTrees[business.id]) return this.aiSubjectTrees[business.id]
      const revision = this.filterStateSequence
      const rows = await getBusinessSubjects(business.id)
      if (this.sourceTab !== 'AI出题' || revision !== this.filterStateSequence) return null
      const tree = this.normalizeBusinessSubjectTree(rows, business.value)
      this.$set(this.aiSubjectTrees, business.id, tree)
      return tree
    },
    async loadAiSubjectNode(node, resolve) {
      const revision = this.filterStateSequence
      if (node.root) { resolve(this.aiBusinessOptions); return }
      // 只在展开学段时请求一次完整科目树，地区、类别等下级节点使用已返回的数据。
      if (node.level !== 1 || (node.children && node.children.length)) { resolve([]); return }
      const business = this.aiBusinessOptions.find(item => item.value === node.value)
      if (!business) { resolve([]); return }
      try {
        const children = await this.ensureAiBusinessSubjects(business)
        if (children === null) { node.loading = false; return }
        // 空学段不能变成可选择的科目。
        node.data.leaf = false
        resolve(children)
        this.updateTaxonomyPopper('ai-subject')
        if (!children.length) this.$message.warning('该学段暂无可选科目')
      } catch (error) {
        node.loading = false
        node.loaded = false
        if (this.sourceTab === 'AI出题' && revision === this.filterStateSequence) this.$message.warning('科目加载失败，请重新展开学段重试')
      }
    },
    async handleAiSubjectChange() {
      // 切换科目清空联动条件与生成结果，使旧请求失效；已导入的组卷题目继续保留。
      const path = [...this.aiFilters.subjectPath]
      this.syncAiExportTitle(this.aiSubject ? this.aiSubject.label : '')
      this.aiFilters = { ...emptyAiFilters(), subjectPath: path, chapterSelection: this.useAiMinutesContent ? [] : '' }
      this.aiOptions = { ...emptyAiOptions(), difficulties: this.aiOptions.difficulties }
      this.aiRequestSequence += 1
      this.minutesSubjectRequestSequence += 1
      this.loading = false
      this.aiQuestionRows = []
      this.aiExportSelectedKeys = []
      this.aiExportFileType = ''
      this.questions = []
      this.total = 0
      this.resetAiGenerationMeta()
      if (!this.aiSubject) return
      const subjectId = this.aiSubject.id
      const standardType = this.aiStandardType
      const isCurrent = this.captureAiFilterRequest('subject')
      try {
        // K9K12 加载教材与知识点；通用并行加载章节与知识点；专升本知识点等待章节选择。
        const tasks = standardType === 1
          ? [getTopicBookList(subjectId), getTopicKnowledgeCompulsoryList(subjectId)]
          : standardType === 0
            ? [getBusinessChapters(subjectId), getBusinessKnowledgePoints(subjectId)]
            : [getTopicSubjectPointList(subjectId), Promise.resolve([])]
        const [first, knowledge] = await this.waitForFilterOptions(Promise.all(tasks))
        if (!isCurrent()) return
        if (standardType === 1) this.aiOptions.books = first || []
        else {
          // 章节接口 children 是知识点，按 parentId 还原章节层级。
          this.aiOptions.chapters = this.normalizeFlatTree((first || []).map(({ children, ...item }) => item))
        }
        this.aiOptions.knowledge = this.normalizeAiKnowledgeTree(knowledge)
      } catch (error) {
        if (isCurrent()) this.$message.warning('出题条件加载失败，请重新选择科目重试')
      }
    },
    async handleAiBookChange() {
      this.aiFilters.level = ''
      this.aiFilters.pointPath = []
      this.aiOptions.levels = []
      this.aiOptions.chapters = []
      const isCurrent = this.captureAiFilterRequest('book')
      if (!this.aiSubject || !this.aiFilters.bookId) return
      try {
        const levels = await this.waitForFilterOptions(getTopicTypeListByBook(this.aiSubject.id, this.aiFilters.bookId))
        if (isCurrent()) this.aiOptions.levels = levels || []
      } catch (error) { if (isCurrent()) this.$message.warning('年级加载失败，请重新选择教材重试') }
    },
    async loadAiChapters() {
      this.aiFilters.pointPath = []
      this.aiOptions.chapters = []
      const isCurrent = this.captureAiFilterRequest('chapter')
      if (!this.aiSubject || !this.aiFilters.bookId || !this.aiFilters.level) return
      try {
        const rows = await this.waitForFilterOptions(getTopicSubjectPointCompulsoryList(this.aiSubject.id, this.aiFilters.level, this.aiFilters.bookId))
        if (isCurrent()) this.aiOptions.chapters = this.normalizeFlatTree(rows)
      } catch (error) { if (isCurrent()) this.$message.warning('章节加载失败，请重新选择年级重试') }
    },
    async handleAiChapterChange() {
      if (this.aiStandardType !== 2) return
      this.aiFilters.knowledgePath = []
      this.aiOptions.knowledge = []
      const chapterIds = [...new Set(this.aiSelectedChapters().map(item => item.id).filter(Boolean))]
      const isCurrent = this.captureAiFilterRequest('knowledge')
      if (!this.aiSubject || !chapterIds.length) return
      try {
        const lists = await this.waitForFilterOptions(Promise.all(chapterIds.map(id => getTopicKnowledgeList(this.aiSubject.id, id))))
        if (isCurrent()) this.aiOptions.knowledge = this.mergeAiKnowledgeTrees(lists.map(rows => this.normalizeAiKnowledgeTree(rows)))
      } catch (error) { if (isCurrent()) this.$message.warning('知识点加载失败，请重新选择章节重试') }
    },
    aiSelectedChapters() {
      if (this.aiStandardType === 0) {
        const values = this.useAiMinutesContent ? this.aiFilters.chapterSelection : [this.aiFilters.chapterSelection]
        return (Array.isArray(values) ? values : []).filter(Boolean).map(value => this.aiGeneralChapters.find(item => item.value === value) || { id: '', name: String(value).trim() })
      }
      const paths = this.useAiMinutesContent ? this.aiFilters.pointPath : [this.aiFilters.pointPath]
      return (paths || []).filter(path => Array.isArray(path) && path.length).map(path => ({ id: this.lastValue(path), name: this.treeName(this.aiOptions.chapters, path) }))
    },
    aiSelectedKnowledge() {
      if (this.aiStandardType === 0) return this.aiGeneralKnowledge.find(item => item.value === this.aiFilters.knowledgeSelection) || { id: '', name: String(this.aiFilters.knowledgeSelection || '').trim() }
      return { id: this.lastValue(this.aiFilters.knowledgePath), name: this.treeName(this.aiOptions.knowledge, this.aiFilters.knowledgePath) }
    },
    captureFilterRequest(kind) {
      // 同类请求只接收最新响应，并检查筛选上下文，避免旧选项覆盖新选择。
      const sequence = (this.filterRequestSequences[kind] || 0) + 1
      this.filterRequestSequences[kind] = sequence
      // 云端上下文不包含当前赛道，因此单独切赛道不会使云端联动失效。
      const context = () => JSON.stringify([
        this.filterStateSequence, this.sourceTab,
        this.sourceTab === '云端题库' ? 'cloud' : this.eduType,
        this.cloudSubjectPath, this.zsb.subjectId, this.k12.subjectPath,
        this.k12.bookId, this.k12.level
      ])
      const originalContext = context()
      return () => this.filterRequestSequences[kind] === sequence && context() === originalContext
    },
    questionEduType(question = {}) {
      // 已选试题可混合两类科目，后续操作优先使用题目自身类型。
      // 缺少内部标记时兼容接口的 compulsory，最后才回退到当前筛选类型。
      if (question._questionEduType) return question._questionEduType
      if (String(question.compulsory) === '0') return '专升本'
      if (String(question.compulsory) === '1') return 'K9K12'
      return this.activeFilterEduType
    },
    buildCloudQuestionContext() {
      const isZsb = this.activeFilterEduType === '专升本'
      const filters = isZsb ? this.zsb : this.k12
      const subjectId = isZsb ? filters.subjectId : this.lastValue(filters.subjectPath)
      const subject = isZsb ? this.optionItem(this.subjectOptions, subjectId) : this.findK12Subject(subjectId)
      const template = this.optionItem(isZsb ? this.questTypeOptions : this.k12QuestTypeOptions, filters.questType)
      return this.removeEmptyParams({
        subjectId,
        subjectName: subject.otherName || subject.name || '',
        difficulty: filters.difficulty,
        difficultyName: this.optionName(this.difficultyOptions, filters.difficulty),
        questTemplateId: filters.questType,
        questTemplateName: template.name || '',
        questType: template.questType || '',
        pointId: this.lastValue(filters.pointPath),
        pointName: this.treeName(isZsb ? this.pointOptions : this.k12PointOptions, filters.pointPath),
        knowledge: this.lastValue(filters.knowledgePath),
        knowledgeName: this.treeName(isZsb ? this.knowledgeOptions : this.k12KnowledgeOptions, filters.knowledgePath),
        typeId: isZsb ? '' : filters.level,
        typeName: isZsb ? '' : this.optionName(this.levelOptions, filters.level),
        bookId: isZsb ? '' : filters.bookId,
        bookName: isZsb ? '' : this.optionName(this.bookOptions, filters.bookId),
        compulsory: isZsb ? '0' : '1'
      })
    },
    withQuestionContext(question, context, eduType) {
      // 类型和查询上下文随题目复制、编辑保留，提交接口时过滤这些内部字段。
      const result = { ...question, _questionEduType: eduType }
      if (context) {
        // 接口的别名字段优先于查询条件中的回退值。
        const aliases = { pointId: 'treeId', knowledge: 'knowledgeId', difficulty: 'difficultyId', questTemplateName: 'questTypeName' }
        Object.keys(aliases).forEach(field => {
          if (!result[field] && result[aliases[field]]) result[field] = result[aliases[field]]
        })
        result._questionContext = { ...context }
        Object.keys(context).forEach(field => {
          if (result[field] === undefined || result[field] === null || result[field] === '') result[field] = context[field]
        })
      }
      return result
    },
    async handleCloudSubjectChange(path) {
      // 更换科目使旧联动和查询失效，只清空左侧筛选与结果，保留右侧已选试题。
      this.cloudSubjectPath = Array.isArray(path) ? path : []
      this.filterStateSequence += 1
      this.requestSequence += 1
      this.loading = false
      this.zsb = emptyZsb()
      this.k12 = emptyK12()
      const dependentFields = ['pointOptions', 'knowledgeOptions', 'questTypeOptions', 'bookOptions',
        'levelOptions', 'k12PointOptions', 'k12KnowledgeOptions', 'k12QuestTypeOptions']
      dependentFields.forEach(field => { this[field] = [] })
      this.releaseErrorImageUrls(this.questions)
      this.questions = []
      this.total = 0
      this.hasSearched = false
      this.page = 1
      this.draggingQuestion = null
      const group = this.cloudSubjectOptions.find(item => item.value === this.cloudSubjectPath[0])
      const isZsb = group && group.eduType === '专升本'
      const category = isZsb
        ? (group.children || []).find(item => item.value === this.cloudSubjectPath[1])
        : group
      const subject = category && this.cloudSubjectPath.length === (isZsb ? 3 : 2)
        && (category.children || []).find(item => item.value === this.lastValue(this.cloudSubjectPath))
      if (!subject) return
      // 去掉显示树的前缀和专升本根节点，还原现有联动方法需要的原始两级路径。
      const originalPath = [category.originalValue, subject.value]
      try {
        if (group.eduType === '专升本') {
          this.zsb.subjectPath = originalPath
          await this.handleZsbSubjectPathChange(originalPath)
        } else {
          this.k12.subjectPath = originalPath
          await this.handleK12SubjectChange(originalPath)
        }
      } catch (error) {
        this.$message.warning('题库筛选条件加载失败，请稍后重试')
      }
    },
    updateTaxonomyPopper(popperKey) {
      this.$nextTick(() => {
        const cascader = this.$refs[popperKey]
        // 菜单宽度由内容决定，展开或收起后只重新计算弹层位置。
        if (cascader && typeof cascader.updatePopper === 'function') cascader.updatePopper()
      })
    },
    handleTaxonomyVisibleChange(visible, popperKey) {
      if (visible) this.updateTaxonomyPopper(popperKey)
    },
    handleTaxonomyLabelClick(node, event) {
      if (node.isDisabled || node.loading) return
      const row = event.currentTarget.closest('.el-cascader-node')
      const input = row && row.querySelector('input[type="radio"], input[type="checkbox"]')
      // 复用组件原有的选择事件，保持单选、多选及父子联动行为一致。
      if (input && !input.disabled) input.click()
    },
    preventQuestionListScroll(event) {
      if (this.isAiGenerating && event && event.cancelable) event.preventDefault()
    },
    interruptAiGeneration() {
      this.aiRequestSequence += 1
      this.loading = false
    },
    async confirmAiGenerationInterruption() {
      if (!this.isAiGenerating) return true
      try {
        await this.$confirm('确认中断当前 AI 出题操作吗？', '提示', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        })
        this.interruptAiGeneration()
        return true
      } catch (error) {
        return false
      }
    },
    async handleBack() {
      const confirmed = await this.confirmAiGenerationInterruption()
      if (!confirmed) return

      if (this.$route && this.$route.name === 'create-practice') {
        clearPracticeRouteConfig()
        this.$router.back()
        return
      }

      this.$emit('back')
    },
    initializePaperGroups() {
      this.paperGroups = Array.from(
        { length: this.motherLimit },
        (_, index) => createPaperGroup(index + 1)
      )
      this.activeTarget = { type: 'mother', groupIndex: 0, childIndex: -1 }
    },
    cachePaperTab() {
      this.$set(this.paperTabSnapshots, this.eduType, {
        paperGroups: this.paperGroups,
        activeTarget: { ...this.activeTarget },
        matchQuestType: this.matchQuestType,
        allowRepeat: this.allowRepeat
      })
    },
    restorePaperTab(eduType) {
      const snapshot = this.paperTabSnapshots[eduType]
      if (snapshot) {
        this.paperGroups = snapshot.paperGroups
        this.activeTarget = { ...snapshot.activeTarget }
        this.matchQuestType = snapshot.matchQuestType
        this.allowRepeat = Boolean(snapshot.allowRepeat)
        return
      }

      this.paperGroups = []
      this.matchQuestType = false
      this.allowRepeat = false
      this.initializePaperGroups()
    },
    normalizeAreaBusiness(list) {
      return (list || []).map(area => ({
        value: String(area.id ?? ''),
        label: area.name || '',
        children: (area.businessList || []).map(business => ({
          value: String(business.id ?? ''),
          label: business.name || ''
        }))
      }))
    },
    getTaxonomyFilterOptions(options) {
      if (this.sourceTab !== '云端题库') return options
      // 仅裁剪搜索条件的选项副本，保留完整的章节和知识点数据。
      return (options || []).map(option => {
        const node = { ...option }
        if (node.children && node.children.length) {
          node.children = node.children.map(child => {
            const leaf = { ...child }
            delete leaf.children
            return leaf
          })
        } else {
          delete node.children
        }
        return node
      })
    },
    normalizeTree(list) {
      return (list || []).map(item => {
        const isPrimitive = typeof item !== 'object'
        const children = isPrimitive
          ? []
          : item.children || item.childList || item.childrenList || item.childs || item.sonList || item.subList || []
        const node = {
          value: String(isPrimitive ? item : (item.id ?? item.value ?? item.pointId ?? item.subjectPointId ?? '')),
          label: isPrimitive ? String(item) : (item.name || item.title || item.label || item.pointName || item.chapterName || ''),
          children: this.normalizeTree(children)
        }
        if (!node.children.length) delete node.children
        return node
      })
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
        if (parent) parent.children.push(node)
        else roots.push(node)
      })
      const cleanup = nodes => nodes.map(node => {
        const result = { value: node.value, label: node.label }
        if (node.children.length) result.children = cleanup(node.children)
        return result
      })
      return cleanup(roots)
    },
    normalizeKnowledgeTree(list) {
      const rows = Array.isArray(list) ? list : []
      const hasChildren = rows.some(item => item && (
        item.children || item.childList || item.childrenList || item.childs || item.sonList || item.subList
      ))
      return hasChildren ? this.normalizeTree(rows) : this.normalizeFlatTree(rows)
    },
    lastValue(value) {
      return value && value.length ? value[value.length - 1] : ''
    },
        removeEmptyParams(params) {
      return Object.keys(params).reduce((result, key) => {
        if (params[key] !== '') result[key] = params[key]
        return result
      }, {})
    },
    async loadCurrentBase() {
      try {
        if (this.sourceTab === 'AI出题') {
          await this.loadAiBase()
        } else if (this.sourceTab === '自有题库') {
          await this.loadOwnBase()
        } else if (this.sourceTab === '云端题库') {
          await Promise.all([
            this.loadDifficulty(), this.loadK12Base(),
            ...(this.eduTypes.includes('专升本') ? [this.loadZsbSubjectBase()] : [])
          ])
        } else if (this.eduType === '专升本') {
          await Promise.all([
            this.loadDifficulty(),
            this.usesZsbSubjectCascader ? this.loadZsbSubjectBase() : this.loadZsbAreas()
          ])
        } else {
          await Promise.all([this.loadDifficulty(), this.loadK12Base()])
        }
      } catch (error) {
        this.$message.warning('题库筛选条件加载失败，请稍后重试')
      }
    },
    async waitForFilterOptions(request) {
      this.filterOptionsLoading += 1
      try {
        return await request
      } finally {
        this.filterOptionsLoading -= 1
      }
    },
    async loadDifficulty() {
      const isCurrent = this.captureFilterRequest('difficulty')
      const options = (this.usesZsbTopicOptions || this.usesK12TopicOptions)
        ? await getTopicDictItemList(TOPIC_DIFFICULTY_DICT_ID)
        : await getTeachingCloudOptions('/getDictList', { id: TOPIC_DIFFICULTY_DICT_ID })
      if (isCurrent()) this.difficultyOptions = options
    },
    async loadZsbSubjectBase() {
      const isCurrent = this.captureFilterRequest('zsbBase')
      const groups = this.usesZsbTopicOptions
        ? await getTopicUnCompulsorySubjectList()
        : await getTeachingCloudOptions('/getUnCompulsorySubjectList')
      if (!isCurrent()) return
      this.zsbSubjectOptions = normalizeZsbSubjectOptions(groups)
      this.subjectOptions = this.zsbSubjectOptions.flatMap(group => group.children.map(subject => ({
        ...subject,
        name: subject.name || subject.label
      })))
    },
    async handleZsbSubjectPathChange(path) {
      const subject = getZsbSubject(this.zsbSubjectOptions, path)
      this.zsb.subjectId = subject ? subject.value : ''
      await this.handleZsbSubjectChange(this.zsb.subjectId)
    },
    async loadZsbAreas() {
      const rows = this.usesZsbTopicOptions
        ? await getTopicAreaBusiness()
        : await getTeachingCloudOptions('/getAreaBusiness')
      this.areaOptions = this.usesZsbTopicOptions
        ? this.normalizeAreaBusiness(rows)
        : this.normalizeTree(rows)
    },
    async handleAreaChange(value) {
      this.zsb.typeId = ''
      this.zsb.subjectId = ''
      this.zsb.pointPath = []
      this.typeOptions = []
      this.subjectOptions = []
      this.pointOptions = []
      this.questTypeOptions = []
      if (value && value.length > 1) {
        this.typeOptions = this.usesZsbTopicOptions
          ? await getTopicTypeListByBusiness(value[1])
          : await getTeachingCloudOptions('/getTypeList', { businessId: value[1] })
      }
    },
    async loadZsbSubjects(value) {
      this.zsb.subjectId = ''
      this.zsb.pointPath = []
      this.subjectOptions = value
        ? this.usesZsbTopicOptions
          ? await getTopicSubjectListByType(value)
          : await getTeachingCloudOptions('/getSubjectList', { typeId: value })
        : []
      this.pointOptions = []
      this.questTypeOptions = []
    },
    async handleZsbSubjectChange(value) {
      this.zsb.pointPath = []
      this.zsb.knowledgePath = []
      this.zsb.questType = ''
      this.pointOptions = []
      this.knowledgeOptions = []
      this.questTypeOptions = []
      const isCurrent = this.captureFilterRequest('subject')
      if (!value) return
      const subject = this.subjectOptions.find(item => String(item.id) === String(value)) || {}
      const [points, questTypes] = await this.waitForFilterOptions(Promise.all([
        this.eduType === '专升本' && this.sourceTab === '自有题库'
          ? getTopicSubjectPointTree(value)
          : this.usesZsbTopicOptions
            ? getTopicSubjectPointList(value)
            : getTeachingCloudOptions('/getSubjectPointTree', { subjectId: value }),
        this.sourceTab !== 'AI出题' && subject.questType
          ? this.usesZsbTopicOptions
            ? getTopicQuestTypeTemplates(subject.questType)
            : getTeachingCloudOptions('/getQuestTypeTemplate', { id: subject.questType })
          : Promise.resolve([])
      ]))
      if (!isCurrent()) return
      this.pointOptions = this.normalizeTree(points)
      this.knowledgeOptions = []
      this.questTypeOptions = questTypes
    },
    async handleZsbPointChange(value) {
      this.zsb.knowledgePath = []
      this.knowledgeOptions = []
      if (this.eduType !== '专升本' || this.sourceTab !== 'AI出题' || this.useAiMinutesContent) return
      const pointId = this.lastValue(value)
      if (!this.zsb.subjectId || !pointId) return
      const isCurrent = this.captureFilterRequest('knowledge')
      const knowledge = await this.waitForFilterOptions(getTopicKnowledgeList(this.zsb.subjectId, pointId))
      if (isCurrent() && this.lastValue(this.zsb.pointPath) === pointId) {
        this.knowledgeOptions = this.normalizeKnowledgeTree(knowledge)
      }
    },
    async loadK12Base() {
      const isCurrent = this.captureFilterRequest('k12Base')
      const groups = this.usesK12TopicOptions
        ? await getTopicCompulsorySubjectList()
        : await getTeachingCloudOptions('/getCompulsorySubjectList')
      if (!isCurrent()) return
      this.k12SubjectGroups = groups || []
      this.k12SubjectRaw = (groups || []).flatMap(group => (
        group.subjectList || group.children || group.childList || []
      ))
      this.k12SubjectOptions = (groups || []).map(group => ({
        value: String(group.name),
        label: group.name,
        children: (group.subjectList || group.children || group.childList || []).map(subject => ({
          value: String(subject.id),
          label: subject.otherName || subject.name
        }))
      }))
    },
    findK12Subject(subjectId) {
      return this.k12SubjectRaw.find(item => String(item.id) === String(subjectId)) || {}
    },
    optionItem(list, value) {
      return (list || []).find(option => String(option.id) === String(value)) || {}
    },
    optionName(list, value) {
      const item = this.optionItem(list, value)
      return item.name || ''
    },
    treeName(list, path) {
      let nodes = list
      let name = ''
      for (const value of path || []) {
        const node = (nodes || []).find(item => String(item.value) === String(value))
        if (!node) break
        name = node.label
        nodes = node.children
      }
      return name
    },
    treeSelectionName(list, selection) {
      if (!Array.isArray(selection) || !selection.length) return ''
      const paths = Array.isArray(selection[0]) ? selection : [selection]
      return [...new Set(paths.map(path => this.treeName(list, path)).filter(Boolean))].join('、')
    },
    k12StageName(subjectId) {
      const group = this.k12SubjectGroups.find(item => {
        const subjects = item.subjectList || item.children || item.childList || []
        return subjects.some(subject => String(subject.id) === String(subjectId))
      })
      return group ? group.name || '' : ''
    },
    buildAiGenerationDetails() {
      return {
        businessId: this.aiBusiness ? this.aiBusiness.id : '',
        stageName: this.aiBusiness ? this.aiBusiness.label : '',
        subjectId: this.aiSubject ? this.aiSubject.id : '',
        subjectName: this.aiSubject ? this.aiSubject.label : '',
        bookId: this.aiStandardType === 1 ? this.aiFilters.bookId : '',
        typeId: this.aiStandardType === 1 ? this.aiFilters.level : '',
        pointId: this.aiSelectedChapters().length === 1 ? this.aiSelectedChapters()[0].id : '',
        knowledgeId: this.aiSelectedKnowledge().id,
        questTemplateId: this.aiFilters.questType,
        difficultyId: this.aiFilters.difficulty,
        difficultyName: this.optionName(this.aiOptions.difficulties, this.aiFilters.difficulty),
        bookName: this.aiStandardType === 1 ? this.optionName(this.aiOptions.books, this.aiFilters.bookId) : '',
        gradeName: this.aiStandardType === 1 ? this.optionName(this.aiOptions.levels, this.aiFilters.level) : '',
        chapterName: this.aiSelectedChapters().map(item => item.name).join('、'),
        knowledgeName: this.aiSelectedKnowledge().name
      }
    },
    buildAiQuestionContext(question, details) {
      // 优先保留题目自身信息，缺失字段用生成时的条件补齐，避免后续切换科目影响编辑和发布。
      const result = { ...question }
      const fallback = { businessId: details.businessId, subjectId: details.subjectId, subjectName: details.subjectName, stageName: details.stageName, bookId: details.bookId, bookName: details.bookName, typeId: details.typeId, typeName: details.gradeName, pointId: details.pointId, knowledge: details.knowledgeId, knowledgeId: details.knowledgeId, pointName: details.chapterName, knowledgeName: details.knowledgeName, questTemplateId: details.questTemplateId, difficulty: details.difficultyId, difficultyId: details.difficultyId, difficultyName: details.difficultyName }
      Object.keys(fallback).forEach(key => { if (!result[key]) result[key] = fallback[key] })
      return result
    },
    aiQuestionDetails(question) {
      const details = question.generationDetails || {}
      const value = (...values) => values.find(item => item !== undefined && item !== null && String(item).trim()) || '—'
      return [
        { label: '学段', value: value(question.stageName, details.stageName) },
        { label: '科目', value: value(question.subjectName, details.subjectName) },
        { label: '教材版本', value: value(question.bookName, details.bookName) },
        { label: '年级', value: value(question.gradeName, question.typeName, details.gradeName) },
        { label: '章节', value: value(question.chapterName, question.pointName, details.chapterName) },
        { label: '知识点', value: value(question.knowledgeName, details.knowledgeName) }
      ]
    },
    aiQuestionDetailsZsb(question) {
      return this.aiQuestionDetails(question).filter(item => !['教材版本', '年级'].includes(item.label))
    },
    async handleK12SubjectChange(value) {
      const subjectId = this.lastValue(value)
            if (this.sourceTab !== 'AI出题' && this.isK12ChineseSubject) {
        this.k12.mode = 'knowledge'
      }
      this.k12.bookId = ''
      this.k12.level = ''
      this.k12.pointPath = []
      this.k12.knowledgePath = []
      this.k12.questType = ''
      this.bookOptions = []
      this.levelOptions = []
      this.k12PointOptions = []
      this.k12KnowledgeOptions = []
      this.k12QuestTypeOptions = []
      const isCurrent = this.captureFilterRequest('subject')
      if (!subjectId) return
      const subject = this.findK12Subject(subjectId)
      const [books, knowledge, questTypes] = await this.waitForFilterOptions(Promise.all([
        this.usesK12TopicOptions
          ? getTopicBookList(subjectId)
          : getTeachingCloudOptions('/getBookList', { subjectId }),
        this.usesK12TopicOptions
          ? getTopicKnowledgeCompulsoryList(subjectId)
          : getTeachingCloudOptions('/getKnowledgeCompulsoryList', { subjectId }),
        this.sourceTab !== 'AI出题' && subject.questType
          ? this.usesK12TopicOptions
            ? getTopicQuestTypeTemplates(subject.questType)
            : getTeachingCloudOptions('/getQuestTypeTemplate', { id: subject.questType })
          : Promise.resolve([])
      ]))
      if (!isCurrent()) return
      this.bookOptions = books
      this.k12KnowledgeOptions = this.normalizeFlatTree(knowledge)
      this.k12QuestTypeOptions = questTypes
    },
    async handleK12BookChange(bookId) {
      this.k12.pointPath = []
      this.k12PointOptions = []
      if (this.sourceTab === '云端题库' || this.usesK12TopicOptions) {
        this.k12.level = ''
        this.levelOptions = []
        const subjectId = this.lastValue(this.k12.subjectPath)
        const isCurrent = this.captureFilterRequest('book')
        const levels = subjectId && bookId
          ? await this.waitForFilterOptions(this.sourceTab === '云端题库'
            ? getTeachingCloudOptions('/getTypeByBook', { subjectId, bookId })
            : getTopicTypeListByBook(subjectId, bookId))
          : []
        if (!isCurrent()) return
        this.levelOptions = levels
      }
      await this.loadK12Points()
    },
    async handleMinutesContentChange(useMinutesContent) {
      this.aiFilters.pointPath = []
      this.aiFilters.chapterSelection = useMinutesContent ? [] : ''
      this.aiFilters.knowledgePath = []
      this.aiFilters.knowledgeSelection = ''
      if (this.aiStandardType === 2) this.aiOptions.knowledge = []
      this.minutesSubjectRequestSequence += 1
      this.resetAiGenerationMeta()
      if (useMinutesContent && !this.hasAiSubjectSelection()) await this.prefillAiMinutesSubject()
    },
    hasAiSubjectSelection() {
      return Boolean(this.aiSubject)
    },
    async clearAiMinutesSubject() {
      this.aiFilters.subjectPath = []
      await this.handleAiSubjectChange()
    },
    async prefillAiMinutesSubject() {
      if (!this.useAiMinutesContent || this.hasAiSubjectSelection()) return
      const authInfo = getAuthInfo() || {}
      const minutesId = String(authInfo.t1Id || authInfo.liveId || '').trim()
      if (!minutesId) return
      let requestId = ++this.minutesSubjectRequestSequence
      const previousPath = JSON.stringify(this.aiFilters.subjectPath)
      const isCurrent = () => requestId === this.minutesSubjectRequestSequence && this.sourceTab === 'AI出题' && this.useAiMinutesContent
      try {
        const info = await getMinutesSubject(minutesId)
        if (!isCurrent() || this.hasAiSubjectSelection() || previousPath !== JSON.stringify(this.aiFilters.subjectPath)) return
        const subjectId = String(info && info.subjectId || '').trim()
        const businessId = String(info && info.businessId || '').trim()
        const candidates = this.aiBusinessOptions.filter(item => businessId ? item.id === businessId : info && info.stage && item.label === info.stage)
        if (!subjectId || subjectId === '-1' || candidates.length !== 1) {
          this.$message.warning('听记科目无法匹配，请手动选择学段和科目')
          return
        }
        const business = candidates[0]
        const tree = await this.ensureAiBusinessSubjects(business)
        if (!isCurrent() || !tree || previousPath !== JSON.stringify(this.aiFilters.subjectPath)) return
        // 同一学段中也可能有重复科目 ID，只有唯一叶节点匹配才自动回显。
        const matches = []
        const find = (nodes, path) => nodes.forEach(node => {
          const current = [...path, node.value]
          if (node.leaf && node.id === subjectId) matches.push(current)
          if (node.children) find(node.children, current)
        })
        find(tree, [business.value])
        if (matches.length !== 1) {
          this.$message.warning('听记科目无法匹配，请手动选择学段和科目')
          return
        }
        // 用已加载树重建级联器，保证回显路径能够解析。
        this.aiBusinessOptions = this.aiBusinessOptions.map(item => ({ ...item, ...(this.aiSubjectTrees[item.id] ? { children: this.aiSubjectTrees[item.id] } : {}) }))
        this.aiSubjectPickerKey += 1
        this.aiFilters.subjectPath = matches[0]
        const loading = this.handleAiSubjectChange()
        requestId = this.minutesSubjectRequestSequence
        await loading
        if (!isCurrent() || JSON.stringify(this.aiFilters.subjectPath) !== JSON.stringify(matches[0])) return
        const firstBook = this.aiOptions.books[0]
        if (this.aiStandardType === 1 && firstBook && firstBook.id != null) {
          this.aiFilters.bookId = String(firstBook.id)
          await this.handleAiBookChange()
        }
      } catch (error) {
        if (isCurrent()) this.$message.warning('听记科目获取失败，请手动选择学段和科目')
      }
    },
    async loadK12Points() {
      const subjectId = this.lastValue(this.k12.subjectPath)
      this.k12.pointPath = []
      this.k12PointOptions = []
      const isCurrent = this.captureFilterRequest('point')
      if (!subjectId || !this.k12.bookId || !this.k12.level) return
      const rows = await this.waitForFilterOptions(this.usesK12TopicOptions
        ? getTopicSubjectPointCompulsoryList(subjectId, this.k12.level, this.k12.bookId)
        : getTeachingCloudOptions('/getSubjectPointCompulsoryList', {
          subjectId,
          bookId: this.k12.bookId,
          level: this.k12.level
        }))
      if (isCurrent()) this.k12PointOptions = this.normalizeFlatTree(rows)
    },
    changeK12Mode(mode) {
      this.filterRequestSequences.point = (this.filterRequestSequences.point || 0) + 1
      this.k12.mode = mode
      this.k12.pointPath = []
      this.k12.knowledgePath = []
    },
    changeEduType(type) {
      if (!this.eduTypes.includes(type) || type === this.eduType || this.sourceTabSwitchLocked) return
      if (['AI出题', '自有题库'].includes(this.sourceTab)) {
        // 只更新顶部选择，不进入清理条件、取消请求或切换组卷的流程。
        this.eduType = type
        return
      }
      return this.switchQuestionTab(type, this.sourceTab)
    },
    changeSource(source) {
      if (!this.sourceTabs.includes(source) || source === this.sourceTab || this.sourceTabSwitchLocked) return
      this.filtersCollapsed = false
      return this.switchQuestionTab(this.eduType, source)
    },
    bankTabKey() {
      // 三种来源分别保存最近一次条件与结果，不按顶部学习赛道拆分。
      if (this.sourceTab === '云端题库') return 'cloud'
      if (this.sourceTab === 'AI出题') return 'ai'
      return 'own'
    },
    cacheBankTab() {
      if (this.sourceTab === 'AI出题') return
      if (this.sourceTab === '自有题库') {
        this.$set(this.bankTabSnapshots, 'own', {
          filters: this.cloneAiSnapshotValue(this.ownFilters), options: this.cloneAiSnapshotValue(this.ownOptions),
          businesses: this.cloneAiSnapshotValue(this.ownBusinessOptions), subjectTrees: this.cloneAiSnapshotValue(this.ownSubjectTrees),
          questions: this.questions, total: this.total, page: this.page, hasSearched: this.hasSearched,
          scrollTop: this.$refs.questionList ? this.$refs.questionList.scrollTop : 0
        })
        return
      }
      const options = FILTER_OPTION_FIELDS.reduce((result, field) => {
        result[field] = this.cloneAiSnapshotValue(this[field])
        return result
      }, {})
      this.$set(this.bankTabSnapshots, this.bankTabKey(), {
        cloudSubjectPath: this.cloneAiSnapshotValue(this.cloudSubjectPath),
        zsb: this.cloneAiSnapshotValue(this.zsb),
        k12: this.cloneAiSnapshotValue(this.k12),
        options,
        // 保留题目交互状态和纠错附件，离开页面时统一释放附件 URL。
        questions: this.questions,
        total: this.total,
        page: this.page,
        hasSearched: this.hasSearched,
        scrollTop: this.$refs.questionList ? this.$refs.questionList.scrollTop : 0
      })
    },
    async switchQuestionTab(eduType, source) {
      this.sourceSwitching = true
      try {
        const confirmed = await this.confirmAiGenerationInterruption()
        if (!confirmed) return
        const eduTypeChanged = eduType !== this.eduType
        if (eduTypeChanged && this.sourceTab === '云端题库' && source === '云端题库') {
          // 云端切赛道只切换右侧试卷，提前返回以保留左侧筛选、结果和分页。
          this.cachePaperTab()
          this.previewVisible = false
          this.closeQuestionEditor()
          this.draggingQuestion = null
          this.eduType = eduType
          this.restorePaperTab(eduType)
          return
        }
        if (eduTypeChanged) {
          this.cachePaperTab()
          this.previewVisible = false
          this.closeQuestionEditor()
          this.draggingQuestion = null
        }
        if (this.sourceTab === 'AI出题') this.cacheAiGenerationSnapshot()
        this.cacheBankTab()
        this.eduType = eduType
        this.sourceTab = source
        if (eduTypeChanged) this.restorePaperTab(eduType)
        this.resetFilterState()
        this.questions = []
        this.total = 0
        this.hasSearched = false
        if (this.$refs.questionList) this.$refs.questionList.scrollTop = 0
        const snapshot = source !== 'AI出题' && this.bankTabSnapshots[this.bankTabKey()]
        if (source === '自有题库') {
          await this.loadOwnBase()
          this.restoreOwnBankSnapshot()
        } else if (snapshot) {
          this.cloudSubjectPath = this.cloneAiSnapshotValue(snapshot.cloudSubjectPath || [])
          this.zsb = this.cloneAiSnapshotValue(snapshot.zsb)
          this.k12 = this.cloneAiSnapshotValue(snapshot.k12)
          FILTER_OPTION_FIELDS.forEach(field => {
            this[field] = this.cloneAiSnapshotValue(snapshot.options[field])
          })
          this.questions = snapshot.questions
          this.total = snapshot.total
          this.page = snapshot.page
          this.hasSearched = snapshot.hasSearched
          await this.$nextTick()
          if (this.$refs.questionList) this.$refs.questionList.scrollTop = snapshot.scrollTop
        } else {
          await this.loadCurrentBase()
          if (source === 'AI出题') {
            this.restoreAiGenerationSnapshot()
            if (this.useAiMinutesContent && !this.hasAiSubjectSelection()) {
              await this.prefillAiMinutesSubject()
            }
          }
        }
      } finally {
        this.sourceSwitching = false
      }
    },
    resetFilterState(options = {}) {
      const preserveBaseOptions = options.preserveBaseOptions === true
      this.filterStateSequence += 1
      this.cloudSubjectPath = []
      this.requestSequence += 1
      this.aiRequestSequence += 1
      this.minutesSubjectRequestSequence += 1
      this.loading = false
      this.aiQuestionRows = []
      this.aiExportSelectedKeys = []
      this.aiExportFileType = ''
      this.ownFilters = emptyOwnFilters()
      this.ownOptions = emptyOwnOptions()
      this.ownBusinessOptions = []
      this.ownSubjectTrees = {}
      this.ownSubjectPickerKey += 1
      this.zsb = emptyZsb()
      this.k12 = emptyK12()
      this.useMinutesContent = true
      this.areaOptions = []
      this.typeOptions = []
      this.subjectOptions = []
      this.zsbSubjectOptions = []
      this.pointOptions = []
      this.knowledgeOptions = []
      this.questTypeOptions = []
      if (!preserveBaseOptions) {
        this.k12SubjectGroups = []
        this.k12SubjectRaw = []
        this.k12SubjectOptions = []
        this.bookOptions = []
        this.levelOptions = []
        this.k12PointOptions = []
        this.k12KnowledgeOptions = []
        this.k12QuestTypeOptions = []
      }
      this.aiCount = 2
      this.resetAiGenerationMeta()
      this.page = 1
    },
    async resetAndSearch() {
      if (this.sourceTabSwitchLocked) return
      const isK12Ai = this.eduType === 'K9K12' && this.sourceTab === 'AI出题'
      this.resetFilterState({ preserveBaseOptions: isK12Ai })
      if (isK12Ai) return
      this.$delete(this.bankTabSnapshots, this.bankTabKey())
      this.releaseErrorImageUrls(this.questions)
      this.questions = []
      this.total = 0
      this.hasSearched = false
      if (this.$refs.questionList) this.$refs.questionList.scrollTop = 0
      this.sourceSwitching = true
      try {
        await this.loadCurrentBase()
      } finally {
        this.sourceSwitching = false
      }
    },
    buildQueryParams() {
      if (this.sourceTab === '自有题库') return this.buildOwnQueryParams()
      const authInfo = getAuthInfo() || {}
      const common = {
        pageNum: this.page,
        pageSize: this.pageSize,
        order: 2,
        institutionId: authInfo.institutionId || '',
        userId: authInfo.userId || authInfo.id || ''
      }
      if (this.sourceTab === '云端题库') common.isHome = 1
      if (this.activeFilterEduType === '专升本') {
        const params = {
          ...common,
          subjectId: this.zsb.subjectId,
          treeId: this.lastValue(this.zsb.pointPath),
          questTemplateId: this.zsb.questType,
          difficulty: this.zsb.difficulty,
          name: this.zsb.name
        }
        if (this.sourceTab !== '云端题库' && !this.usesZsbSubjectCascader) {
          params.areaId = this.zsb.areaPath[0] || ''
          params.businessId = this.zsb.areaPath[1] || ''
          params.typeId = this.zsb.typeId
        }
        return params
      }
      const params = {
        ...common,
        subjectId: this.lastValue(this.k12.subjectPath),
        questTemplateId: this.k12.questType,
        difficulty: this.k12.difficulty,
        name: this.k12.name
      }
      if (this.k12FilterMode === 'chapter') {
        params.bookId = this.k12.bookId
        params.typeId = this.k12.level
        params.pointId = this.lastValue(this.k12.pointPath)
      } else {
        params.knowledge = this.lastValue(this.k12.knowledgePath)
      }
      return params
    },
    runSearch() {
      if (this.loading || this.sourceSwitching || this.filterOptionsLoading > 0) return
      if (this.sourceTab === '自有题库' && !this.ownSubject) {
        this.$message.warning('请选择学段科目至最后一级')
        return
      }
      if (this.sourceTab !== 'AI出题' && !this.hasBankFilter()) {
        this.$message.warning('请先选择筛选条件')
        return
      }
      if (
        this.sourceTab === '云端题库' &&
        this.activeFilterEduType === 'K9K12' &&
        this.k12FilterMode === 'chapter'
      ) {
        const missingFields = [
          { label: '科目', value: this.lastValue(this.k12.subjectPath) },
          { label: '教材版本', value: this.k12.bookId },
          { label: '年级', value: this.k12.level }
        ].filter(field => !field.value)

        if (missingFields.length) {
          this.$message.warning(`请选择${missingFields.map(field => field.label).join('、')}`)
          return
        }
      }

      this.page = 1
      if (this.sourceTab === 'AI出题') this.filterAiQuestions()
      else return this.searchQuestions()
    },
    hasBankFilter() {
      if (this.sourceTab === '自有题库') return Boolean(this.ownSubject)
      const filters = this.activeFilterEduType === '专升本' ? this.zsb : this.k12
      const fields = this.activeFilterEduType === '专升本'
        ? ['subjectId', 'pointPath', 'questType', 'difficulty', 'name']
        : ['subjectPath', 'questType', 'name',
            ...(this.sourceTab === '自有题库' ? ['difficulty'] : []),
            ...(this.k12FilterMode === 'chapter' ? ['bookId', 'level', 'pointPath'] : ['knowledgePath'])]
      return fields.some(field => Array.isArray(filters[field])
        ? filters[field].length > 0
        : String(filters[field] || '').trim().length > 0)
    },
    buildAiQueryParams() {
      const params = this.buildAfterQuizAiQueryParams()
      return this.removeEmptyParams({
        ...params, difficulty: params.difficultyId || '',
        difficultyName: this.optionName(this.aiOptions.difficulties, this.aiFilters.difficulty),
        questType: this.optionItem(this.aiQuestTypeOptions, this.aiFilters.questType).questType || ''
      })
    },
    buildAfterQuizAiQueryParams() {
      const authInfo = getAuthInfo() || {}
      const chapters = this.aiSelectedChapters()
      const knowledge = this.aiSelectedKnowledge()
      const params = {
        learningScope: AI_LEARNING_TRACKS[this.aiStandardType] || '',
        useMinutesContent: this.useAiMinutesContent,
        subjectId: this.aiSubject ? this.aiSubject.id : '',
        subjectName: this.aiSubject ? this.aiSubject.label : '',
        questTemplateId: this.aiFilters.questType,
        questTemplateName: this.optionName(this.aiQuestTypeOptions, this.aiFilters.questType),
        difficultyId: this.aiFilters.difficulty,
        questionCount: Number(this.aiCount)
      }
      if (this.aiStandardType === 1) {
        params.bookId = this.aiFilters.bookId
        params.bookName = this.optionName(this.aiOptions.books, this.aiFilters.bookId)
        params.typeId = this.aiFilters.level
        params.typeName = this.optionName(this.aiOptions.levels, this.aiFilters.level)
      }
      const reference = item => {
        if (item && item.id) return { id: item.id }
        const name = String(item && item.name || '').trim()
        return this.allowAiCustomNames && name ? { name } : null
      }
      if (this.useAiMinutesContent) {
        params.t1Id = String(authInfo.t1Id || authInfo.liveId || '')
        params.chapterIds = chapters.map(item => item.id).filter(Boolean)
      } else {
        const chapter = reference(chapters[0])
        if (chapter) params.chapter = chapter
      }
      const knowledgePoint = reference(knowledge)
      if (knowledgePoint) params.knowledgePoint = knowledgePoint
      return this.removeEmptyParams(params)
    },
    validateAfterQuizAiParams(params) {
      const requiredFields = [
        ['subjectId', '科目'],
        ...(this.aiStandardType === 1 ? [['bookId', '教材版本'], ['typeId', '年级']] : []),
        ['questTemplateId', '题型'], ['difficultyId', '难度']
      ]
      const missing = requiredFields.filter(([key]) => !params[key]).map(([, label]) => label)
      const hasReference = item => Boolean(item && (item.id || String(item.name || '').trim()))
      const hasChapter = params.useMinutesContent
        ? Array.isArray(params.chapterIds) && params.chapterIds.some(Boolean)
        : hasReference(params.chapter)
      if (!hasChapter) missing.push('章节')
      if (params.useMinutesContent && !params.t1Id) missing.unshift('当前听记 ID')
      if (!params.useMinutesContent && !hasReference(params.knowledgePoint)) missing.push('知识点')
      if (missing.length) {
        this.$message.warning(`请选择${missing.join('、')}`)
        return false
      }
      if (!params.learningScope || !this.aiSubject) return false
      const customChapters = this.aiSelectedChapters().filter(item => !item.id)
      const customKnowledge = !this.aiSelectedKnowledge().id && this.aiSelectedKnowledge().name
      if ((customChapters.length || customKnowledge) && !this.allowAiCustomNames) {
        this.$message.warning('当前出题模式不支持自行输入章节或知识点')
        return false
      }
      if (!params.useMinutesContent && this.aiSelectedChapters().length !== 1) {
        this.$message.warning('不根据听记内容出题时只能选择一个章节')
        return false
      }
      if (!Number.isInteger(params.questionCount) || params.questionCount < 1 || params.questionCount > this.aiCountMax) {
        this.$message.warning(`出题数量须为 1～${this.aiCountMax} 的整数`)
        return false
      }
      return true
    },
    resetAiGenerationMeta() {
      this.aiGenerationMeta = {
        matchedChapters: [],
        unavailableChapters: []
      }
    },
    chapterSummaryNames(chapters) {
      return (chapters || []).map(chapter => chapter.name || chapter.id).filter(Boolean).join('、')
    },
    async searchQuestions() {
      if (this.sourceTab === 'AI出题') {
        this.filterAiQuestions()
        return
      }
      if (!this.hasBankFilter()) return
      const sequence = ++this.requestSequence
      this.loading = true
      try {
        const params = this.buildQueryParams()
        // 在等待接口前固定类型和科目信息，后续入库不受用户换筛选条件影响。
        const requestEduType = this.activeFilterEduType
        const requestOwnType = this.sourceTab === '自有题库' ? this.ownStandardType : null
        const questionContext = this.sourceTab === '云端题库' ? this.buildCloudQuestionContext() : this.buildOwnQuestionContext()
        const result = requestOwnType === 0
          ? await getTopicGeneralQuestList(params)
          : this.isZsbSmartBank
          ? await getTopicQuestList(params)
          : this.isK12SmartBank
            ? await getTopicCompulsoryQuestList(params)
            : await getTeachingCloudQuestions(
              requestEduType === '专升本' ? '/getQuestList' : '/getCompulsoryQuestList',
              params
            )
        if (sequence !== this.requestSequence) return
        const rows = (result.rows || []).map(item => ({
          ...this.withQuestionContext(item, questionContext, requestEduType),
          ...(requestOwnType !== null ? { _ownStandardType: requestOwnType } : {}),
          _banked: this.sourceTab === '云端题库' ? String(item.hasJoin) === '1' : item._banked
        }))
        this.releaseErrorImageUrls(this.questions)
        this.questions = rows
        this.total = Number(result.total ?? this.questions.length)
        this.hasSearched = true
      } catch (error) {
        if (sequence === this.requestSequence) {
          this.$message.error('题目查询失败，请稍后重试')
        }
      } finally {
        if (sequence === this.requestSequence) {
          this.loading = false
        }
      }
    },
    changeBatch() {
      if (this.sourceTab !== '云端题库' || !this.hasSearched || this.loading || this.sourceSwitching) return
      const totalPages = Math.max(1, Math.ceil(this.total / this.pageSize))
      this.changePage(this.page >= totalPages ? 1 : this.page + 1)
    },
    changePage(page) {
      if (!this.hasSearched || this.loading || this.sourceSwitching) return
      this.page = page
      if (this.$refs.questionList) this.$refs.questionList.scrollTop = 0
      this.searchQuestions()
    },
    async generateQuestions() {
      if (this.loading || this.sourceSwitching || this.filterOptionsLoading > 0) return
      const useNewAfterQuizApi = this.useAfterQuizAiApi
      const params = useNewAfterQuizApi
        ? this.buildAfterQuizAiQueryParams()
        : this.buildAiQueryParams()
      const generationDetails = this.buildAiGenerationDetails()
      if (!this.validateAfterQuizAiParams(params)) return
      const sequence = ++this.aiRequestSequence
      const requestSourceTab = this.sourceTab
      // 通用学段沿用非 K12 的题库字段格式，实际学段类型单独保留。
      const requestEduType = this.aiStandardType === 1 ? 'K9K12' : '专升本'
      const requestStandardType = this.aiStandardType
      const requestSubjectPath = JSON.stringify(this.aiFilters.subjectPath)
      if (useNewAfterQuizApi) this.resetAiGenerationMeta()
      this.loading = true
      try {
        const result = await this.generateAiQuestions(params)
        const rows = useNewAfterQuizApi ? result.rows : result
        if (sequence !== this.aiRequestSequence || requestSourceTab !== this.sourceTab || requestSubjectPath !== JSON.stringify(this.aiFilters.subjectPath)) return
        if (useNewAfterQuizApi) {
          this.aiGenerationMeta = {
            matchedChapters: result.matchedChapters,
            unavailableChapters: result.unavailableChapters
          }
          if (result.unavailableChapters.length) {
            this.$message.warning(`部分章节未被课堂纪要覆盖：${this.chapterSummaryNames(result.unavailableChapters)}`)
          }
        }
        this.aiQuestionRows = (Array.isArray(rows) ? rows : []).map((row, index) => {
          const { _aiExportSource, ...item } = row
          const context = this.buildAiQuestionContext(item, generationDetails)
          return {
            ...context,
            _aiExportKey: `ai-export-${sequence}-${index}`,
            _aiExportSnapshot: snapshotAiExportQuestion(_aiExportSource || item, context),
            _questionEduType: requestEduType,
            _aiStandardType: requestStandardType,
            compulsory: requestStandardType === 1 ? '1' : '0',
            isAi: item.isAi || '1',
            generationDetails
          }
        })
        this.questions = this.aiQuestionRows.map(item => ({ ...item }))
        this.aiExportSelectedKeys = this.questions.map(item => item._aiExportKey)
        this.total = this.questions.length
        this.cacheAiGenerationSnapshot()
        this.$message.success(`已生成 ${this.total} 道题目`)
      } catch (error) {
        if (sequence === this.aiRequestSequence && requestSourceTab === this.sourceTab && requestSubjectPath === JSON.stringify(this.aiFilters.subjectPath)) {
          this.$message.error(error.message || 'AI 出题失败，请调整条件后重试')
        }
      } finally {
        if (sequence === this.aiRequestSequence && requestSourceTab === this.sourceTab && requestSubjectPath === JSON.stringify(this.aiFilters.subjectPath)) {
          this.loading = false
        }
      }
    },
    generateAiQuestions(params) {
      if (this.useAfterQuizAiApi) {
        return generateAfterQuizQuestions(params).then(data => {
          const generation = data && data.generation ? data.generation : {}
          const sourceQuestions = Array.isArray(data && data.questions) ? data.questions.filter(item => item && typeof item === 'object') : []
          return {
            rows: normalizeT1AiQuestions(sourceQuestions, generation).map((question, index) => ({
              ...question,
              _aiExportSource: sourceQuestions[index],
              difficulty: question.difficultyId || '',
              knowledge: question.knowledgeId || ''
            })),
            matchedChapters: Array.isArray(data && data.matchedChapters) ? data.matchedChapters : [],
            unavailableChapters: Array.isArray(data && data.unavailableChapters) ? data.unavailableChapters : [],
            message:data.message
          }
        })
      }
      return generatePartQuest(params)
    },
    cloneAiSnapshotValue(value) {
      return JSON.parse(JSON.stringify(value))
    },
    cacheAiGenerationSnapshot() {
      // AI 共用一份缓存，切换题目来源后恢复最近的条件和结果，不按学习赛道拆分。
      this.$set(this.aiGenerationSnapshots, 'ai', {
        filters: this.cloneAiSnapshotValue(this.aiFilters),
        options: this.cloneAiSnapshotValue(this.aiOptions),
        businesses: this.cloneAiSnapshotValue(this.aiBusinessOptions),
        subjectTrees: this.cloneAiSnapshotValue(this.aiSubjectTrees),
        useMinutesContent: this.useMinutesContent, aiCount: this.aiCount,
        aiGenerationMeta: this.cloneAiSnapshotValue(this.aiGenerationMeta),
        rows: this.cloneAiSnapshotValue(this.aiQuestionRows),
        exportSelectedKeys: [...this.aiExportSelectedKeys]
      })
    },
    restoreAiGenerationSnapshot() {
      const snapshot = this.aiGenerationSnapshots.ai
      if (!snapshot) {
        this.aiFilters = emptyAiFilters()
        this.aiSubjectTrees = {}
        this.aiOptions = { ...emptyAiOptions(), difficulties: this.aiOptions.difficulties }
        this.aiQuestionRows = []
        this.aiExportSelectedKeys = []
        this.questions = []
        this.total = 0
        this.aiSubjectPickerKey += 1
        return false
      }
      // 以当前机构权限重新核对学段，防止缓存恢复已无权使用的福建专升本科目。
      const allowedIds = new Set(this.aiBusinessOptions.map(item => item.id))
      const selectedBusiness = snapshot.businesses.find(item => item.value === snapshot.filters.subjectPath[0])
      if (selectedBusiness && !allowedIds.has(selectedBusiness.id)) {
        this.$delete(this.aiGenerationSnapshots, 'ai')
        return this.restoreAiGenerationSnapshot()
      }
      this.aiFilters = this.cloneAiSnapshotValue(snapshot.filters)
      this.aiOptions = this.cloneAiSnapshotValue(snapshot.options)
      this.aiSubjectTrees = this.cloneAiSnapshotValue(snapshot.subjectTrees)
      this.aiBusinessOptions = this.aiBusinessOptions.map(item => ({ ...item, ...(this.aiSubjectTrees[item.id] ? { children: this.aiSubjectTrees[item.id] } : {}) }))
      this.aiSubjectPickerKey += 1
      this.useMinutesContent = snapshot.useMinutesContent
      this.aiCount = snapshot.aiCount
      this.aiGenerationMeta = this.cloneAiSnapshotValue(snapshot.aiGenerationMeta)
      this.aiQuestionRows = this.cloneAiSnapshotValue(snapshot.rows || [])
      this.aiExportSelectedKeys = [...(snapshot.exportSelectedKeys || [])]
      this.questions = this.aiQuestionRows.map(item => ({ ...item }))
      this.total = this.questions.length
      return true
    },
    filterAiQuestions() {
      this.questions = this.aiQuestionRows.map(item => ({ ...item }))
      this.total = this.questions.length
    },
    toggleAiExportQuestion(question, selected) {
      if (this.sourceTab !== 'AI出题' || this.loading || this.sourceSwitching || !question._aiExportKey) return
      const keys = new Set(this.aiExportSelectedKeys)
      if (selected) keys.add(question._aiExportKey)
      else keys.delete(question._aiExportKey)
      this.aiExportSelectedKeys = [...keys]
    },
    toggleAllAiExportQuestions(selected) {
      if (this.sourceTab !== 'AI出题' || this.loading || this.sourceSwitching) return
      this.aiExportSelectedKeys = selected ? this.questions.map(question => question._aiExportKey).filter(Boolean) : []
    },
    openAiExport(fileType) {
      if (this.aiExportDisabled || !['DOCX', 'PDF'].includes(fileType)) return
      this.aiExportQuestionsSnapshot = this.cloneAiSnapshotValue(this.aiExportSelectedQuestions.map(question => question._aiExportSnapshot))
      this.aiExportSubjectName = this.aiExportQuestionsSnapshot[0].subjectName || ''
      this.syncAiExportTitle(this.aiSubject ? this.aiSubject.label : this.aiExportSubjectName)
      this.aiExportFileType = fileType
    },
    syncAiExportTitle(subjectName) {
      const subjectKey = JSON.stringify(this.aiFilters.subjectPath)
      if (this.aiExportSettings && subjectKey === this.aiExportSettingsSubjectKey) return
      this.aiExportSettingsSubjectKey = subjectKey
      this.aiExportSettings = {
        ...this.aiExportSettings,
        title: `${Array.from(subjectName || 'AI 生成').slice(0, 28).join('')}试卷`
      }
    },
    questionKey(question, index) {
      return String(question._aiExportKey || question.id || question.questId || `${question.name}-${index}`)
    },
    handleQuestionDragStart(question, index, event) {
      this.draggingQuestion = question
      event.dataTransfer.effectAllowed = 'copy'
      event.dataTransfer.setData('text/plain', this.questionKey(question, index))
    },
    handleQuestionDragEnd() {
      this.draggingQuestion = null
    },
    getDroppedQuestion(event) {
      if (this.draggingQuestion) return this.draggingQuestion
      const key = event.dataTransfer.getData('text/plain')
      return this.questions.find((question, index) => this.questionKey(question, index) === key) || null
    },
    getQuestionIdentityValues(question) {
      if (!question) return []
      return ['id', 'questId', 'questionId', 'topicId', 'spiderId']
        .map(field => question[field])
        .filter(value => value !== undefined && value !== null && String(value).trim() !== '')
        .map(value => String(value))
    },
    getQuestionFingerprint(question) {
      if (!question) return ''
      const fields = ['name', 'optionA', 'optionB', 'optionC', 'optionD', 'optionE']
      const values = fields.map(field => this.plainText(question[field] || '').replace(/\s+/g, ' ').trim())
      return values.some(Boolean) ? values.join('\u0001') : ''
    },
    isSameQuestion(firstQuestion, secondQuestion) {
      if (!firstQuestion || !secondQuestion) return false
      if (firstQuestion._questionEduType && secondQuestion._questionEduType &&
        firstQuestion._questionEduType !== secondQuestion._questionEduType) return false
      const firstIds = this.getQuestionIdentityValues(firstQuestion)
      const secondIds = this.getQuestionIdentityValues(secondQuestion)
      if (firstIds.length && secondIds.length) {
        return firstIds.some(id => secondIds.includes(id))
      }
      const firstFingerprint = this.getQuestionFingerprint(firstQuestion)
      return Boolean(firstFingerprint) && firstFingerprint === this.getQuestionFingerprint(secondQuestion)
    },
    hasQuestionKnowledge(question) {
      if (!question) return false
      return Boolean(
        question.knowledgeName ||
        question.knowledgeId ||
        question.knowledge
      )
    },
    validateQuestionPlacement(question, type, groupIndex, childIndex = -1) {
      const group = this.ensureGroup(groupIndex)
      if (!question || !group) return false

      if (type === 'mother') {
        if (!this.hasQuestionKnowledge(question)) {
          this.$message.warning('该题目没有知识点，不能导入母题')
          return false
        }
        const duplicateMotherIndex = this.paperGroups.findIndex((item, index) => (
          index !== groupIndex && this.isSameQuestion(item.mother, question)
        ))
        if (duplicateMotherIndex !== -1) {
          this.$message.warning(`该题目已作为母题 ${duplicateMotherIndex + 1} 导入，母题不能重复`)
          return false
        }
        if (group.children.some(child => this.isSameQuestion(child, question))) {
          this.$message.warning('母题不能与自己的子题相同')
          return false
        }
        return true
      }

      if (type === 'child') {
        if (this.isSameQuestion(group.mother, question)) {
          this.$message.warning('子题不能与所属母题相同')
          return false
        }
        if (!this.allowRepeat) {
          const duplicateChildIndex = group.children.findIndex((child, index) => (
            index !== childIndex && this.isSameQuestion(child, question)
          ))
          if (duplicateChildIndex !== -1) {
            this.$message.warning(`该题目已作为子题 ${duplicateChildIndex + 1} 导入，同一母题下的子题不能重复`)
            return false
          }
        }
        return true
      }

      return false
    },
    dropQuestionAsMother(groupIndex, event) {
      const question = this.getDroppedQuestion(event)
      const group = this.ensureGroup(groupIndex)
      if (!question || !group || !this.validateQuestionPlacement(question, 'mother', groupIndex)) return
      this.$set(group, 'mother', { ...question })
      group.expanded = true
      this.activeTarget = { type: 'mother', groupIndex, childIndex: -1 }
    },
    dropQuestionAsChild(groupIndex, childIndex, event) {
      const question = this.getDroppedQuestion(event)
      const group = this.ensureGroup(groupIndex)
      if (!question || !group || !this.validateQuestionPlacement(question, 'child', groupIndex, childIndex)) return
      this.$set(group.children, childIndex, { ...question })
      group.expanded = true
      this.activeTarget = { type: 'child', groupIndex, childIndex }
    },
    getOptions(question) {
      // 判断题仅在展示时补齐固定选项，不写回题目或提交数据。
      if (question && this.resolveQuestionTypeCode(question) === '3') {
        return [
          { key: 'A', value: '对' },
          { key: 'B', value: '错' }
        ]
      }
      return ['A', 'B', 'C', 'D', 'E'].map(key => ({
        key,
        value: question && question[`option${key}`]
      })).filter(item => item.value)
    },
    plainText(value) {
      const element = document.createElement('div')
      element.innerHTML = value || ''
      return element.textContent || element.innerText || ''
    },
    isBlankContent(value) {
      const html = value === null || value === undefined ? '' : String(value)
      const hasMedia = /<(img|video|iframe|embed|object|table)\b/i.test(html)
      const hasFormula = /class=["'][^"']*\bql-formula\b/i.test(html)
      if (hasMedia || hasFormula) return false
      return !this.plainText(html).replace(/\u00a0/g, ' ').trim()
    },
    activeQuestionTypeOptions() {
      if (this.sourceTab === 'AI出题') return this.aiQuestTypeOptions
      if (this.sourceTab === '自有题库') return this.ownOptions.questTypes
      return this.activeFilterEduType === '专升本' ? this.questTypeOptions : this.k12QuestTypeOptions
    },
    resolveQuestionTypeCode(question = {}) {
      if (question._questionEduType && /^[1-8]$/.test(String(question.questType || question.questTypeCode || ''))) {
        return String(question.questType || question.questTypeCode)
      }
      const templateId = question.questTemplateId
      const options = this.questionEduType(question) === this.activeFilterEduType ? this.activeQuestionTypeOptions() : []
      const template = options.find(item => (
        String(item.id) === String(templateId)
      )) || {}
      const templateType = String(template.questType || '')
      if (templateType) return templateType

      const rawType = String(question.questType || question.questTypeCode || '')
      if (/^[1-8]$/.test(rawType)) return rawType

      const typeName = question.questTypeName || question.questTemplateName || template.name || ''
      const typeMap = [
        [/多选|多项选择|不定项/, '2'],
        [/单选|单项选择|选择/, '1'],
        [/排序/, '8'],
        [/判断/, '3'],
        [/填空/, '4'],
        [/简答/, '5'],
        [/计算/, '6'],
        [/论述/, '7']
      ]
      const matched = typeMap.find(([pattern]) => pattern.test(typeName))
      return matched ? matched[1] : ''
    },
    resolveQuestionTypeName(question = {}, typeCode = '') {
      const directName = question.questTypeName || question.questTemplateName
      if (directName) return directName
      const options = this.questionEduType(question) === this.activeFilterEduType ? this.activeQuestionTypeOptions() : []
      const template = options.find(item => (
        String(item.id) === String(question.questTemplateId)
      ))
      if (template && template.name) return template.name
      const typeNameMap = {
        1: '单选题',
        2: '多选题',
        3: '判断题',
        4: '填空题',
        5: '简答题',
        6: '计算题',
        7: '论述题',
        8: '排序题'
      }
      return typeNameMap[typeCode] || '未知题型'
    },
    toggleAnalysis(question) {
      this.$set(question, '_showAnalysis', !question._showAnalysis)
    },
    createErrorCorrectionForm() {
      return {
        reason: '',
        content: '',
        files: [],
        submitting: false
      }
    },
    async toggleErrorCorrection(question) {
      if (question._showErrorCorrection) {
        this.closeErrorCorrection(question)
        return
      }
      if (!question._errorCorrection) {
        this.$set(question, '_errorCorrection', this.createErrorCorrectionForm())
      }
      this.$set(question, '_showErrorCorrection', true)
      await this.loadErrorReasonOptions()
    },
    closeErrorCorrection(question) {
      if (question._errorCorrection && question._errorCorrection.submitting) return
      this.$set(question, '_showErrorCorrection', false)
    },
    async loadErrorReasonOptions() {
      if (this.errorReasonLoaded || this.errorReasonLoading) return
      this.errorReasonLoading = true
      try {
        const rows = await getTeachingCloudOptions('/getDictList', {
          id: TEACHING_CLOUD_ERROR_DICT_ID
        })
        this.errorReasonOptions = (Array.isArray(rows) ? rows : []).map(item => ({
          value: String(item.id ?? item.value ?? item.dictValue ?? item.code ?? ''),
          label: item.name || item.label || item.dictLabel || item.value || ''
        })).filter(item => item.value && item.label)
        this.errorReasonLoaded = this.errorReasonOptions.length > 0
        if (!this.errorReasonOptions.length) {
          this.$message.warning('暂无可用的纠错类型，请稍后重试')
        }
      } catch (error) {
        this.$message.error('纠错类型加载失败，请稍后重试')
      } finally {
        this.errorReasonLoading = false
      }
    },
    selectErrorImages(question, event) {
      const form = question._errorCorrection
      const selectedFiles = Array.from((event.target && event.target.files) || [])
      if (!form || !selectedFiles.length) return
      const imageFiles = selectedFiles.filter(file => (
        ['image/jpeg', 'image/png'].includes(file.type) || /\.(jpe?g|png)$/i.test(file.name)
      ))
      if (imageFiles.length !== selectedFiles.length) {
        this.$message.warning('仅支持 jpg/png 格式的图片')
      }
      const remaining = Math.max(0, 5 - form.files.length)
      if (imageFiles.length > remaining) {
        this.$message.warning('最多上传 5 张图片')
      }
      imageFiles.slice(0, remaining).forEach(file => {
        form.files.push({
          uid: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: file.name,
          file,
          url: window.URL && window.URL.createObjectURL
            ? window.URL.createObjectURL(file)
            : ''
        })
      })
      if (event.target) event.target.value = ''
    },
    removeErrorImage(question, imageIndex) {
      const form = question._errorCorrection
      if (!form) return
      const removed = form.files.splice(imageIndex, 1)[0]
      if (removed && removed.url && window.URL && window.URL.revokeObjectURL) {
        window.URL.revokeObjectURL(removed.url)
      }
    },
    releaseErrorImageUrls(questions) {
      if (!window.URL || !window.URL.revokeObjectURL) return
      const rows = questions || []
      rows.forEach(question => {
        const form = question && question._errorCorrection
        if (!form || !Array.isArray(form.files)) return
        form.files.forEach(image => {
          if (image.url) window.URL.revokeObjectURL(image.url)
        })
      })
    },
    clearErrorCorrectionForm(question) {
      const form = question._errorCorrection
      if (form) {
        form.files.forEach(image => {
          if (image.url && window.URL && window.URL.revokeObjectURL) {
            window.URL.revokeObjectURL(image.url)
          }
        })
      }
      this.$set(question, '_errorCorrection', this.createErrorCorrectionForm())
    },
    async submitErrorCorrection(question) {
      const form = question._errorCorrection
      if (!form || form.submitting) return
      if (!form.reason) {
        this.$message.warning('请选择纠错类型')
        return
      }
      const authInfo = getAuthInfo() || {}
      const userId = authInfo.userId || authInfo.id || ''
      const userName = authInfo.userName || ''
      const questId = question.id || question.questId || ''
      if (!userId) {
        this.$message.error('未获取到当前用户信息，请重新登录后再试')
        return
      }
      if (!questId) {
        this.$message.error('当前题目缺少题目 ID，无法提交纠错')
        return
      }

      const formData = new FormData()
      formData.append('userId', String(userId))
      formData.append('questId', String(questId))
      formData.append('userName', String(userName))
      formData.append('reason', form.reason)
      if (form.content.trim()) formData.append('content', form.content.trim())
      form.files.forEach(image => formData.append('files', image.file))

      form.submitting = true
      try {
        await addTeachingCloudError(formData)
        this.$message.success('纠错提交成功')
        this.clearErrorCorrectionForm(question)
        this.$set(question, '_showErrorCorrection', false)
        this.$set(question, 'hasErrorReport', '1')
      } catch (error) {
        this.$message.error(error.message || '纠错提交失败，请稍后重试')
      } finally {
        question._errorCorrection.submitting = false
      }
    },
    async copyQuestionId(question) {

      // const spiderId = question && question.spiderId
      // const rawId = spiderId !== undefined && spiderId !== null && spiderId !== ''
      //   ? spiderId
      //   : question && question.id
      // if (rawId === undefined || rawId === null || rawId === '') {
      //   this.$message.warning('当前题目没有可复制的 ID')
      //   return
      // }

      const id = question.id
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(id)
        } else {
          this.copyTextFallback(id)
        }
        this.$message.success('题目 ID 已复制')
      } catch (error) {
        try {
          this.copyTextFallback(id)
          this.$message.success('题目 ID 已复制')
        } catch (fallbackError) {
          this.$message.error('复制失败，请稍后重试')
        }
      }
    },
    copyTextFallback(text) {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      let copied = false
      try {
        textarea.select()
        copied = document.execCommand('copy')
      } finally {
        document.body.removeChild(textarea)
      }
      if (!copied) throw new Error('copy failed')
    },
    saveToSmartBank(question) {
      if (this.sourceTab === '自有题库') return
      if (question._bankLoading || question._banked) return

      const isCloudBank = this.sourceTab === '云端题库'
      // 下划线字段仅供前端保存类型、上下文和交互状态，不进入入库请求。
      const payload = Object.keys(question).reduce((result, key) => {
        if (!key.startsWith('_')) {
          result[key] = question[key]
        }
        return result
      }, {})

      if (isCloudBank) {
        const context = question._questionContext || this.buildCloudQuestionContext()
        Object.keys(context).forEach(field => {
          if (payload[field] === undefined || payload[field] === null || payload[field] === '') payload[field] = context[field]
        })
        payload.id = question.id || question.questId || ''
        payload.pointId = question.pointId || question.treeId || payload.pointId || ''
        payload.questTemplateName = question.questTemplateName || question.questTypeName || payload.questTemplateName || ''
        payload.compulsory = this.questionEduType(question) === '专升本' ? '0' : '1'
      }

      this.bankAddQuestion = question
      this.openQuestionEditor(payload, isCloudBank ? 'cloudBank' : 'aiBank', -1)
    },
    async submitBankAddEditor(editor) {
      const question = this.bankAddQuestion
      if (!question || this.bankAddSaving) return
      const isCloudBank = this.editingTarget.type === 'cloudBank'
      const payload = Object.keys(editor).reduce((result, key) => {
        if (!key.startsWith('_')) result[key] = editor[key]
        return result
      }, {})
      if (isCloudBank) {
        payload.id = question.id || question.questId || ''
        payload.spiderId = question.spiderId
        payload.compulsory = this.questionEduType(question) === '专升本' ? '0' : '1'
      }
      this.bankAddSaving = true
      this.$set(question, '_bankLoading', true)
      try {
        await (isCloudBank ? addTopicByTeaching(payload) : addTopicByAi(payload))
        this.$set(question, '_banked', true)
        if (isCloudBank) {
          this.$set(question, 'hasJoin', '1')
        } else {
          const aiQuestion = this.aiQuestionRows.find(item => item === question || this.isSameQuestion(item, question))
          if (aiQuestion) this.$set(aiQuestion, '_banked', true)
          this.cacheAiGenerationSnapshot()
        }
        this.$message.success('题目加入自有题库成功')
      } catch (error) {
        // 请求层已统一展示后端错误信息，保留编辑弹窗供重试。
      } finally {
        this.bankAddSaving = false
        this.$set(question, '_bankLoading', false)
      }
      if (question._banked) this.closeQuestionEditor()
    },
    deleteBankQuestion(index) {
      const question = this.questions[index] || {}
      const id = question.id ? String(question.id) : ''
      if (!id) {
        this.$message.warning('当前题目没有有效的题目 ID，无法删除')
        return
      }
      this.$confirm('确认删除这道题目吗？', '提示', { type: 'warning' }).then(async () => {
        await deleteTopic({ id })
        this.questions.splice(index, 1)
        this.total = Math.max(0, this.total - 1)
        this.$message.success('删除题目成功')
      }).catch(error => {
        if (error !== 'cancel' && error !== 'close') {
          this.$message.error(error.message || '删除题目失败，请稍后重试')
        }
      })
    },
    openBankEditor(question, index = null) {
      this.bankEditingIndex = index
      this.bankEditorQuestId = question ? String(question.questId || question.id || '') : ''
      if (this.sourceTab === '自有题库') {
        // 表单独立于列表；学段根节点拆成 businessId，科目路径只保留学段下面的层级。
        const context = question && question._questionContext || {}
        const filters = this.ownFilters
        this.bankEditor = question
          ? { ...question, businessId: question.businessId || context.businessId || '', subjectId: question.subjectId || context.subjectId || '' }
          : {
            name: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '', answer: '', analysis: '',
            businessId: this.ownBusiness ? this.ownBusiness.id : '',
            subjectId: this.ownSubject ? this.ownSubject.id : '',
            subjectPath: [...filters.subjectPath.slice(1)],
            pointPath: [...filters.pointPath], pointId: this.lastValue(filters.pointPath),
            knowledgePath: [...filters.knowledgePath], knowledge: this.lastValue(filters.knowledgePath),
            bookId: this.ownStandardType === 1 && this.ownFilterMode === 'chapter' ? filters.bookId : '',
            typeId: this.ownStandardType === 1 && this.ownFilterMode === 'chapter' ? filters.level : '',
            questTemplateId: filters.questType, difficulty: filters.difficulty, serialNumber: '1'
          }
        this.bankEditorVisible = true
        return
      }
      const k12SubjectId = this.lastValue(this.k12.subjectPath)
      const isK12 = this.eduType === 'K9K12'
      const questionSubjectId = question && (question.subjectId || (isK12 ? k12SubjectId : this.zsb.subjectId))
      const questionPointId = question && (question.pointId || this.lastValue(question.pointPath))
      const questionKnowledge = question && (question.knowledge || this.lastValue(question.knowledgePath))
      const questionAreaPath = question && Array.isArray(question.areaPath) && question.areaPath.length > 1
        ? question.areaPath
        : question && question.areaId && question.businessId
          ? [question.areaId, question.businessId]
          : this.zsb.areaPath
      this.bankEditor = question
        ? {
          ...question,
          id: question.id || question.questId || '',
          areaPath: this.eduType === '专升本' ? questionAreaPath.map(String) : [],
          subjectPath: isK12 && questionSubjectId ? [String(questionSubjectId)] : [],
          typeId: question.typeId || (this.eduType === '专升本' ? this.zsb.typeId : this.k12.level),
          subjectId: questionSubjectId,
          pointPath: questionPointId ? [String(questionPointId)] : [],
          pointId: questionPointId,
          knowledgePath: questionKnowledge ? [String(questionKnowledge)] : [],
          knowledge: questionKnowledge,
          bookId: question.bookId || (this.eduType === 'K9K12' ? this.k12.bookId : ''),
          questTemplateId: question.questTemplateId || question.questType || '',
          difficulty: question.difficulty || '',
          serialNumber: question.serialNumber || '1'
        }
        : {
          name: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          optionE: '',
          answer: '',
          analysis: '',
          areaPath: this.eduType === '专升本' ? this.zsb.areaPath : [],
          subjectPath: this.eduType === 'K9K12' ? this.k12.subjectPath : [],
          typeId: this.eduType === '专升本' ? this.zsb.typeId : this.k12.level,
          subjectId: this.eduType === '专升本' ? this.zsb.subjectId : k12SubjectId,
          pointPath: this.eduType === '专升本' ? this.zsb.pointPath : this.k12.pointPath,
          pointId: this.eduType === '专升本' ? this.lastValue(this.zsb.pointPath) : this.lastValue(this.k12.pointPath),
          knowledgePath: this.eduType === 'K9K12' ? this.k12.knowledgePath : [],
          knowledge: this.eduType === 'K9K12' ? this.lastValue(this.k12.knowledgePath) : '',
          bookId: this.eduType === 'K9K12' ? this.k12.bookId : '',
          questTemplateId: this.eduType === '专升本' ? this.zsb.questType : this.k12.questType,
          difficulty: this.eduType === '专升本' ? this.zsb.difficulty : this.k12.difficulty,
          serialNumber: '1'
        }
      this.bankEditorVisible = true
    },
    closeBankEditor() {
      this.bankEditorVisible = false
      this.bankEditorQuestId = ''
      this.bankEditingIndex = null
    },
    saveBankEditor(editor) {
      const nextEditor = editor || this.bankEditor
      if (this.bankEditingIndex === null) {
        this.questions.unshift({ ...nextEditor, id: nextEditor.id || `local-${Date.now()}` })
        this.total += 1
      } else {
        this.$set(this.questions, this.bankEditingIndex, { ...nextEditor })
      }
      this.closeBankEditor()
      // 保存后重新查询，同步最新展示字段及当前筛选条件下的列表和总数。
      return this.searchQuestions()
    },
    // 导入请求只核对弹框及学段科目上下文，顶部 eduType 不参与判断。
    captureImportRequest(kind, withContext = true) {
      const sequence = (this.importSequences[kind] || 0) + 1
      this.$set(this.importSequences, kind, sequence)
      const revision = this.importRevision
      const context = () => JSON.stringify([this.importForm.subjectPath, this.importForm.bookId, this.importForm.typeId])
      const original = context()
      return () => this.importVisible && revision === this.importRevision && this.importSequences[kind] === sequence && (!withContext || original === context())
    },
    invalidateImportDialog() {
      this.importRevision += 1
      this.importDownloadLoading = false
    },
    beforeImportClose(done) {
      if (!this.importLoading) done()
    },
    handleImportClosed() {
      if (!this.importVisible) this.resetImportForm()
    },
    async openImportDialog() {
      if (this.importLoading || this.importVisible) return
      this.resetImportForm()
      this.importVisible = true
      const seed = this.sourceTab === '自有题库' && this.ownSubject
        ? { path: [...this.ownFilters.subjectPath], bookId: this.ownFilters.bookId, typeId: this.ownFilters.level }
        : null
      const isCurrent = this.captureImportRequest('open', false)
      await this.loadImportBusinesses()
      if (!isCurrent() || !seed) return
      const business = this.importBusinessOptions.find(item => item.value === seed.path[0])
      if (!business) return
      try {
        await this.ensureImportSubjects(business)
        if (!isCurrent()) return
        if (!this.findBusinessSubject(business, this.importSubjectTrees, seed.path)) return
        this.importForm.subjectPath = seed.path
        this.importSubjectPickerKey += 1
        await this.handleImportSubjectChange(seed)
      } catch (error) {
        if (isCurrent()) this.$message.warning('科目加载失败，请重新展开学段重试')
      }
    },
    resetImportForm() {
      this.importRevision += 1
      this.importSequences = {}
      this.importForm = emptyImportForm()
      this.importBusinessOptions = []
      this.importSubjectTrees = {}
      this.importTreeRequests = {}
      this.importSubjectPickerKey += 1
      this.importBooks = []
      this.importLevels = []
      this.importBaseLoading = false
      this.importBaseError = false
      this.importBooksLoading = false
      this.importLevelsLoading = false
      this.importDownloadLoading = false
      this.importLoading = false
      this.clearImportCatalogs()
      this.clearImportFile()
    },
    clearImportFile() {
      this.importForm.file = null
      this.importForm.fileName = ''
      if (this.$refs.importInput) this.$refs.importInput.value = ''
    },
    clearImportCatalogs() {
      this.importChapters = []
      this.importKnowledge = []
      this.importKnowledgeCache = {}
      this.importPreviousChapters = []
      this.importForm.chapterValues = []
      this.importForm.knowledgeValues = []
      this.importCatalogLoading = false
      this.importKnowledgeLoading = false
      this.importCatalogReady = false
      this.importOptionsError = ''
    },
    async loadImportBusinesses() {
      const isCurrent = this.captureImportRequest('businesses', false)
      this.importBaseLoading = true
      this.importBaseError = false
      try {
        const rows = await getBusinessSubjectTree()
        if (!isCurrent()) return
        const businesses = this.businessTrackOptions(rows)
        businesses.forEach(business => {
          const old = this.importBusinessOptions.find(item => item.id === business.id)
          if (!old || old.standardType !== business.standardType) this.$delete(this.importSubjectTrees, business.id)
          if (this.importSubjectTrees[business.id]) business.children = this.importSubjectTrees[business.id]
        })
        const selected = businesses.find(item => item.value === this.importForm.subjectPath[0])
        const changed = this.importBusiness && (!selected || selected.standardType !== this.importStandardType)
        this.importBusinessOptions = businesses
        this.importSubjectPickerKey += 1
        this.importBaseLoading = false
        if (changed) {
          this.importForm.subjectPath = []
          await this.handleImportSubjectChange()
          this.$message.warning('当前学段已不可用，请重新选择科目')
        }
      } catch (error) {
        if (isCurrent()) {
          this.importBaseError = true
          this.$message.warning('学段加载失败，请重新加载学段')
        }
      } finally {
        if (isCurrent()) this.importBaseLoading = false
      }
    },
    async ensureImportSubjects(business) {
      if (this.importSubjectTrees[business.id]) return this.importSubjectTrees[business.id]
      if (this.importTreeRequests[business.id]) return this.importTreeRequests[business.id]
      const isCurrent = this.captureImportRequest('tree:' + business.id, false)
      const pending = getBusinessSubjects(business.id).then(rows => {
        if (!isCurrent()) return null
        const tree = this.normalizeBusinessSubjectTree(rows, business.value)
        this.$set(this.importSubjectTrees, business.id, tree)
        this.$set(business, 'children', tree)
        return tree
      }).finally(() => {
        if (this.importTreeRequests[business.id] === pending) this.$delete(this.importTreeRequests, business.id)
      })
      this.$set(this.importTreeRequests, business.id, pending)
      return pending
    },
    async loadImportSubjectNode(node, resolve) {
      if (node.root) { resolve(this.importBusinessOptions); return }
      if (node.level !== 1) { resolve([]); return }
      const business = this.importBusinessOptions.find(item => item.value === node.value)
      if (!business) { resolve([]); return }
      const revision = this.importRevision
      try {
        const children = await this.ensureImportSubjects(business)
        if (!this.importVisible || revision !== this.importRevision || children === null) { node.loading = false; return }
        node.data.leaf = false
        resolve(children)
        this.updateTaxonomyPopper('import-subject')
        if (!children.length) this.$message.warning('该学段暂无可选科目')
      } catch (error) {
        node.loading = false
        node.loaded = false
        if (this.importVisible && revision === this.importRevision) this.$message.warning('科目加载失败，请重新展开学段重试')
      }
    },
    handleImportPopperVisible(visible, ref) {
      if (visible) this.updateTaxonomyPopper(ref)
    },
    async handleImportSubjectChange(seed = {}) {
      this.importRevision += 1
      this.importBooks = []
      this.importLevels = []
      this.importBooksLoading = false
      this.importLevelsLoading = false
      this.importDownloadLoading = false
      this.importForm.bookId = ''
      this.importForm.typeId = ''
      this.clearImportCatalogs()
      this.clearImportFile()
      if (!this.importSubject) return
      if (this.importStandardType === 1) await this.loadImportBooks(seed)
      else await this.loadImportCatalogs()
    },
    async loadImportBooks(seed = this.importForm) {
      const isCurrent = this.captureImportRequest('books')
      this.importBooksLoading = true
      try {
        const rows = await getTopicBookList(this.importSubject.id)
        if (!isCurrent()) return
        this.importBooks = Array.isArray(rows) ? rows : []
        this.importOptionsError = ''
        this.importBooksLoading = false
        if (seed.bookId && this.importBooks.some(item => String(item.id) === String(seed.bookId))) {
          this.importForm.bookId = String(seed.bookId)
          await this.loadImportLevels(seed.typeId)
        }
      } catch (error) {
        if (isCurrent()) this.importOptionsError = '教材加载失败'
      } finally {
        if (isCurrent()) this.importBooksLoading = false
      }
    },
    async handleImportBookChange() {
      this.importRevision += 1
      this.importForm.typeId = ''
      this.importLevels = []
      this.importLevelsLoading = false
      this.importDownloadLoading = false
      this.clearImportCatalogs()
      this.clearImportFile()
      if (this.importForm.bookId) await this.loadImportLevels()
    },
    async loadImportLevels(seedLevel = '') {
      const isCurrent = this.captureImportRequest('levels')
      this.importLevelsLoading = true
      try {
        const rows = await getTopicTypeListByBook(this.importSubject.id, this.importForm.bookId)
        if (!isCurrent()) return
        this.importLevels = Array.isArray(rows) ? rows : []
        this.importOptionsError = ''
        this.importLevelsLoading = false
        if (seedLevel && this.importLevels.some(item => String(item.id) === String(seedLevel))) {
          this.importForm.typeId = String(seedLevel)
          await this.loadImportCatalogs()
        }
      } catch (error) {
        if (isCurrent()) this.importOptionsError = '年级加载失败'
      } finally {
        if (isCurrent()) this.importLevelsLoading = false
      }
    },
    async handleImportLevelChange() {
      this.importRevision += 1
      this.importDownloadLoading = false
      this.clearImportCatalogs()
      this.clearImportFile()
      if (this.importForm.typeId) await this.loadImportCatalogs()
    },
    async loadImportCatalogs() {
      if (!this.importSubject || (this.importStandardType === 1 && (!this.importForm.bookId || !this.importForm.typeId))) return
      const isCurrent = this.captureImportRequest('catalogs')
      const type = this.importStandardType
      const subjectId = this.importSubject.id
      this.clearImportCatalogs()
      this.importCatalogLoading = true
      try {
        const [chapters, knowledge] = await Promise.all([
          type === 0 ? getBusinessChapters(subjectId) : type === 1
            ? getTopicSubjectPointCompulsoryList(subjectId, this.importForm.typeId, this.importForm.bookId)
            : getTopicSubjectPointList(subjectId),
          type === 0 ? getBusinessKnowledgePoints(subjectId) : type === 1 ? getTopicKnowledgeCompulsoryList(subjectId) : Promise.resolve([])
        ])
        if (!isCurrent()) return
        // 通用/专升本章节列表中的 children 是知识点，章节层级按 parentId 还原。
        this.importChapters = normalizeImportCatalog(chapters, 'chapter', type !== 1)
        this.importKnowledge = normalizeImportCatalog(knowledge, 'knowledge')
        // 三类学段均从空选择开始；专升本在用户选章节后才加载对应知识点。
        if (isCurrent()) this.importCatalogReady = !this.importOptionsError
      } catch (error) {
        if (isCurrent()) this.importOptionsError = '目录加载失败'
      } finally {
        if (isCurrent()) this.importCatalogLoading = false
      }
    },
    async loadImportUpgradeKnowledge() {
      const isCurrent = this.captureImportRequest('upgrade-knowledge')
      const chapters = expandImportSelection(this.importChapters, this.importForm.chapterValues)
      const subjectId = this.importSubject.id
      this.importKnowledgeLoading = true
      let cursor = 0
      let failed = false
      // 按章节缓存，限制并发；选择变化后旧响应不能回写，更不能恢复已取消的选择。
      const worker = async () => {
        while (cursor < chapters.length && isCurrent()) {
          const chapter = chapters[cursor++]
          if (this.importKnowledgeCache[chapter.id]) continue
          try {
            const rows = await getTopicKnowledgeList(subjectId, chapter.id)
            if (!isCurrent()) return
            this.$set(this.importKnowledgeCache, chapter.id, normalizeImportCatalog(rows, 'knowledge:' + chapter.value))
          } catch (error) { if (isCurrent()) failed = true }
        }
      }
      await Promise.all(Array.from({ length: Math.min(4, chapters.length) }, worker))
      if (!isCurrent()) return
      this.importKnowledgeLoading = false
      this.importOptionsError = failed ? '知识点加载失败' : ''
      this.importCatalogReady = !failed
      this.pruneImportKnowledge()
    },
    pruneImportKnowledge() {
      const all = Object.values(this.importKnowledgeCache).flatMap(tree => flattenImportCatalog(tree))
      const selectedIds = new Set(all.filter(item => this.importForm.knowledgeValues.includes(item.value)).map(item => item.id))
      const allowed = this.importKnowledgeGroups.flatMap(group => group.items)
      const keptIds = new Set()
      this.importForm.knowledgeValues = allowed.filter(item => {
        if (!selectedIds.has(item.id) || keptIds.has(item.id)) return false
        keptIds.add(item.id)
        return true
      }).map(item => item.value)
    },
    async handleImportChapterChange(values) {
      const old = new Set(this.importPreviousChapters)
      const next = new Set(values)
      const removed = this.importChapterItems.filter(item => old.has(item.value) && !next.has(item.value))
      // 父章节勾选包含后代；取消子章节时同步取消祖先勾选，保留同级已选章节。
      expandImportSelection(this.importChapters, values).forEach(item => next.add(item.value))
      removed.forEach(item => {
        expandImportSelection([item], [item.value]).forEach(child => next.delete(child.value))
        item.ancestors.forEach(value => next.delete(value))
      })
      this.importForm.chapterValues = this.importChapterItems.filter(item => next.has(item.value)).map(item => item.value)
      this.importPreviousChapters = [...this.importForm.chapterValues]
      this.pruneImportKnowledge()
      await this.loadImportUpgradeKnowledge()
    },
    async retryImportOptions() {
      if (!this.importSubject) return
      if (this.importOptionsError === '教材加载失败') await this.loadImportBooks()
      else if (this.importOptionsError === '年级加载失败') await this.loadImportLevels(this.importForm.typeId)
      else if (this.importStandardType === 2 && this.importChapters.length) await this.loadImportUpgradeKnowledge()
      else await this.loadImportCatalogs()
    },
    selectImportFile(event) {
      if (this.importLoading || this.importDownloadLoading) return
      const file = event.target.files && event.target.files[0]
      if (!file) return
      this.importForm.file = file
      this.importForm.fileName = file.name
    },
    normalizeImportResult(result = {}) {
      return {
        totalRows: Number(result.totalRows) || 0,
        successCount: Number(result.successCount) || 0,
        failureCount: Number(result.failureCount) || 0,
        failures: Array.isArray(result.failures)
          ? result.failures.map(item => ({
            rowNumber: item.rowNumber || '',
            sn: item.sn || '',
            reason: item.reason || ''
          }))
          : []
      }
    },
    showImportFailures(result) {
      this.importResult = this.normalizeImportResult(result)
      if (this.importResult.failureCount > 0 || this.importResult.failures.length) {
        this.importResultVisible = true
      }
    },
    validateImportConditions() {
      if (!this.importSubject || (this.importStandardType === 2 && String((getAuthInfo() || {}).isInternalOrganization) !== '1')) {
        this.$message.warning('请选择学段及科目至最后一级')
        return false
      }
      if (this.importStandardType === 1 && !this.importBooks.some(item => String(item.id) === this.importForm.bookId)) {
        this.$message.warning('请选择教材版本')
        return false
      }
      if (this.importStandardType === 1 && !this.importLevels.some(item => String(item.id) === this.importForm.typeId)) {
        this.$message.warning('请选择年级')
        return false
      }
      return true
    },
    buildImportQuery() {
      const params = { subjectId: this.importSubject.id, echoParentChild: false }
      if (this.importStandardType === 1) Object.assign(params, { bookId: this.importForm.bookId, typeId: this.importForm.typeId })
      return params
    },
    buildImportTemplatePayload() {
      const knowledge = this.importStandardType === 2
        ? expandImportSelection(this.importChapters, this.importForm.chapterValues).flatMap(chapter => this.importKnowledgeCache[chapter.id] || [])
        : this.importKnowledge
      return {
        ...this.buildImportQuery(), questType: this.importSubject.questType,
        chapters: serializeImportCatalog(this.importChapters, this.importForm.chapterValues),
        knowledgePoints: serializeImportCatalog(knowledge, this.importForm.knowledgeValues)
      }
    },
    async validateImportTemplateBlob(blob) {
      if (!blob || !blob.size) throw new Error('模板文件为空，请重试')
      // 成功与错误均可能以 Blob 返回，只将实际的 Excel 响应保存为文件。
      const head = (await blob.slice(0, 512).text()).replace(/^\uFEFF/, '').trim()
      if (/json|text\//i.test(blob.type || '') || /^[{[]/.test(head)) {
        let result
        try { result = JSON.parse((await blob.text()).replace(/^\uFEFF/, '')) } catch (error) { throw new Error('模板接口返回了无效文件，请重试') }
        throw new Error(result.message || result.msg || '模板下载失败，请重试')
      }
    },
    saveImportTemplateBlob(blob) {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      try {
        link.href = url
        link.download = '题目导入模板.xlsx'
        document.body.appendChild(link)
        link.click()
      } finally {
        if (link.parentNode) link.parentNode.removeChild(link)
        window.URL.revokeObjectURL(url)
      }
    },
    async downloadImportTemplate() {
      if (this.importLoading || this.importDownloadLoading || !this.validateImportConditions()) return
      if (!String(this.importSubject.questType || '').trim()) {
        this.$message.warning('当前科目缺少题型配置，无法下载模板')
        return
      }
      if (!this.importCatalogReady || this.importCatalogLoading || this.importKnowledgeLoading || this.importOptionsError) {
        this.$message.warning('请等待目录加载完成；加载失败时请点击重试')
        return
      }
      const isCurrent = this.captureImportRequest('download')
      const download = [downloadTopicGeneralTemplate, downloadTopicCompulsoryTemplateWithCatalog, downloadTopicTemplateWithCatalog][this.importStandardType]
      const payload = this.buildImportTemplatePayload()
      this.importDownloadLoading = true
      try {
        const blob = await download(payload)
        if (!isCurrent()) return
        await this.validateImportTemplateBlob(blob)
        if (isCurrent()) this.saveImportTemplateBlob(blob)
      } catch (error) {
        if (isCurrent()) this.$message.error(error.message || '模板下载失败，请稍后重试')
      } finally {
        if (isCurrent()) this.importDownloadLoading = false
      }
    },
    async confirmImport() {
      if (this.importLoading || this.importDownloadLoading || !this.validateImportConditions()) return
      if (!this.importForm.file) {
        this.$message.warning('请选择导入文件')
        return
      }
      // 上传只提交 file；分类参数在 Query，目录和题型取文件内快照。
      const formData = new FormData()
      formData.append('file', this.importForm.file)
      const params = this.buildImportQuery()
      const isCurrent = this.captureImportRequest('upload')
      const importQuestions = [importTopicGeneralQuestions, importTopicCompulsoryQuestions, importTopicQuestions][this.importStandardType]
      this.importLoading = true
      try {
        const result = await importQuestions(formData, params)
        if (!isCurrent()) return
        const importResult = this.normalizeImportResult(result)
        this.importLoading = false
        this.importVisible = false
        this.$message.success(`导入完成：共 ${importResult.totalRows} 行，成功 ${importResult.successCount} 行，失败 ${importResult.failureCount} 行`)
        this.showImportFailures(importResult)
        if (this.sourceTab === '自有题库') {
          this.page = 1
          if (this.hasSearched) await this.searchQuestions()
        }
      } catch (error) {
        if (!isCurrent()) return
        const result = error && (error.data || (error.response && error.response.data && error.response.data.data))
        if (result) this.showImportFailures(result)
        this.$message.error(error.message || '导入失败，请检查文件后重试')
      } finally {
        if (isCurrent()) this.importLoading = false
      }
    },
    ensureGroup(groupIndex) {
      return this.paperGroups[groupIndex] || null
    },
    selectMotherTarget(groupIndex) {
      this.activeTarget = { type: 'mother', groupIndex, childIndex: -1 }
      // this.$message.info('已选中母题位置，请从左侧题目列表点击“导入母题”')
    },
    importAsMother(question) {
      let groupIndex = this.activeTarget.type === 'mother' ? this.activeTarget.groupIndex : -1
      const targetGroup = this.ensureGroup(groupIndex)
      if (!targetGroup || targetGroup.mother) {
        groupIndex = this.paperGroups.findIndex(group => !group.mother)
      }
      if (groupIndex < 0 || groupIndex >= this.motherLimit) {
        this.$message.warning(`最多只能导入 ${this.motherLimit} 道母题`)
        return
      }
      const group = this.ensureGroup(groupIndex)
      if (!this.validateQuestionPlacement(question, 'mother', groupIndex)) return
      this.$set(group, 'mother', { ...question })
      group.expanded = true
      this.activeTarget = { type: 'child', groupIndex, childIndex: group.children.findIndex(item => !item) }
      this.$message.success(`已导入母题 ${groupIndex + 1}`)
    },
    importAsChild(question) {
      let groupIndex = this.activeTarget.groupIndex
      let childIndex = this.activeTarget.type === 'child' ? this.activeTarget.childIndex : -1
      const group = this.ensureGroup(groupIndex)
      if (!group) {
        this.$message.warning('请选择子题位置')
        return
      }
      if (childIndex < 0 || group.children[childIndex]) {
        childIndex = group.children.findIndex(item => !item)
      }
      if (childIndex < 0) {
        this.$message.warning('当前母题的子题位置已满')
        return
      }
      if (!this.validateQuestionPlacement(question, 'child', groupIndex, childIndex)) return
      this.$set(group.children, childIndex, { ...question })
      const nextIndex = group.children.findIndex(item => !item)
      this.activeTarget = { type: 'child', groupIndex, childIndex: nextIndex }
      this.$message.success(`已导入子题 ${childIndex + 1}`)
    },
    handleChildSlot(groupIndex, childIndex, child) {
      if (child) {
        this.previewQuestion(child)
        return
      }
      this.activeTarget = { type: 'child', groupIndex, childIndex }
      // this.$message.info('已选中子题位置，请从左侧题目列表点击“导入子题”')
    },
    isChildTarget(groupIndex, childIndex) {
      return this.activeTarget.type === 'child' &&
        this.activeTarget.groupIndex === groupIndex &&
        this.activeTarget.childIndex === childIndex
    },
    isMotherTarget(groupIndex) {
      return this.activeTarget.type === 'mother' &&
        this.activeTarget.groupIndex === groupIndex
    },
    removeMother(groupIndex) {
      const group = this.paperGroups[groupIndex]
      this.$set(group, 'mother', null)
      this.$set(group, 'children', group.children.map(() => null))
      this.activeTarget = { type: 'mother', groupIndex, childIndex: -1 }
    },
    removeChild(groupIndex, childIndex) {
      this.$set(this.paperGroups[groupIndex].children, childIndex, null)
      this.activeTarget = { type: 'child', groupIndex, childIndex }
    },
    async clearAllSelectedQuestions() {
      if (!this.hasSelectedQuestions) return

      try {
        await this.$confirm(
          '是否确认清空所有选择的母题和子题？',
          '确认清空',
          {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      } catch (error) {
        return
      }

      this.paperGroups.forEach(group => {
        this.$set(group, 'mother', null)
        this.$set(group, 'children', group.children.map(() => null))
      })
      this.activeTarget = { type: 'mother', groupIndex: 0, childIndex: -1 }
      this.previewVisible = false
      this.closeQuestionEditor()
      this.$message.success('已清空所有选择的母题和子题')
    },
    addMotherQuestion() {
      const groupIndex = this.paperGroups.length
      this.paperGroups.push(createPaperGroup(groupIndex + 1))
      this.activeTarget = { type: 'mother', groupIndex, childIndex: -1 }
    },
    addChildQuestion() {
      if (!this.paperGroups.length) {
        this.$message.warning('请先新增母题')
        return
      }
      let firstNewChildIndex = -1
      this.paperGroups.forEach(group => {
        const childIndex = group.children.length
        group.children.push(null)
        group.expanded = true
        if (firstNewChildIndex < 0) firstNewChildIndex = childIndex
      })
      this.activeTarget = { type: 'child', groupIndex: 0, childIndex: firstNewChildIndex }
    },
    previewQuestion(question) {
      this.previewQuestionData = question || {}
      this.previewZIndex = PopupManager.nextZIndex()
      this.previewVisible = true
    },
    openQuestionEditor(question, type, groupIndex, childIndex = -1) {
      this.editingQuestion = {
        ...question,
        name: question.name || '',
        optionA: question.optionA || '',
        optionB: question.optionB || '',
        optionC: question.optionC || '',
        optionD: question.optionD || '',
        optionE: question.optionE || '',
        answer: question.answer || '',
        analysis: question.analysis || '',
        knowledgeName: question.knowledgeName || ''
      }
      this.editingTarget = { type, groupIndex, childIndex }
      // 与 Element UI 提示共享层级，确保后续校验和接口消息显示在遮罩上方。
      this.editZIndex = PopupManager.nextZIndex()
      this.editVisible = true
    },
    closeQuestionEditor() {
      if (this.bankAddSaving) return
      this.bankAddQuestion = null
      this.editVisible = false
      this.editingQuestion = {}
      this.editingTarget = { type: '', groupIndex: -1, childIndex: -1 }
    },
    saveEditedQuestion() {
      if (this.bankAddSaving) return
      if (this.isBlankContent(this.editingQuestion.name)) {
        this.$message.warning('请输入题目')
        return
      }
      if (this.showEditingOptionEditors) {
        if (this.isBlankContent(this.editingQuestion.optionA)) {
          this.$message.warning('请输入选项 A')
          return
        }
        if (this.isBlankContent(this.editingQuestion.optionB)) {
          this.$message.warning('请输入选项 B')
          return
        }
      }
      const { type, groupIndex, childIndex } = this.editingTarget
      if (type === 'cloudBank' || type === 'aiBank') {
        return this.submitBankAddEditor(this.editingQuestion)
      }
      const group = this.ensureGroup(groupIndex)
      if (!group) return
      const question = {
        ...this.editingQuestion
      }
      if (type === 'mother') {
        this.$set(group, 'mother', question)
      } else if (type === 'child' && childIndex >= 0) {
        this.$set(group.children, childIndex, question)
      }
      this.closeQuestionEditor()
      this.$message.success('题目修改成功')
    },
    createUniqueId() {
      if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID()
      }
      return `${Date.now()}-${Math.random().toString(16).slice(2)}`
    },
    buildChildImportRequest(group, num) {
      const mother = group && group.mother
      if (!mother) return null
      const id = mother.id || mother.questId
      const subjectId = mother.subjectId || (this.questionEduType(mother) === '专升本'
        ? this.zsb.subjectId
        : this.lastValue(this.k12.subjectPath))
      const pointId = mother.pointId || mother.treeId
      const knowledge = mother.knowledge || mother.knowledgeId
      const pointName = mother.pointName
      const knowledgeName = mother.knowledgeName
      if (!id || !num) return null
      return {
        id: String(id),
        subjectId: String(subjectId || ''),
        pointId: String(pointId),
        knowledge: String(knowledge),
        knowledgeName: String(knowledgeName),
        pointName: String(pointName),
        questTemplateId: mother.questTemplateId || mother.questType || '',
        matchQuestType: this.matchQuestType ? 1 : 0,
        allowRepeat: this.allowRepeat ? 1 : 0,
        uniqueId: this.createUniqueId(),
        num
      }
    },
    async autoImportQuestions() {
      const importTasks = this.paperGroups
        .map((group, groupIndex) => {
          const emptyIndexes = group.children.reduce((indexes, child, index) => {
            if (!child) indexes.push(index)
            return indexes
          }, [])
          const request = this.buildChildImportRequest(group, emptyIndexes.length)
          return request ? { groupIndex, emptyIndexes, request, eduType: this.questionEduType(group.mother) } : null
        })
        .filter(Boolean)

      if (!importTasks.length) {
        this.$message.warning('请先导入母题，并确保母题有章节和知识点信息')
        return
      }

      this.autoImportLoading = true
      try {
        // 混合母题按自身类型分组调用两套接口，不能用当前学习赛道统一选接口。
        const batches = ['K9K12', '专升本'].map(eduType => ({
          eduType,
          requests: importTasks.filter(task => task.eduType === eduType).map(task => task.request)
        })).filter(batch => batch.requests.length)
        const results = await Promise.all(batches.map(batch => (
          batch.eduType === '专升本'
            ? getQuestListByKnowledgeByUpgrade(batch.requests)
            : getQuestListByKnowledge(batch.requests)
        )))
        const rows = results.flatMap(result => result || [])
        // 接口按 uniqueId 对应请求，合并两批结果后仍能准确回填各母题的空位。
        const resultMap = new Map((rows || []).map(item => [String(item.uniqueId), item.questList || []]))
        let totalImportCount = 0

        importTasks.forEach(task => {
          const group = this.ensureGroup(task.groupIndex)
          if (!group) return
          const questList = resultMap.get(String(task.request.uniqueId)) || []
          const importCount = Math.min(task.emptyIndexes.length, questList.length)
          task.emptyIndexes.slice(0, importCount).forEach((childIndex, index) => {
            this.$set(group.children, childIndex, this.withQuestionContext(questList[index], null, task.eduType))
          })
          group.expanded = true
          totalImportCount += importCount
        })

        const firstGroupIndex = this.paperGroups.findIndex(group => group.children.some(child => !child))
        this.activeTarget = {
          type: 'child',
          groupIndex: firstGroupIndex >= 0 ? firstGroupIndex : 0,
          childIndex: firstGroupIndex >= 0 ? this.paperGroups[firstGroupIndex].children.findIndex(child => !child) : -1
        }
        if(totalImportCount ==0){
          this.$message.warning('暂无子题支持导入')
          return
        }
        this.$message.success(`已自动导入 ${totalImportCount} 道子题`)
      } catch (error) {
        // 请求层已统一展示后端错误信息
      } finally {
        this.autoImportLoading = false
      }
    },
    async autoImportGroupChildren(groupIndex) {
      const group = this.ensureGroup(groupIndex)
      if (!group) return
      const emptyIndexes = group.children.reduce((indexes, child, index) => {
        if (!child) indexes.push(index)
        return indexes
      }, [])
      if (!emptyIndexes.length) {
        this.$message.warning('该母题的子题位置已满')
        return
      }
      const requestItem = this.buildChildImportRequest(group, emptyIndexes.length)
      if (!requestItem) {
        this.$message.warning('请先导入母题，并确保母题有章节和知识点信息')
        return
      }

      this.autoImportLoading = true
      try {
        const eduType = this.questionEduType(group.mother)
        const getChildQuestions = eduType === '专升本'
          ? getQuestListByKnowledgeByUpgrade
          : getQuestListByKnowledge
        const rows = await getChildQuestions([requestItem])
        const matched = (rows || []).find(item => String(item.uniqueId) === String(requestItem.uniqueId)) || {}
        const questList = matched.questList || []
        const importCount = Math.min(emptyIndexes.length, questList.length)
        if (!importCount) {
          this.$message.warning('暂无子题支持导入')
          return
        }

        emptyIndexes.slice(0, importCount).forEach((childIndex, index) => {
          this.$set(group.children, childIndex, this.withQuestionContext(questList[index], null, eduType))
        })
        const nextIndex = group.children.findIndex(child => !child)
        this.activeTarget = { type: 'child', groupIndex, childIndex: nextIndex }
        this.$message.success(`母题 ${groupIndex + 1} 已导入 ${importCount} 道子题`)
      } catch (error) {
        // 请求层已统一展示后端错误信息
      } finally {
        this.autoImportLoading = false
      }
    },
    normalizeQuestType(question) {
      const value = String(question.questType || question.questTypeCode || '')
      if (/^[1-7]$/.test(value)) return value
      const typeName = question.questTypeName || question.questTemplateName || ''
      const typeMap = [
        ['多选', '2'],
        ['单选', '1'],
        ['判断', '3'],
        ['填空', '4'],
        ['简答', '5'],
        ['计算', '6'],
        ['论述', '7']
      ]
      const matched = typeMap.find(([name]) => typeName.includes(name))
      return matched ? matched[1] : value
    },
    buildPublishTopic(question, serialNumber) {
      // 发布使用字段白名单，避免将题目内部类型、上下文及交互状态提交给后端。
      const editableFields = [
        'intehubId', 'sourceQuestionId',
        'institutionId', 'examConfigId', 't1Id', 'name', 'subjectId', 'subjectName',
        'difficultyId', 'difficultyName', 'bookId', 'bookName', 'knowledgeId',
        'knowledgeName', 'pointId', 'pointName', 'typeId', 'typeName',
        'questTemplateId', 'questTemplateName', 'material', 'answer', 'analysis',
        'optionA', 'optionB', 'optionC', 'optionD', 'optionE', 'isAi'
      ]
      const topic = editableFields.reduce((result, field) => {
        if (question[field] !== undefined && question[field] !== null) {
          result[field] = question[field]
        }
        return result
      }, {})
      topic.questType = this.normalizeQuestType(question)
      topic.serialNumber = serialNumber
      // 逐题处理年级字段，专升本清空 typeId，小初高保留原有年级。
      if (this.questionEduType(question) === '专升本') topic.typeId = ''
      return topic
    },
    buildPublishPayload(publishConfig = this.practiceConfig) {
      const authInfo = getAuthInfo() || {}
      // 发布科目优先取当前有效筛选，云端按科目类型读取；未选时回退首道母题。
      const selectedSubjectId = this.sourceTab === 'AI出题'
        ? (this.aiSubject ? this.aiSubject.id : '')
        : this.sourceTab === '自有题库' ? (this.ownSubject ? this.ownSubject.id : '')
        : this.activeFilterEduType === '专升本'
        ? this.zsb.subjectId
        : this.lastValue(this.k12.subjectPath)
      const firstPaperQuestion = this.paperGroups.find(group => group.mother)
      const generatedSubjectId = firstPaperQuestion && firstPaperQuestion.mother
        ? firstPaperQuestion.mother.subjectId
        : ''
      const generatedSubjectName = firstPaperQuestion && firstPaperQuestion.mother
        ? firstPaperQuestion.mother.subjectName
        : ''
      const subjectId = selectedSubjectId || generatedSubjectId
      const selectedSubject = this.sourceTab === 'AI出题'
        ? (this.aiSubject || {})
        : this.sourceTab === '自有题库' ? (this.ownSubject || {})
        : this.activeFilterEduType === '专升本'
        ? this.subjectOptions.find(item => String(item.id) === String(subjectId)) || {}
        : this.findK12Subject(subjectId)
      const subjectName = selectedSubject.label || selectedSubject.otherName ||
        selectedSubject.name ||
        generatedSubjectName ||
        this.practiceConfig.subject ||
        ''
      let serialNumber = 1
      const topics = this.paperGroups
        .filter(group => group.mother)
        .map(group => {
          const topic = this.buildPublishTopic(group.mother, serialNumber++)
          topic.children = group.children
            .filter(Boolean)
            .map(child => this.buildPublishTopic(child, serialNumber++))
          return topic
        })
      const students = (publishConfig.students || []).map(student => {
        const userId = String(student.userId || student.studentId || student.id || '')
        return {
          ...student,
          id: String(student.id || userId),
          userId,
          userName: student.studentName || student.name || ''
        }
      })

      return {
        t1Id: this.practiceEntrySource === 'teacher-home'
          ? ''
          : String(authInfo.t1Id || authInfo.liveId || ''),
        name: publishConfig.name || '',
        subjectId: String(subjectId || this.practiceConfig.subjectId || ''),
        students,
        examDurationMinutes: Number(publishConfig.duration),
        topicInitScore: Number(publishConfig.score),
        errorTopicPushNum: Number(publishConfig.wrongCount),
        topics
      }
    },
    publishPractice() {
      const allMothersEmpty = this.paperGroups.every(group => !group.mother)
      if (allMothersEmpty) {
        this.$message.warning('母题不能全部为空')
        return
      }

      const invalidGroupIndex = this.paperGroups.findIndex(
        group => !group.mother && group.children.some(Boolean)
      )
      if (invalidGroupIndex !== -1) {
        this.$message.warning(`母题 ${invalidGroupIndex + 1} 为空，请先补充母题或删除其子题`)
        return
      }

      const currentConfig = Object.keys(this.publishConfirmConfig).length
        ? this.publishConfirmConfig
        : this.practiceConfig
      this.publishConfirmConfig = {
        ...currentConfig,
        entrySource: this.practiceEntrySource,
        students: (currentConfig.students || []).map(student => ({ ...student }))
      }
      this.publishConfirmVisible = true
    },
    closePublishConfirmation() {
      if (this.publishing) return
      this.publishConfirmVisible = false
    },
    async confirmPublishPractice(config) {
      if (this.publishing) return
      this.publishConfirmConfig = {
        ...config,
        entrySource: this.practiceEntrySource,
        students: (config.students || []).map(student => ({ ...student }))
      }
      savePracticeRouteConfig(this.publishConfirmConfig)
      this.publishing = true
      try {
        await publishAfterQuiz(this.buildPublishPayload(this.publishConfirmConfig))
        this.publishConfirmVisible = false
        this.$message.success('练习发布成功')
        this.handleBack()
      } catch (error) {
        // 请求层已统一展示后端错误信息
      } finally {
        this.publishing = false
      }
    }
  }
}
</script>

<style scoped src="./createPrectice.css"></style>

<style src="./createPrectice.global.css"></style>
