<template>
  <section class="target-section">
    <div class="target-section-head">
      <div class="section-label">目标选择</div>
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

    <div v-else-if="targetType === 'self'" class="target-hint-card">
      <div class="target-hint-title">自身目标</div>
      <div class="target-hint-desc">本次行动以自身为目标，无需额外指定。</div>
    </div>

    <div v-else-if="!targetCandidates.length" class="empty-text">当前没有合法目标。</div>

    <div v-else class="target-grid">
      <button
        v-for="target in targetCandidates"
        :key="target.unitId"
        class="target-btn"
        :class="{
          selected: selectedTargetId === target.unitId,
          'enemy-target': target.阵营 === 'enemy',
          'ally-target': target.阵营 === 'ally',
        }"
        :disabled="!canAct"
        @click="$emit('select-target', target.unitId)"
      >
        <div style="display: flex; align-items: center; gap: 8px;">
          <div :class="['unit-portrait', target.阵营 === 'enemy' ? 'enemy-portrait' : 'ally-portrait']" style="width: 28px; height: 28px; font-size: 11px;">
            {{ target.名字.charAt(0) }}
          </div>
          <div>
            <div class="target-btn-name">{{ target.名字 }}</div>
            <div class="target-btn-meta">{{ target.阵营 === 'enemy' ? '敌方' : '我方' }} · HP {{ target.当前资源.HP }}/{{ target.当前资源.HPMax }}</div>
          </div>
        </div>
        <div style="margin-top: 4px; display: flex; gap: 8px; font-size: 10px; color: var(--text-muted);">
          <span>MP {{ target.当前资源.MP }}/{{ target.当前资源.MPMax }}</span>
          <span v-if="target.当前资源.Shield > 0">护盾 {{ target.当前资源.Shield }}</span>
        </div>
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

  if (targetType.value === 'self') return props.actor.是否存活 ? [props.actor] : [];
  if (targetType.value === 'single_ally') return actorSideUnits;
  if (targetType.value === 'single_enemy') return oppositeSideUnits;
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
</script>