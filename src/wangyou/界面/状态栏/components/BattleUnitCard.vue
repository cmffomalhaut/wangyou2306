<template>
  <article class="unit-card" :class="[sideClass, { current: isCurrentActor, targeted: isTargeted }]">
    <div class="card-topline">
      <div>
        <div class="card-name">{{ unit.名字 }}</div>
        <div class="card-meta">{{ metaText }}</div>
      </div>
      <div v-if="isCurrentActor" class="turn-pill">行动中</div>
    </div>

    <div class="bar-group">
      <label>HP</label>
      <div class="bar-track"><div class="bar-fill hp" :class="sideClass" :style="{ width: hpWidth }"></div></div>
      <span>{{ unit.当前资源.HP }}/{{ unit.当前资源.HPMax }}</span>
    </div>

    <div class="bar-group">
      <label>MP</label>
      <div class="bar-track"><div class="bar-fill mp" :style="{ width: mpWidth }"></div></div>
      <span>{{ unit.当前资源.MP }}/{{ unit.当前资源.MPMax }}</span>
    </div>

    <div class="stats-grid">
      <span>护盾 {{ unit.当前资源.Shield }}</span>
      <span>物防 {{ unit.当前属性.物理防御 }}</span>
      <span>精防 {{ unit.当前属性.精神防御 }}</span>
      <span>先攻 {{ unit.当前属性.先攻 }}</span>
    </div>

    <div class="status-row">
      <span
        v-for="status in unit.状态列表"
        :key="`${status.statusId}-${status.来源单位Id ?? 'self'}`"
        class="badge"
        :class="badgeClass"
      >
        {{ status.名称 }} {{ status.剩余回合 }}T
      </span>
      <span v-if="unit.状态列表.length === 0" class="empty-text">{{ emptyStatusText }}</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BattleUnitState } from '@/wangyou/脚本/战斗系统/types';

const props = defineProps<{
  unit: BattleUnitState;
  side: 'ally' | 'enemy';
  isCurrentActor?: boolean;
  isTargeted?: boolean;
}>();

const isCurrentActor = computed(() => !!props.isCurrentActor);
const isTargeted = computed(() => !!props.isTargeted);

const sideClass = computed(() => props.side);
const hpWidth = computed(
  () => `${Math.max(0, Math.min(100, (props.unit.当前资源.HP / Math.max(1, props.unit.当前资源.HPMax)) * 100))}%`,
);
const mpWidth = computed(
  () => `${Math.max(0, Math.min(100, (props.unit.当前资源.MP / Math.max(1, props.unit.当前资源.MPMax)) * 100))}%`,
);
const metaText = computed(() =>
  props.side === 'enemy' ? `敌方 · ${props.unit.当前属性.护甲等级} AC` : `我方 · 命中 ${props.unit.当前属性.命中加值}`,
);
const badgeClass = computed(() => (props.side === 'enemy' ? 'danger' : 'ally'));
const emptyStatusText = computed(() => (props.side === 'enemy' ? '无异常' : '状态正常'));
</script>
