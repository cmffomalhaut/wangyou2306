<template>
  <section class="subpanel target-panel">
    <div class="subpanel-head">
      <div>
        <div class="panel-title">目标面板</div>
        <div class="panel-phase">{{ panelHint }}</div>
      </div>
      <div v-if="targetBadgeText" class="target-type-badge">{{ targetBadgeText }}</div>
    </div>

    <div v-if="selectionLabel" class="panel-alert subtle">{{ selectionLabel }}</div>

    <div v-if="!targetType" class="empty-text">先选择一个技能，再决定本次行动目标。</div>

    <div v-else-if="isGroupTarget" class="target-hint-card">
      <div class="target-hint-title">{{ targetModeText }}</div>
      <div class="target-hint-desc">{{ groupTargetText }}</div>
    </div>

    <div v-else-if="targetType === 'random_enemy'" class="target-hint-card">
      <div class="target-hint-title">随机目标</div>
      <div class="target-hint-desc">本次行动会在全部存活敌人中随机抽取一个目标，无需手动指定。</div>
    </div>

    <div v-else-if="!targetCandidates.length" class="empty-text">当前没有合法目标。</div>

    <div v-else class="target-grid">
      <button
        v-for="target in targetCandidates"
        :key="target.unitId"
        class="target-btn"
        :class="{
          selected: selectedTargetId === target.unitId,
          enemy: target.阵营 === 'enemy',
          ally: target.阵营 === 'ally',
        }"
        :disabled="!canAct"
        @click="$emit('select-target', target.unitId)"
      >
        <span class="target-name">{{ target.名字 }}</span>
        <span class="target-meta"
          >{{ target.阵营 === 'enemy' ? '敌方单位' : '我方单位' }} · HP {{ target.当前资源.HP }}/{{
            target.当前资源.HPMax
          }}</span
        >
        <span class="target-meta"
          >MP {{ target.当前资源.MP }}/{{ target.当前资源.MPMax }} · 护盾 {{ target.当前资源.Shield }}</span
        >
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BattleState, BattleUnitState, SkillDefinition } from '@/wangyou/脚本/战斗系统/types';

const props = defineProps<{
  battleState: BattleState | null;
  actor?: BattleUnitState;
  targetType?: SkillDefinition['目标类型'];
  selectedTargetId?: string | null;
  canAct: boolean;
  selectionLabel?: string;
}>();

defineEmits<{
  (e: 'select-target', targetId: string): void;
}>();

const targetTypeLabelMap: Record<SkillDefinition['目标类型'], string> = {
  self: '自身',
  single_enemy: '单体敌人',
  single_ally: '单体友方',
  all_enemies: '全体敌人',
  all_allies: '全体友方',
  random_enemy: '随机敌人',
};

const targetType = computed(() => props.targetType);

const isGroupTarget = computed(() => targetType.value === 'all_enemies' || targetType.value === 'all_allies');

const targetCandidates = computed(() => {
  if (!props.battleState || !props.actor || !targetType.value) return [];

  const allies = props.battleState.参战方.ally.单位列表.filter(unit => unit.是否存活);
  const enemies = props.battleState.参战方.enemy.单位列表.filter(unit => unit.是否存活);
  const actorSideUnits = props.actor.阵营 === 'ally' ? allies : enemies;
  const oppositeSideUnits = props.actor.阵营 === 'ally' ? enemies : allies;

  if (targetType.value === 'self') {
    return props.actor.是否存活 ? [props.actor] : [];
  }

  if (targetType.value === 'single_ally') {
    return actorSideUnits;
  }

  if (targetType.value === 'single_enemy') {
    return oppositeSideUnits;
  }

  return [];
});

const targetBadgeText = computed(() => (targetType.value ? targetTypeLabelMap[targetType.value] : ''));

const targetModeText = computed(() => {
  if (!targetType.value) return '';
  return targetTypeLabelMap[targetType.value];
});

const groupTargetText = computed(() => {
  if (!props.actor || !props.battleState || !targetType.value) return '';

  const targets =
    targetType.value === 'all_allies'
      ? props.actor.阵营 === 'ally'
        ? props.battleState.参战方.ally.单位列表
        : props.battleState.参战方.enemy.单位列表
      : props.actor.阵营 === 'ally'
        ? props.battleState.参战方.enemy.单位列表
        : props.battleState.参战方.ally.单位列表;

  const aliveNames = targets.filter(unit => unit.是否存活).map(unit => unit.名字);
  return aliveNames.length ? `本次行动会影响：${aliveNames.join('、')}` : '当前没有可被影响的目标。';
});

const panelHint = computed(() => {
  if (!props.targetType) return '根据技能目标类型展示本次可选目标';
  if (isGroupTarget.value) return '群体技能无需逐个指定目标';
  if (props.targetType === 'random_enemy') return '随机敌方目标由系统结算时决定';
  if (!props.canAct) return '当前不可操作';
  return '点击一个合法目标后提交行动';
});
</script>
