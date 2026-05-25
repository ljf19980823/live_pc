<template>
  <div class="cancel-account">
    <div class="cancel-account__title">账号注销</div>
    <div class="cancel-account__warning">
      <div class="cancel-account__warning-header">
        <svg class="cancel-account__warning-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#FF4D4F" stroke-width="1.8" stroke-linejoin="round"/>
          <line x1="12" y1="9" x2="12" y2="13" stroke="#FF4D4F" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="12" cy="17" r="0.8" fill="#FF4D4F"/>
        </svg>
        <span class="cancel-account__warning-title">注销前请仔细阅读</span>
      </div>
      <ul class="cancel-account__warning-list">
        <li>·注销后账号将永久删除，无法恢复</li>
        <li>·所有课程、教研组数据将同步清除</li>
        <li>·如有未完成课程请先完成交接</li>
      </ul>
    </div>
    <div class="cancel-account__tip">
      你的账号由学校分配，无法自行注销，请联系学校管理员删除
    </div>
  </div>
</template>

<script>
export default {
  name: 'CancelAccount'
}
</script>

<style lang="scss" scoped>
.cancel-account {
  padding: 24px 32px;
  box-sizing: border-box;

  &__title {
    font-size: 13px;
  color: #888;
  font-weight: 400;
    margin-bottom: 20px;
  }

  &__warning {
    background: #FFF0F0;
    border-radius: 12px;
    padding: 18px 20px 16px;
    margin-bottom: 20px;
    border: 1px solid #FFD5D5;

    &-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    &-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    &-title {
      font-size: 13px;
      font-weight: bold;
      color: #FF3B30;
    }
  }

  &__warning-list {
    list-style: none;
    margin: 0;
    padding: 0 0 0 28px;
    display: flex;
    flex-direction: column;
    gap: 6px;

    li {
      font-size: 12px;
      color: #666666;
      line-height: 1.6;
    }
  }

  &__tip {
    height: 42px;
    border: 1.5px solid #FF3B30;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    color: #FF3B30;
    font-weight: 500;
    text-align: center;
    line-height: 1.6;
  }
}
</style>
