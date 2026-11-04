<template>
  <div class="feedback-page">
    <div class="feedback-header">
      <button
        type="button"
        class="feedback-back"
        aria-label="返回设置"
        :disabled="submitting"
        @click="handleBack"
      >
        <i class="el-icon-arrow-left" aria-hidden="true"></i>
      </button>
      <div>
        <h2 class="feedback-title">问题反馈</h2>
        <p class="feedback-subtitle">请描述您遇到的问题，我们会尽快处理。</p>
      </div>
    </div>

    <form class="feedback-card" novalidate @submit.prevent="handleSubmit">
      <div class="feedback-field-header">
        <label for="feedback-content" class="feedback-label">
          问题描述 <span class="feedback-required">*</span>
        </label>
        <span class="feedback-hint">必填</span>
      </div>
      <div class="feedback-textarea-wrap" :class="{ 'has-error': contentError }">
        <textarea
          id="feedback-content"
          ref="contentInput"
          v-model="content"
          class="feedback-textarea"
          maxlength="2000"
          required
          aria-required="true"
          :aria-invalid="Boolean(contentError)"
          :aria-describedby="contentError ? 'feedback-content-error' : 'feedback-content-count'"
          :disabled="submitting"
          placeholder="请详细描述遇到的问题、出现的场景或操作步骤，方便我们更快定位。"
          @input="contentError = ''"
        ></textarea>
        <span id="feedback-content-count" class="feedback-word-count">{{ content.length }}/2000</span>
      </div>
      <p v-if="contentError" id="feedback-content-error" class="feedback-error" role="alert">{{ contentError }}</p>

      <div class="feedback-images-section">
        <div class="feedback-field-header">
          <div class="feedback-label">
            上传图片 <span class="feedback-optional">选填</span>
          </div>
          <span class="feedback-hint">{{ images.length }}/9</span>
        </div>
        <p class="feedback-upload-tip">最多上传 9 张图片，便于我们了解问题。</p>
        <input
          ref="imageInput"
          class="feedback-file-input"
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
          aria-label="选择反馈图片"
          multiple
          :disabled="submitting"
          @change="handleImageChange"
        >
        <div class="feedback-image-list">
          <div v-for="(image, index) in images" :key="image.url" class="feedback-image-item">
            <el-image
              class="feedback-image"
              :src="image.url"
              :alt="image.file.name"
              :preview-src-list="previewUrls"
              fit="cover"
            />
            <button
              type="button"
              class="feedback-image-remove"
              :aria-label="'删除图片 ' + image.file.name"
              :disabled="submitting"
              @click="removeImage(index)"
            >
              <i class="el-icon-close" aria-hidden="true"></i>
            </button>
          </div>
          <button
            v-if="images.length < 9"
            type="button"
            class="feedback-upload"
            :disabled="submitting"
            @click="$refs.imageInput.click()"
          >
            <i class="el-icon-plus" aria-hidden="true"></i>
            <span>上传图片</span>
          </button>
        </div>
      </div>

      <div class="feedback-actions">
        <button type="button" class="feedback-cancel" :disabled="submitting" @click="handleBack">取消</button>
        <button type="submit" class="feedback-submit" :disabled="submitting">
          <i v-if="submitting" class="el-icon-loading" aria-hidden="true"></i>
          {{ submitting ? '提交中...' : '提交反馈' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { addFeedback } from '@/api/modules/student'

const IMAGE_EXTENSION = /\.(jpe?g|png|gif|webp|bmp)$/i
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/x-bmp', 'image/x-ms-bmp']

export default {
  name: 'Feedback',
  data() {
    return {
      content: '',
      contentError: '',
      images: [],
      submitting: false
    }
  },
  computed: {
    previewUrls() {
      return this.images.map(image => image.url)
    }
  },
  beforeDestroy() {
    this.clearImages()
  },
  methods: {
    handleBack() {
      if (!this.submitting) this.$emit('back')
    },
    handleImageChange(event) {
      const files = Array.from(event.target.files || [])
      event.target.value = ''
      if (this.submitting) return

      const validFiles = files.filter(file => IMAGE_EXTENSION.test(file.name) && (!file.type || IMAGE_TYPES.includes(file.type.toLowerCase())))
      if (validFiles.length !== files.length) {
        this.$message.warning('仅支持 jpg、jpeg、png、gif、webp、bmp 格式的图片')
      }
      const availableCount = 9 - this.images.length
      if (validFiles.length > availableCount) {
        this.$message.warning('最多上传 9 张图片')
      }
      validFiles.slice(0, availableCount).forEach(file => {
        this.images.push({ file, url: URL.createObjectURL(file) })
      })
    },
    removeImage(index) {
      if (this.submitting) return
      const [image] = this.images.splice(index, 1)
      if (image) URL.revokeObjectURL(image.url)
    },
    clearImages() {
      this.images.forEach(image => URL.revokeObjectURL(image.url))
      this.images = []
    },
    async handleSubmit() {
      if (this.submitting) return
      const content = this.content.trim()
      if (!content || this.content.length > 2000) {
        this.contentError = content ? '反馈内容最多 2000 字' : '请输入问题描述'
        this.$refs.contentInput.focus()
        return
      }

      this.submitting = true
      try {
        const formData = new FormData()
        formData.append('content', content)
        this.images.forEach(image => formData.append('images', image.file))
        await addFeedback(formData)
        this.content = ''
        this.contentError = ''
        this.clearImages()
        this.$message.success('反馈提交成功，感谢您的意见！')
      } catch (error) {
        // 请求错误由全局拦截器提示，保留表单以便重试。
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.feedback-page {
  padding: 24px;
  box-sizing: border-box;
  color: #29445D;
}

.feedback-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}

.feedback-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  padding: 0;
  border: 1px solid #DFEAF5;
  border-radius: 6px;
  background: #EEF6FF;
  color: #6988A3;
  font-size: 18px;
  cursor: pointer;
}

.feedback-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
}

.feedback-subtitle {
  margin: 6px 0 0;
  color: #6E89A3;
  font-size: 14px;
  line-height: 1.6;
}

.feedback-card {
  padding: 32px;
  border: 1px solid #DFECFF;
  border-radius: 18px;
  background: #FFF;
  box-shadow: 0 1px 2px rgba(40, 90, 150, 0.05);
}

.feedback-field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.feedback-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.feedback-required {
  color: #FF5D67;
}

.feedback-hint,
.feedback-word-count {
  color: #91A4B8;
  font-size: 14px;
}

.feedback-textarea-wrap {
  position: relative;
  border: 1px solid #E1E9F2;
  border-radius: 12px;
  background: #F7F9FB;

  &:focus-within {
    border-color: #409EFF;
  }

  &.has-error {
    border-color: #FF5D67;
  }
}

.feedback-textarea {
  display: block;
  width: 100%;
  min-height: 180px;
  padding: 18px 18px 42px;
  box-sizing: border-box;
  resize: vertical;
  border: 0;
  outline: none;
  background: transparent;
  color: #29445D;
  font: inherit;
  font-size: 14px;
  line-height: 1.7;

  &::placeholder {
    color: #91A4B8 !important;
  }
}

.feedback-word-count {
  position: absolute;
  right: 18px;
  bottom: 14px;
  pointer-events: none;
}

.feedback-error {
  margin: 8px 0 0;
  color: #F56C6C;
  font-size: 12px;
}

.feedback-images-section {
  margin-top: 28px;
}

.feedback-optional {
  padding: 2px 5px;
  border-radius: 5px;
  background: #F0F7FF;
  color: #7595B1;
  font-size: 14px;
  font-weight: 400;
}

.feedback-upload-tip {
  margin: 0 0 14px;
  color: #91A4B8;
  font-size: 14px;
  line-height: 1.6;
}

.feedback-file-input {
  display: none;
}

.feedback-image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.feedback-image-item,
.feedback-upload {
  width: 100px;
  height: 100px;
  box-sizing: border-box;
  border-radius: 8px;
}

.feedback-image-item {
  position: relative;
  border: 1px solid #E1E9F2;
}

.feedback-image {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.feedback-image-remove {
  position: absolute;
  top: -7px;
  right: -7px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 2px solid #FFF;
  border-radius: 50%;
  background: #8DA1B5;
  color: #FFF;
  cursor: pointer;
}

.feedback-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0;
  border: 1px dashed #B7D7F5;
  background: #F2F8FF;
  color: #409EFF;
  font-size: 14px;
  cursor: pointer;

  .el-icon-plus {
    font-size: 28px;
  }

  &:hover {
    border-color: #409EFF;
  }
}

.feedback-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.feedback-cancel,
.feedback-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 42px;
  padding: 0 24px;
  border: 0;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
}

.feedback-cancel {
  min-width: 100px;
  background: #F5F8FB;
  color: #6484A1;
}

.feedback-submit {
  min-width: 142px;
  background: linear-gradient(100deg, #1263FF 0%, #00B9EF 100%);
  color: #FFF;
}

button:disabled,
textarea:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

@media (max-width: 1200px) {
  .feedback-page,
  .feedback-card {
    padding: 20px;
  }
}
</style>
