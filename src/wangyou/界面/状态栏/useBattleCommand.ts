import { computed, ref, watch, type ComputedRef, type Ref } from 'vue';
import type { BattleState, InventoryItem, PendingCommand, SkillDefinition } from '@/wangyou/脚本/战斗系统/types';

type Maybe<T> = T | null | undefined;

type UseBattleCommandOptions = {
  battleState: ComputedRef<Maybe<BattleState>>;
  allyUnit: ComputedRef<BattleState['参战方']['ally']['单位列表'][number] | null>;
  equippedSkills: ComputedRef<SkillDefinition[]>;
  availableItems: ComputedRef<InventoryItem[]>;
};

export function useBattleCommand(options: UseBattleCommandOptions) {
  const selectedSkillId = ref<string | null>(null);
  const selectedItemId = ref<string | null>(null);
  const selectedTargetId = ref<string | null>(null);

  const selectedSkill = computed(() => {
    if (!selectedSkillId.value) return null;
    return options.equippedSkills.value.find(skill => skill.id === selectedSkillId.value) ?? null;
  });

  const selectedItem = computed(() => {
    if (!selectedItemId.value) return null;
    return options.availableItems.value.find(item => item.id === selectedItemId.value) ?? null;
  });

  const activeMode = computed<'skill' | 'item' | null>(() => {
    if (selectedItem.value) return 'item';
    if (selectedSkill.value) return 'skill';
    return null;
  });

  const activeTargetType = computed(() => selectedItem.value?.目标类型 ?? selectedSkill.value?.目标类型);

  const requiresExplicitTarget = computed(() => {
    const targetType = activeTargetType.value;
    return targetType === 'self' || targetType === 'single_enemy' || targetType === 'single_ally';
  });

  const activeSelectionLabel = computed(() => {
    if (selectedSkill.value) return `技能：${selectedSkill.value.名称}`;
    if (selectedItem.value) return `道具：${selectedItem.value.名称}`;
    return '未选择行动';
  });

  watch(
    options.equippedSkills,
    skills => {
      if (!skills.length) {
        selectedSkillId.value = null;
        return;
      }

      const currentExists = !!selectedSkillId.value && skills.some(skill => skill.id === selectedSkillId.value);
      if (!selectedSkillId.value || (!selectedItemId.value && !currentExists)) {
        selectedSkillId.value = skills[0].id;
      }
    },
    { immediate: true },
  );

  watch(
    options.availableItems,
    items => {
      if (!selectedItemId.value) return;
      if (!items.some(item => item.id === selectedItemId.value)) {
        selectedItemId.value = null;
      }
    },
    { immediate: true },
  );

  watch(
    [activeTargetType, options.allyUnit, options.battleState],
    ([targetType, actor, state]) => {
      if (!targetType || !actor || !state) {
        selectedTargetId.value = null;
        return;
      }

      const currentTargetExists =
        !!selectedTargetId.value &&
        [...state.参战方.ally.单位列表, ...state.参战方.enemy.单位列表].some(
          unit => unit.unitId === selectedTargetId.value && unit.是否存活,
        );

      if (targetType === 'self') {
        selectedTargetId.value = actor.unitId;
        return;
      }

      if (targetType === 'single_ally') {
        const allyTargets = state.参战方[actor.阵营].单位列表.filter(unit => unit.是否存活);
        if (!currentTargetExists || !allyTargets.some(unit => unit.unitId === selectedTargetId.value)) {
          selectedTargetId.value = allyTargets[0]?.unitId ?? null;
        }
        return;
      }

      if (targetType === 'single_enemy') {
        const targetSide = actor.阵营 === 'ally' ? 'enemy' : 'ally';
        const enemyTargets = state.参战方[targetSide].单位列表.filter(unit => unit.是否存活);
        if (!currentTargetExists || !enemyTargets.some(unit => unit.unitId === selectedTargetId.value)) {
          selectedTargetId.value = enemyTargets[0]?.unitId ?? null;
        }
        return;
      }

      selectedTargetId.value = null;
    },
    { immediate: true },
  );

  function selectSkill(skillId: string) {
    selectedSkillId.value = skillId;
    selectedItemId.value = null;
  }

  function selectItem(itemId: string) {
    selectedItemId.value = itemId;
    selectedSkillId.value = null;
  }

  function buildPendingCommand(actionType: PendingCommand['actionType']): PendingCommand | null {
    const actor = options.allyUnit.value;
    if (!actor) return null;

    if (actionType === 'defend' || actionType === 'escape') {
      return {
        actorId: actor.unitId,
        actionType,
        clientHint: { source: 'player_ui' },
      };
    }

    const targetType = activeTargetType.value;
    const targetIds =
      targetType === 'all_enemies' || targetType === 'all_allies' || targetType === 'random_enemy'
        ? undefined
        : selectedTargetId.value
          ? [selectedTargetId.value]
          : undefined;

    if (actionType === 'skill' && selectedSkillId.value) {
      return {
        actorId: actor.unitId,
        actionType,
        skillId: selectedSkillId.value,
        targetIds,
        clientHint: { source: 'player_ui' },
      };
    }

    if (actionType === 'item' && selectedItemId.value) {
      return {
        actorId: actor.unitId,
        actionType,
        itemId: selectedItemId.value,
        targetIds,
        clientHint: { source: 'player_ui' },
      };
    }

    return null;
  }

  return {
    selectedSkillId,
    selectedItemId,
    selectedTargetId,
    selectedSkill,
    selectedItem,
    activeMode,
    activeTargetType,
    requiresExplicitTarget,
    activeSelectionLabel,
    selectSkill,
    selectItem,
    buildPendingCommand,
  };
}
