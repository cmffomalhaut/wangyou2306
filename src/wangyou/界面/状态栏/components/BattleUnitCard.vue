<template>
  <article
    class="unit-card"
    :class="[side, { current: isCurrentActor, targeted: isTargeted, selectable: isSelectable, dead: !unit.是否存活 }]"
    @click="$emit('select')"
  >
    <div class="unit-card-top">
      <div :class="['unit-portrait', side === 'enemy' ? 'enemy-portrait' : 'ally-portrait']">
        {{ unit.名字.charAt(0) }}
      </div>
      <div class="unit-top-info">
        <div class="unit-name">{{ unit.名字 }}<span v-if="unit.当前属性.生命层次 > 1" class="unit-tier"> {{ '★'.repeat(unit.当前属性.生命层次 - 1) }}</span></div>
        <div class="unit-meta">{{ side === 'enemy' ? `先攻 ${unit.当前属性.先攻}` : `敏捷 ${unit.当前属性.敏捷}` }}</div>
      </div>
      <div v-if="isCurrentActor" class="turn-indicator active-turn">▸</div>
      <div v-if="isTargeted && side === 'enemy'" class="target-marker">◈</div>
    </div>

    <div class="unit-bars">
      <div class="unit-bar-row">
        <span class="unit-bar-label hp-lbl">HP</span>
        <div class="unit-bar-track"><div class="unit-bar-fill hp-fill" :class="{ 'enemy-bar': side === 'enemy' }" :style="{ width: hpWidth }"></div></div>
        <span class="unit-bar-text">{{ unit.当前资源.HP }}/{{ unit.当前资源.HPMax }}</span>
      </div>
      <div class="unit-bar-row">
        <span class="unit-bar-label mp-lbl">MP</span>
        <div class="unit-bar-track"><div class="unit-bar-fill mp-fill" :style="{ width: mpWidth }"></div></div>
        <span class="unit-bar-text">{{ unit.当前资源.MP }}/{{ unit.当前资源.MPMax }}</span>
      </div>
    </div>

    <div v-if="unit.当前资源.Shield > 0" class="unit-shield-row">
      <span class="shield-icon">◆</span> {{ unit.当前资源.Shield }}
    </div>

    <div class="unit-statuses">
      <span
        v-for="status in unit.状态列表"
        :key="`${status.statusId}-${status.来源单位Id ?? 'self'}`"
        class="status-badge"
        :class="statusClass(status)"
      >{{ status.名称 }}{{ status.剩余回合 }}T</span>
    </div>

    <div v-if="hovered" class="unit-tooltip">
      <div>物防 {{ unit.当前属性.物理防御 }} · 精防 {{ unit.当前属性.精神防御 }}</div>
      <div>命中 {{ unit.当前属性.命中加值 }} · 闪避 {{ unit.当前属性.闪避加值 }}</div>
      <div>层次 {{ unit.当前属性.生命层次 }} · CTB {{ unit.行动计数器 }}</div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { BattleUnitState } from '@/wangyou/脚本/战斗系统/types';

const DEBUFF_IDS = ['poison', 'burn', 'freeze', 'stun', 'fear', 'confuse', 'charm', 'silence', 'slow', 'blind', 'curse', 'weaken', 'vulnerability', 'taunted'];

const props = defineProps<{
  unit: BattleUnitState;
  side: 'ally' | 'enemy';
  isCurrentActor?: boolean;
  isTargeted?: boolean;
  isSelectable?: boolean;
}>();

defineEmits<{ (e: 'select'): void }>();

const hovered = ref(false);

const isCurrentActor = computed(() => !!props.isCurrentActor);
const isTargeted = computed(() => !!props.isTargeted);
const isSelectable = computed(() => !!props.isSelectable);

const hpWidth = computed(() => `${Math.max(0, Math.min(100, (props.unit.当前资源.HP / Math.max(1, props.unit.当前资源.HPMax)) * 100))}%`);
const mpWidth = computed(() => `${Math.max(0, Math.min(100, (props.unit.当前资源.MP / Math.max(1, props.unit.当前资源.MPMax)) * 100))}%`);

function statusClass(status: BattleUnitState['状态列表'][number]) {
  const id = status.statusId?.toLowerCase() ?? '';
  if (DEBUFF_IDS.some(d => id.includes(d))) return 'debuff';
  const name = status.名称;
  if (name.includes('护盾') || name.includes('强化') || name.includes('祝福') || name.includes('鼓舞')) return 'buff';
  return 'neutral';
}
</script>