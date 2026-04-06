<template>
  <div class="unit-panel" :class="[side, { active: isActive }]">
    <div class="name-row">
      <span class="unit-name">{{ unit.name }}</span>
      <span class="unit-level">Lv.{{ unit.等级 }}</span>
      <span class="element-badge" :class="unit.元素属性">{{ unit.元素属性 }}</span>
      <span v-if="isActive" class="active-tag">出战</span>
    </div>

    <div class="stat-row">
      <span :class="statClass('atk')">攻 {{ effStat('atk') }}</span>
      <span :class="statClass('def')">防 {{ effStat('def') }}</span>
      <span :class="statClass('spa')">特攻 {{ effStat('spa') }}</span>
      <span :class="statClass('spd')">特防 {{ effStat('spd') }}</span>
      <span :class="statClass('speed')">速 {{ effStat('speed') }}</span>
    </div>

    <div class="bar-row">
      <span class="bar-label">HP</span>
      <div class="bar-track">
        <div class="bar-fill hp" :style="{ width: hpPct + '%' }" :class="hpColor"></div>
      </div>
      <span class="bar-num">{{ unit.HP }}/{{ unit.HPMax }}</span>
    </div>

    <div class="bar-row">
      <span class="bar-label">MP</span>
      <div class="bar-track">
        <div class="bar-fill mp" :style="{ width: mpPct + '%' }"></div>
      </div>
      <span class="bar-num">{{ unit.MP }}/{{ unit.MPMax }}</span>
    </div>

    <div v-if="unit.shieldMax > 0 || unit.shield > 0" class="bar-row">
      <span class="bar-label">盾</span>
      <div class="bar-track">
        <div class="bar-fill shield" :style="{ width: shieldPct + '%' }"></div>
      </div>
      <span class="bar-num">{{ unit.shield }}/{{ unit.shieldMax || unit.shield }}</span>
    </div>

    <div v-if="effectDetails.length" class="effect-row">
      <div class="effect-badges">
        <div
          v-for="detail in effectDetails"
          :key="detail.key"
          class="effect-badge"
          :class="detail.tone"
          :title="`${detail.name}：${detail.desc}${detail.source ? '（来源：' + detail.source + '）' : ''} ${detail.turnText}`"
        >
          {{ detail.name }}<span class="badge-turn">{{ detail.turnText }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BattleUnit, StatusEffect, StatusEffectType } from '../types';

const props = withDefaults(
  defineProps<{
    unit: BattleUnit;
    side: 'ally' | 'enemy';
    isActive?: boolean;
  }>(),
  {
    isActive: false,
  },
);

const hpPct = computed(() => Math.max(0, (props.unit.HP / props.unit.HPMax) * 100));
const mpPct = computed(() => Math.max(0, (props.unit.MP / props.unit.MPMax) * 100));
const shieldPct = computed(() => {
  const max = props.unit.shieldMax > 0 ? props.unit.shieldMax : Math.max(1, props.unit.shield);
  return Math.max(0, (props.unit.shield / max) * 100);
});

const hpColor = computed(() => {
  if (hpPct.value > 50) return 'green';
  if (hpPct.value > 20) return 'yellow';
  return 'red';
});

type StatKey = 'atk' | 'def' | 'spa' | 'spd' | 'speed';

const STAT_BASE_MAP: Record<StatKey, keyof BattleUnit> = {
  atk: '攻击力',
  def: '防御力',
  spa: '特攻',
  spd: '特防',
  speed: '速度',
};
const STAT_UP_MAP: Record<StatKey, string> = {
  atk: 'atk_up',
  def: 'def_up',
  spa: 'spa_up',
  spd: 'spd_up',
  speed: 'speed_up',
};
const STAT_DOWN_MAP: Record<StatKey, string> = {
  atk: 'atk_down',
  def: 'def_down',
  spa: 'spa_down',
  spd: 'spd_down',
  speed: 'speed_down',
};

function effStat(key: StatKey): number {
  const base = props.unit[STAT_BASE_MAP[key]] as number;
  let mult = 1;
  for (const eff of props.unit.statusEffects) {
    if (eff.type === STAT_UP_MAP[key]) mult += eff.value;
    if (eff.type === STAT_DOWN_MAP[key]) mult -= eff.value;
  }
  return Math.round(base * Math.max(0.1, mult));
}

function statClass(key: StatKey): string {
  const base = props.unit[STAT_BASE_MAP[key]] as number;
  const eff = effStat(key);
  if (eff > base) return 'stat-up';
  if (eff < base) return 'stat-down';
  return '';
}

function statusText(type: StatusEffectType): string {
  const map: Record<string, string> = {
    burn: '灼烧',
    poison: '中毒',
    freeze: '冰冻',
    paralyze: '麻痹',
    confuse: '混乱',
    atk_up: '攻击提升',
    atk_down: '攻击下降',
    def_up: '防御提升',
    def_down: '防御下降',
    spa_up: '特攻提升',
    spa_down: '特攻下降',
    spd_up: '特防提升',
    spd_down: '特防下降',
    speed_up: '速度提升',
    speed_down: '速度下降',
    acc_up: '命中提升',
    acc_down: '命中下降',
    eva_up: '闪避提升',
    eva_down: '闪避下降',
    shield: '护盾',
    damage_boost: '增伤',
    skill_boost: '技能强化',
  };
  return map[type] ?? type;
}

function statusDesc(eff: StatusEffect): string {
  const pct = `${Math.round((eff.value ?? 0) * 100)}%`;
  const map: Record<StatusEffectType, string> = {
    burn: `每回合灼烧伤害 ${pct}`,
    poison: `每回合中毒伤害 ${pct}`,
    freeze: '无法行动',
    paralyze: `约${pct}概率无法行动`,
    confuse: `约${pct}概率误伤自己`,
    atk_up: `攻击 +${pct}`,
    atk_down: `攻击 -${pct}`,
    def_up: `防御 +${pct}`,
    def_down: `防御 -${pct}`,
    spa_up: `特攻 +${pct}`,
    spa_down: `特攻 -${pct}`,
    spd_up: `特防 +${pct}`,
    spd_down: `特防 -${pct}`,
    speed_up: `速度 +${pct}`,
    speed_down: `速度 -${pct}`,
    acc_up: `命中 +${pct}`,
    acc_down: `命中 -${pct}`,
    eva_up: `闪避 +${pct}`,
    eva_down: `闪避 -${pct}`,
    shield: `吸收伤害 ${Math.max(0, Math.floor(eff.value ?? 0))} 点`,
    damage_boost: `最终伤害 +${pct}`,
    skill_boost: `技能伤害 +${pct}`,
  };
  return map[eff.type] ?? '效果生效中';
}

const effectDetails = computed(() => {
  const details: Array<{ key: string; name: string; desc: string; turnText: string; tone: string; source?: string }> =
    [];

  if (props.unit.shield > 0) {
    const shieldEff = props.unit.statusEffects.find(eff => eff.type === 'shield');
    details.push({
      key: `shield-pool-${props.unit.name}`,
      name: '护盾值',
      desc: `${props.unit.shield}/${props.unit.shieldMax || props.unit.shield}（吸收伤害）`,
      turnText: shieldEff ? `剩余 ${shieldEff.remainingTurns} 回合` : '持续至破碎',
      tone: 'shield',
      source: shieldEff?.source,
    });
  }

  props.unit.statusEffects.forEach((eff, idx) => {
    if (eff.type === 'shield') return;
    details.push({
      key: `${eff.type}-${eff.source ?? 'none'}-${idx}`,
      name: statusText(eff.type),
      desc: statusDesc(eff),
      turnText: `剩余 ${eff.remainingTurns} 回合`,
      tone: eff.type,
      source: eff.source,
    });
  });

  return details;
});
</script>

<style scoped>
.unit-panel {
  background: linear-gradient(135deg, rgba(26, 15, 46, 0.95), rgba(45, 27, 78, 0.9));
  border: 3px solid #b8860b;
  border-radius: 8px;
  padding: 10px 14px;
  min-width: 270px;
  max-width: 360px;
  box-shadow:
    0 0 15px rgba(255, 215, 0, 0.4),
    0 4px 24px rgba(0, 0, 0, 0.6),
    inset 0 2px 0 rgba(255, 215, 0, 0.2);
  position: relative;
}

/* 面板四角装饰 */
.unit-panel::before,
.unit-panel::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border: 2px solid #ffd700;
}
.unit-panel::before {
  top: -2px;
  left: -2px;
  border-right: none;
  border-bottom: none;
}
.unit-panel::after {
  bottom: -2px;
  right: -2px;
  border-left: none;
  border-top: none;
}

.unit-panel.enemy {
  border-color: #dc143c;
  box-shadow:
    0 0 20px rgba(220, 20, 60, 0.5),
    0 4px 24px rgba(0, 0, 0, 0.6),
    inset 0 2px 0 rgba(220, 20, 60, 0.3);
}
.unit-panel.enemy::before,
.unit-panel.enemy::after {
  border-color: #dc143c;
}

.unit-panel.ally {
  border-color: #4169e1;
  box-shadow:
    0 0 20px rgba(65, 105, 225, 0.5),
    0 4px 24px rgba(0, 0, 0, 0.6),
    inset 0 2px 0 rgba(65, 105, 225, 0.3);
}
.unit-panel.ally::before,
.unit-panel.ally::after {
  border-color: #4169e1;
}

.unit-panel.active {
  box-shadow:
    0 0 25px rgba(255, 215, 0, 0.8),
    0 4px 24px rgba(0, 0, 0, 0.6),
    inset 0 0 15px rgba(255, 215, 0, 0.15);
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {
  0%,
  100% {
    box-shadow:
      0 0 20px rgba(255, 215, 0, 0.6),
      0 4px 24px rgba(0, 0, 0, 0.6);
  }
  50% {
    box-shadow:
      0 0 30px rgba(255, 215, 0, 0.9),
      0 4px 24px rgba(0, 0, 0, 0.6);
  }
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
}

.unit-name {
  font-size: 16px;
  font-weight: 700;
  color: #ffd700;
  text-shadow:
    0 0 8px rgba(255, 215, 0, 0.6),
    1px 1px 0 rgba(0, 0, 0, 0.8);
  letter-spacing: 0.05em;
}

.unit-level {
  font-size: 12px;
  color: #d4af37;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(184, 134, 11, 0.3));
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(212, 175, 55, 0.5);
}

.active-tag {
  margin-left: auto;
  font-size: 11px;
  color: #ffd700;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(184, 134, 11, 0.2));
  border: 2px solid #ffd700;
  border-radius: 4px;
  padding: 2px 8px;
  font-weight: 700;
  text-shadow: 0 0 5px rgba(255, 215, 0, 0.8);
  animation: glowPulse 2s ease-in-out infinite;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 5px;
  font-size: 11px;
  color: #c9b896;
  margin-bottom: 6px;
  font-weight: 600;
}
.stat-up {
  color: #32cd32;
  font-weight: 700;
  text-shadow: 0 0 5px rgba(50, 205, 50, 0.6);
}
.stat-down {
  color: #ff4444;
  font-weight: 700;
  text-shadow: 0 0 5px rgba(255, 68, 68, 0.6);
}

.element-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(20, 10, 30, 0.7));
  border: 1px solid currentColor;
  font-weight: 700;
  text-shadow: 0 0 5px currentColor;
}

.element-badge.火 {
  color: #ff4500;
  border-color: #ff6347;
}
.element-badge.水 {
  color: #1e90ff;
  border-color: #4169e1;
}
.element-badge.风 {
  color: #32cd32;
  border-color: #7fff00;
}
.element-badge.地 {
  color: #daa520;
  border-color: #ffd700;
}
.element-badge.光 {
  color: #ffd700;
  border-color: #ffff00;
}
.element-badge.暗 {
  color: #9370db;
  border-color: #ba55d3;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
}

.bar-label {
  width: 28px;
  font-weight: 700;
  color: #ffd700;
  text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
}

.bar-track {
  flex: 1;
  height: 12px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.8), rgba(20, 10, 30, 0.9));
  border-radius: 3px;
  overflow: hidden;
  border: 2px solid rgba(139, 69, 19, 0.6);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.8);
  position: relative;
}

.bar-fill {
  height: 100%;
  border-radius: 1px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 0 8px currentColor;
}
.bar-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    rgba(255, 255, 255, 0.1) 4px,
    rgba(255, 255, 255, 0.1) 8px
  );
}

.bar-fill.hp.green {
  background: linear-gradient(90deg, #32cd32 0%, #7fff00 100%);
  color: #32cd32;
}
.bar-fill.hp.yellow {
  background: linear-gradient(90deg, #ffa500 0%, #ffd700 100%);
  color: #ffa500;
}
.bar-fill.hp.red {
  background: linear-gradient(90deg, #dc143c 0%, #ff6347 100%);
  color: #dc143c;
}
.bar-fill.mp {
  background: linear-gradient(90deg, #4169e1 0%, #87ceeb 100%);
  color: #4169e1;
}
.bar-fill.shield {
  background: linear-gradient(90deg, #9370db 0%, #ba55d3 100%);
  color: #9370db;
}

.bar-num {
  width: 90px;
  text-align: right;
  font-size: 11px;
  color: #d4c5a9;
  font-weight: 600;
}

.effect-row {
  margin-top: 8px;
  border-top: 2px solid rgba(255, 215, 0, 0.2);
  padding-top: 6px;
}

.effect-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.effect-badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  border: 2px solid;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 10, 30, 0.8));
  cursor: default;
  white-space: nowrap;
  font-weight: 700;
  text-shadow: 0 0 5px currentColor;
  box-shadow: 0 0 8px currentColor;
}

.badge-turn {
  margin-left: 4px;
  opacity: 0.8;
  font-size: 10px;
}

.effect-badge.shield {
  border-color: #9370db;
  color: #e1b3f0;
}
.effect-badge.burn,
.effect-badge.poison,
.effect-badge.freeze,
.effect-badge.paralyze,
.effect-badge.confuse {
  border-color: #dc143c;
  color: #ffaaaa;
}
.effect-badge.atk_up,
.effect-badge.def_up,
.effect-badge.spa_up,
.effect-badge.spd_up,
.effect-badge.speed_up,
.effect-badge.acc_up,
.effect-badge.eva_up,
.effect-badge.damage_boost,
.effect-badge.skill_boost {
  border-color: #32cd32;
  color: #98fb98;
}
.effect-badge.atk_down,
.effect-badge.def_down,
.effect-badge.spa_down,
.effect-badge.spd_down,
.effect-badge.speed_down,
.effect-badge.acc_down,
.effect-badge.eva_down {
  border-color: #ffa500;
  color: #ffd700;
}
</style>
