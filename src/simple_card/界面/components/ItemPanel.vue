<template>
  <section class="subpanel item-panel">
    <div class="subpanel-head">
      <div>
        <div class="panel-title">道具面板</div>
        <div class="panel-phase">{{ panelHintText }}</div>
      </div>
    </div>

    <div v-if="selectionAlertText" class="panel-alert">{{ selectionAlertText }}</div>

    <div v-if="items.length === 0" class="empty-text">当前没有可在战斗中使用的道具。</div>

    <div v-else class="command-grid">
      <button
        v-for="item in items"
        :key="item.id"
        class="skill-btn item-btn"
        :class="{ selected: selectedItemId === item.id, disabled: !isItemAvailable(item), muted: !!activeSkillId }"
        :disabled="!canAct || !isItemAvailable(item)"
        @click="$emit('select-item', item.id)"
      >
        <span class="skill-name">{{ item.名称 }}</span>
        <span class="skill-meta">数量 {{ item.数量 }} · {{ targetTypeText(item.目标类型) }}</span>
        <span class="skill-desc">{{ itemSummary(item) }}</span>
        <span class="skill-reason">{{ getUnavailableReason(item) }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { InventoryItem } from '@/wangyou/脚本/战斗系统/types';

const props = defineProps<{
  items: InventoryItem[];
  selectedItemId: string | null;
  canAct: boolean;
  activeSkillId?: string | null;
}>();

defineEmits<{
  (e: 'select-item', itemId: string): void;
}>();

const targetTypeLabelMap: Record<InventoryItem['目标类型'], string> = {
  self: '自身',
  single_enemy: '单体敌人',
  single_ally: '单体友方',
  all_enemies: '全体敌人',
  all_allies: '全体友方',
  random_enemy: '随机敌人',
};

const panelHintText = computed(() => {
  if (!props.canAct) return '当前不可操作';
  if (props.activeSkillId) return '当前已切换为技能模式，道具仅保留预览';
  return '可选择战斗道具并配合目标面板提交';
});

const selectionAlertText = computed(() => {
  if (!props.activeSkillId) return '';
  return '已选择技能，道具选择会与技能选择互斥。';
});

function isItemAvailable(item: InventoryItem) {
  return item.战斗可用 && item.数量 > 0;
}

function getUnavailableReason(item: InventoryItem) {
  if (!props.canAct) return '当前不可操作';
  if (!item.战斗可用) return '该道具不可在战斗中使用';
  if (item.数量 <= 0) return '数量不足';
  return '可使用';
}

function targetTypeText(targetType: InventoryItem['目标类型']) {
  return targetTypeLabelMap[targetType];
}

function itemSummary(item: InventoryItem) {
  const parts: string[] = [];
  if (item.回复HP) parts.push(`恢复 HP ${item.回复HP}`);
  if (item.回复MP) parts.push(`恢复 MP ${item.回复MP}`);
  if (item.描述) parts.push(item.描述);
  return parts.join(' · ') || '暂无道具说明';
}
</script>
