<template>
  <section class="subpanel skill-panel">
    <div class="subpanel-head">
      <div>
        <div class="panel-title">技能面板</div>
        <div class="panel-phase">{{ panelHintText }}</div>
      </div>
    </div>

    <div v-if="selectionAlertText" class="panel-alert">{{ selectionAlertText }}</div>

    <div v-if="skills.length === 0" class="empty-text">当前没有已装备且可用的技能。</div>

    <div v-else-if="previewSkill" class="skill-preview-card">
      <div class="skill-preview-head">
        <div>
          <div class="skill-preview-title">{{ previewSkill.名称 }}</div>
          <div class="skill-preview-meta">
            {{ targetTypeText(previewSkill.目标类型) }} · {{ rangeText(previewSkill.射程) }} ·
            {{ checkTypeText(previewSkill.检定.类型) }}
          </div>
        </div>
        <div class="skill-preview-cost">MP {{ previewSkill.消耗.MP }} / CD {{ getCooldown(previewSkill.id) }}</div>
      </div>

      <div class="skill-preview-desc">{{ previewSkill.描述 || '暂无技能说明' }}</div>

      <div class="skill-preview-effects">
        <span v-for="summary in effectSummaries(previewSkill)" :key="summary" class="badge">{{ summary }}</span>
      </div>
    </div>

    <div class="command-grid">
      <button
        v-for="skill in skills"
        :key="skill.id"
        class="skill-btn"
        :class="{
          selected: selectedSkillId === skill.id,
          disabled: !isSkillAvailable(skill.id, skill.消耗.MP),
          muted: !!activeItemId,
        }"
        :disabled="!canAct || !isSkillAvailable(skill.id, skill.消耗.MP)"
        @click="$emit('select-skill', skill.id)"
        @mouseenter="hoveredSkillId = skill.id"
        @mouseleave="hoveredSkillId = null"
        @focus="hoveredSkillId = skill.id"
        @blur="hoveredSkillId = null"
      >
        <span class="skill-name">{{ skill.名称 }}</span>
        <span class="skill-meta">MP {{ skill.消耗.MP }} · CD {{ getCooldown(skill.id) }}</span>
        <span class="skill-desc">{{ skill.描述 || '暂无技能说明' }}</span>
        <span class="skill-reason">{{ getUnavailableReason(skill) }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { BattleUnitState, SkillDefinition } from '@/wangyou/脚本/战斗系统/types';

const props = defineProps<{
  skills: SkillDefinition[];
  selectedSkillId: string | null;
  actor?: BattleUnitState;
  canAct: boolean;
  activeItemId?: string | null;
}>();

defineEmits<{
  (e: 'select-skill', skillId: string): void;
}>();

const hoveredSkillId = ref<string | null>(null);

const previewSkill = computed(() => {
  const skillId = hoveredSkillId.value ?? props.selectedSkillId;
  return skillId ? (props.skills.find(skill => skill.id === skillId) ?? null) : (props.skills[0] ?? null);
});

const panelHintText = computed(() => {
  if (!props.canAct) return '当前不可操作';
  if (props.activeItemId) return '当前已切换为道具模式，技能仅保留预览';
  return '选择一个技能后提交行动';
});

const selectionAlertText = computed(() => {
  if (!props.activeItemId) return '';
  return '已选择道具，技能选择会与道具选择互斥。';
});

function getCooldown(skillId: string) {
  return props.actor?.技能栏.find(skill => skill.skillId === skillId)?.当前冷却 ?? 0;
}

function isSkillAvailable(skillId: string, mpCost: number) {
  const runtimeSkill = props.actor?.技能栏.find(skill => skill.skillId === skillId);
  if (!props.actor || !runtimeSkill) return false;
  return runtimeSkill.当前冷却 <= 0 && !runtimeSkill.已禁用 && props.actor.当前资源.MP >= mpCost;
}

function getUnavailableReason(skill: SkillDefinition) {
  const runtimeSkill = props.actor?.技能栏.find(item => item.skillId === skill.id);
  if (!props.canAct) return '当前不可操作';
  if (!props.actor || !runtimeSkill) return '运行时技能缺失';
  if (runtimeSkill.已禁用) return runtimeSkill.禁用原因 || '技能已禁用';
  if (runtimeSkill.当前冷却 > 0) return `冷却中，还需 ${runtimeSkill.当前冷却} 回合`;
  if (props.actor.当前资源.MP < skill.消耗.MP) return `MP 不足，需要 ${skill.消耗.MP}`;
  return '可使用';
}

function targetTypeText(targetType: SkillDefinition['目标类型']) {
  const map: Record<SkillDefinition['目标类型'], string> = {
    self: '目标: 自身',
    single_enemy: '目标: 单体敌人',
    single_ally: '目标: 单体友方',
    all_enemies: '目标: 全体敌人',
    all_allies: '目标: 全体友方',
    random_enemy: '目标: 随机敌人',
  };
  return map[targetType];
}

function rangeText(range: SkillDefinition['射程']) {
  const map: Record<SkillDefinition['射程'], string> = {
    melee: '近战',
    ranged: '远程',
    global: '全域',
  };
  return `射程: ${map[range]}`;
}

function checkTypeText(checkType: SkillDefinition['检定']['类型']) {
  const map: Record<SkillDefinition['检定']['类型'], string> = {
    attack_roll: '攻击检定',
    saving_throw: '豁免检定',
    auto_hit: '自动生效',
  };
  return map[checkType];
}

function effectSummaries(skill: SkillDefinition) {
  return skill.效果列表.map(effect => summarizeEffect(effect));
}

function summarizeEffect(effect: SkillDefinition['效果列表'][number]) {
  switch (effect.kind) {
    case 'damage':
      return `伤害 ${effect.scale} x${effect.ratio} + ${effect.flat} (${effect.damageType})`;
    case 'heal':
      return `治疗 ${effect.scale} x${effect.ratio} + ${effect.flat}`;
    case 'restore_mp':
      return `回复 MP ${effect.flat}${effect.ratio ? ` + ${effect.ratio}系数` : ''}`;
    case 'shield':
      return `护盾 ${effect.scale} x${effect.ratio} + ${effect.flat}，持续 ${effect.duration} 回合`;
    case 'apply_status':
      return `附加状态 ${effect.statusId}，${Math.round(effect.chance * 100)}% 持续 ${effect.duration} 回合`;
    case 'remove_status':
      return `移除状态 ${effect.count} 个`;
    case 'add_modifier':
      return `施加修正 ${effect.modifierId}，数值 ${effect.value}，持续 ${effect.duration} 回合`;
    case 'dispel':
      return `驱散效果 ${effect.count} 个`;
    case 'taunt':
      return `嘲讽 ${effect.duration} 回合${effect.dc ? `，DC ${effect.dc}` : ''}`;
    case 'forced_move':
      return `强制位移 ${effect.moveType} ${effect.distance} 格`;
    default:
      return '特殊效果';
  }
}
</script>
