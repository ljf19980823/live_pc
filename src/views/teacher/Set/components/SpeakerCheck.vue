<template>
  <div class="sc-wrap">
    <!-- 扬声器选择器 -->
    <el-select
      v-model="selectedSpeakerId"
      class="sc-select"
      @change="onDeviceChange"
    >
      <el-option
        v-for="(spk, si) in speakerList"
        :key="spk.deviceId"
        :label="spk.label || ('扬声器 ' + (si + 1))"
        :value="spk.deviceId"
      />
    </el-select>

    <!-- 音量可视化 + 测试按钮 -->
    <div class="sc-level-row">
      <i class="el-icon-headset sc-level-icon"></i>
      <div class="sc-level-bars">
        <span
          v-for="n in 12"
          :key="n"
          class="sc-level-bar"
          :class="{ active: level * 12 >= n }"
        ></span>
      </div>
      <el-button
        class="sc-test-btn"
        :loading="testing"
        @click="toggleTest"
      >{{ testing ? '停止' : '测试' }}</el-button>
    </div>

    <!-- 操作按钮 -->
    <div class="sc-btns">
      <el-button class="sc-btn-no" @click="$emit('result', 'fail')">不能听到</el-button>
      <el-button type="primary" class="sc-btn-yes" @click="$emit('result', 'ok')">能听到</el-button>
    </div>

    <!-- 常见问题 -->
    <div class="sc-faq">
      <div class="sc-faq-title">
        <i class="el-icon-warning sc-faq-icon"></i>
        常见问题
      </div>
      <ul class="sc-faq-list">
        <li>调整声音音量</li>
        <li>当有多个扬声器时，切换正确的输出设备</li>
        <li>如使用耳机，请检查耳机连接是否稳定，重新插拔耳机</li>
        <li>重启应用/重启电脑，再次检测</li>
        <li>还有问题，请更换电脑或扬声器</li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SpeakerCheck',
  emits: ['result'],
  data() {
    return {
      speakerList: [],
      selectedSpeakerId: '',
      testing: false,
      level: 0,
      audioCtx: null,
      gainNode: null,
      oscillator: null,
      analyser: null,
      animFrame: null,
      testTimer: null
    }
  },
  async mounted() {
    await this.init()
  },
  beforeDestroy() {
    this.stopTest()
  },
  methods: {
    async init() {
      try {
        const tmp = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        tmp.getTracks().forEach(t => t.stop())
        const devices = await navigator.mediaDevices.enumerateDevices()
        this.speakerList = devices.filter(d => d.kind === 'audiooutput')
        if (this.speakerList.length > 0) {
          this.selectedSpeakerId = this.speakerList[0].deviceId
        }
      } catch {
        // 无法获取设备列表时保持空列表，不影响测试
      }
    },
    onDeviceChange() {
      if (this.testing) this.stopTest()
    },
    toggleTest() {
      if (this.testing) {
        this.stopTest()
      } else {
        this.startTest()
      }
    },
    startTest() {
      this.stopTest()
      this.testing = true
      this.level = 0

      const AudioCtx = window.AudioContext || window.webkitAudioContext
      this.audioCtx = new AudioCtx()

      // 振荡器产生 440 Hz 测试音
      this.oscillator = this.audioCtx.createOscillator()
      this.oscillator.type = 'sine'
      this.oscillator.frequency.setValueAtTime(440, this.audioCtx.currentTime)

      // 增益控制音量
      this.gainNode = this.audioCtx.createGain()
      this.gainNode.gain.setValueAtTime(0.4, this.audioCtx.currentTime)

      // 分析节点用于可视化
      this.analyser = this.audioCtx.createAnalyser()
      this.analyser.fftSize = 256

      this.oscillator.connect(this.gainNode)
      this.gainNode.connect(this.analyser)
      this.analyser.connect(this.audioCtx.destination)
      this.oscillator.start()

      // 绑定输出设备（需浏览器/Electron 支持 setSinkId）
      this.bindSinkId()

      this.pollLevel()

      // 3 秒后自动停止
      this.testTimer = setTimeout(() => this.stopTest(), 3000)
    },
    bindSinkId() {
      if (!this.selectedSpeakerId || this.selectedSpeakerId === 'default') return
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (this.audioCtx && typeof this.audioCtx.setSinkId === 'function') {
          this.audioCtx.setSinkId(this.selectedSpeakerId).catch(() => {})
        }
      } catch { /* 不支持时静默 */ }
    },
    pollLevel() {
      if (!this.analyser) return
      const buf = new Uint8Array(this.analyser.frequencyBinCount)
      const tick = () => {
        if (!this.analyser) return
        this.analyser.getByteFrequencyData(buf)
        const avg = buf.reduce((s, v) => s + v, 0) / buf.length
        this.level = Math.min(avg / 60, 1)
        this.animFrame = requestAnimationFrame(tick)
      }
      this.animFrame = requestAnimationFrame(tick)
    },
    stopTest() {
      if (this.testTimer) { clearTimeout(this.testTimer); this.testTimer = null }
      if (this.animFrame) { cancelAnimationFrame(this.animFrame); this.animFrame = null }
      if (this.oscillator) {
        try { this.oscillator.stop() } catch { /* 已停止 */ }
        this.oscillator.disconnect()
        this.oscillator = null
      }
      if (this.analyser) { this.analyser.disconnect(); this.analyser = null }
      if (this.gainNode) { this.gainNode.disconnect(); this.gainNode = null }
      if (this.audioCtx) { this.audioCtx.close().catch(() => {}); this.audioCtx = null }
      this.testing = false
      this.level = 0
    }
  }
}
</script>

<style lang="scss" scoped>
.sc-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sc-select {
  width: 300px;
  margin-bottom: 18px;

  ::v-deep .el-input__inner {
    border-radius: 8px !important;
  }
}

.sc-level-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 28px 0 32px;
}

.sc-level-icon {
  font-size: 24px;
  color: #333;
  flex-shrink: 0;
}

.sc-level-bars {
  display: flex;
  align-items: center;
  gap: 5px;
}

.sc-level-bar {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  background: #E0E0E0;
  transition: background 0.08s;

  &.active {
    background: #00C48C;
  }
}

.sc-test-btn {
  border-radius: 8px !important;
  font-size: 13px !important;
  padding: 7px 18px !important;
  margin-left: 4px;
}

.sc-btns {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;

  .sc-btn-no {
    min-width: 120px;
    border-radius: 8px !important;
    font-size: 14px !important;
  }

  .sc-btn-yes {
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

.sc-faq {
  width: 100%;
  background: #FFF8F0;
  border-radius: 10px;
  padding: 16px 20px;
  box-sizing: border-box;
}

.sc-faq-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.sc-faq-icon {
  color: #F59E0B;
  font-size: 16px;
  margin-right: 6px;
}

.sc-faq-list {
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
