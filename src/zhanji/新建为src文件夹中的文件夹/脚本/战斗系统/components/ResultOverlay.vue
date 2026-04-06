<template>
  <div class="result-overlay" :class="result.winner">
    <div class="result-box">
      <div class="result-title">
        {{ result.winner === 'ally' ? '胜利' : result.winner === 'escape' ? '逃跑成功' : '战败' }}
      </div>
      <div class="result-stats">
        <div>回合数: {{ result.rounds }}</div>
        <div>己方HP: {{ result.allyHP }}</div>
        <div>敌方HP: {{ result.enemyHP }}</div>
        <div v-if="result.expGained">经验值 +{{ result.expGained }}</div>
        <div v-if="result.goldGained">金币 +{{ result.goldGained }}</div>
        <div v-if="result.enemyPostAction">敌方战后决策: {{ postActionText }}</div>
      </div>

      <div v-if="result.capture" class="capture-box">
        <div class="capture-title">捕捉掷骰判定</div>
        <div class="capture-formula">
          基础{{ pct(result.capture.baseRate) }} × 球{{ result.capture.ballMultiplier.toFixed(2) }} × 辅助{{
            result.capture.techMod.toFixed(2)
          }}
          × 状态{{ result.capture.statusMod.toFixed(2) }} ÷ 抵抗{{ result.capture.resistMod.toFixed(2) }}
        </div>
        <div class="capture-final">最终成功率：{{ pct(result.capture.finalRate) }}</div>

        <template v-if="result.capture.attempted">
          <div class="dice-row">
            <div class="dice-orb" :class="{ success: result.capture.success, fail: !result.capture.success }">
              {{ pct(result.capture.roll ?? 0) }}
            </div>
            <div class="dice-vs">≤</div>
            <div class="dice-target">{{ pct(result.capture.finalRate) }}</div>
          </div>
          <div class="capture-anim-line"></div>
          <div class="capture-result" :class="result.capture.success ? 'ok' : 'bad'">
            {{ result.capture.success ? '捕捉成功' : '捕捉失败' }}
          </div>
        </template>

        <template v-else>
          <div class="capture-pending">尚未投骰，点击下方按钮进行捕捉判定。</div>
          <button class="roll-btn" @click="$emit('capture-roll')">投骰判定</button>
        </template>
      </div>
      <div class="result-actions">
        <button class="restart-btn" @click="$emit('restart')">重新战斗</button>
        <button class="close-btn" @click="$emit('close')">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BattleResult } from '../types';

const props = defineProps<{ result: BattleResult }>();
defineEmits<{ close: []; restart: []; 'capture-roll': [] }>();

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

const postActionText = computed(() => {
  if (props.result.enemyPostAction === 'continue') return '继续纠缠/再次挑战';
  if (props.result.enemyPostAction === 'retreat') return '撤退离场';
  if (props.result.enemyPostAction === 'surrender') return '心理崩溃，放弃抵抗';
  return '未知';
});
</script>

<style scoped>
.result-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(6px);
  z-index: 100;
}

.result-box {
  background: linear-gradient(160deg, #1a0f2e 0%, #2d1b4e 100%);
  border: 3px solid #ffd700;
  border-radius: 16px;
  padding: 24px 28px;
  text-align: center;
  width: min(560px, 92%);
  max-height: 86%;
  overflow-y: auto;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.5), inset 0 2px 0 rgba(255, 215, 0, 0.2);
  position: relative;
}

.result-box::before,
.result-box::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border: 3px solid #ffd700;
  background: #1a0f2e;
}

.result-box::before {
  top: -3px;
  left: -3px;
  border-right: none;
  border-bottom: none;
}

.result-box::after {
  top: -3px;
  right: -3px;
  border-left: none;
  border-bottom: none;
}

.result-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ally .result-title {
  color: #ffd700;
  text-shadow: 0 0 15px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.4);
  animation: victoryPulse 2s ease-in-out infinite;
}

.escape .result-title {
  color: #daa520;
  text-shadow: 0 0 10px rgba(218, 165, 32, 0.6);
}

.enemy .result-title {
  color: #dc143c;
  text-shadow: 0 0 10px rgba(220, 20, 60, 0.6);
}

@keyframes victoryPulse {
  0%, 100% { text-shadow: 0 0 15px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.4); }
  50% { text-shadow: 0 0 20px rgba(255, 215, 0, 1), 0 0 40px rgba(255, 215, 0, 0.6); }
}

.result-stats {
  font-size: 14px;
  color: #f0e6d2;
  line-height: 1.85;
  margin-bottom: 16px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.restart-btn,
.close-btn {
  padding: 8px 22px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  border: 2px solid transparent;
  font-weight: 600;
}

.restart-btn {
  background: linear-gradient(135deg, rgba(184, 134, 11, 0.4), rgba(45, 27, 78, 0.9));
  border-color: #b8860b;
  color: #daa520;
  box-shadow: 0 0 10px rgba(184, 134, 11, 0.3);
}

.restart-btn:hover {
  box-shadow: 0 0 15px rgba(184, 134, 11, 0.5);
  border-color: #daa520;
}

.close-btn {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.4), rgba(45, 27, 78, 0.9));
  border-color: #ffd700;
  color: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.close-btn:hover {
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
  border-color: #fff;
}

.capture-box {
  margin: 12px 0 16px;
  padding: 12px;
  border-radius: 10px;
  border: 2px solid #ffd700;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(45, 27, 78, 0.8));
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
}

.capture-title {
  font-size: 14px;
  color: #ffd700;
  margin-bottom: 6px;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
}

.capture-formula,
.capture-final {
  font-size: 12px;
  color: #f0e6d2;
}

.dice-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.dice-orb,
.dice-target {
  min-width: 56px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(30, 30, 30, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-weight: 700;
}

.dice-orb {
  animation: dicePulse 0.9s ease-in-out infinite;
}

.dice-orb.success {
  border-color: rgba(88, 255, 148, 0.7);
  color: #89ffb8;
}

.dice-orb.fail {
  border-color: rgba(255, 97, 97, 0.75);
  color: #ff9d9d;
}

.dice-vs {
  color: #9fb0bf;
  font-size: 16px;
}

.capture-anim-line {
  margin: 10px auto 0;
  height: 2px;
  width: 80%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
  animation: scan 1.2s linear infinite;
}

.capture-result {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 700;
}

.capture-result.ok {
  color: #7cffae;
}

.capture-result.bad {
  color: #ff8a8a;
}

.capture-pending {
  margin-top: 10px;
  font-size: 12px;
  color: #cfd8dc;
}

.roll-btn {
  margin-top: 10px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 2px solid #ffd700;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(45, 27, 78, 0.9));
  color: #ffd700;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  transition: all 0.2s;
}

.roll-btn:hover {
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
  border-color: #fff;
}

@keyframes dicePulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.07);
  }
}

@keyframes scan {
  0% {
    opacity: 0.25;
    transform: translateX(-10px);
  }

  50% {
    opacity: 1;
    transform: translateX(10px);
  }

  100% {
    opacity: 0.25;
    transform: translateX(-10px);
  }
}
</style>
