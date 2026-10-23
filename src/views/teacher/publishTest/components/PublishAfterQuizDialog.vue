<template>
  <div class="publish-dialog-mask">
    <section class="publish-dialog" role="dialog" aria-modal="true" aria-labelledby="publish-dialog-title">
      <header class="publish-dialog-header">
        <div>
          <h3 id="publish-dialog-title">{{ dialogTitle }}</h3>
          <p>设置课后测信息，并选择接收班级</p>
        </div>
        <button type="button" aria-label="关闭" @click="$emit('close')">
          <i class="el-icon-close"></i>
        </button>
      </header>

      <div class="publish-dialog-body">
        <label v-if="showTitle" class="title-field">
          <span>标题</span>
          <input v-model.trim="form.name" type="text" maxlength="50" placeholder="请输入课后测标题">
        </label>

        <div class="subject-field">
          <label for="publish-subject">学段 / 科目 <span class="required-mark">*</span></label>
          <el-cascader
            id="publish-subject"
            v-model="subjectPath"
            class="subject-picker"
            :options="subjectOptions"
            :props="{ expandTrigger: 'hover', checkStrictly: false }"
            :disabled="subjectLoading || submitting"
            clearable
            filterable
            aria-required="true"
            :placeholder="subjectLoading ? '正在加载学段及科目' : '请选择学段及科目'"
          />
          <div v-if="!subjectLoading && (subjectLoadError || !subjectOptions.length)" class="subject-tip">
            <span>{{ subjectLoadError ? '学段科目加载失败' : '暂无可选学段及科目' }}</span>
            <button type="button" @click="loadSubjectOptions">重新加载</button>
          </div>
        </div>

        <div v-if="showNumbers" class="number-grid">
          <label v-for="field in numberFields" :key="field.key">
            <span>{{ field.label }}</span>
            <span class="number-field">
              <input v-model.number="form[field.key]" type="number" min="1">
              <button type="button" aria-label="减少" @click="adjustNumber(field.key, -1)">−</button>
              <button type="button" aria-label="增加" @click="adjustNumber(field.key, 1)">+</button>
            </span>
          </label>
        </div>

        <div class="dialog-divider"></div>

        <div class="student-heading">
          <div>
            <strong>选择班级</strong>
            <span>课后测将发布给班级内全部学生</span>
          </div>
        </div>

        <el-select
          v-model="selectedClassId"
          class="class-picker"
          clearable
          filterable
          :loading="classLoading"
          :disabled="classLoading"
          placeholder="请选择班级"
          @change="handleClassChange"
        >
          <el-option
            v-for="item in classOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          >
            <span>{{ item.name }}</span>
            <span v-if="item.studentCount !== null" class="class-option-count">{{ item.studentCount }} 人</span>
          </el-option>
        </el-select>

        <div v-if="pickerLoading" class="student-loading">
          <i class="el-icon-loading"></i>
          <span>正在加载班级学生...</span>
        </div>

        <div v-else-if="selectedClassId && selectedStudents.length" class="selected-summary">
          <span class="selected-class-name">{{ selectedClassName }}</span>
          <span>共 {{ selectedStudents.length }} 名学生</span>
        </div>

        <div v-if="!pickerLoading && visibleStudents.length" class="selected-students">
          <span v-for="student in visibleStudents" :key="student.id">{{ student.name }}</span>
          <span v-if="selectedStudents.length > visibleStudents.length" class="student-more">
            +{{ selectedStudents.length - visibleStudents.length }}
          </span>
        </div>

        <div v-else-if="!pickerLoading && selectedClassId" class="empty-class-tip">该班级暂无学生</div>
      </div>

      <footer class="publish-dialog-footer">
        <span>
          已选 <strong>{{ selectedClassId ? 1 : 0 }}</strong> 个班级，
          共 <strong>{{ selectedStudents.length }}</strong> 名学生
        </span>
        <button class="cancel-button" type="button" :disabled="submitting" @click="$emit('close')">取消</button>
        <button class="confirm-button" type="button" :disabled="submitting || pickerLoading || subjectLoading" @click="confirm">
          {{ submitting ? '发布中...' : '确定' }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script>
import { getClassList, getClassStudents } from '@/api/modules/teacher'
import { getAfterQuizIntehubToken, getTeachingCloudOptions, getTeachingCloudUpgradeSubjectList } from '@/api/quizBuilder'
import { getAuthInfo } from '@/utils/auth'
import { buildBankSubjectOptions, normalizeK12SubjectOptions } from '@/utils/quizSubjects'
import { normalizeZsbSubjectOptions } from '@/utils/zsbSubjects'

export default {
  name: 'PublishAfterQuizDialog',
  props: {
    initialConfig: {
      type: Object,
      default: () => ({})
    },
    showTitle: {
      type: Boolean,
      default: true
    },
    showNumbers: {
      type: Boolean,
      default: true
    },
    requireStudents: {
      type: Boolean,
      default: true
    },
    dialogTitle: {
      type: String,
      default: '发布课后测'
    },
    submitting: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      subjectLoading: false,
      subjectLoadError: false,
      subjectOptions: [],
      subjectPath: [],
      subjectRequestId: 0,
      classLoading: false,
      pickerLoading: false,
      classOptions: [],
      selectedClassId: '',
      selectedStudents: [],
      studentRequestId: 0,
      numberFields: [
        { key: 'originalCount', label: '原题数量' },
        { key: 'wrongCount', label: '错题推送量' },
        { key: 'score', label: '每题分数' },
        { key: 'duration', label: '做题时间（分）' }
      ],
      form: {
        name: '',
        originalCount: 10,
        wrongCount: 3,
        score: 5,
        duration: 30
      }
    }
  },
  computed: {
    selectedSubject() {
      const group = this.subjectOptions.find(item => item.value === this.subjectPath[0])
      if (!group || this.subjectPath.length !== (group.eduType === '专升本' ? 3 : 2)) return null
      let nodes = this.subjectOptions
      let selected = null
      for (const value of this.subjectPath) {
        selected = nodes.find(item => item.value === value)
        if (!selected || selected.disabled) return null
        nodes = selected.children || []
      }
      return selected && !nodes.length && selected.value && !selected.isSubjectGroup ? selected : null
    },
    selectedClassName() {
      const selected = this.classOptions.find(item => item.id === this.selectedClassId)
      return selected ? selected.name : String(this.initialConfig.className || '')
    },
    visibleStudents() {
      return this.selectedStudents.slice(0, 12)
    }
  },
  created() {
    const config = this.initialConfig || {}
    const numberValue = (key, fallback) => {
      const value = Number(config[key])
      return Number.isFinite(value) && value > 0 ? value : fallback
    }
    this.form = {
      name: String(config.name || ''),
      originalCount: numberValue('originalCount', 10),
      wrongCount: numberValue('wrongCount', 3),
      score: numberValue('score', 5),
      duration: numberValue('duration', 30)
    }
    if (process.env.NODE_ENV === 'development' && !this.form.name) {
      this.form.name = '测试' + new Date().toISOString().slice(0, 19).replace('T', '_')
    }
    this.selectedClassId = String(config.classId || '')
    this.selectedStudents = (Array.isArray(config.students) ? config.students : [])
      .filter(Boolean)
      .map(this.normalizeStudent)
      .filter(student => student.id)
    this.subjectPath = Array.isArray(config.subjectPath) ? config.subjectPath.map(String) : []
    this.loadSubjectOptions()
    this.loadClassOptions()
  },
  beforeDestroy() {
    this.subjectRequestId += 1
    this.studentRequestId += 1
  },
  methods: {
    async loadSubjectOptions() {
      const requestId = ++this.subjectRequestId
      this.subjectLoading = true
      this.subjectLoadError = false
      try {
        const { institutionId } = await getAfterQuizIntehubToken()
        if (requestId !== this.subjectRequestId) return
        const authInfo = getAuthInfo() || {}
        const params = { isHome: 0, institutionId }
        const [k12Groups, zsbGroups] = await Promise.all([
          getTeachingCloudOptions('/home/getCompulsorySubjectList', params),
          String(authInfo.isInternalOrganization) !== '1'
            ? getTeachingCloudUpgradeSubjectList(params)
            : Promise.resolve([])
        ])
        if (requestId !== this.subjectRequestId) return
        this.subjectOptions = buildBankSubjectOptions(
          normalizeK12SubjectOptions(k12Groups), normalizeZsbSubjectOptions(zsbGroups)
        )
        this.restoreSubjectSelection()
      } catch (error) {
        if (requestId !== this.subjectRequestId) return
        console.error('加载学段科目失败', error)
        this.subjectOptions = []
        this.subjectLoadError = true
      } finally {
        if (requestId === this.subjectRequestId) this.subjectLoading = false
      }
    },
    restoreSubjectSelection() {
      const subjectId = String(this.initialConfig.subjectId || '')
      if (this.selectedSubject && (!subjectId || this.selectedSubject.value === subjectId)) return
      const findPath = (nodes, path = []) => {
        for (const node of nodes) {
          const nextPath = [...path, node.value]
          if (node.children && node.children.length) {
            const result = findPath(node.children, nextPath)
            if (result) return result
          } else if (subjectId && node.value === subjectId) {
            return nextPath
          }
        }
        return null
      }
      this.subjectPath = findPath(this.subjectOptions) || []
      if (!this.selectedSubject) this.subjectPath = []
    },
    adjustNumber(key, delta) {
      const value = Number(this.form[key])
      this.form[key] = Math.max(1, (Number.isFinite(value) ? value : 1) + delta)
    },
    responseRows(response) {
      const payload = response && response.data !== undefined ? response.data : response
      if (Array.isArray(payload)) return payload
      if (!payload || typeof payload !== 'object') return []
      return payload.rows || payload.records || payload.list || []
    },
    async loadClassOptions() {
      this.classLoading = true
      try {
        const response = await getClassList()
        this.classOptions = this.responseRows(response).map(item => ({
          id: String(item.classId || item.id || ''),
          name: String(item.classAlias || item.className || item.name || ''),
          studentCount: item.studentCount == null ? null : Number(item.studentCount)
        })).filter(item => item.id && item.name)

        if (this.selectedClassId) {
          await this.loadClassStudents(this.selectedClassId)
        }
      } catch (error) {
        console.error('加载班级列表失败', error)
        this.$message.warning('班级列表加载失败，请重试')
      } finally {
        this.classLoading = false
      }
    },
    handleClassChange(classId) {
      this.selectedStudents = []
      if (!classId) {
        this.studentRequestId += 1
        this.pickerLoading = false
        return
      }
      this.loadClassStudents(classId)
    },
    async loadClassStudents(classId) {
      const requestId = ++this.studentRequestId
      this.pickerLoading = true
      try {
        const response = await getClassStudents(classId)
        if (requestId !== this.studentRequestId) return
        this.selectedStudents = this.responseRows(response)
          .map(this.normalizeStudent)
          .filter(student => student.id)
      } catch (error) {
        if (requestId !== this.studentRequestId) return
        console.error('加载班级学生失败', error)
        this.selectedStudents = []
        this.$message.warning('班级学生加载失败，请重试')
      } finally {
        if (requestId === this.studentRequestId) this.pickerLoading = false
      }
    },
    normalizeStudent(student) {
      const id = String(student.studentId || student.userId || student.id || '')
      const userId = String(student.userId || student.studentId || student.id || '')
      const name = String(student.studentName || student.realName || student.name || student.userName || id)
      return {
        ...student,
        id,
        userId,
        studentName: name,
        name,
        avatar: student.avatar || student.profilePicture || ''
      }
    },
    confirm() {
      if (this.submitting || this.pickerLoading || this.subjectLoading) return
      if (this.showTitle && !this.form.name) {
        this.$message.warning('请输入标题')
        return
      }
      if (!this.selectedSubject) {
        this.$message.warning('请选择学段及科目至最后一级')
        return
      }
      const invalidField = this.showNumbers && this.numberFields.find(field => {
        const value = Number(this.form[field.key])
        return !Number.isFinite(value) || value <= 0
      })
      if (invalidField) {
        this.$message.warning(`请输入${invalidField.label}`)
        return
      }
      if (!this.selectedClassId) {
        this.$message.warning('请选择班级')
        return
      }
      if (this.requireStudents && !this.selectedStudents.length) {
        this.$message.warning('所选班级暂无学生')
        return
      }

      this.$emit('confirm', {
        ...this.initialConfig,
        ...this.form,
        subjectId: String(this.selectedSubject.value),
        subjectName: this.selectedSubject.label,
        subjectPath: [...this.subjectPath],
        classId: this.selectedClassId,
        className: this.selectedClassName,
        studentIds: this.selectedStudents.map(student => student.id),
        students: this.selectedStudents.map(student => ({ ...student })),
        entrySource: this.initialConfig.entrySource || 'teacher-home'
      })
    }
  }
}
</script>

<style scoped>
.publish-dialog-mask {
  position: fixed;
  z-index: 2000;
  inset: 0;
  display: flex;
  padding: 24px;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  background: rgba(63, 76, 91, 0.47);
}

.publish-dialog {
  display: flex;
  width: min(680px, 100%);
  max-height: calc(100vh - 48px);
  overflow: hidden;
  flex-direction: column;
  border: 1px solid #dce5ed;
  border-radius: 15px;
  color: #66778a;
  background: #fff;
  box-shadow: 0 14px 38px rgba(35, 51, 68, 0.18);
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

.publish-dialog-header {
  position: relative;
  display: flex;
  padding: 18px 24px 15px;
  flex: 0 0 auto;
  border-bottom: 1px solid #e8eef3;
}

.publish-dialog-header h3 {
  margin: 0 0 3px;
  color: #29394b;
  font-size: 20px;
  line-height: 30px;
}

.publish-dialog-header p {
  margin: 0;
  color: #93a2b2;
  font-size: 13px;
  line-height: 20px;
}

.publish-dialog-header > button {
  position: absolute;
  top: 17px;
  right: 18px;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  color: #8c9aa9;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
}

.publish-dialog-body {
  min-height: 0;
  padding: 20px 24px 22px;
  overflow-y: auto;
}

.title-field,
.subject-field,
.number-grid label {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.title-field > span,
.subject-field > label,
.number-grid label > span:first-child {
  color: #6e7f91;
  font-size: 13px;
  line-height: 20px;
}

.title-field > input {
  height: 40px;
  padding: 0 12px;
  box-sizing: border-box;
  border: 1px solid #d4e0ea !important;
  border-radius: 7px;
  outline: none;
  color: #3e4b5c;
  background: #fff !important;
  font: inherit;
}

.title-field > input:focus,
.number-field:focus-within {
  border-color: #1F7CFF !important;
}

.title-field > input::placeholder {
  color: #a4afbb !important;
  font-size: 12px !important;
}

.number-grid {
  display: grid;
  margin-top: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.subject-field {
  margin-top: 16px;
}

.required-mark {
  color: #f56c6c;
}

.subject-picker {
  width: 100%;
}

.subject-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8795a5;
  font-size: 12px;
}

.subject-tip button {
  padding: 0;
  border: 0;
  color: #1F7CFF;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.number-field {
  display: flex;
  height: 38px;
  box-sizing: border-box;
  align-items: center;
  border: 1px solid #d4e0ea;
  border-radius: 7px;
}

.number-field input {
  min-width: 0;
  height: 100%;
  padding: 0 8px;
  flex: 1;
  border: 0;
  outline: none;
  color: #3e4b5c;
  background: transparent;
  font: inherit;
}

.number-field input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.number-field input::-webkit-inner-spin-button,
.number-field input::-webkit-outer-spin-button {
  margin: 0;
  -webkit-appearance: none;
}

.number-field button {
  width: 25px;
  height: 100%;
  padding: 0;
  border: 0;
  color: #1F7CFF;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}

.dialog-divider {
  height: 1px;
  margin: 20px 0 16px;
  background: #e8eef3;
}

.student-heading > div {
  display: flex;
  align-items: center;
  gap: 9px;
}

.student-heading strong {
  color: #29394b;
  font-size: 15px;
}

.student-heading span {
  color: #9aa6b5;
  font-size: 12px;
}

.class-picker {
  width: 100%;
  margin-top: 12px;
}

.class-picker ::v-deep .el-input__inner,
.subject-picker ::v-deep .el-input__inner {
  border: 1px solid #d4e0ea !important;
  background: #fff !important;
}

.class-picker ::v-deep .el-input__inner:focus,
.class-picker ::v-deep .el-input.is-focus .el-input__inner,
.subject-picker ::v-deep .el-input__inner:focus,
.subject-picker ::v-deep .el-input.is-focus .el-input__inner {
  border-color: #1F7CFF !important;
}

.class-option-count {
  float: right;
  color: #9aa6b5;
  font-size: 12px;
}

.student-loading,
.empty-class-tip,
.selected-summary {
  display: flex;
  min-height: 38px;
  margin-top: 12px;
  align-items: center;
  gap: 8px;
  color: #8795a5;
  font-size: 13px;
}

.selected-summary {
  justify-content: space-between;
  color: #7b8998;
}

.selected-class-name {
  color: #3e4b5c;
  font-weight: 600;
}

.empty-class-tip {
  justify-content: center;
  border: 1px dashed #dce5ed;
  border-radius: 7px;
}

.selected-students {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.selected-students > span {
  height: 30px;
  padding: 0 11px;
  border: 1px solid #BBD8FF;
  border-radius: 16px;
  color: #1F7CFF;
  background: #EFF6FF;
  font-size: 13px;
  line-height: 30px;
}

.selected-students .student-more {
  border-color: #d9dfe7;
  color: #7b8998;
  background: #f5f7fa;
}

.publish-dialog-footer {
  display: flex;
  min-height: 68px;
  padding: 0 24px;
  box-sizing: border-box;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #e8eef3;
}

.publish-dialog-footer > span {
  margin-right: auto;
  color: #8693a2;
  font-size: 13px;
}

.publish-dialog-footer strong {
  color: #1F7CFF;
}

.publish-dialog-footer button {
  min-width: 78px;
  height: 36px;
  padding: 0 18px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.publish-dialog-footer button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.cancel-button {
  border: 1px solid #d5e0e9;
  color: #657587;
  background: #fff;
}

.confirm-button {
  border: 1px solid #1F7CFF;
  color: #fff;
  background: #1F7CFF;
}

@media (max-width: 600px) {
  .publish-dialog-mask {
    padding: 12px;
  }

  .publish-dialog {
    max-height: calc(100vh - 24px);
  }

  .publish-dialog-header,
  .publish-dialog-body {
    padding-right: 16px;
    padding-left: 16px;
  }

  .number-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .student-heading > div {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .publish-dialog-footer {
    padding: 0 16px;
  }

  .publish-dialog-footer > span {
    display: none;
  }
}
</style>
