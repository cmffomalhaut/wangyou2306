<template>
  <div class="item-select-overlay">
    <div class="item-panel">
      <h3>⚗️ 战前道具选择</h3>
      <p class="hint">可使用一个道具，或跳过</p>
      <div class="item-list">
        <button
          v-for="item in items" :key="item.name"
          class="item-btn" :class="item.category"
          @click="$emit('use', item)"
        >
          <span class="item-icon">{{ categoryIcon(item.category) }}</span>
          <span class="item-name">{{ item.name }}</span>
          <span class="item-desc">{{ categoryDesc(item) }}</span>
          <span class="item-count">×{{ item.count }}</span>
        </button>
      </div>
      <button class="skip-btn" @click="$emit('skip')">跳过 ▶</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BattleItem, ItemCategory } from '../types';

defineProps<{ items: BattleItem[] }>();
defineEmits<{ use: [item: BattleItem]; skip: [] }>();

function categoryIcon(cat: ItemCategory): string {
  if (cat === '属性增强药') return '💎';
  if (cat === '技能增强药') return '⚡';
  return '🧪';
}

function categoryDesc(item: BattleItem): string {
  if (item.category === '属性增强药') return `${item.element ?? ''}伤害+10% 5回合`;
  if (item.category === '技能增强药') return '技能伤害+30% 3回合';
  if (item.healLevel === '初级') return '恢复20%HP';
  if (item.healLevel === '中级') return '恢复50%HP';
  return '恢复100%HP';
}
</script>

<style scoped>
.item-select-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(6px);
  z-index: 20;
}

.item-panel {
  background: linear-gradient(160deg, #1a0f2e 0%, #2d1b4e 100%);
  border: 3px solid #ffd700;
  border-radius: 14px;
  padding: 20px 22px;
  width: min(420px, 90%);
  text-align: center;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.5), inset 0 2px 0 rgba(255, 215, 0, 0.2);
  position: relative;
}

.item-panel::before,
.item-panel::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border: 3px solid #ffd700;
  background: #1a0f2e;
}

.item-panel::before {
  top: -3px;
  left: -3px;
  border-right: none;
  border-bottom: none;
}

.item-panel::after {
  top: -3px;
  right: -3px;
  border-left: none;
  border-bottom: none;
}

.item-panel h3 {
  margin: 0 0 6px;
  font-size: 18px;
  color: #ffd700;
  letter-spacing: 0.05em;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
  font-weight: 700;
}

.hint {
  font-size: 12px;
  color: #daa520;
  margin: 0 0 14px;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.item-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  border: 2px solid #ffd700;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(45, 27, 78, 0.8), rgba(26, 15, 46, 0.9));
  color: #f0e6d2;
  cursor: pointer;
  transition: all 0.18s;
  font-size: 13px;
  text-align: left;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
}

.item-btn:hover {
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
  border-color: #fff;
  transform: translateY(-1px);
}

.item-icon {
  font-size: 18px;
}

.item-name {
  font-weight: 700;
  flex-shrink: 0;
  color: #ffd700;
}

.item-desc {
  flex: 1;
  font-size: 11px;
  color: #d1d5db;
}

.item-count {
  font-size: 11px;
  color: #b8860b;
  min-width: 32px;
  text-align: right;
  font-weight: 600;
}

.skip-btn {
  padding: 8px 24px;
  border: 2px solid #ffd700;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(45, 27, 78, 0.9));
  color: #ffd700;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  font-weight: 600;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.skip-btn:hover {
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
  border-color: #fff;
}
</style>
