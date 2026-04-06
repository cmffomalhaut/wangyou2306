<template>
  <div class="tester">
    <header class="head">
      <h1>战斗系统本地测试面板</h1>
      <div class="meta">
        状态: {{ state?.状态 ?? 'none' }} | 阶段: {{ state?.当前阶段 ?? '-' }} | 回合: {{ state?.回合数 ?? '-' }}
      </div>
    </header>

    <section class="row actions">
      <button @click="resetData">重置样例数据</button>
      <button @click="startBattle">开始/初始化</button>
      <button @click="tick">推进 1 步</button>
      <button @click="autoRun">自动推进到玩家输入/结束</button>
      <button @click="settle" :disabled="!canSettle">应用结算到长期档案</button>
    </section>

    <section class="row" v-if="lastActionNote">
      <h3>最近操作反馈</h3>
      <p>{{ lastActionNote }}</p>
    </section>

    <section v-if="state" class="row cards">
      <article class="card" v-if="ally">
        <h3>我方: {{ ally.名字 }}</h3>
        <p>
          HP {{ ally.当前资源.HP }}/{{ ally.当前资源.HPMax }} | MP {{ ally.当前资源.MP }}/{{ ally.当前资源.MPMax }} |
          Shield
          {{ ally.当前资源.Shield }}
        </p>
        <p>可行动: {{ ally.是否可行动 ? '是' : '否' }}</p>
        <p>状态: {{ formatStatuses(ally) }}</p>
        <h4>战斗属性</h4>
        <ul class="info-list">
          <li v-for="line in formatAttrs(ally)" :key="`ally-${line}`">{{ line }}</li>
        </ul>
        <h4>技能详情</h4>
        <ul class="info-list">
          <li v-for="line in formatSkillDetails(ally)" :key="`ally-skill-${line}`">{{ line }}</li>
        </ul>
      </article>
      <article class="card" v-if="enemy">
        <h3>敌方: {{ enemy.名字 }}</h3>
        <p>
          HP {{ enemy.当前资源.HP }}/{{ enemy.当前资源.HPMax }} | MP {{ enemy.当前资源.MP }}/{{
            enemy.当前资源.MPMax
          }}
          | Shield {{ enemy.当前资源.Shield }}
        </p>
        <p>可行动: {{ enemy.是否可行动 ? '是' : '否' }}</p>
        <p>状态: {{ formatStatuses(enemy) }}</p>
        <h4>战斗属性</h4>
        <ul class="info-list">
          <li v-for="line in formatAttrs(enemy)" :key="`enemy-${line}`">{{ line }}</li>
        </ul>
        <h4>技能详情</h4>
        <ul class="info-list">
          <li v-for="line in formatSkillDetails(enemy)" :key="`enemy-skill-${line}`">{{ line }}</li>
        </ul>
      </article>
    </section>

    <section v-if="canPlayerInput && ally" class="row command-box">
      <h3>玩家行动</h3>
      <div class="line">
        <label>技能</label>
        <select v-model="pickedSkillId">
          <option :value="''">(默认技能)</option>
          <option v-for="s in ally.技能栏" :key="s.skillId" :value="s.skillId">{{ skillName(s.skillId) }}</option>
        </select>
        <button @click="playerSkill">提交技能</button>
      </div>
      <div class="line">
        <label>道具</label>
        <select v-model="pickedItemId">
          <option :value="''">(无)</option>
          <option v-for="item in fightItems" :key="item.id" :value="item.id">{{ item.名称 }} x{{ item.数量 }}</option>
        </select>
        <button @click="playerItem" :disabled="!pickedItemId">提交道具</button>
      </div>
      <div class="line">
        <button @click="playerDefend">防御</button>
        <button @click="playerEscape">逃跑</button>
      </div>
    </section>

    <section class="row">
      <h3>最近日志</h3>
      <ul class="logs">
        <li v-for="log in recentLogs" :key="log.id">[T{{ log.turn }}][{{ log.type }}] {{ log.text }}</li>
      </ul>
    </section>

    <section class="row">
      <h3>背包(战斗可用)</h3>
      <ul class="logs">
        <li v-for="item in fightItems" :key="item.id">{{ item.名称 }}: {{ item.数量 }}</li>
      </ul>
      <p class="meta">提示: 满血/满蓝时使用药水会显示恢复 0，但数量会减少。</p>
    </section>

    <section class="row">
      <h3>结算摘要</h3>
      <pre>{{ state?.结算结果 ?? '暂无' }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import initvar from '../../世界书/变量/initvar.yaml';
import { advanceBattle, applyBattleSummaryToRecords } from '../../脚本/战斗系统/engine';
import type { PendingCommand, StatData } from '../../脚本/战斗系统/types';

const AUTO_LIMIT = 50;

function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const data = ref<StatData>(cloneData(initvar) as StatData);
const pickedSkillId = ref('');
const pickedItemId = ref('');
const lastActionNote = ref('');

const state = computed(() => data.value.战斗状态);
const ally = computed(() => state.value?.参战方.ally.单位列表[0]);
const enemy = computed(() => state.value?.参战方.enemy.单位列表[0]);
const canPlayerInput = computed(
  () => !!state.value?.玩家输入态.可操作 && state.value?.当前阶段 === 'select_action' && state.value?.状态 !== 'ended',
);
const canSettle = computed(() => state.value?.状态 === 'ended' && !!state.value?.结算结果);
const recentLogs = computed(() => state.value?.日志.slice(-16) ?? []);
const fightItems = computed(() => Object.values(data.value.背包).filter(item => item.战斗可用 && item.数量 > 0));

function skillName(skillId: string): string {
  return data.value.技能定义表[skillId]?.名称 ?? skillId;
}

function formatStatuses(unit: { 状态列表: Array<{ 名称: string; 剩余回合: number; 层数: number }> }): string {
  if (!unit.状态列表.length) return '无';
  return unit.状态列表.map(status => `${status.名称}(${status.剩余回合}T/${status.层数}层)`).join(' | ');
}

function formatAttrs(unit: {
  当前属性: {
    力量: number;
    魅力: number;
    体质: number;
    智力: number;
    精神: number;
    护甲等级: number;
    物理防御: number;
    精神防御: number;
    命中加值: number;
    闪避加值: number;
    先攻: number;
    异常抗性: number;
    控制强度: number;
    治疗强度: number;
  };
}): string[] {
  const a = unit.当前属性;
  return [
    `力量 ${a.力量} | 魅力 ${a.魅力} | 体质 ${a.体质} | 智力 ${a.智力} | 精神 ${a.精神}`,
    `护甲 ${a.护甲等级} | 物防 ${a.物理防御} | 精防 ${a.精神防御}`,
    `命中 ${a.命中加值} | 闪避 ${a.闪避加值} | 先攻 ${a.先攻}`,
    `异常抗性 ${a.异常抗性} | 控制强度 ${a.控制强度} | 治疗强度 ${a.治疗强度}`,
  ];
}

function formatSkillDetails(unit: { 技能栏: Array<{ skillId: string; 当前冷却: number; 已禁用: boolean }> }): string[] {
  if (!unit.技能栏.length) return ['无技能'];
  return unit.技能栏.map(runtime => {
    const def = data.value.技能定义表[runtime.skillId];
    if (!def) return `${runtime.skillId} | 定义缺失`;
    const check =
      def.检定.类型 === 'attack_roll'
        ? `攻击检定(${def.检定.攻击属性 ?? '-'} vs ${def.检定.对抗防御 ?? '-'})`
        : def.检定.类型 === 'saving_throw'
          ? `豁免检定(目标${def.检定.豁免属性 ?? '-'} vs DC ${def.检定.基础DC ?? '动态'})`
          : '自动命中';
    return `${def.名称} | CD ${runtime.当前冷却}${runtime.已禁用 ? ' [禁用]' : ''} | 消耗 MP ${def.消耗.MP}/HP ${def.消耗.HP} | ${check} | 描述: ${def.描述 || '无'}`;
  });
}

function resetData() {
  data.value = cloneData(initvar) as StatData;
  pickedSkillId.value = '';
  pickedItemId.value = '';
  lastActionNote.value = '';
}

function runOnce(command?: PendingCommand) {
  const next = advanceBattle(data.value, command);
  data.value.战斗状态 = next.state;
}

function startBattle() {
  runOnce();
}

function tick() {
  runOnce();
}

function autoRun() {
  for (let i = 0; i < AUTO_LIMIT; i += 1) {
    if (!state.value || state.value.状态 === 'ended') return;
    if (canPlayerInput.value) return;
    runOnce();
  }
  throw new Error(`自动推进超过 ${AUTO_LIMIT} 步，疑似循环。`);
}

function submit(command: PendingCommand) {
  runOnce(command);
  autoRun();
}

function playerSkill() {
  if (!ally.value) return;
  const name = pickedSkillId.value ? skillName(pickedSkillId.value) : '默认技能';
  submit({
    actorId: ally.value.unitId,
    actionType: 'skill',
    skillId: pickedSkillId.value || undefined,
    clientHint: { source: 'player_ui' },
  });
  lastActionNote.value = `已提交技能: ${name}。已自动结算到下一次可操作时机。`;
}

function playerItem() {
  if (!ally.value || !pickedItemId.value) return;
  const item = data.value.背包[pickedItemId.value];
  const beforeHp = ally.value.当前资源.HP;
  const beforeMp = ally.value.当前资源.MP;
  const beforeCount = item?.数量 ?? 0;
  submit({
    actorId: ally.value.unitId,
    actionType: 'item',
    itemId: pickedItemId.value,
    targetIds: [ally.value.unitId],
    clientHint: { source: 'player_ui' },
  });
  const afterHp = ally.value.当前资源.HP;
  const afterMp = ally.value.当前资源.MP;
  const afterCount = item?.数量 ?? 0;
  const hpDelta = afterHp - beforeHp;
  const mpDelta = afterMp - beforeMp;
  lastActionNote.value = `已使用${item?.名称 ?? pickedItemId.value}: HP ${beforeHp}->${afterHp} (${hpDelta >= 0 ? '+' : ''}${hpDelta}), MP ${beforeMp}->${afterMp} (${mpDelta >= 0 ? '+' : ''}${mpDelta}), 数量 ${beforeCount}->${afterCount}。`;
}

function playerDefend() {
  if (!ally.value) return;
  submit({
    actorId: ally.value.unitId,
    actionType: 'defend',
    clientHint: { source: 'player_ui' },
  });
  lastActionNote.value = '已提交防御。已自动推进到下一次可操作时机。';
}

function playerEscape() {
  if (!ally.value) return;
  submit({
    actorId: ally.value.unitId,
    actionType: 'escape',
    clientHint: { source: 'player_ui' },
  });
  lastActionNote.value = '已提交逃跑检定。';
}

function settle() {
  data.value = applyBattleSummaryToRecords(data.value);
}
</script>

<style scoped>
.tester {
  display: grid;
  gap: 12px;
  font-family: 'Segoe UI', 'PingFang SC', sans-serif;
  color: #1f2937;
}

.head h1 {
  margin: 0;
  font-size: 18px;
}

.meta {
  font-size: 13px;
  color: #4b5563;
}

.row {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px;
  background: #f9fafb;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 8px;
}

.card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 8px;
}

.card h4 {
  margin: 8px 0 6px;
  font-size: 13px;
  color: #374151;
}

.info-list {
  margin: 0;
  padding-left: 18px;
}

.info-list li {
  margin-bottom: 4px;
  line-height: 1.4;
}

.line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.logs {
  margin: 0;
  padding-left: 18px;
  max-height: 240px;
  overflow: auto;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
}

button,
select {
  border: 1px solid #9ca3af;
  border-radius: 6px;
  background: #fff;
  height: 30px;
  padding: 0 10px;
}
</style>
