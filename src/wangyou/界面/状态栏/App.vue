<template>
  <div class="battle-shell">
    <section class="hero-panel">
      <div class="eyebrow">DND Lite Combat</div>
      <h1>网游战斗面板</h1>
      <p class="scene-text">{{ data.世界.地点 }} · {{ data.世界.时间 }}</p>
      <p class="scene-subtext">{{ data.世界.剧情上下文 }}</p>
    </section>

    <section class="battle-panel">
      <div class="panel-head">
        <div>
          <div class="panel-title">战斗状态</div>
          <div class="panel-phase">{{ battlePhaseText }}</div>
        </div>
        <button class="action-btn secondary" @click="startBattle">开始/初始化</button>
      </div>

      <BattleHeader
        :battle-state="battleState"
        :active-selection-label="activeSelectionLabel"
        :selected-target-name="selectedTargetName"
      />

      <div class="battle-board">
        <BattleUnitCard
          v-if="enemyUnit"
          :unit="enemyUnit"
          side="enemy"
          :is-current-actor="battleState?.当前行动单位Id === enemyUnit.unitId"
          :is-targeted="selectedTargetId === enemyUnit.unitId"
        />
        <BattleUnitCard
          v-if="allyUnit"
          :unit="allyUnit"
          side="ally"
          :is-current-actor="battleState?.当前行动单位Id === allyUnit.unitId"
          :is-targeted="selectedTargetId === allyUnit.unitId"
        />
      </div>

      <SkillPanel
        v-if="battleState && allyUnit"
        :skills="equippedSkills"
        :selected-skill-id="selectedSkillId"
        :actor="allyUnit"
        :can-act="canAct"
        :active-item-id="selectedItemId"
        @select-skill="selectSkill($event)"
      />

      <ItemPanel
        v-if="battleState && allyUnit"
        :items="availableItems"
        :selected-item-id="selectedItemId"
        :can-act="canAct"
        :active-skill-id="selectedSkillId"
        @select-item="selectItem($event)"
      />

      <TargetPanel
        v-if="battleState && allyUnit"
        :battle-state="battleState"
        :actor="allyUnit"
        :target-type="activeTargetType"
        :selected-target-id="selectedTargetId"
        :can-act="canAct"
        :selection-label="activeSelectionLabel"
        @select-target="selectedTargetId = $event"
      />

      <div class="control-row">
        <button class="action-btn" :disabled="!canSubmitSkill" @click="submitSkill">使用技能</button>
        <button class="action-btn secondary" :disabled="!canSubmitItem" @click="submitItem">使用道具</button>
        <button class="action-btn secondary" :disabled="!canAct" @click="submitDefend">防御</button>
        <button class="action-btn secondary" :disabled="!canAct" @click="submitEscape">逃跑</button>
        <button class="action-btn secondary" :disabled="!battleState" @click="advanceEnemy">推进回合</button>
      </div>

      <BattleResultModal :result="battleState?.结算结果" @settle="settleBattle" />
    </section>

    <BattleLogPanel :logs="recentLogs" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from './store';
import BattleHeader from './components/BattleHeader.vue';
import BattleLogPanel from './components/BattleLogPanel.vue';
import BattleResultModal from './components/BattleResultModal.vue';
import BattleUnitCard from './components/BattleUnitCard.vue';
import ItemPanel from './components/ItemPanel.vue';
import SkillPanel from './components/SkillPanel.vue';
import TargetPanel from './components/TargetPanel.vue';
import { useBattleCommand } from './useBattleCommand';

const store = useDataStore();
const data = computed(() => store.data);
const battleState = computed(() => data.value.战斗状态);
const allyUnit = computed(() => battleState.value?.参战方.ally.单位列表[0]);
const enemyUnit = computed(() => battleState.value?.参战方.enemy.单位列表[0]);

const equippedSkills = computed(() => {
  const hero = data.value.角色档案.hero;
  return (
    hero?.技能表
      .filter(item => item.已装备 && item.已解锁)
      .map(item => data.value.技能定义表[item.skillId])
      .filter(Boolean) ?? []
  );
});

const availableItems = computed(() => {
  const hero = data.value.角色档案.hero;
  return (hero?.可用道具栏 ?? []).map(itemId => data.value.背包[itemId]).filter(Boolean);
});

const {
  selectedSkillId,
  selectedItemId,
  selectedTargetId,
  selectedSkill,
  selectedItem,
  activeTargetType,
  requiresExplicitTarget,
  activeSelectionLabel,
  selectSkill,
  selectItem,
  buildPendingCommand,
} = useBattleCommand({
  battleState,
  allyUnit,
  equippedSkills,
  availableItems,
});

const recentLogs = computed(() => battleState.value?.日志.slice(-12) ?? []);
const battlePhaseText = computed(() => {
  if (!battleState.value) return '未进入战斗';
  return `第 ${battleState.value.回合数} 回合 · ${battleState.value.当前阶段}`;
});
const canAct = computed(() => !!battleState.value?.玩家输入态.可操作 && battleState.value?.状态 !== 'ended');
const canSubmitSkill = computed(() => {
  if (!canAct.value || !selectedSkill.value) return false;
  if (selectedItem.value) return false;
  return requiresExplicitTarget.value ? !!selectedTargetId.value : true;
});
const canSubmitItem = computed(() => {
  if (!canAct.value || !selectedItem.value) return false;
  if (selectedSkill.value) return false;
  return requiresExplicitTarget.value ? !!selectedTargetId.value : true;
});

const selectedTargetName = computed(() => {
  if (!battleState.value || !selectedTargetId.value) return '';
  return (
    [...battleState.value.参战方.ally.单位列表, ...battleState.value.参战方.enemy.单位列表].find(
      unit => unit.unitId === selectedTargetId.value,
    )?.名字 ?? ''
  );
});

async function writePendingCommand(command: Record<string, unknown>) {
  if (!battleState.value) return;
  store.data.战斗状态!.待处理指令 = command as never;
  store.data.战斗状态!.玩家输入态.待选技能Id = (command.skillId as string | undefined) ?? undefined;
  store.data.战斗状态!.玩家输入态.待选目标Id = (command.targetIds as string[] | undefined)?.[0];
}

async function triggerButton(name: string) {
  emitEvent(getButtonEvent(name));
}

async function startBattle() {
  await triggerButton('开始战斗');
}

async function submitSkill() {
  const command = buildPendingCommand('skill');
  if (!command) return;
  await writePendingCommand(command);
  await triggerButton('推进战斗');
}

async function submitItem() {
  const command = buildPendingCommand('item');
  if (!command) return;
  await writePendingCommand(command);
  await triggerButton('推进战斗');
}

async function submitDefend() {
  const command = buildPendingCommand('defend');
  if (!command) return;
  await writePendingCommand(command);
  await triggerButton('推进战斗');
}

async function submitEscape() {
  const command = buildPendingCommand('escape');
  if (!command) return;
  await writePendingCommand(command);
  await triggerButton('推进战斗');
}

async function advanceEnemy() {
  await triggerButton('推进战斗');
}

async function settleBattle() {
  await triggerButton('战斗结算');
}
</script>
