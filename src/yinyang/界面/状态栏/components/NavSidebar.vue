<template>
  <div class="nav-sidebar">
    <div 
      v-for="(tab, index) in tabs" 
      :key="index" 
      class="nav-item font-ancient" 
      :class="{ active: currentTab === index }"
      @click="$emit('switch', index)">
      {{ tab.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  tabs: Array<{ name: string }>;
  currentTab: number;
}>();

defineEmits(['switch']);
</script>

<style scoped>
.font-ancient {
  font-family: 'Ma Shan Zheng', 'STXingkai', cursive;
}
.nav-sidebar {
  width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  border-right: 2px solid rgba(212, 175, 55, 0.4);
  background: linear-gradient(to right, rgba(212, 175, 55, 0.05), transparent);
  z-index: 10;
}
.nav-item {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 1.8rem;
  color: rgba(138, 11, 28, 0.8);
  border: 3px solid rgba(138, 11, 28, 0.7);
  border-radius: 6px;
  padding: 15px 5px;
  margin-bottom: 35px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  letter-spacing: 4px;
  position: relative;
  background: rgba(255, 255, 255, 0.2);
  clip-path: polygon(3% 0%, 97% 2%, 100% 95%, 2% 100%);
}
.nav-item:nth-child(even) { transform: rotate(3deg); }
.nav-item:nth-child(odd) { transform: rotate(-2deg); }

.nav-item:hover { 
  color: #8a0b1c; 
  border-color: #8a0b1c; 
  background: rgba(138, 11, 28, 0.1);
  transform: scale(1.1) rotate(0deg); 
  box-shadow: 0 0 15px rgba(138, 11, 28, 0.4);
}
.nav-item.active {
  color: #fff;
  background-color: #8a0b1c;
  border-color: #5a0712;
  transform: scale(1.15) rotate(0deg);
  box-shadow: 0 5px 15px rgba(138, 11, 28, 0.6);
  clip-path: polygon(2% 2%, 98% 0%, 100% 98%, 0% 100%); 
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}
</style>
