<template>
    <div class="app_container">
        <div class="app_container_top">
            <div class="app_container_top_left" @click="handleBack()">
                <img src="@/assets/images/class/back_icon.png" class="app_container_last_back" alt="">
                <div class="app_container_top_left_text">学习进度</div>
            </div>
        </div>
        <div class="app_container_last" v-loading="loading">
            <template v-if="list.length > 0">
                <div class="app_container_last_detail" v-for="(item, index) in list" :key="index">
                    <div class="app_container_last_detail_top">
                        <img
                            :src="item.profilePicture || require('@/assets/images/class/such.png')"
                            class="app_container_last_detail_top_head"
                            alt=""
                        >
                        <div class="app_container_last_detail_top_text">{{ item.realName || '未知学生' }}</div>
                    </div>
                    <div class="app_container_last_detail_jd">
                        <div class="app_container_last_detail_jd_box">
                            <div
                                class="app_container_last_detail_jd_box_now"
                                :style="{ width: Math.round(item.progressPercent || 0) + '%' }"
                            ></div>
                        </div>
                        <div class="app_container_last_detail_jd_num">{{ Math.round(item.progressPercent || 0) }}%</div>
                    </div>
                </div>
            </template>
            <div v-if="!loading && list.length === 0" class="empty-tip">暂无学习进度数据</div>
        </div>
    </div>
</template>
<script>
import { getLessonProgress, getCourseProgress } from '@/api/modules/teacher'

export default {
    data () {
        return {
            list: [],
            loading: false
        }
    },
    created() {
        this.fetchProgress()
    },
    methods: {
        handleBack() {
            this.$router.go(-1)
        },
        async fetchProgress() {
            const { type, classId, courseId, lessonId } = this.$route.query
            this.loading = true
            try {
                if (type === 'course') {
                    if (!courseId || !classId) return
                    const res = await getCourseProgress(courseId, classId)
                    this.list = res.data || res.rows || []
                } else {
                    if (!classId || !courseId || !lessonId) return
                    const res = await getLessonProgress({ classId, courseId, lessonId })
                    this.list = res.data || res.rows || []
                }
            } catch (e) {
                console.error(e)
                this.list = []
            } finally {
                this.loading = false
            }
        }
    }
}
</script>
<style scoped>
.app_container{
    width: 100%;
    height: 100%;
    background: #F0F3F6;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 14px;
}
.app_container_top{
    width: 100%;
    height: 68px;
background: #FFFFFF;
padding: 0 24px;
box-sizing: border-box;
display: flex;
justify-content: space-between;
align-items: center;
}
.app_container_top_left{
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 16px;
    cursor: pointer;
}
.app_container_last_back{
    width: 7px;
    height: 14px;
}
.app_container_top_left_text{
font-weight: bold;
color: #333333;
font-size: 16px;
}
.app_container_last{
    flex: 1;
    height: 0;
    overflow: auto;
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 15px;
    padding: 0 16px 16px 16px;
    box-sizing: border-box;
    align-content: flex-start;
}
.app_container_last_detail{
    width: 195px;
height: 128px;
background: #FFFFFF;
box-shadow: 0px 0px 8px 0px rgba(0,73,255,0.1);
border-radius: 8px 8px 8px 8px;
padding: 22px 0 20px 0;
box-sizing: border-box;
display: flex;
justify-content: space-between;
flex-direction: column;
}
.app_container_last_detail_top{
    padding: 0 12px 0 19px;
    box-sizing: border-box;
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 12px;
}
.app_container_last_detail_top_head{
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}
.app_container_last_detail_top_text{
    font-weight: bold;
font-size: 14px;
color: #333333;
  word-break: break-all;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  line-height: 20px;
}
.app_container_last_detail_jd{
    display: flex;
    padding: 0 12px 0 14px;
    box-sizing: border-box;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}
.app_container_last_detail_jd_box{
    height: 4px;
background: #F3F4F8;
border-radius: 2px 2px 2px 2px;
flex: 1;
width: 0;
}
.app_container_last_detail_jd_box_now{
height: 4px;
background: #71A0FF;
border-radius: 2px 2px 2px 2px;
transition: width 0.3s ease;
}
.app_container_last_detail_jd_num{
color: #666666;
font-size: 12px;
}
.empty-tip {
    width: 100%;
    text-align: center;
    color: #999999;
    font-size: 14px;
    padding-top: 40px;
}
</style>
