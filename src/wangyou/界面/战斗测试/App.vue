<template>
  <div class="preview-shell">
    <div class="preview-left">
      <div class="preview-title-bar">
        <h1>战斗UI预览</h1>
        <div class="preview-controls">
          <button @click="resetData">重置</button>
          <button @click="startBattle">开始</button>
          <button @click="tick">推1步</button>
          <button @click="autoRun">自动</button>
          <button @click="settle" :disabled="!canSettle">结算</button>
        </div>
      </div>

      <div class="battle-shell">
        <div v-if="battleState" class="battle-top-bar">
          <TurnOrderBar :battle-state="battleState" />
        </div>

        <div v-if="battleState" class="enemy-strip">
          <div class="section-label">敌方</div>
          <div class="enemy-strip-list">
            <div v-for="unit in enemyUnits" :key="unit.unitId" class="enemy-strip-item"
              :class="{ targeted: selectedTargetId === unit.unitId, selectable: needsEnemyTarget && unit.是否存活, dead: !unit.是否存活 }"
              @click="onEnemyClick(unit)">
              <div class="enemy-strip-name">{{ unit.名字 }}</div>
              <div class="enemy-strip-bar-row">
                <div class="bar-track enemy-bar-track"><div class="bar-fill hp" :style="{ width: barWidth(unit.当前资源.HP, unit.当前资源.HPMax) }"></div></div>
                <span class="bar-val">{{ unit.当前资源.HP }}/{{ unit.当前资源.HPMax }}</span>
              </div>
              <button class="detail-toggle enemy-strip-toggle" @click.stop="expandedEnemy = expandedEnemy === unit.unitId ? null : unit.unitId">{{ expandedEnemy === unit.unitId ? '▾' : '▸' }}</button>
              <div v-if="expandedEnemy === unit.unitId" class="detail-panel enemy-detail" @click.stop>
                <div class="detail-grid">
                  <span>力量 {{ unit.当前属性.力量 }}</span>
                  <span>敏捷 {{ unit.当前属性.敏捷 }}</span>
                  <span>体质 {{ unit.当前属性.体质 }}</span>
                  <span>智力 {{ unit.当前属性.智力 }}</span>
                  <span>感知 {{ unit.当前属性.感知 }}</span>
                  <span>魅力 {{ unit.当前属性.魅力 }}</span>
                  <span>物防 {{ unit.当前属性.物理防御 }}</span>
                  <span>精防 {{ unit.当前属性.精神防御 }}</span>
                  <span>先攻 {{ unit.当前属性.先攻 }}</span>
                </div>
                <div v-if="unit.状态列表.length" class="detail-section">
                  <div class="detail-section-title">状态</div>
                  <div v-for="s in unit.状态列表" :key="`${s.statusId}-e`" class="detail-line">
                    <span class="status-badge" :class="statusClass(s)">{{ s.名称 }} {{ s.剩余回合 }}T{{ s.层数 > 1 ? ` ×${s.层数}` : '' }}</span>
                  </div>
                </div>
                <div v-if="unit.技能栏.length" class="detail-section">
                  <div class="detail-section-title">技能</div>
                  <div v-for="sk in unit.技能栏" :key="sk.skillId" class="detail-line">{{ skillName(sk.skillId) }}{{ sk.当前冷却 > 0 ? ` CD:${sk.当前冷却}` : '' }}{{ sk.已禁用 ? ' [禁用]' : '' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="battle-main">
          <aside class="left-col">
            <div class="round-info" v-if="battleState">
              <span class="round-info-round">R{{ battleState.回合数 }}</span>
              <span v-if="currentActor" class="round-info-actor">
                <span class="round-info-dot" :class="currentActor.阵营 === 'ally' ? 'ally-dot' : 'enemy-dot'"></span>
                {{ currentActor.名字 }}
              </span>
              <span v-if="battleState.玩家输入态.可操作 && battleState.状态 !== 'ended'" class="turn-state-pill player">◈ 你的回合</span>
              <span v-else-if="battleState.状态 !== 'ended'" class="turn-state-pill system">◇ 系统处理中</span>
            </div>

            <section class="party-section">
              <div class="section-label">我方</div>
              <div class="party-list">
                <div v-for="unit in allyUnits" :key="unit.unitId" class="party-row"
                  :class="{ active: unit.unitId === activeAllyId, dead: !unit.是否存活, selectable: needsAllyTarget && unit.是否存活, targeted: selectedTargetId === unit.unitId }"
                  @click="onAllyClick(unit)">
                  <div class="party-avatar-sm">{{ unit.名字.charAt(0) }}</div>
                  <div class="party-row-info">
                    <div class="party-row-name">{{ unit.名字 }}<span v-if="unit.当前属性.生命层次 > 1" class="unit-tier"> {{ '★'.repeat(unit.当前属性.生命层次 - 1) }}</span>
                      <span v-if="unit.unitId === (battleState?.当前行动单位Id) && unit.阵营 === 'ally'" class="turn-badge">▸</span>
                    </div>
                    <div class="party-bar-row">
                      <span class="bar-lbl hp">HP</span>
                      <div class="bar-track"><div class="bar-fill hp" :style="{ width: barWidth(unit.当前资源.HP, unit.当前资源.HPMax) }"></div></div>
                      <span class="bar-val">{{ unit.当前资源.HP }}/{{ unit.当前资源.HPMax }}</span>
                    </div>
                    <div class="party-bar-row">
                      <span class="bar-lbl mp">MP</span>
                      <div class="bar-track"><div class="bar-fill mp" :style="{ width: barWidth(unit.当前资源.MP, unit.当前资源.MPMax) }"></div></div>
                      <span class="bar-val">{{ unit.当前资源.MP }}/{{ unit.当前资源.MPMax }}</span>
                    </div>
                    <div v-if="unit.当前资源.Shield > 0" class="party-shield">◆ 护盾 {{ unit.当前资源.Shield }}</div>
                    <div v-if="unit.状态列表.length" class="party-statuses">
                      <span v-for="s in unit.状态列表" :key="`${s.statusId}-${s.来源单位Id ?? 'self'}`" class="status-badge" :class="statusClass(s)">{{ s.名称 }}{{ s.剩余回合 }}T</span>
                    </div>
                  </div>
                  <button class="detail-toggle" @click.stop="expandedAlly = expandedAlly === unit.unitId ? null : unit.unitId">{{ expandedAlly === unit.unitId ? '▾' : '▸' }}</button>
                </div>
              </div>
            </section>

            <section class="log-strip">
              <div class="section-label">日志</div>
              <div class="log-scroll">
                <div v-for="entry in recentLogs" :key="entry.id" class="log-item-sm" :class="entry.type">
                  <span class="log-turn-sm">T{{ entry.turn }}</span> {{ entry.text }}
                </div>
                <div v-if="recentLogs.length === 0" class="empty-text">暂无日志</div>
              </div>
            </section>
          </aside>

          <main class="center-col">
            <template v-if="battleState">
              <BattleArena
                :ally-units="allyUnits"
                :enemy-units="enemyUnits"
                :current-actor-id="battleState.当前行动单位Id"
                :selected-target-id="selectedTargetId"
                :needs-enemy-target="needsEnemyTarget"
                :needs-ally-target="needsAllyTarget"
                :anim="animEvent"
                @select="onArenaSelect"
              />

              <div v-if="currentActor" class="actor-status-bar">
                <div class="actor-status-name">{{ currentActor.名字 }} · {{ currentActor.阵营 === 'ally' ? '我方' : '敌方' }}</div>
                <div class="actor-status-badges">
                  <span v-if="currentActor.当前资源.Shield > 0" class="status-badge buff">◆ 护盾 {{ currentActor.当前资源.Shield }}</span>
                  <span v-for="s in currentActor.状态列表" :key="`${s.statusId}-actor`" class="status-badge" :class="statusClass(s)">{{ s.名称 }} {{ s.剩余回合 }}T{{ s.层数 > 1 ? ` ×${s.层数}` : '' }}</span>
                  <span v-if="currentActor.状态列表.length === 0 && currentActor.当前资源.Shield <= 0" class="status-badge neutral">状态正常</span>
                </div>
                <div v-if="!currentActor.是否可行动" class="status-badge debuff">不可行动</div>
              </div>

              <div v-if="targetHintText" class="target-hint">{{ targetHintText }}</div>

              <div v-if="confirmBarText" class="confirm-bar">
                <div class="confirm-info">{{ confirmBarText }}</div>
                <button v-if="activeMode === 'skill'" class="confirm-btn" :disabled="!canSubmitSkill" @click="submitSkill">确认使用技能</button>
                <button v-if="activeMode === 'item'" class="confirm-btn" :disabled="!canSubmitItem" @click="submitItem">确认使用道具</button>
                <button class="confirm-btn cancel" @click="cancelSelection">取消</button>
              </div>

              <div class="command-area">
                <div class="command-buttons">
                  <button class="action-btn" :class="{ expanded: expandedPanel === 'skill' }" :disabled="!canAct" @click="togglePanel('skill')">⚔ 技能</button>
                  <button class="action-btn secondary" :class="{ expanded: expandedPanel === 'item' }" :disabled="!canAct" @click="togglePanel('item')">✦ 道具</button>
                  <button class="action-btn secondary" :disabled="!canAct" @click="submitDefend">◆ 防御</button>
                  <button class="action-btn secondary danger" :disabled="!canAct" @click="submitEscape">✕ 逃跑</button>
                  <button class="action-btn secondary" @click="tick">▸ 推进</button>
                </div>

                <SkillPanel
                  v-if="expandedPanel && activeAllyUnit"
                  :skills="activeAllySkills"
                  :items="availableItems"
                  :selected-skill-id="selectedSkillId"
                  :selected-item-id="selectedItemId"
                  :actor="activeAllyUnit"
                  :can-act="canAct"
                  :active-item-id="selectedItemId"
                  :active-skill-id="selectedSkillId"
                  :active-tab-prop="expandedPanel === 'item' ? 'item' : 'skill'"
                  @select-skill="onSelectSkill"
                  @select-item="onSelectItem"
                />
              </div>

              <BattleResultModal :result="battleState?.结算结果" @settle="settle" />
            </template>

            <div v-else class="no-battle-state">
              <div class="no-battle-icon">⚔</div>
              <div class="no-battle-text">点击「开始」进入战斗</div>
              <button class="action-btn" @click="startBattle">⚔ 开始战斗</button>
            </div>
          </main>
        </div>
      </div>
    </div>

    <div class="preview-bottom">
      <div class="debug-header" @click="debugOpen = !debugOpen">
        <h2>{{ debugOpen ? '▾' : '▸' }} 调试</h2>
      </div>
      <template v-if="debugOpen">
        <section class="debug-section" v-if="lastActionNote">
          <p>{{ lastActionNote }}</p>
        </section>
        <section class="debug-section" v-if="recentRolls.length">
          <h3>检定 (近5次)</h3>
          <ul class="debug-logs">
            <li v-for="(roll, i) in recentRolls.slice(-5)" :key="i">
              [{{ roll.rollType }}] {{ roll.rawRolls.join(',') }} {{ roll.success ? '✓' : '✗' }}
            </li>
          </ul>
        </section>
        <section class="debug-section" v-if="battleState">
          <h3>单位</h3>
          <div v-for="unit in allUnits" :key="unit.unitId" class="debug-unit">
            <strong>{{ unit.名字 }}</strong> ({{ unit.阵营 }}) HP {{ unit.当前资源.HP }}/{{ unit.当前资源.HPMax }}
            <span v-if="!unit.是否存活" style="color:#e05555">[阵亡]</span>
            <span v-if="unit.unitId === battleState.当前行动单位Id" style="color:#d4a44c">[行动中]</span>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import initvar from '../../世界书/变量/initvar.yaml';
import { advanceBattle, applyBattleSummaryToRecords } from '../../脚本/战斗系统/engine';
import type { PendingCommand, RollResult, StatData } from '../../脚本/战斗系统/types';
import BattleResultModal from '../状态栏/components/BattleResultModal.vue';
import BattleArena from '../状态栏/components/BattleArena.vue';
import SkillPanel from '../状态栏/components/SkillPanel.vue';
import TurnOrderBar from '../状态栏/components/TurnOrderBar.vue';
import { classifyAnimation, defendAnimation, escapeAnimation, ANIM_DURATION } from '../状态栏/anim';
import type { AnimEvent } from '../状态栏/anim';
import '../状态栏/global.css';

const AUTO_LIMIT = 50;
function cloneData<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }

const data = ref<StatData>(cloneData(initvar) as StatData);
const lastActionNote = ref('');
const recentRolls = ref<RollResult[]>([]);
const selectedSkillId = ref<string | null>(null);
const selectedItemId = ref<string | null>(null);
const selectedTargetId = ref<string | null>(null);
const activeAllyId = ref<string | null>(null);
const expandedPanel = ref<'skill' | 'item' | null>(null);
const expandedAlly = ref<string | null>(null);
const expandedEnemy = ref<string | null>(null);
const debugOpen = ref(false);
const animEvent = ref<AnimEvent | null>(null);

const battleState = computed(() => data.value.战斗状态);
const allyUnits = computed(() => battleState.value?.参战方.ally.单位列表 ?? []);
const enemyUnits = computed(() => battleState.value?.参战方.enemy.单位列表 ?? []);
const allUnits = computed(() => [...allyUnits.value, ...enemyUnits.value]);
const canSettle = computed(() => battleState.value?.状态 === 'ended' && !!battleState.value?.结算结果);
const recentLogs = computed(() => battleState.value?.日志.slice(-23) ?? []);
const fightItems = computed(() => Object.values(data.value.背包).filter(item => item.战斗可用 && item.数量 > 0));
const canPlayerInput = computed(() => !!battleState.value?.玩家输入态.可操作 && battleState.value?.当前阶段 === 'select_action' && battleState.value?.状态 !== 'ended');
const canAct = computed(() => !!battleState.value?.玩家输入态.可操作 && battleState.value?.状态 !== 'ended');

const activeAllyUnit = computed(() => {
  if (!battleState.value) return null;
  const units = battleState.value.参战方.ally.单位列表;
  if (activeAllyId.value) {
    const found = units.find(u => u.unitId === activeAllyId.value);
    if (found && found.是否存活) return found;
  }
  const currentId = battleState.value.当前行动单位Id;
  if (currentId) {
    const currentActor = units.find(u => u.unitId === currentId && u.是否存活);
    if (currentActor) return currentActor;
  }
  return units.find(u => u.是否存活) ?? null;
});

const currentActor = computed(() => {
  if (!battleState.value?.当前行动单位Id) return null;
  return [...battleState.value.参战方.ally.单位列表, ...battleState.value.参战方.enemy.单位列表].find(u => u.unitId === battleState.value!.当前行动单位Id) ?? null;
});

watch(() => battleState.value?.当前行动单位Id, (newId) => {
  if (newId) {
    const ally = battleState.value?.参战方.ally.单位列表.find(u => u.unitId === newId && u.是否存活);
    if (ally) activeAllyId.value = ally.unitId;
  }
}, { immediate: true });

const activeAllySkills = computed(() => {
  const unit = activeAllyUnit.value;
  if (!unit) return [];
  return unit.技能栏.filter(s => !s.已禁用).map(s => data.value.技能定义表[s.skillId]).filter(Boolean);
});

const availableItems = computed(() => Object.values(data.value.背包).filter(item => item.战斗可用 && item.数量 > 0));

const selectedSkill = computed(() => {
  if (!selectedSkillId.value) return null;
  return activeAllySkills.value.find(s => s.id === selectedSkillId.value) ?? null;
});
const selectedItem = computed(() => {
  if (!selectedItemId.value) return null;
  return availableItems.value.find(item => item.id === selectedItemId.value) ?? null;
});

const activeMode = computed(() => selectedSkillId.value ? 'skill' : selectedItemId.value ? 'item' : null);
const activeTargetType = computed(() => selectedItem.value?.目标类型 ?? selectedSkill.value?.目标类型);
const requiresExplicitTarget = computed(() => {
  const tt = activeTargetType.value;
  return tt === 'self' || tt === 'single_enemy' || tt === 'single_ally';
});

const selectedTargetName = computed(() => {
  if (!battleState.value || !selectedTargetId.value) return '';
  return [...battleState.value.参战方.ally.单位列表, ...battleState.value.参战方.enemy.单位列表].find(u => u.unitId === selectedTargetId.value)?.名字 ?? '';
});

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

const needsEnemyTarget = computed(() => canAct.value && activeTargetType.value === 'single_enemy');
const needsAllyTarget = computed(() => canAct.value && (activeTargetType.value === 'single_ally' || activeTargetType.value === 'self'));

const targetHintText = computed(() => {
  if (!canAct.value || !activeTargetType.value) return '';
  const tt = activeTargetType.value;
  if (tt === 'single_enemy') return '↑ 点击战斗场中敌方单位选择目标';
  if (tt === 'single_ally') return '↑ 点击战斗场中我方单位或左侧列表选择目标';
  if (tt === 'all_enemies') return '↑ 群体技能，影响所有敌方，直接确认即可';
  if (tt === 'all_allies') return '↑ 群体技能，影响所有友方，直接确认即可';
  if (tt === 'random_enemy') return '↑ 随机目标，直接确认即可';
  if (tt === 'self') return '↑ 自身目标，直接确认即可';
  return '';
});

const confirmBarText = computed(() => {
  if (!activeMode.value) return '';
  if (activeMode.value === 'skill' && selectedSkill.value) {
    const name = selectedSkill.value.名称;
    const tt = activeTargetType.value;
    if (!requiresExplicitTarget.value) {
      const td = tt === 'all_enemies' ? '全体敌人' : tt === 'all_allies' ? '全体友方' : tt === 'random_enemy' ? '随机敌人' : tt === 'self' ? '自身' : '';
      return `${name} → ${td}`;
    }
    return selectedTargetId.value && selectedTargetName.value ? `${name} → ${selectedTargetName.value}` : `${name} → 请选择目标`;
  }
  if (activeMode.value === 'item' && selectedItem.value) {
    const name = selectedItem.value.名称;
    const tt = activeTargetType.value;
    if (!requiresExplicitTarget.value) {
      const td = tt === 'all_enemies' ? '全体敌人' : tt === 'all_allies' ? '全体友方' : tt === 'random_enemy' ? '随机敌人' : tt === 'self' ? '自身' : '';
      return `${name} → ${td}`;
    }
    return selectedTargetId.value && selectedTargetName.value ? `${name} → ${selectedTargetName.value}` : `${name} → 请选择目标`;
  }
  return '';
});

function onAllyClick(unit: { unitId: string; 是否存活: boolean }) {
  if (needsAllyTarget.value && unit.是否存活) {
    selectedTargetId.value = unit.unitId;
  } else {
    activeAllyId.value = unit.unitId;
  }
}

function onArenaSelect(unit: { unitId: string; 阵营: string; 是否存活: boolean }) {
  if (unit.阵营 === 'enemy' && needsEnemyTarget.value) {
    selectedTargetId.value = unit.unitId;
  } else if ((unit.阵营 === 'ally') && needsAllyTarget.value && unit.是否存活) {
    selectedTargetId.value = unit.unitId;
  }
}

function cancelSelection() {
  selectedSkillId.value = null;
  selectedItemId.value = null;
  selectedTargetId.value = null;
  expandedPanel.value = null;
}

watch([activeTargetType, activeAllyUnit, battleState], () => {
  if (!activeTargetType.value || !activeAllyUnit.value || !battleState.value) {
    selectedTargetId.value = null; return;
  }
  const tt = activeTargetType.value;
  if (tt === 'self') { selectedTargetId.value = activeAllyUnit.value.unitId; return; }
  if (tt === 'single_ally') {
    const targets = battleState.value.参战方[activeAllyUnit.value.阵营].单位列表.filter(u => u.是否存活);
    if (!targets.some(u => u.unitId === selectedTargetId.value)) selectedTargetId.value = targets[0]?.unitId ?? null;
    return;
  }
  if (tt === 'single_enemy') {
    const side = activeAllyUnit.value.阵营 === 'ally' ? 'enemy' : 'ally';
    const targets = (side === 'ally' ? battleState.value.参战方.ally : battleState.value.参战方.enemy).单位列表.filter(u => u.是否存活);
    if (!targets.some(u => u.unitId === selectedTargetId.value)) selectedTargetId.value = targets[0]?.unitId ?? null;
    return;
  }
  selectedTargetId.value = null;
});

watch(() => activeAllyUnit.value?.unitId, () => { selectedSkillId.value = null; selectedItemId.value = null; selectedTargetId.value = null; });

watch(activeAllySkills, (skills) => {
  if (!skills.length) { selectedSkillId.value = null; return; }
  const currentExists = !!selectedSkillId.value && skills.some(s => s.id === selectedSkillId.value);
  if (!selectedSkillId.value || (!selectedItemId.value && !currentExists)) selectedSkillId.value = skills[0].id;
}, { immediate: true });

function barWidth(current: number, max: number) { return `${Math.max(0, Math.min(100, (current / Math.max(1, max)) * 100))}%`; }

const DEBUFF_IDS = ['poison', 'burn', 'freeze', 'stun', 'fear', 'confuse', 'charm', 'silence', 'slow', 'blind', 'curse', 'weaken', 'vulnerability', 'taunted'];
function statusClass(status: { statusId: string; 名称: string }) {
  const id = status.statusId?.toLowerCase() ?? '';
  if (DEBUFF_IDS.some(d => id.includes(d))) return 'debuff';
  const name = status.名称;
  if (name.includes('护盾') || name.includes('强化') || name.includes('祝福') || name.includes('鼓舞') || name.includes('恢复')) return 'buff';
  return 'neutral';
}
function skillName(skillId: string) { return data.value.技能定义表[skillId]?.名称 ?? skillId; }

function togglePanel(panel: 'skill' | 'item') {
  expandedPanel.value = expandedPanel.value === panel ? null : panel;
}

function onSelectSkill(skillId: string) { selectedSkillId.value = skillId; selectedItemId.value = null; expandedPanel.value = 'skill'; }
function onSelectItem(itemId: string) { selectedItemId.value = itemId; selectedSkillId.value = null; expandedPanel.value = 'item'; }

function onEnemyClick(unit: { unitId: string }) {
  if (needsEnemyTarget.value) selectedTargetId.value = unit.unitId;
}

function buildCommand(actionType: PendingCommand['actionType']): PendingCommand | null {
  const actor = activeAllyUnit.value;
  if (!actor) return null;
  if (actionType === 'defend' || actionType === 'escape') return { actorId: actor.unitId, actionType, clientHint: { source: 'test_ui' } };
  const tt = activeTargetType.value;
  const targetIds = (tt === 'all_enemies' || tt === 'all_allies' || tt === 'random_enemy') ? undefined : selectedTargetId.value ? [selectedTargetId.value] : undefined;
  if (actionType === 'skill' && selectedSkillId.value) return { actorId: actor.unitId, actionType, skillId: selectedSkillId.value, targetIds, clientHint: { source: 'test_ui' } };
  if (actionType === 'item' && selectedItemId.value) return { actorId: actor.unitId, actionType, itemId: selectedItemId.value, targetIds, clientHint: { source: 'test_ui' } };
  return null;
}

function runOnce(command?: PendingCommand) {
  const next = advanceBattle(data.value, command);
  data.value.战斗状态 = next.state;
  if (next.rolls.length) recentRolls.value = next.rolls;
}

function startBattle() { runOnce(); }
function tick() { runOnce(); }
function autoRun() {
  for (let i = 0; i < AUTO_LIMIT; i += 1) {
    if (!battleState.value || battleState.value.状态 === 'ended') return;
    if (canPlayerInput.value) return;
    runOnce();
  }
}

function fireAnim(event: AnimEvent | null) {
  if (!event) return;
  animEvent.value = event;
  const dur = ANIM_DURATION[event.type] ?? 500;
  nextTick(() => {
    setTimeout(() => { animEvent.value = null; }, dur + 100);
  });
}

function skillAnim(): AnimEvent | null {
  const actor = activeAllyUnit.value;
  const skill = selectedSkill.value;
  if (!actor || !skill) return null;
  const targetIds = selectedTargetId.value ? [selectedTargetId.value] : [];
  return classifyAnimation(
    skill.标签 ?? [],
    skill.目标类型,
    (skill.效果列表 ?? []).map(e => e.kind),
    actor.unitId,
    actor.阵营,
    targetIds,
  );
}

function itemAnim(): AnimEvent | null {
  const actor = activeAllyUnit.value;
  const item = selectedItem.value;
  if (!actor || !item) return null;
  const targetIds = selectedTargetId.value ? [selectedTargetId.value] : [];
  let tags: string[] = [];
  let effectKinds: string[] = [];
  if (item.效果列表) {
    effectKinds = item.效果列表.map(e => e.kind);
    if (effectKinds.includes('heal') || effectKinds.includes('restore_mp')) tags = ['heal'];
    else if (effectKinds.includes('shield') || effectKinds.includes('add_modifier')) tags = ['buff'];
    else if (effectKinds.includes('damage')) tags = ['physical'];
    else tags = ['support'];
  }
  return classifyAnimation(tags, item.目标类型 ?? 'self', effectKinds, actor.unitId, actor.阵营, targetIds);
}

function submitSkill() {
  const event = skillAnim();
  const command = buildCommand('skill'); if (!command) return;
  const dur = event ? ANIM_DURATION[event.type] ?? 500 : 0;
  if (event) fireAnim(event);
  setTimeout(() => { runOnce(command); cancelSelection(); autoRun(); }, dur);
}
function submitItem() {
  const event = itemAnim();
  const command = buildCommand('item'); if (!command) return;
  const dur = event ? ANIM_DURATION[event.type] ?? 500 : 0;
  if (event) fireAnim(event);
  setTimeout(() => { runOnce(command); cancelSelection(); autoRun(); }, dur);
}
function submitDefend() {
  const actor = activeAllyUnit.value;
  if (!actor) return;
  const event = defendAnimation(actor.unitId, actor.阵营);
  fireAnim(event);
  const command = buildCommand('defend'); if (!command) return;
  setTimeout(() => { runOnce(command); cancelSelection(); autoRun(); }, ANIM_DURATION.defend);
}
function submitEscape() {
  const actor = activeAllyUnit.value;
  if (!actor) return;
  const event = escapeAnimation(actor.unitId, actor.阵营);
  fireAnim(event);
  const command = buildCommand('escape'); if (!command) return;
  setTimeout(() => { runOnce(command); cancelSelection(); autoRun(); }, ANIM_DURATION.escape);
}
function resetData() { data.value = cloneData(initvar) as StatData; lastActionNote.value = ''; cancelSelection(); }
function settle() { data.value = applyBattleSummaryToRecords(data.value); }
</script>

<style scoped>
.preview-shell { display: flex; flex-direction: column; min-height: 100vh; background: #080e18; padding: 12px; }
.preview-left { flex: 1; min-width: 0; }
.preview-bottom { background: #0e1a28; border: 1px solid rgba(212,164,76,0.35); border-radius: 10px; padding: 10px; margin-top: 10px; font-family: 'Noto Sans SC','Microsoft YaHei',sans-serif; color: #e8eef4; font-size: 11px; }
.preview-bottom h2 { margin: 0; color: #d4a44c; font-size: 14px; }
.debug-header { cursor: pointer; user-select: none; }
.debug-header:hover h2 { color: #f0d88a; }
.preview-bottom h3 { margin: 0 0 4px; color: #f0d88a; font-size: 11px; }
.debug-section { margin-bottom: 8px; padding: 6px; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid rgba(255,255,255,0.06); }
.debug-logs { margin: 0; padding-left: 14px; max-height: 120px; overflow: auto; }
.debug-unit { padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.06); display: inline-block; margin-right: 16px; }
.preview-title-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
.preview-title-bar h1 { color: #d4a44c; font-size: 16px; margin: 0; font-family: 'Cinzel','Noto Serif SC',serif; }
.preview-controls { display: flex; gap: 4px; flex-wrap: wrap; }
.preview-controls button { padding: 3px 8px; border: 1px solid rgba(212,164,76,0.35); border-radius: 4px; background: rgba(20,36,56,0.9); color: #e8eef4; cursor: pointer; font-size: 11px; }
.preview-controls button:hover { border-color: #d4a44c; }
.preview-controls button:disabled { opacity: 0.4; }
.enemy-strip { padding: 6px 8px; border-radius: var(--radius-sm); background: var(--bg-panel); border: 1px solid var(--border-enemy); margin-bottom: 4px; }
.enemy-strip-list { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
.enemy-strip-item { flex: 1; min-width: 120px; max-width: 200px; padding: 4px 8px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.06); background: rgba(16,28,44,0.7); cursor: default; transition: all var(--transition-fast); position: relative; }
.enemy-strip-item.selectable { cursor: pointer; border-color: rgba(224,85,85,0.3); }
.enemy-strip-item.selectable:hover { border-color: rgba(224,85,85,0.6); background: rgba(224,85,85,0.08); }
.enemy-strip-item.targeted { border-color: rgba(100,200,255,0.7); background: rgba(100,200,255,0.08); box-shadow: 0 0 8px rgba(100,200,255,0.2); }
.enemy-strip-item.dead { opacity: 0.3; filter: grayscale(0.7); }
.enemy-strip-name { font-size: 11px; font-weight: 700; color: var(--enemy-red-light); }
.enemy-strip-bar-row { display: flex; align-items: center; gap: 4px; margin-top: 2px; }
.enemy-bar-track { flex: 1; }
.enemy-strip-toggle { position: absolute; top: 2px; right: 4px; }
.enemy-detail { margin-top: 4px; }
.enemy-detail .detail-grid { grid-template-columns: repeat(3, 1fr); }
.round-info { display: flex; align-items: center; gap: 8px; padding: 4px 8px; margin-bottom: 4px; border-radius: var(--radius-sm); background: var(--bg-panel); border: 1px solid var(--border-gold); }
.round-info-round { font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--gold-light); }
.round-info-actor { font-size: 12px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 4px; }
.round-info-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
</style>