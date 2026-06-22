<template>
  <div class="al-container">
      <!-- ===== 顶部标题栏 ===== -->
      <div class="al-topbar">
        <div class="al-topbar-left">
          <button class="al-back-btn" @click="handleClose" title="返回">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span class="al-breadcrumb-parent">课堂笔记</span>
          <span class="al-breadcrumb-sep">/</span>
          <span class="al-breadcrumb-current">{{ meetingTitle || '未命名笔记' }}</span>
        </div>
        <div class="al-topbar-right">
          <button class="al-tb-btn al-tb-btn--outline">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            AI问答
          </button>
          <button class="al-tb-btn">编辑</button>
          <button class="al-tb-btn">翻译</button>
          <button class="al-tb-btn al-tb-btn--primary" @click="handleShare">分享</button>
          <button class="al-tb-btn al-tb-btn--icon" title="更多操作">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- ===== 主体（左右分栏） ===== -->
      <div class="al-body">
      <!-- ===== 左侧：视频 + 内容 ===== -->
      <div class="al-left">
        <!-- 视频播放器 -->
        <div class="al-player-wrap" ref="playerWrap">
          <video
            ref="videoEl"
            class="al-video"
            :src="videoUrl || ''"
            preload="metadata"
            @timeupdate="onTimeUpdate"
            @loadedmetadata="onLoadedMetadata"
            @play="isPlaying = true"
            @pause="isPlaying = false"
            @ended="isPlaying = false"
            @waiting="isBuffering = true"
            @canplay="isBuffering = false"
          ></video>

          <!-- 中心播放按钮 -->
          <transition name="al-fade">
            <div class="al-center-play" v-show="!isPlaying" @click="togglePlay">
              <div class="al-play-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <polygon points="6,3 20,12 6,21"/>
                </svg>
              </div>
            </div>
          </transition>

          <!-- 缓冲中 -->
          <div class="al-buffering" v-show="isBuffering && isPlaying">
            <div class="al-spinner"></div>
          </div>

          <!-- 底部控制栏 -->
          <div class="al-controls-overlay">
            <!-- 进度条 -->
            <div class="al-progress-bar" @click="onProgressClick" ref="progressBar">
              <div class="al-progress-track">
                <div class="al-progress-fill" :style="{ width: progressPct + '%' }"></div>
                <div class="al-progress-dot" :style="{ left: progressPct + '%' }"></div>
              </div>
            </div>
            <!-- 控制按钮行 -->
            <div class="al-controls-row">
              <button class="al-ctrl-btn" @click="togglePlay">
                <svg v-if="isPlaying" width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/>
                </svg>
                <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <polygon points="6,3 20,12 6,21"/>
                </svg>
              </button>
              <span class="al-ctrl-time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
              <button class="al-ctrl-btn al-ctrl-vol" @click="toggleMute">
                <svg v-if="!isMuted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
                  <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
                <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
                  <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
                  <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              </button>
              <div class="al-ctrl-spacer"></div>
              <button class="al-ctrl-btn" title="设置">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
              <button class="al-ctrl-btn" @click="toggleFullscreen" title="全屏">
                <svg v-if="!isFullscreen" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
                <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 标签页 -->
        <div class="al-tabs-bar">
          <div
            class="al-tab"
            :class="{ active: activeTab === 'transcript' }"
            @click="activeTab = 'transcript'"
          >转写</div>
          <div
            class="al-tab"
            :class="{ active: activeTab === 'summary' }"
            @click="activeTab = 'summary'"
          >AI纪要</div>
        </div>

        <!-- 内容区 -->
        <div class="al-content-area">
          <!-- 图文纪要按钮 -->
          <div class="al-pictxt-row">
            <button class="al-pictxt-btn" @click="handlePicTxt">
              图文纪要
              <span class="al-new-badge">NEW</span>
            </button>
          </div>

          <!-- ===== 转写内容 ===== -->
          <div v-if="activeTab === 'transcript'" class="al-transcript-list">
            <div v-if="transcriptLoading" class="al-loading-placeholder">
              <div class="al-skeleton" v-for="i in 3" :key="i"></div>
            </div>
            <div
              v-else
              v-for="(item, index) in transcriptList"
              :key="index"
              class="al-tran-entry"
            >
              <div class="al-tran-meta">
                <span class="al-speaker-badge" :class="'speaker-color-' + ((item.speakerId - 1) % 6 + 1)">
                  {{ item.speakerId }}
                </span>
                <span class="al-speaker-name">发言人 {{ item.speakerId }}</span>
                <span class="al-tran-sep">·</span>
                <span class="al-tran-ts">{{ item.displayTime }}</span>
              </div>
              <p class="al-tran-text">{{ item.text }}</p>
            </div>
          </div>

          <!-- ===== AI纪要内容 ===== -->
          <div v-if="activeTab === 'summary'" class="al-summary-area">
            <div v-if="summaryLoading" class="al-loading-placeholder">
              <div class="al-skeleton" v-for="i in 4" :key="i" style="margin-bottom:10px;"></div>
            </div>
            <template v-else>
              <div class="al-summary-meta">
                <div class="al-summary-meta-row">
                  <span class="al-meta-key">主题：</span>
                  <span class="al-meta-val">{{ summaryInfo.title }}</span>
                </div>
                <div class="al-summary-meta-row">
                  <span class="al-meta-key">时间：</span>
                  <span class="al-meta-val">{{ summaryInfo.time }}</span>
                </div>
                <div class="al-summary-meta-row">
                  <span class="al-meta-key">参与人：</span>
                  <span class="al-meta-val">{{ summaryInfo.participants }}</span>
                </div>
              </div>
              <div class="al-summary-content">{{ summaryInfo.content }}</div>
            </template>
          </div>
        </div>
      </div>

      <!-- ===== 右侧：AI问答 ===== -->
      <div class="al-right">
        <!-- Header -->
        <div class="al-chat-hd">
          <span class="al-chat-title">AI问答</span>
          <div class="al-chat-hd-btns">
            <!-- 有对话时显示新建对话，无对话时显示搜索 -->
            <button
              class="al-hd-btn"
              :title="chatMessages.length > 0 ? '新建对话' : '搜索'"
              @click="chatMessages.length > 0 ? newChatSession() : null"
            >
              <!-- 新建图标（有对话状态） -->
              <svg v-if="chatMessages.length > 0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <!-- 搜索图标（无对话状态） -->
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <!-- 菜单按钮 -->
            <button class="al-hd-btn" title="更多">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <!-- 关闭按钮 -->
            <button class="al-hd-btn al-hd-close-btn" @click="handleClose" title="关闭">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Chat Body -->
        <div class="al-chat-body" ref="chatBodyEl">
          <!-- ===== 欢迎态（无对话） ===== -->
          <div v-if="chatMessages.length === 0 && !aiLoading" class="al-welcome-area">
            <div class="al-welcome-greeting">
              <span class="al-welcome-emoji">👋</span>
              <span class="al-welcome-text">Hi，我可以帮你干什么？</span>
            </div>
            <p class="al-scope-hint">问答范围：{{ scopeText }}</p>
            <div class="al-quick-questions">
              <button
                v-for="q in quickQuestions"
                :key="q"
                class="al-quick-btn"
                @click="sendChat(q)"
              >{{ q }}</button>
            </div>
          </div>

          <!-- ===== 对话消息列表 ===== -->
          <div v-if="chatMessages.length > 0" class="al-msg-list">
            <div
              v-for="(msg, idx) in chatMessages"
              :key="idx"
              class="al-msg-item"
              :class="'msg-' + msg.role"
            >
              <!-- 用户消息 -->
              <div v-if="msg.role === 'user'" class="al-msg-user-wrap">
                <div class="al-bubble-user">{{ msg.content }}</div>
              </div>

              <!-- AI消息 -->
              <div v-else class="al-msg-ai-wrap">
                <div v-if="msg.thinking" class="al-thinking-label">已思考{{ msg.thinkSec }}秒</div>
                <div class="al-bubble-ai">
                  <span v-if="msg.streaming" class="al-typing-cursor">{{ msg.content }}</span>
                  <span v-else>{{ msg.content }}</span>
                </div>
                <div v-if="!msg.streaming" class="al-msg-ops">
                  <button class="al-op-btn" @click="shareMsg(msg.content)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                      <polyline points="16 6 12 2 8 6"/>
                      <line x1="12" y1="2" x2="12" y2="15"/>
                    </svg>
                    分享
                  </button>
                  <span class="al-op-divider">|</span>
                  <button class="al-op-btn" @click="copyMsg(msg.content)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                      <rect x="9" y="9" width="13" height="13" rx="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- AI 加载中 -->
            <div v-if="aiLoading" class="al-ai-loading">
              <div class="al-dot-loader">
                <span></span><span></span><span></span>
              </div>
            </div>

            <!-- 继续提问建议 -->
            <div v-if="followUpList.length > 0 && !aiLoading" class="al-followup-area">
              <div class="al-followup-title">继续提问</div>
              <button
                v-for="q in followUpList"
                :key="q"
                class="al-quick-btn"
                @click="sendChat(q)"
              >{{ q }}</button>
            </div>
          </div>
        </div>

        <!-- Chat Footer -->
        <div class="al-chat-ft">
          <div class="al-input-box">
            <textarea
              ref="chatInput"
              v-model="inputText"
              class="al-textarea"
              placeholder="有问题尽管问我..."
              rows="1"
              @keydown.enter.exact.prevent="sendChat(inputText)"
              @input="autoResizeTextarea"
            ></textarea>
          </div>
          <div class="al-ft-toolbar">
            <button class="al-ft-btn al-ft-attach" title="附件">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <button
              class="al-ft-btn al-deep-think-btn"
              :class="{ active: deepThinkMode }"
              @click="deepThinkMode = !deepThinkMode"
              title="深度思考"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 9h6M9 12h6M9 15h4"/>
              </svg>
              深度思考
            </button>
            <div class="al-ft-spacer"></div>
            <button
              class="al-send-btn"
              :class="{ enabled: inputText.trim() && !aiLoading }"
              :disabled="!inputText.trim() || aiLoading"
              @click="sendChat(inputText)"
              title="发送"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
</template>

<script>
/**
 * AIListening — AI 听记组件
 * 包含：视频播放器、转写/AI纪要标签页、右侧 AI 问答对话面板
 */

// ===== 模拟 API =====
const mockGetTranscript = (meetingId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        data: [
          {
            speakerId: 1,
            displayTime: '00:01',
            startSeconds: 12,
            text: '[00:12] 大家好，今天我们要讨论的主题是直播数字编辑与传化路径。这是一个非常重要的议题。'
          },
          {
            speakerId: 1,
            displayTime: '00:01',
            startSeconds: 85,
            text: '[01:25] 数字化编辑在当今的传播环境中扮演着关键角色，我们需要关注用户体验和内容质量的平衡。'
          },
          {
            speakerId: 2,
            displayTime: '00:01',
            startSeconds: 158,
            text: '[02:38] 另外，技术架构的可扩展性也非常重要，这将确保系统能够应对未来的增长需求。'
          },
          {
            speakerId: 1,
            displayTime: '00:03',
            startSeconds: 210,
            text: '[03:30] 关于用户增长策略，我们应该重点关注社区运营和口碑传播，这两个维度对于直播平台来说至关重要。'
          },
          {
            speakerId: 3,
            displayTime: '00:04',
            startSeconds: 270,
            text: '[04:30] 我同意这个观点，同时我认为内容分发算法的优化也不可忽视，它直接影响到内容的曝光率和用户留存。'
          },
          {
            speakerId: 2,
            displayTime: '00:05',
            startSeconds: 320,
            text: '[05:20] 数据分析工具的引入将帮助我们更好地理解用户行为，从而制定更精准的内容策略。'
          }
        ]
      })
    }, 800)
  })
}

const mockGetSummary = (meetingId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        data: {
          title: '直播教学的痛点与优化路径',
          time: '2026-03-21  23:58:03',
          participants: '霸王龙',
          content: ''
        }
      })
    }, 600)
  })
}

const mockAiChat = (question, deepThink, history) => {
  const thinkSec = deepThink ? Math.floor(Math.random() * 5) + 3 : Math.floor(Math.random() * 3) + 1

  const responses = {
    '用30字概括': {
      answer: '对话聚焦音频设备连接问题，最终确认使用耳机解决声音输出，达成"能用就行"共识。',
      followUp: ['插线后延迟具体指什么？', '切换音频设备怎么操作？']
    },
    'AI一键生成思维导图': {
      answer: '已为您生成思维导图，本次直播主要围绕以下几个核心议题展开：\n\n1. 直播数字编辑技术（数字化工具应用、内容制作流程）\n2. 传播路径优化（算法分发、用户增长策略）\n3. 技术架构建设（可扩展性设计、数据分析体系）\n4. 用户体验提升（界面优化、互动功能增强）',
      followUp: ['导出为 PDF 格式', '思维导图能否按时间轴排列？']
    },
    '帮我提炼一下重点内容': {
      answer: '本次直播的重点内容如下：\n\n① 直播数字编辑是当今传播环境的核心竞争力\n② 用户体验与内容质量需要保持动态平衡\n③ 技术架构的可扩展性决定了平台的长期发展潜力\n④ 社区运营和口碑传播是用户增长的关键\n⑤ 数据分析工具的引入可显著提升内容策略精准度',
      followUp: ['这些内容如何形成方案？', '哪个方向最值得优先投入？']
    },
    'default': {
      answer: '根据本次直播内容，关于您的问题，主要观点如下：直播数字化编辑需要关注内容质量、技术架构和用户体验三个核心维度，缺一不可。建议从用户需求出发，结合数据分析逐步迭代优化。',
      followUp: ['能否举个具体案例？', '如何制定实施路线图？']
    }
  }

  const resp = responses[question] || responses['default']
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        data: {
          answer: resp.answer,
          thinkSec,
          followUp: resp.followUp
        }
      })
    }, deepThink ? 2500 : 1200)
  })
}

export default {
  name: 'AIListening',
  data() {
    return {
      // ===== 视频播放器状态 =====
      isPlaying: false,
      isMuted: false,
      isBuffering: false,
      isFullscreen: false,
      currentTime: 0,
      duration: 0,

      // ===== 内容标签 =====
      activeTab: 'transcript',

      // ===== 转写数据 =====
      transcriptLoading: false,
      transcriptList: [],

      // ===== AI纪要数据 =====
      summaryLoading: false,
      summaryInfo: {
        title: '',
        time: '',
        participants: '',
        content: ''
      },

      // ===== AI问答 =====
      chatMessages: [],
      inputText: '',
      aiLoading: false,
      deepThinkMode: false,
      followUpList: [],

      // 快捷问题（欢迎状态）
      quickQuestions: [
        'AI一键生成思维导图',
        '帮我提炼一下重点内容'
      ]
    }
  },
  computed: {
    videoUrl() {
      return this.$route.query.videoUrl || ''
    },
    meetingId() {
      return this.$route.query.meetingId || ''
    },
    meetingTitle() {
      return this.$route.query.meetingTitle || '未命名笔记'
    },
    scopeText() {
      return this.$route.query.scopeText || ''
    },
    progressPct() {
      if (!this.duration) return 0
      return (this.currentTime / this.duration) * 100
    }
  },
  mounted() {
    this.loadData()
    document.addEventListener('fullscreenchange', this.onFullscreenChange)
  },
  methods: {
    // ===== 初始化加载 =====
    loadData() {
      this.fetchTranscript()
      this.fetchSummary()
    },

    async fetchTranscript() {
      this.transcriptLoading = true
      try {
        const res = await mockGetTranscript(this.meetingId)
        if (res.code === 200) {
          this.transcriptList = res.data
        }
      } catch (e) {
        console.error('转写数据加载失败', e)
      } finally {
        this.transcriptLoading = false
      }
    },

    async fetchSummary() {
      this.summaryLoading = true
      try {
        const res = await mockGetSummary(this.meetingId)
        if (res.code === 200) {
          this.summaryInfo = res.data
        }
      } catch (e) {
        console.error('AI纪要加载失败', e)
      } finally {
        this.summaryLoading = false
      }
    },

    // ===== 视频播放控制 =====
    togglePlay() {
      const video = this.$refs.videoEl
      if (!video) return
      if (this.isPlaying) {
        video.pause()
      } else {
        video.play().catch(() => {})
      }
    },

    pauseVideo() {
      const video = this.$refs.videoEl
      if (video && this.isPlaying) {
        video.pause()
      }
    },

    toggleMute() {
      const video = this.$refs.videoEl
      if (!video) return
      this.isMuted = !this.isMuted
      video.muted = this.isMuted
    },

    toggleFullscreen() {
      const wrap = this.$refs.playerWrap
      if (!wrap) return
      if (!document.fullscreenElement) {
        wrap.requestFullscreen().catch(() => {})
      } else {
        document.exitFullscreen()
      }
    },

    onFullscreenChange() {
      this.isFullscreen = !!document.fullscreenElement
    },

    onTimeUpdate() {
      const video = this.$refs.videoEl
      if (video) {
        this.currentTime = video.currentTime
      }
    },

    onLoadedMetadata() {
      const video = this.$refs.videoEl
      if (video) {
        this.duration = video.duration
      }
    },

    onProgressClick(e) {
      const bar = this.$refs.progressBar
      if (!bar || !this.duration) return
      const rect = bar.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const video = this.$refs.videoEl
      if (video) {
        video.currentTime = ratio * this.duration
      }
    },

    formatTime(sec) {
      if (!sec || isNaN(sec)) return '00:00'
      const m = Math.floor(sec / 60)
      const s = Math.floor(sec % 60)
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    },

    // ===== 图文纪要 =====
    handlePicTxt() {
      this.$message && this.$message.info('图文纪要功能开发中...')
    },

    // ===== AI问答 =====
    async sendChat(text) {
      if (!text || !text.trim() || this.aiLoading) return
      const question = text.trim()

      // 清空输入
      this.inputText = ''
      this.followUpList = []

      // 添加用户消息
      this.chatMessages.push({ role: 'user', content: question })

      // 重置 textarea 高度
      this.$nextTick(() => {
        if (this.$refs.chatInput) {
          this.$refs.chatInput.style.height = 'auto'
        }
        this.scrollChatToBottom()
      })

      // 开始加载
      this.aiLoading = true

      try {
        const res = await mockAiChat(question, this.deepThinkMode, this.chatMessages)
        if (res.code === 200) {
          const { answer, thinkSec, followUp } = res.data

          this.chatMessages.push({
            role: 'ai',
            content: answer,
            thinking: this.deepThinkMode,
            thinkSec,
            streaming: false
          })

          this.followUpList = followUp || []
        }
      } catch (e) {
        this.chatMessages.push({
          role: 'ai',
          content: '抱歉，请求失败，请稍后重试。',
          thinking: false,
          thinkSec: 0,
          streaming: false
        })
      } finally {
        this.aiLoading = false
        this.$nextTick(() => {
          this.scrollChatToBottom()
        })
      }
    },

    newChatSession() {
      this.chatMessages = []
      this.followUpList = []
      this.inputText = ''
    },

    shareMsg(content) {
      this.$message && this.$message.success('分享功能开发中')
    },

    copyMsg(content) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(content).then(() => {
          this.$message && this.$message.success('已复制到剪贴板')
        })
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = content
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        this.$message && this.$message.success('已复制到剪贴板')
      }
    },

    scrollChatToBottom() {
      const body = this.$refs.chatBodyEl
      if (body) {
        body.scrollTop = body.scrollHeight
      }
    },

    autoResizeTextarea() {
      const el = this.$refs.chatInput
      if (!el) return
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    },

    // ===== 分享 =====
    handleShare() {
      this.$emit('share', { meetingId: this.meetingId, meetingTitle: this.meetingTitle })
    },

    // ===== 返回 =====
    handleClose() {
      this.pauseVideo()
      this.$router.back()
    }
  },

  beforeDestroy() {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange)
  }
}
</script>

<style lang="scss" scoped>
// ===== 颜色变量 =====
$primary: #3B6FFF;
$primary-light: #EEF3FF;
$text-main: #1A1A2E;
$text-sub: #888;
$text-hint: #999;
$border: #EBEBEB;
$bg-hover: #F5F7FA;
$white: #fff;

// ===== 主容器（全页面） =====
.al-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background: $white;
  overflow: hidden;
}

// ===== 顶部标题栏 =====
.al-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  min-height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid $border;
  background: $white;
  flex-shrink: 0;
}

.al-topbar-left {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  min-width: 0;
}

.al-back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: $text-sub;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: $bg-hover;
    color: $text-main;
  }
}

.al-breadcrumb-parent {
  color: $text-sub;
  cursor: pointer;
  white-space: nowrap;
  &:hover { color: $primary; }
}

.al-breadcrumb-sep {
  color: $text-hint;
  font-size: 12px;
}

.al-breadcrumb-current {
  color: $text-main;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 320px;
}

.al-topbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.al-tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid $border;
  border-radius: 6px;
  background: $white;
  color: $text-main;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: $bg-hover;
    border-color: #d0d0d0;
  }

  &--outline {
    border-color: $primary;
    color: $primary;
    &:hover { background: $primary-light; }
  }

  &--primary {
    background: $primary;
    border-color: $primary;
    color: $white;
    &:hover { background: darken($primary, 8%); }
  }

  &--icon {
    padding: 0 8px;
    color: $text-sub;
    border-color: transparent;
    background: transparent;
    &:hover { background: $bg-hover; border-color: $border; }
  }
}

// ===== 主体左右分栏 =====
.al-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

// ===================================================================
// 左侧面板
// ===================================================================
.al-left {
  flex: 0 0 580px;
  width: 580px;
  display: flex;
  flex-direction: column;
  background: $white;
  border-right: 1px solid $border;
  overflow: hidden;
}

// ===== 视频播放器 =====
.al-player-wrap {
  position: relative;
  width: 100%;
  background: #0f0f1a;
  flex-shrink: 0;
  aspect-ratio: 16 / 9;
  overflow: hidden;

  .al-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  // 中心播放按钮
  .al-center-play {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    .al-play-circle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.18);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.28);
      }
    }
  }

  // 缓冲动画
  .al-buffering {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .al-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: $white;
      border-radius: 50%;
      animation: al-spin 0.8s linear infinite;
    }
  }

  // 控制栏覆盖层
  .al-controls-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
    padding: 16px 12px 8px;

    // 进度条
    .al-progress-bar {
      width: 100%;
      padding: 4px 0;
      cursor: pointer;
      margin-bottom: 4px;

      &:hover .al-progress-dot {
        opacity: 1;
        transform: translateX(-50%) scale(1);
      }

      .al-progress-track {
        position: relative;
        width: 100%;
        height: 3px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 2px;

        .al-progress-fill {
          height: 100%;
          background: $primary;
          border-radius: 2px;
          transition: width 0.1s linear;
        }

        .al-progress-dot {
          position: absolute;
          top: 50%;
          width: 10px;
          height: 10px;
          background: $white;
          border-radius: 50%;
          transform: translateX(-50%) translateY(-50%) scale(0);
          opacity: 0;
          transition: opacity 0.15s, transform 0.15s;
          pointer-events: none;
        }
      }
    }

    // 控制按钮行
    .al-controls-row {
      display: flex;
      align-items: center;
      gap: 4px;

      .al-ctrl-btn {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: $white;
        border-radius: 4px;
        opacity: 0.9;
        transition: opacity 0.15s;

        &:hover {
          opacity: 1;
        }
      }

      .al-ctrl-time {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.9);
        font-family: monospace;
        white-space: nowrap;
        margin-left: 2px;
      }

      .al-ctrl-vol {
        margin-left: 2px;
      }

      .al-ctrl-spacer {
        flex: 1;
      }
    }
  }
}

// ===== 标签页 =====
.al-tabs-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 16px;
  border-bottom: 1px solid $border;
  flex-shrink: 0;

  .al-tab {
    padding: 12px 0;
    font-size: 14px;
    color: $text-sub;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.2s;
    user-select: none;

    &:hover {
      color: $primary;
    }

    &.active {
      color: $primary;
      font-weight: 600;
      border-bottom-color: $primary;
    }
  }
}

// ===== 内容区 =====
.al-content-area {
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px 16px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 2px;
  }
}

// 图文纪要按钮
.al-pictxt-row {
  margin-bottom: 14px;
}

.al-pictxt-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: $primary-light;
  color: $primary;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: darken($primary-light, 3%);
  }

  .al-new-badge {
    background: $primary;
    color: $white;
    font-size: 10px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 8px;
    letter-spacing: 0.3px;
  }
}

// ===== 转写列表 =====
.al-transcript-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.al-tran-entry {
  padding: 10px 0;
  border-bottom: 1px solid #F5F5F5;

  &:last-child {
    border-bottom: none;
  }
}

.al-tran-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
}

.al-speaker-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: $white;
  flex-shrink: 0;

  &.speaker-color-1 { background: #3B6FFF; }
  &.speaker-color-2 { background: #7B5EA7; }
  &.speaker-color-3 { background: #FF7043; }
  &.speaker-color-4 { background: #26A69A; }
  &.speaker-color-5 { background: #EF5350; }
  &.speaker-color-6 { background: #FFA726; }
}

.al-speaker-name {
  font-size: 13px;
  color: $text-main;
  font-weight: 500;
}

.al-tran-sep {
  font-size: 12px;
  color: $text-hint;
}

.al-tran-ts {
  font-size: 12px;
  color: $text-hint;
}

.al-tran-text {
  font-size: 13px;
  color: #444;
  line-height: 1.65;
  margin: 0;
  padding-left: 26px;
}

// ===== AI纪要区域 =====
.al-summary-area {
  padding: 4px 0;
}

.al-summary-meta {
  margin-bottom: 14px;
}

.al-summary-meta-row {
  display: flex;
  align-items: baseline;
  margin-bottom: 8px;
  font-size: 13.5px;
}

.al-meta-key {
  color: $text-sub;
  flex-shrink: 0;
  min-width: 52px;
}

.al-meta-val {
  color: $text-main;
}

.al-summary-content {
  font-size: 13.5px;
  color: #444;
  line-height: 1.8;
  white-space: pre-wrap;
  background: #FAFAFA;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid $border;
  min-height: 80px;
}

// ===== 骨架屏 =====
.al-loading-placeholder {
  padding: 8px 0;
}

.al-skeleton {
  height: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  margin-bottom: 12px;
  animation: al-shimmer 1.5s infinite;

  &:nth-child(2) { width: 85%; }
  &:nth-child(3) { width: 70%; }
  &:nth-child(4) { width: 90%; }
}

// ===================================================================
// 右侧 AI 问答面板
// ===================================================================
.al-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: $white;
  min-width: 0;
}

// ===== AI问答 Header =====
.al-chat-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 13px;
  border-bottom: 1px solid $border;
  flex-shrink: 0;

  .al-chat-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-main;
  }

  .al-chat-hd-btns {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .al-hd-btn {
    width: 30px;
    height: 30px;
    border: 1.5px dashed #CCC;
    border-radius: 6px;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #888;
    transition: all 0.2s;

    &:hover {
      border-color: $primary;
      color: $primary;
    }

    svg {
      flex-shrink: 0;
    }
  }

  .al-hd-close-btn {
    border-color: #DDD;

    &:hover {
      border-color: #FF5252;
      color: #FF5252;
    }
  }
}

// ===== Chat Body =====
.al-chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px 8px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 2px;
  }
}

// 欢迎状态
.al-welcome-area {
  padding: 16px 4px;
}

.al-welcome-greeting {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;

  .al-welcome-emoji {
    font-size: 24px;
  }

  .al-welcome-text {
    font-size: 18px;
    font-weight: 700;
    color: $text-main;
  }
}

.al-scope-hint {
  font-size: 12px;
  color: $text-hint;
  margin: 0 0 16px;
  line-height: 1.6;
  word-break: break-all;
}

.al-quick-questions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.al-quick-btn {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  background: #F2F5FF;
  border: none;
  border-radius: 8px;
  font-size: 13.5px;
  color: $text-main;
  cursor: pointer;
  transition: background 0.2s;
  line-height: 1.5;

  &:hover {
    background: #E8EFFE;
    color: $primary;
  }
}

// 消息列表
.al-msg-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.al-msg-item {
  &.msg-user {
    display: flex;
    justify-content: flex-end;
  }

  &.msg-ai {
    display: flex;
    justify-content: flex-start;
  }
}

// 用户消息气泡
.al-msg-user-wrap {
  max-width: 80%;
}

.al-bubble-user {
  display: inline-block;
  background: #F0F0F0;
  color: $text-main;
  padding: 9px 14px;
  border-radius: 12px 12px 2px 12px;
  font-size: 13.5px;
  line-height: 1.6;
  word-break: break-word;
}

// AI消息
.al-msg-ai-wrap {
  max-width: 100%;
  width: 100%;
}

.al-thinking-label {
  font-size: 12px;
  color: $text-hint;
  margin-bottom: 6px;
}

.al-bubble-ai {
  font-size: 13.5px;
  color: $text-main;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

.al-typing-cursor::after {
  content: '|';
  animation: al-blink 1s step-end infinite;
  margin-left: 1px;
}

// 消息操作按钮
.al-msg-ops {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.al-op-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: $text-hint;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.15s;

  &:hover {
    color: $primary;
  }
}

.al-op-divider {
  color: #DDD;
  font-size: 12px;
  margin: 0 2px;
}

// AI 加载中
.al-ai-loading {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.al-dot-loader {
  display: flex;
  gap: 5px;

  span {
    width: 7px;
    height: 7px;
    background: #CCC;
    border-radius: 50%;
    animation: al-bounce 1.2s infinite ease-in-out;

    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

// 继续提问区域
.al-followup-area {
  margin-top: 8px;
}

.al-followup-title {
  font-size: 13px;
  font-weight: 600;
  color: $text-main;
  margin-bottom: 8px;
}

// ===== Chat Footer =====
.al-chat-ft {
  flex-shrink: 0;
  padding: 10px 12px 12px;
  border-top: 1px solid $border;
}

.al-input-box {
  background: #F7F8FA;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
  border: 1px solid transparent;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: $primary;
    background: $white;
  }

  .al-textarea {
    width: 100%;
    background: none;
    border: none;
    outline: none;
    resize: none;
    font-size: 13.5px;
    color: $text-main;
    line-height: 1.6;
    font-family: inherit;
    min-height: 22px;
    max-height: 120px;
    overflow-y: auto;

    &::placeholder {
      color: $text-hint;
    }

    &::-webkit-scrollbar {
      width: 3px;
    }
  }
}

.al-ft-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
}

.al-ft-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 12.5px;
  color: $text-sub;
  transition: all 0.2s;

  &:hover {
    background: $bg-hover;
    color: $text-main;
  }
}

.al-ft-attach {
  width: 30px;
  height: 30px;
  padding: 0;
  justify-content: center;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 300;
}

.al-deep-think-btn {
  border: 1px solid $border;

  &.active {
    background: $primary-light;
    color: $primary;
    border-color: lighten($primary, 20%);
  }
}

.al-ft-spacer {
  flex: 1;
}

.al-send-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: #E5E5E5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: not-allowed;
  color: #AAA;
  transition: all 0.2s;

  &.enabled {
    background: $primary;
    color: $white;
    cursor: pointer;

    &:hover {
      background: darken($primary, 8%);
    }
  }

  &:disabled {
    cursor: not-allowed;
  }
}

// ===================================================================
// 过渡动画
// ===================================================================
.al-fade-enter-active,
.al-fade-leave-active {
  transition: opacity 0.2s;
}

.al-fade-enter,
.al-fade-leave-to {
  opacity: 0;
}

// ===================================================================
// Keyframes
// ===================================================================
@keyframes al-spin {
  to { transform: rotate(360deg); }
}

@keyframes al-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes al-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes al-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}
</style>
