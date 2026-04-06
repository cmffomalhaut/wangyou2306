<template>
  <div class="fluid-bar-wrapper" :class="[wrapperClass]">
    <div class="fluid-fill" :class="[fillClass]" :style="{ width: percent + '%' }"></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  percent: number;
  wrapperClass?: string;
  fillClass?: string;
}>();
</script>

<style scoped>
.fluid-bar-wrapper {
  height: 16px;
  width: 100%;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(138, 11, 28, 0.2);
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.2);
  margin-top: 6px;
}
.fluid-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff4d6d, #d12e53, #8a0b1c);
  position: relative;
  transition: width 1.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.fluid-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 100%;
  background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg"><path d="M0,10 Q25,20 50,10 T100,10 L100,20 L0,20 Z" fill="rgba(255,255,255,0.3)"/></svg>');
  background-size: 50% 100%;
  animation: waveFlow 2s linear infinite;
}
@keyframes waveFlow {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
/* 辅助修饰类 */
.fluid-fill.gold-qi {
  background: linear-gradient(90deg, #e6c27a, #d4af37, #996515);
}
</style>
