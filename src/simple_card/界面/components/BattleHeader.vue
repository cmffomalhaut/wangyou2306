<template>
  <section class="battle-header">
    <div class="battle-header-top">
      <div>
        <div class="section-label">战斗状态</div>
        <div class="battle-header-round">{{ roundText }}</div>
        <div class="battle-header-phase">{{ phaseText }}</div>
      </div>
      <div class="turn-state-pill" :class="turnStateClass">
        <span class="turn-state-icon">{{ turnStateIcon }}</span>
        {{ turnStateText }}
      </div>
    </div>

    <div class="battle-header-info">
      <div class="info-card">
        <div class="info-label">当前行动</div>
        <div class="info-value">{{ actorName }}</div>
        <div class="info-meta">{{ actorSideText }}</div>
      </div>
      <div class="info-card">
        <div class="info-label">操作状态</div>
        <div class="info-value">{{ actionStateText }}</div>
        <div class="info-meta">{{ actionHintText }}</div>
      </div>
      <div class="info-card emphasis">
        <div class="info-label">当前选择</div>
        <div class="info-value">{{ selectionText }}</div>
        <div class="info-meta">{{ selectionMetaText }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BattleState } from '@/wangyou/脚本/战斗系统/types';

const props = defineProps<{
  battleState: BattleState | null;
  activeSelectionLabel?: string;
  selectedTargetName?: string;
}>();

const phaseLabelMap: Record<BattleState['当前阶段'], string> = {
  turn_start: '回合开始',
  select_action: '选择行动',
  select_target: '选择目标',
  resolve_action: '结算行动',
  turn_end: '回合结束',
  battle_end: '战斗结束',
};

const phaseText = computed(() => {
  if (!props.battleState) return '未进入战斗';
  return phaseLabelMap[props.battleState.当前阶段] ?? props.battleState.当前阶段;
});

const roundText = computed(() => {
  if (!props.battleState) return '等待初始化';
  return `第 ${props.battleState.回合数} 回合`;
});

const currentActor = computed(() => {
  if (!props.battleState?.当前行动单位Id) return null;
  return [...props.battleState.参战方.ally.单位列表, ...props.battleState.参战方.enemy.单位列表].find(
    unit => unit.unitId === props.battleState?.当前行动单位Id,
  );
});

const actorName = computed(() => currentActor.value?.名字 ?? '暂无');

const actorSideText = computed(() => {
  if (!props.battleState || !currentActor.value) return '等待战斗开始';
  return currentActor.value.阵营 === 'ally' ? '我方单位' : '敌方单位';
});

const turnStateText = computed(() => {
  if (!props.battleState) return '未开始';
  if (props.battleState.状态 === 'ended') return '已结束';
  return props.battleState.玩家输入态.可操作 ? '玩家回合' : '系统推进中';
});

const turnStateIcon = computed(() => {
  if (!props.battleState) return '◇';
  if (props.battleState.状态 === 'ended') return '◆';
  return props.battleState.玩家输入态.可操作 ? '◈' : '◇';
});

const turnStateClass = computed(() => {
  if (!props.battleState) return 'idle';
  if (props.battleState.状态 === 'ended') return 'ended';
  return props.battleState.玩家输入态.可操作 ? 'player' : 'system';
});

const actionStateText = computed(() => {
  if (!props.battleState) return '待命';
  if (props.battleState.状态 === 'ended') return '等待结算';
  return props.battleState.玩家输入态.可操作 ? '可操作' : '不可操作';
});

const actionHintText = computed(() => {
  if (!props.battleState) return '点击「开始战斗」进入战斗';
  if (props.battleState.状态 === 'ended') return '可在下方执行战后结算';
  return props.battleState.玩家输入态.可操作 ? '请选择技能或指令后提交' : '等待敌方或系统流程完成';
});

const selectionText = computed(() => props.activeSelectionLabel || '未选择行动');

const selectionMetaText = computed(() => {
  if (!props.battleState) return '进入战斗后会同步展示当前指令与目标';
  if (props.battleState.状态 === 'ended') return props.battleState.结算结果?.summary ?? '战斗已结束';
  if (props.selectedTargetName) return `当前目标：${props.selectedTargetName}`;
  if (props.battleState.玩家输入态.待选目标Id) return `目标已写入：${props.battleState.玩家输入态.待选目标Id}`;
  return '尚未指定目标';
});
</script>