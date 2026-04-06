<template>
  <div class="fade-content">
    <div class="ancient-card">
      <h2 class="text-2xl font-bold text-red-900 mb-4 flex items-center">
        <svg class="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A9,9 0 0,0 3,11C3,14.03 4.53,16.82 7,18.46V22H17V18.46C19.47,16.82 21,14.03 21,11A9,9 0 0,0 12,2M8,11A4,4 0 0,1 12,7A4,4 0 0,1 16,11A4,4 0 0,1 12,15A4,4 0 0,1 8,11Z"/></svg>
        真身本源
      </h2>
      <div class="grid grid-cols-2 gap-4">
        <div class="kv-block"><span class="kv-key">尊名:</span><span class="kv-val font-bold text-lg">天道无名</span></div>
        <div class="kv-block">
          <span class="kv-key">位阶:</span>
          <span class="seal-tag gold">元婴期</span> 
          <span class="seal-tag">表界 D级</span>
        </div>
        <div class="kv-block"><span class="kv-key">双重身份:</span><span class="kv-val">合欢宗少主 / 凡星学子</span></div>
        <div class="kv-block"><span class="kv-key">法宝神器:</span><span class="kv-val text-yellow-700 font-bold">天香美人图(神)</span>、缚仙索</div>
      </div>

      <h2 class="text-xl font-bold text-red-900 mt-6 mb-3">仙道五维</h2>
      <div class="grid grid-cols-2 gap-6">
        <div v-for="stat in stats" :key="stat.name">
          <div class="flex justify-between text-sm font-bold text-gray-800 mb-1">
            <span>{{ stat.name }}</span><span>{{ stat.val }}</span>
          </div>
          <LustBar :percent="stat.val" fillClass="gold-qi" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LustBar from './LustBar.vue';
import { ref } from 'vue';

const stats = ref([
  { name: '力量', val: 65 },
  { name: '敏捷', val: 80 },
  { name: '体质', val: 95 },
  { name: '智力', val: 85 },
  { name: '魅力', val: 100 }
]);
</script>

<style scoped>
.ancient-card {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.5);
  box-shadow: 0 4px 15px rgba(0,0,0,0.08), inset 0 0 30px rgba(255,255,255,0.5);
  border-radius: 4px;
  padding: 25px;
  position: relative;
  margin-bottom: 25px;
  backdrop-filter: blur(4px);
}
.ancient-card::before, .ancient-card::after {
  content: ''; position: absolute; width: 20px; height: 20px; border: 2px solid #c49123; pointer-events: none;
}
.ancient-card::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.ancient-card::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.kv-block { margin-bottom: 12px; }
.kv-key { color: #8a0b1c; font-weight: bold; margin-right: 8px; }
.kv-val { color: #1a1a1a; font-size: 0.95rem; line-height: 1.6; }

.seal-tag {
  font-size: 0.85rem; padding: 2px 8px;
  border: 1px solid #8a0b1c; color: #8a0b1c;
  border-radius: 2px; font-weight: bold;
  background: rgba(138, 11, 28, 0.05);
  display: inline-flex; align-items: center; gap: 4px;
}
.seal-tag.gold {
  border-color: #c49123; color: #c49123; background: rgba(196, 145, 35, 0.1);
}
</style>
