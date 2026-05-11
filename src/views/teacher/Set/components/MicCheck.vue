<template>
  <div class="mc-wrap">
    <!-- 麦克风选择器 -->
    <el-select
      v-model="selectedMicId"
      class="mc-select"
      @change="switchMic"
    >
      <el-option
        v-for="(mic, mi) in micList"
        :key="mic.deviceId"
        :label="mic.label || ('麦克风 ' + (mi + 1))"
        :value="mic.deviceId"
      />
    </el-select>

    <!-- 音量可视化 -->
    <div class="mc-level-wrap">
      <i class="el-icon-microphone mc-level-icon"></i>
      <div class="mc-level-bars">
        <span
          v-for="n in 12"
          :key="n"
          class="mc-level-bar"
          :class="{ active: level * 12 >= n }"
        ></span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="mc-btns">
      <el-button class="mc-btn-no" @click="$emit('result', 'fail')">不能听到</el-button>
      <el-button type="primary" class="mc-btn-yes" @click="$emit('result', 'ok')">能听到</el-button>
    </div>

    <!-- 常见问题 -->
    <div class="mc-faq">
      <div class="mc-faq-title">
        <i class="el-icon-warning mc-faq-icon"></i>
        常见问题
      </div>
      <ul class="mc-faq-list">
        <li v-if="$isWindows">新设备或第一次使用，前往 开始菜单 &gt; 设置 &gt; 隐私和安全性 &gt; 麦克风，开启本应用访问权限</li>
        <li v-else-if="$isMac">新设备或第一次使用，前往 系统设置 &gt; 隐私与安全性 &gt; 麦克风，开启本应用权限（旧版 macOS：系统偏好设置 &gt; 安全性与隐私 &gt; 隐私 &gt; 麦克风）</li>
        <li v-else>新设备或第一次上课，请至系统设置&gt;隐私&gt;麦克风，开启本应用权限</li>
        <li v-if="$isWindows">在任务栏右侧音量图标处右键 &gt; 打开声音设置，确认录音设备已启用并设为默认</li>
        <li v-else-if="$isMac">前往 系统设置 &gt; 声音 &gt; 输入，调整麦克风输入音量</li>
        <li v-else>调整声音和麦克风音量</li>
        <li>当有多个麦克风时，在上方下拉框中选择正确的麦克风</li>
        <li>检查麦克风连接是否稳定，重新插拔麦克风</li>
        <li v-if="$isWindows">打开 设备管理器，确认音频设备驱动正常，必要时更新驱动</li>
        <li>重启应用/重启电脑，再次检测</li>
        <li>还有问题，请更换电脑或麦克风</li>
      </ul>
    </div>
  </div>
</template>

<script>
import platformMixin from '@/mixins/platform'

export default {
  name: 'MicCheck',
  mixins: [platformMixin],
  emits: ['result'],
  data() {
    return {
      micList: [],
      selectedMicId: '',
      stream: null,
      audioCtx: null,
      analyser: null,
      animFrame: null,
      level: 0,
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
      this.error = ''
      this.level = 0
      try {
        const tmp = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        tmp.getTracks().forEach(t => t.stop())
        const devices = await navigator.mediaDevices.enumerateDevices()
        this.micList = devices.filter(d => d.kind === 'audioinput')
        if (this.micList.length === 0) {
          this.error = '未检测到麦克风设备'
          return
        }
        this.selectedMicId = this.micList[0].deviceId
        await this.start(this.selectedMicId)
      } catch (e) {
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          this.error = '麦克风权限被拒绝，请在系统设置中开启权限'
        } else if (e.name === 'NotFoundError') {
          this.error = '未检测到麦克风设备'
        } else {
          this.error = '麦克风启动失败，请检查设备连接'
        }
      }
    },
    async start(deviceId) {
      this.stop()
      this.error = ''
      try {
        const constraints = { audio: deviceId ? { deviceId: { exact: deviceId } } : true, video: false }
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        this.stream = stream
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        this.audioCtx = new AudioCtx()
        const source = this.audioCtx.createMediaStreamSource(stream)
        this.analyser = this.audioCtx.createAnalyser()
        this.analyser.fftSize = 256
        source.connect(this.analyser)
        this.poll()
      } catch {
        this.error = '麦克风启动失败，请检查设备连接'
      }
    },
    poll() {
      if (!this.analyser) return
      const buf = new Uint8Array(this.analyser.frequencyBinCount)
      const tick = () => {
        if (!this.analyser) return
        this.analyser.getByteFrequencyData(buf)
        const avg = buf.reduce((s, v) => s + v, 0) / buf.length
        this.level = Math.min(avg / 80, 1)
        this.animFrame = requestAnimationFrame(tick)
      }
      this.animFrame = requestAnimationFrame(tick)
    },
    stop() {
      if (this.animFrame) { cancelAnimationFrame(this.animFrame); this.animFrame = null }
      if (this.analyser) { this.analyser.disconnect(); this.analyser = null }
      if (this.audioCtx) { this.audioCtx.close().catch(() => {}); this.audioCtx = null }
      if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null }
      this.level = 0
    },
    async switchMic(deviceId) {
      await this.start(deviceId)
    }
  }
}
</script>

<style lang="scss" scoped>
.mc-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mc-select {
  width: 300px;
  margin-bottom: 18px;

  ::v-deep .el-input__inner {
    border-radius: 8px !important;
  }
}

.mc-level-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 28px 0 32px;
}

.mc-level-icon {
  font-size: 28px;
  color: #333;
  flex-shrink: 0;
}

.mc-level-bars {
  display: flex;
  align-items: center;
  gap: 5px;
}

.mc-level-bar {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  background: #E0E0E0;
  transition: background 0.08s;

  &.active {
    background: #0049FF;
  }
}

.mc-btns {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;

  .mc-btn-no {
    min-width: 120px;
    border-radius: 8px !important;
    font-size: 14px !important;
  }

  .mc-btn-yes {
    min-width: 120px;
    border-radius: 8px !important;
    font-size: 14px !important;
    background: #0049FF !important;
    border-color: #0049FF !important;

    &:hover {
      background: #0445eb !important;
      border-color: #0445eb !important;
    }
  }
}

.mc-faq {
  width: 100%;
  background: #FFF8F0;
  border-radius: 10px;
  padding: 16px 20px;
  box-sizing: border-box;
}

.mc-faq-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.mc-faq-icon {
  color: #F59E0B;
  font-size: 16px;
  margin-right: 6px;
}

.mc-faq-list {
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
