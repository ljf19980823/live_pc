<template>
  <div class="cc-wrap">
    <!-- 摄像头选择器 -->
    <el-select
      v-model="selectedCameraId"
      class="cc-select"
      @change="switchCamera"
    >
      <el-option
        v-for="(cam, ci) in cameraList"
        :key="cam.deviceId"
        :label="cam.label || ('摄像头 ' + (ci + 1))"
        :value="cam.deviceId"
      />
    </el-select>

    <!-- 视频预览区 -->
    <div class="cc-preview-wrap">
      <video
        ref="video"
        class="cc-preview-video"
        autoplay
        muted
        playsinline
      ></video>
      <div v-if="loading" class="cc-preview-mask">
        <i class="el-icon-loading" style="font-size:36px;color:#fff"></i>
      </div>
      <div v-if="error && !loading" class="cc-preview-mask cc-error-mask">
        <i class="el-icon-video-camera" style="font-size:44px;color:#ccc;display:block;margin-bottom:10px"></i>
        <span>{{ error }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="cc-btns">
      <el-button class="cc-btn-no" @click="$emit('result', 'fail')">不能看到</el-button>
      <el-button type="primary" class="cc-btn-yes" @click="$emit('result', 'ok')">能看到</el-button>
    </div>

    <!-- 常见问题 -->
    <div class="cc-faq">
      <div class="cc-faq-title">
        <i class="el-icon-warning cc-faq-icon"></i>
        常见问题
      </div>
      <ul class="cc-faq-list">
        <li>新设备或第一次上课，前往设置&gt;隐私&gt;摄像头，开启本应用权限</li>
        <li>检查摄像头物理开关，部分电脑存在摄像头物理开关，请手动开启</li>
        <li>检查摄像头是否被其他应用程序占用，关闭其他应用程序</li>
        <li>检查摄像头连接是否稳定，重新插拔摄像头</li>
        <li>重启应用/重启电脑，再次检测</li>
        <li>还有问题，请更换电脑或摄像头</li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CameraCheck',
  emits: ['result'],
  data() {
    return {
      cameraList: [],
      selectedCameraId: '',
      stream: null,
      loading: false,
      error: ''
    }
  },
  async mounted() {
    await this.init()
  },
  beforeDestroy() {
    this.stop()
  },
  methods: {
    async init() {
      this.loading = true
      this.error = ''
      try {
        const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        tmp.getTracks().forEach(t => t.stop())
        const devices = await navigator.mediaDevices.enumerateDevices()
        this.cameraList = devices.filter(d => d.kind === 'videoinput')
        if (this.cameraList.length === 0) {
          this.error = '未检测到摄像头设备'
          this.loading = false
          return
        }
        this.selectedCameraId = this.cameraList[0].deviceId
        await this.start(this.selectedCameraId)
      } catch (e) {
        this.loading = false
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          this.error = '摄像头权限被拒绝，请在系统设置中开启权限'
        } else if (e.name === 'NotFoundError') {
          this.error = '未检测到摄像头设备'
        } else {
          this.error = '摄像头启动失败，请检查设备连接'
        }
      }
    },
    async start(deviceId) {
      this.stop()
      this.loading = true
      this.error = ''
      try {
        const constraints = { video: deviceId ? { deviceId: { exact: deviceId } } : true, audio: false }
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        this.stream = stream
        await this.$nextTick()
        const video = this.$refs.video
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => {})
        }
      } catch {
        this.error = '摄像头启动失败，请检查设备连接'
      } finally {
        this.loading = false
      }
    },
    stop() {
      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop())
        this.stream = null
      }
      const video = this.$refs.video
      if (video) video.srcObject = null
    },
    async switchCamera(deviceId) {
      await this.start(deviceId)
    }
  }
}
</script>

<style lang="scss" scoped>
.cc-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cc-select {
  width: 300px;
  margin-bottom: 18px;

  ::v-deep .el-input__inner {
    border-radius: 8px !important;
  }
}

.cc-preview-wrap {
  width: 300px;
  height: 200px;
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.cc-preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cc-preview-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 13px;
  text-align: center;
  padding: 12px;
  box-sizing: border-box;
}

.cc-error-mask {
  background: rgba(0, 0, 0, 0.7);
  color: #ccc;
}

.cc-btns {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;

  .cc-btn-no {
    min-width: 120px;
    border-radius: 8px !important;
    font-size: 14px !important;
  }

  .cc-btn-yes {
    min-width: 120px;
    border-radius: 8px !important;
    font-size: 14px !important;
    background: #00C48C !important;
    border-color: #00C48C !important;

    &:hover {
      background: #00B07E !important;
      border-color: #00B07E !important;
    }
  }
}

.cc-faq {
  width: 100%;
  background: #FFF8F0;
  border-radius: 10px;
  padding: 16px 20px;
  box-sizing: border-box;
}

.cc-faq-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.cc-faq-icon {
  color: #F59E0B;
  font-size: 16px;
  margin-right: 6px;
}

.cc-faq-list {
  margin: 0;
  padding-left: 18px;
  list-style: disc;

  li {
    font-size: 13px;
    color: #666;
    line-height: 1.8;
  }
}
</style>
