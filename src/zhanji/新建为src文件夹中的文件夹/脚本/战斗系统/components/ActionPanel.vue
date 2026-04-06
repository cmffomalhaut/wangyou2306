<template>
  <div class="action-panel">
    <!-- 左：换人 -->
    <div class="section switch-section">
      <div class="section-title">己方出战位</div>
      <div class="unit-pills">
        <button
          v-for="(u, idx) in allyTeam"
          :key="u.name"
          class="unit-pill"
          :class="{ active: idx === selectedAllyIndex, defeated: u.HP <= 0 }"
          :disabled="u.HP <= 0"
          @click="selectedAllyIndex = idx"
        >
          {{ u.name }}
          <span class="hp">{{ Math.max(0, u.HP) }}/{{ u.HPMax }}</span>
        </button>
      </div>
      <div class="switch-row">
        <button
          class="switch-btn"
          :disabled="selectedAllyIndex === allyActiveIndex || allyTeam[selectedAllyIndex]?.HP <= 0"
          @click="emitSwitch"
        >
          换人
        </button>
      </div>
    </div>

    <!-- 右：技能 + 投球 -->
    <div class="section skill-section">
      <div class="section-title">技能</div>
      <div class="skill-grid">
        <button
          v-for="skill in activeSkills"
          :key="skill.name"
          class="skill-btn"
          :class="[
            `elem-${skill.元素属性}`,
            `rarity-${skill.稀有度}`,
            { disabled: !canUse(skill), selected: selectedSkillName === skill.name },
          ]"
          :disabled="!canUse(skill)"
          :title="skill.描述"
          @click="selectedSkillName = skill.name"
        >
          <span class="rarity-badge">{{ skill.稀有度 }}</span>
          <span class="skill-name">{{ skill.name }}</span>
          <span class="skill-info">
            <span class="power">威力{{ skill.基础威力 }}</span>
            <span class="hit">{{ Math.floor((skill.数值参数?.命中率 ?? 0.95) * 100) }}%</span>
            <span v-if="getCd(skill) > 0" class="cd">CD{{ getCd(skill) }}</span>
            <span v-else class="mp-cost">MP{{ skill.消耗MP }}</span>
          </span>
        </button>
      </div>

      <div class="action-row">
        <button class="confirm-btn" @click="emitSkillCommand">执行指令</button>
        <button v-if="battleType !== 'BOSS'" class="escape-btn" @click="$emit('escape')">逃跑</button>
      </div>

      <!-- 投球区域：敌方 HP≤20% 时显示 -->
      <div v-if="canCapture" class="capture-section">
        <div class="capture-title">⚡ 目标虚弱，可投球捕捉！</div>
        <div class="ball-row">
          <button
            v-for="ball in BALL_TYPES"
            :key="ball"
            class="ball-btn"
            :class="{ selected: selectedBall === ball }"
            @click="
              selectedBall = ball;
              $emit('preview-capture', { ballType: ball });
            "
          >
            {{ ball }}
          </button>
        </div>
        <div v-if="capturePreview" class="capture-preview">{{ capturePreview.detailText }}</div>
        <div class="dice-row">
          <button class="throw-btn" :disabled="!selectedBall" @click="emitCapture">投骰并投球！</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { BattleCommand, BattleConsole, BattleUnit, CaptureAttempt, CaptureRollResult, SkillData } from '../types';

const BALL_TYPES = ['普通球', '高级球', '超级球', '魅惑之球'] as const;

const props = defineProps<{
  allyTeam: BattleUnit[];
  enemyTeam: BattleUnit[];
  allyActiveIndex: number;
  enemyActiveIndex: number;
  battleType: BattleConsole['战斗类型'];
  canCapture?: boolean;
  capturePreview?: CaptureRollResult | null;
}>();

const emit = defineEmits<{
  command: [command: BattleCommand];
  escape: [];
  'preview-capture': [attempt: CaptureAttempt];
  'roll-capture': [attempt: CaptureAttempt];
}>();

const selectedAllyIndex = ref(0);
const selectedSkillName = ref('普通攻击');
const selectedBall = ref<(typeof BALL_TYPES)[number] | null>(null);

watch(
  () => props.allyActiveIndex,
  v => {
    selectedAllyIndex.value = v;
  },
  { immediate: true },
);

const currentUnit = computed(() => props.allyTeam[selectedAllyIndex.value] ?? props.allyTeam[props.allyActiveIndex]);

const activeSkills = computed(() => {
  const unit = currentUnit.value;
  if (!unit) return [];
  const list = unit.skills.filter(s => s.类型 === '主动');
  if (list.length === 0) {
    return [
      {
        name: '普通攻击',
        类型: '主动',
        稀有度: 'N',
        元素属性: '无',
        消耗MP: 0,
        冷却回合: 0,
        基础威力: 42,
        描述: '基础物理攻击',
        效果公式: 'physical_damage',
        数值参数: { 命中率: 0.98 },
      } as SkillData,
    ];
  }
  return list;
});

function canUse(skill: SkillData): boolean {
  const unit = currentUnit.value;
  if (!unit || unit.HP <= 0) return false;
  if (unit.MP < skill.消耗MP) return false;
  return (unit.cooldowns[skill.name] ?? 0) <= 0;
}

function getCd(skill: SkillData): number {
  return currentUnit.value?.cooldowns[skill.name] ?? 0;
}

function emitSwitch() {
  emit('command', { action: 'switch', switchToIndex: selectedAllyIndex.value });
}

function emitSkillCommand() {
  const chosen = activeSkills.value.find(s => s.name === selectedSkillName.value && canUse(s));
  const fallback = activeSkills.value.find(canUse) ?? activeSkills.value[0];
  emit('command', { action: 'skill', skillName: chosen?.name ?? fallback?.name ?? '普通攻击' });
}

function emitCapture() {
  if (!selectedBall.value) return;
  emit('roll-capture', { ballType: selectedBall.value });
}
</script>

<style scoped>
.action-panel {
  background: linear-gradient(160deg, #1a0f2e 0%, #2d1b4e 100%);
  border-top: 2px solid #ffd700;
  padding: 10px 12px;
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(280px, 2fr);
  gap: 10px;
  box-shadow: 0 -4px 20px rgba(255, 215, 0, 0.15);
}

.section {
  background: linear-gradient(160deg, rgba(45, 27, 78, 0.8) 0%, rgba(26, 15, 46, 0.9) 100%);
  border: 2px solid #ffd700;
  border-radius: 12px;
  padding: 8px;
  box-shadow:
    0 0 15px rgba(255, 215, 0, 0.3),
    inset 0 1px 0 rgba(255, 215, 0, 0.2);
  position: relative;
}

.section::before,
.section::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border: 2px solid #ffd700;
  background: #2d1b4e;
}

.section::before {
  top: -2px;
  left: -2px;
  border-right: none;
  border-bottom: none;
}

.section::after {
  top: -2px;
  right: -2px;
  border-left: none;
  border-bottom: none;
}

.skill-section {
  display: flex;
  flex-direction: column;
}

.switch-section {
  display: flex;
  flex-direction: column;
}

.switch-row {
  margin-top: auto;
  padding-top: 8px;
}

.action-row {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

@media (max-width: 840px) {
  .action-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .skill-grid {
    grid-template-columns: 1fr;
  }
}

.section-title {
  font-size: 11px;
  color: #ffd700;
  margin-bottom: 7px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
}

.skill-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  align-content: start;
}

.skill-btn {
  position: relative;
  padding: 9px 10px 6px;
  border: 2px solid #ffd700;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(45, 27, 78, 0.9), rgba(26, 15, 46, 0.95));
  color: #f0e6d2;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  text-align: left;
  transition: all 0.15s;
  font-size: 12px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  overflow: hidden;
  min-height: 34px;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
}

.skill-name {
  font-weight: 700;
  margin-top: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.skill-info {
  display: flex;
  gap: 6px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.76);
  margin-top: 4px;
  font-weight: 500;
}

.capture-preview {
  font-size: 10px;
  color: #cfd8dc;
  margin-bottom: 6px;
  line-height: 1.5;
}

.throw-btn {
  flex: 1;
  padding: 4px 8px;
  border-radius: 6px;
  border: 2px solid #dc143c;
  background: linear-gradient(135deg, rgba(220, 20, 60, 0.3), rgba(45, 27, 78, 0.9));
  color: #ff6b6b;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(220, 20, 60, 0.3);
  transition: all 0.2s;
}

.throw-btn:not(:disabled):hover {
  box-shadow: 0 0 15px rgba(220, 20, 60, 0.5);
  border-color: #ff6b6b;
}

.throw-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(0.6);
}

.confirm-btn:disabled,
.escape-btn:disabled,
.ball-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(0.6);
}

.unit-pill {
  border: 2px solid #ffd700;
  background: linear-gradient(135deg, rgba(45, 27, 78, 0.7), rgba(26, 15, 46, 0.8));
  color: #f0e6d2;
  border-radius: 8px;
  padding: 3px 4px;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  min-width: 44px;
  transition: all 0.18s;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.2);
}

.unit-pill:hover:not(.defeated) {
  border-color: #fff;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
}

.unit-pill.active {
  outline: none;
  border-color: #fff;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(45, 27, 78, 0.9));
}

.unit-pill.defeated {
  filter: grayscale(1);
  opacity: 0.5;
  cursor: not-allowed;
}

.switch-btn {
  width: 100%;
  border: 2px solid #ffd700;
  background: linear-gradient(135deg, rgba(45, 27, 78, 0.8), rgba(26, 15, 46, 0.9));
  color: #ffd700;
  border-radius: 8px;
  padding: 4px 6px;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 0.04em;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
  transition: all 0.2s;
}

.switch-btn:not(:disabled):hover {
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
  border-color: #fff;
}

.switch-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(0.6);
}

.capture-section {
  margin-top: 8px;
  border: 2px solid #ffd700;
  border-radius: 8px;
  padding: 5px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(45, 27, 78, 0.8));
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
}

.capture-title {
  font-size: 10px;
  color: #ffd700;
  margin-bottom: 6px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
}

.ball-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.ball-btn {
  padding: 3px 6px;
  border-radius: 6px;
  border: 2px solid #ffd700;
  background: linear-gradient(135deg, rgba(45, 27, 78, 0.8), rgba(26, 15, 46, 0.9));
  color: #ffd700;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.2);
}

.ball-btn:hover {
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
  border-color: #fff;
}

.ball-btn.selected {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.4), rgba(45, 27, 78, 0.9));
  border-color: #fff;
  color: #fff;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
}

.confirm-btn {
  border: 2px solid #ffd700;
  background: linear-gradient(135deg, rgba(65, 105, 225, 0.4), rgba(45, 27, 78, 0.9));
  color: #ffd700;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: all 0.2s;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
}

.confirm-btn:hover {
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
  border-color: #fff;
}

.escape-btn {
  border: 2px solid #b8860b;
  background: linear-gradient(135deg, rgba(184, 134, 11, 0.3), rgba(45, 27, 78, 0.9));
  color: #daa520;
  transition: all 0.2s;
  box-shadow: 0 0 8px rgba(184, 134, 11, 0.2);
}

.escape-btn:hover {
  box-shadow: 0 0 12px rgba(184, 134, 11, 0.4);
  border-color: #daa520;
}

.hp {
  font-size: 10px;
  color: #a7bdd6;
  margin-top: 2px;
}

.rarity-badge {
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 4px;
  line-height: 1.2;
  letter-spacing: 0.02em;
}

.skill-btn.selected {
  outline: none;
  border-color: #fff;
  box-shadow:
    0 0 0 2px #ffd700,
    0 0 20px rgba(255, 215, 0, 0.6);
  animation: skillGlow 1s ease-in-out infinite;
}

.skill-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(0.6);
  border-color: #666;
  box-shadow: none;
}

.skill-btn:hover:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
}

@keyframes skillGlow {
  0%, 100% { box-shadow: 0 0 0 2px #ffd700, 0 0 20px rgba(255, 215, 0, 0.6); }
  50% { box-shadow: 0 0 0 2px #ffd700, 0 0 25px rgba(255, 215, 0, 0.8); }
}

.skill-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.16;
  border-radius: 8px;
}

.action-row {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.confirm-btn,
.escape-btn {
  flex: 1;
  border-radius: 8px;
  padding: 5px 6px;
  cursor: pointer;
  border: 1px solid transparent;
}

.switch-row {
  margin-top: 8px;
}

.unit-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.capture-title {
  font-size: 10px;
  color: #ffe066;
  margin-bottom: 6px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.dice-row {
  display: flex;
  gap: 6px;
}

.elem-火 {
  border-color: #ff5a2a;
  background: linear-gradient(135deg, rgba(255, 80, 30, 0.28), rgba(255, 160, 60, 0.12));
}

.elem-水 {
  border-color: #3a9eff;
  background: linear-gradient(135deg, rgba(40, 120, 255, 0.28), rgba(100, 200, 255, 0.12));
}

.elem-风 {
  border-color: #4dff88;
  background: linear-gradient(135deg, rgba(60, 220, 100, 0.28), rgba(160, 255, 180, 0.12));
}

.elem-地 {
  border-color: #c8a24a;
  background: linear-gradient(135deg, rgba(180, 130, 40, 0.28), rgba(220, 190, 100, 0.12));
}

.elem-光 {
  border-color: #ffe066;
  background: linear-gradient(135deg, rgba(255, 220, 60, 0.28), rgba(255, 240, 160, 0.12));
}

.elem-暗 {
  border-color: #b066ff;
  background: linear-gradient(135deg, rgba(140, 60, 255, 0.28), rgba(200, 140, 255, 0.12));
}

.elem-无 {
  border-color: rgba(180, 180, 180, 0.4);
  background: rgba(255, 255, 255, 0.06);
}

.rarity-N .rarity-badge {
  background: #555;
  color: #ccc;
}

.rarity-普通 .rarity-badge {
  background: #888;
  color: #fff;
}

.rarity-稀有 .rarity-badge {
  background: #2a6fff;
  color: #fff;
}

.rarity-史诗 .rarity-badge {
  background: #8b2be2;
  color: #fff;
}

.rarity-传说 .rarity-badge {
  background: linear-gradient(90deg, #f5a623, #f8e71c);
  color: #222;
}

.rarity-神话 .rarity-badge {
  background: linear-gradient(90deg, #ff2d55, #ff6b35);
  color: #fff;
}

.power {
  color: #ffd580;
}

.cd {
  color: #ffb74d;
}

.hit {
  color: #81d4fa;
}

.mp-cost {
  color: #a5d6a7;
}

.ball-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.throw-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
