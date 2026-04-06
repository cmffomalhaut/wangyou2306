<template>
  <div v-if="!isClosed" class="battle-screen" @click.self="() => {}">
    <button class="close-btn" title="关闭战斗界面" @click="onClose">✕</button>

    <ItemSelect
      v-if="store.phase === 'item_select'"
      :items="store.availableItems"
      @use="onUseItem"
      @skip="store.skipItem()"
    />

    <template v-else>
      <div class="battle-stage">
        <div v-if="store.enemy" class="enemy-silhouette">
          <div
            :key="`enemy-card-${hitShakeEnemySeed}`"
            class="silhouette-card enemy"
            :class="{ 'hit-shake-enemy': hitShakeEnemySeed > 0 }"
          >
            <div class="silhouette-name">{{ store.enemy.name }}</div>
            <div class="silhouette" :style="enemySilhouetteStyle"></div>
          </div>
        </div>

        <div v-if="store.ally" class="ally-silhouette">
          <div
            :key="`ally-card-${hitShakeAllySeed}`"
            class="silhouette-card ally"
            :class="{ 'hit-shake-ally': hitShakeAllySeed > 0 }"
          >
            <div class="silhouette-name">{{ store.ally.name }}</div>
            <div class="silhouette" :style="allySilhouetteStyle"></div>
          </div>
        </div>

        <div v-if="store.enemy" class="enemy-info">
          <UnitPanel
            :key="`enemy-${store.enemyActiveIndex}-${store.enemy.name}`"
            :unit="store.enemy"
            side="enemy"
            :is-active="true"
          />
        </div>

        <div v-if="store.ally" class="ally-info">
          <UnitPanel
            :key="`ally-${store.allyActiveIndex}-${store.ally.name}`"
            :unit="store.ally"
            side="ally"
            :is-active="true"
          />
        </div>

        <div class="fx-layer">
          <div v-if="attackFxSeed" :key="`slash-${attackFxSeed}`" class="slash-fx" :class="attackFxClass"></div>
          <div v-if="hitFxSeed" :key="`hit-${hitFxSeed}`" class="hit-fx" :class="hitFxClass"></div>
        </div>

        <div v-if="store.phase === 'forced_switch' && forcedSwitchOpen" class="forced-switch-mask">
          <div class="forced-switch-dialog">
            <div class="dialog-title">当前战姬已倒下，必须换人</div>
            <div class="dialog-tip">本回合无法出招，请选择下一位出战战姬</div>
            <div class="forced-switch-list">
              <button
                v-for="(u, idx) in store.allyTeam"
                :key="`${u.name}-${idx}`"
                class="forced-switch-unit"
                :class="{ selected: idx === forcedSelectedIndex, defeated: u.HP <= 0 }"
                :disabled="u.HP <= 0 || idx === store.allyActiveIndex"
                @click="forcedSelectedIndex = idx"
              >
                <span>{{ u.name }}</span>
                <span class="unit-hp">HP {{ Math.max(0, u.HP) }}/{{ u.HPMax }}</span>
              </button>
            </div>
            <div class="dialog-actions">
              <button class="dialog-btn confirm" @click="confirmForcedSwitch">确认换人</button>
              <button class="dialog-btn restart" @click="onRestart">重新开始战斗</button>
              <button class="dialog-btn close" @click="forcedSwitchOpen = false">关闭选项框</button>
            </div>
          </div>
        </div>
      </div>

      <div class="hud-row">
        <div class="message-box">
          <BattleMessage :log="store.log" />
        </div>

        <div v-if="store.phase === 'selecting'" class="action-panel">
          <ActionPanel
            :ally-team="store.allyTeam"
            :enemy-team="store.enemyTeam"
            :ally-active-index="store.allyActiveIndex"
            :enemy-active-index="store.enemyActiveIndex"
            :battle-type="store.battleType"
            :can-capture="store.canCapture"
            :capture-preview="store.capturePreview"
            @command="onCommand"
            @escape="onEscape"
            @preview-capture="store.previewCapture"
            @roll-capture="onCaptureRoll"
          />
        </div>

        <div v-if="store.phase === 'animating'" class="action-panel waiting-panel">
          <div class="waiting">结算中...</div>
        </div>

        <div v-if="store.phase === 'forced_switch'" class="action-panel waiting-panel forced-tip-panel">
          <div class="waiting">等待你完成强制换人</div>
          <button v-if="!forcedSwitchOpen" class="reopen-switch-btn" @click="forcedSwitchOpen = true">
            打开换人选项框
          </button>
        </div>
      </div>
    </template>

    <ResultOverlay v-if="store.finalResult" :result="store.finalResult" @close="onConfirmResult" @restart="onRestart" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ActionPanel from './components/ActionPanel.vue';
import BattleMessage from './components/BattleMessage.vue';
import ItemSelect from './components/ItemSelect.vue';
import ResultOverlay from './components/ResultOverlay.vue';
import UnitPanel from './components/UnitPanel.vue';
import { useBattleStore } from './store';
import type { BattleCommand, BattleItem, CaptureAttempt } from './types';

const store = useBattleStore();
const attackFxSeed = ref(0);
const hitFxSeed = ref(0);
const hitShakeAllySeed = ref(0);
const hitShakeEnemySeed = ref(0);
const attackFxTargetSide = ref<'ally' | 'enemy'>('enemy');
const hitFxTargetSide = ref<'ally' | 'enemy'>('enemy');
const forcedSwitchOpen = ref(true);
const forcedSelectedIndex = ref(0);

const DEFAULT_ALLY_SILHOUETTE_URL =
  'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=512&q=80';
const DEFAULT_ENEMY_SILHOUETTE_URL =
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=512&q=80';

const allySilhouetteStyle = computed(() => ({
  backgroundImage: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.18), rgba(8, 12, 20, 0.82)), url(${DEFAULT_ALLY_SILHOUETTE_URL})`,
}));

const enemySilhouetteStyle = computed(() => ({
  backgroundImage: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.18), rgba(8, 12, 20, 0.82)), url(${DEFAULT_ENEMY_SILHOUETTE_URL})`,
}));

const attackFxClass = computed(() => (attackFxTargetSide.value === 'enemy' ? 'to-enemy' : 'to-ally'));
const hitFxClass = computed(() => (hitFxTargetSide.value === 'enemy' ? 'on-enemy' : 'on-ally'));

watch(
  () => store.lastActions,
  actions => {
    const latest = actions[actions.length - 1];
    if (!latest) return;
    if (latest.isMissed) return;

    const hasImpact = (latest.damage ?? 0) > 0 || (latest.shieldDamage ?? 0) > 0;
    if (!hasImpact) return;

    attackFxSeed.value += 1;
    hitFxSeed.value += 1;

    const defenderSide = latest.defenderSide ?? 'enemy';
    const attackerSide = latest.attackerSide ?? (defenderSide === 'ally' ? 'enemy' : 'ally');
    attackFxTargetSide.value = defenderSide;
    hitFxTargetSide.value = defenderSide;

    if (defenderSide === 'ally') hitShakeAllySeed.value += 1;
    else hitShakeEnemySeed.value += 1;

    if (attackerSide === defenderSide) {
      attackFxTargetSide.value = defenderSide === 'ally' ? 'enemy' : 'ally';
    }
  },
  { deep: true },
);

watch(
  () => store.phase,
  phase => {
    if (phase === 'forced_switch') {
      forcedSwitchOpen.value = true;
      forcedSelectedIndex.value = store.allyTeam.findIndex((u, idx) => idx !== store.allyActiveIndex && u.HP > 0);
      if (forcedSelectedIndex.value < 0) forcedSelectedIndex.value = 0;
    }
  },
  { immediate: true },
);

function onCommand(command: BattleCommand) {
  if (store.phase !== 'selecting') return;
  store.executeRound(command);
}

function onEscape() {
  if (store.phase !== 'selecting') return;
  store.tryEscape();
}

function onUseItem(item: BattleItem) {
  store.useItem(item);
}

function onConfirmResult() {
  store.emitBattleEnd();
}

function onRestart() {
  store.restartBattle();
}

function onCaptureRoll(attempt: CaptureAttempt) {
  store.rollCapture(attempt);
}

function confirmForcedSwitch() {
  if (store.phase !== 'forced_switch') return;
  store.confirmForcedSwitch(forcedSelectedIndex.value);
  forcedSwitchOpen.value = true;
}

const isClosed = ref(false);

function onClose() {
  isClosed.value = true;
  window.parent.postMessage({ type: 'battle-close', source: 'th-battle-ui' }, '*');
}
</script>

<style scoped>
/* 复古日漫RPG风格 - CSS变量 */
.battle-screen {
  --hud-height: 220px;
  --retro-bg-dark: #1a0f2e;
  --retro-bg-mid: #2d1b4e;
  --retro-gold: #ffd700;
  --retro-gold-dark: #b8860b;
  --retro-blue: #4169e1;
  --retro-red: #dc143c;

  position: relative;
  width: 100%;
  height: 100%;
  min-height: 620px;
  background:
    radial-gradient(circle at 20% 80%, rgba(138, 43, 226, 0.15), transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(25, 25, 112, 0.2), transparent 50%),
    linear-gradient(180deg, #1a0f2e 0%, #2d1b4e 50%, #0f0a1e 100%);
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  color: #f0e6d2;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 星空闪烁效果 */
.battle-screen::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(2px 2px at 20% 30%, white, transparent), radial-gradient(2px 2px at 60% 70%, white, transparent),
    radial-gradient(1px 1px at 50% 50%, white, transparent), radial-gradient(1px 1px at 80% 10%, white, transparent),
    radial-gradient(2px 2px at 90% 60%, white, transparent), radial-gradient(1px 1px at 33% 80%, white, transparent),
    radial-gradient(1px 1px at 15% 60%, white, transparent);
  background-size: 200% 200%;
  background-position: 0% 0%;
  animation: starTwinkle 8s ease-in-out infinite;
  opacity: 0.6;
  pointer-events: none;
  z-index: 1;
}

/* 顶部金色装饰边框 */
.battle-screen::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--retro-gold-dark) 20%,
    var(--retro-gold) 50%,
    var(--retro-gold-dark) 80%,
    transparent
  );
  box-shadow:
    0 0 10px rgba(255, 215, 0, 0.6),
    0 0 20px rgba(255, 215, 0, 0.3);
  z-index: 20;
}

@keyframes starTwinkle {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.8;
  }
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 14px;
  z-index: 30;
  background: linear-gradient(135deg, rgba(139, 0, 0, 0.8), rgba(220, 20, 60, 0.6));
  border: 2px solid var(--retro-gold);
  color: var(--retro-gold);
  font-size: 18px;
  font-weight: bold;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  box-shadow:
    0 0 10px rgba(255, 215, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  text-shadow: 0 0 5px rgba(255, 215, 0, 0.8);
}
.close-btn:hover {
  background: linear-gradient(135deg, rgba(220, 20, 60, 0.9), rgba(255, 69, 0, 0.7));
  transform: scale(1.1);
  box-shadow:
    0 0 15px rgba(255, 215, 0, 0.8),
    0 0 25px rgba(220, 20, 60, 0.5);
}

.battle-stage {
  position: relative;
  flex: 1;
  background: linear-gradient(180deg, transparent 60%, rgba(139, 69, 19, 0.1) 100%);
  --enemy-anchor-x: calc(50% + 30px);
  --enemy-anchor-y: 174px;
  --ally-anchor-x: calc(50% - 250px);
  --ally-anchor-y: calc(100% - var(--hud-height) - 96px);
  z-index: 2;
}
/* 地面金色装饰线 */
.battle-stage::after {
  content: '';
  position: absolute;
  bottom: calc(var(--hud-height) - 10px);
  left: 10%;
  right: 10%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--retro-gold-dark) 30%,
    var(--retro-gold) 50%,
    var(--retro-gold-dark) 70%,
    transparent
  );
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
  pointer-events: none;
}

.enemy-silhouette,
.ally-silhouette {
  position: absolute;
  width: 220px;
  height: 220px;
  z-index: 3;
}

.enemy-silhouette {
  top: var(--enemy-anchor-y);
  left: var(--enemy-anchor-x);
  transform: translate(-50%, -50%);
}

.ally-silhouette {
  top: var(--ally-anchor-y);
  left: var(--ally-anchor-x);
  transform: translate(-50%, -50%);
}

.silhouette-card {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(26, 15, 46, 0.9), rgba(45, 27, 78, 0.85));
  border: 3px solid var(--retro-gold);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 15px rgba(255, 215, 0, 0.5),
    0 8px 32px rgba(0, 0, 0, 0.6),
    inset 0 2px 0 rgba(255, 215, 0, 0.3),
    inset 0 -2px 0 rgba(0, 0, 0, 0.5);
  position: relative;
}

/* 四角装饰 */
.silhouette-card::before,
.silhouette-card::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid var(--retro-gold);
}
.silhouette-card::before {
  top: -2px;
  left: -2px;
  border-right: none;
  border-bottom: none;
}
.silhouette-card::after {
  top: -2px;
  right: -2px;
  border-left: none;
  border-bottom: none;
}

.silhouette-card.enemy {
  border-color: var(--retro-red);
  box-shadow:
    0 0 20px rgba(220, 20, 60, 0.6),
    0 8px 32px rgba(0, 0, 0, 0.6),
    inset 0 2px 0 rgba(220, 20, 60, 0.4);
}
.silhouette-card.enemy::before,
.silhouette-card.enemy::after {
  border-color: var(--retro-red);
}

.silhouette-card.ally {
  border-color: var(--retro-blue);
  box-shadow:
    0 0 20px rgba(65, 105, 225, 0.6),
    0 8px 32px rgba(0, 0, 0, 0.6),
    inset 0 2px 0 rgba(65, 105, 225, 0.4);
}
.silhouette-card.ally::before,
.silhouette-card.ally::after {
  border-color: var(--retro-blue);
}

.silhouette-name {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--retro-gold);
  margin-bottom: 10px;
  text-shadow:
    0 0 10px rgba(255, 215, 0, 0.8),
    2px 2px 0 rgba(0, 0, 0, 0.8),
    -1px -1px 0 rgba(0, 0, 0, 0.5);
  text-transform: uppercase;
}

.silhouette {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  border: 3px solid rgba(255, 215, 0, 0.4);
  box-shadow:
    inset 0 0 40px rgba(0, 0, 0, 0.8),
    0 0 20px rgba(255, 215, 0, 0.3);
}

.enemy-info {
  position: absolute;
  top: 12px;
  left: 16px;
  z-index: 5;
}

.ally-info {
  position: absolute;
  top: 48px;
  right: 16px;
  z-index: 5;
}

.hud-row {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: minmax(280px, 34%) 1fr;
  gap: 10px;
  padding: 0 12px 10px;
  min-height: var(--hud-height);
  z-index: 10;
  background: linear-gradient(0deg, rgba(26, 15, 46, 0.95) 0%, rgba(45, 27, 78, 0.85) 80%, transparent 100%);
  border-top: 3px solid var(--retro-gold);
  box-shadow: 0 -5px 20px rgba(255, 215, 0, 0.3);
}

.fx-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 8;
}

.slash-fx {
  position: absolute;
  width: 300px;
  height: 6px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 215, 0, 0.3) 20%,
    rgba(255, 255, 255, 1) 50%,
    rgba(135, 206, 250, 0.8) 70%,
    transparent 100%
  );
  box-shadow:
    0 0 25px rgba(255, 255, 255, 1),
    0 0 50px rgba(255, 215, 0, 0.8),
    0 0 80px rgba(135, 206, 250, 0.5);
  animation: slashFx 400ms cubic-bezier(0.2, 0.9, 0.3, 1);
}

.slash-fx.to-enemy {
  left: var(--enemy-anchor-x);
  top: var(--enemy-anchor-y);
  --slash-rotate: -25deg;
  transform: translate(-50%, -50%) rotate(var(--slash-rotate));
}

.slash-fx.to-ally {
  left: var(--ally-anchor-x);
  top: var(--ally-anchor-y);
  --slash-rotate: 155deg;
  transform: translate(-50%, -50%) rotate(var(--slash-rotate));
}

.hit-fx {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.9);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%);
  box-shadow:
    0 0 30px rgba(255, 255, 255, 1),
    0 0 60px rgba(255, 215, 0, 0.8),
    inset 0 0 30px rgba(255, 255, 255, 0.5);
  animation: hitFx 380ms ease-out;
}

.hit-fx.on-enemy {
  top: var(--enemy-anchor-y);
  left: var(--enemy-anchor-x);
  transform: translate(-50%, -50%);
}

.hit-fx.on-ally {
  top: var(--ally-anchor-y);
  left: var(--ally-anchor-x);
  transform: translate(-50%, -50%);
}

@keyframes slashFx {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) translateX(-30px) scaleX(0.3) rotate(var(--slash-rotate));
  }
  30% {
    opacity: 1;
    transform: translate(-50%, -50%) translateX(0) scaleX(1) rotate(var(--slash-rotate));
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) translateX(25px) scaleX(1.4) rotate(var(--slash-rotate));
  }
}

@keyframes hitFx {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.3);
    border-width: 6px;
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
    border-width: 4px;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.6);
    border-width: 2px;
  }
}

@keyframes hitShakeEnemy {
  0%,
  100% {
    transform: translate(-50%, -50%);
  }
  10% {
    transform: translate(-50%, -50%) translateX(-12px) rotate(-2deg);
  }
  30% {
    transform: translate(-50%, -50%) translateX(10px) rotate(1.8deg);
  }
  50% {
    transform: translate(-50%, -50%) translateX(-8px) rotate(-1.2deg);
  }
  70% {
    transform: translate(-50%, -50%) translateX(5px) rotate(0.8deg);
  }
  90% {
    transform: translate(-50%, -50%) translateX(-2px) rotate(-0.3deg);
  }
}

@keyframes hitShakeAlly {
  0%,
  100% {
    transform: translate(-50%, -50%);
  }
  10% {
    transform: translate(-50%, -50%) translateX(12px) rotate(2deg);
  }
  30% {
    transform: translate(-50%, -50%) translateX(-10px) rotate(-1.8deg);
  }
  50% {
    transform: translate(-50%, -50%) translateX(8px) rotate(1.2deg);
  }
  70% {
    transform: translate(-50%, -50%) translateX(-5px) rotate(-0.8deg);
  }
  90% {
    transform: translate(-50%, -50%) translateX(2px) rotate(0.3deg);
  }
}

.hit-shake-enemy {
  animation: hitShakeEnemy 350ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

.hit-shake-ally {
  animation: hitShakeAlly 350ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

.message-box {
  border: 3px solid var(--retro-gold);
  border-radius: 8px;
  overflow: hidden;
  align-self: end;
  background: linear-gradient(135deg, rgba(26, 15, 46, 0.95), rgba(45, 27, 78, 0.9));
  box-shadow:
    0 0 15px rgba(255, 215, 0, 0.4),
    0 4px 20px rgba(0, 0, 0, 0.6),
    inset 0 2px 0 rgba(255, 215, 0, 0.2);
}

.action-panel {
  border: 3px solid var(--retro-gold);
  border-radius: 8px;
  overflow: hidden;
  align-self: end;
  background: linear-gradient(135deg, rgba(26, 15, 46, 0.95), rgba(45, 27, 78, 0.9));
  box-shadow:
    0 0 15px rgba(255, 215, 0, 0.4),
    0 4px 20px rgba(0, 0, 0, 0.6),
    inset 0 2px 0 rgba(255, 215, 0, 0.2);
}

.waiting-panel {
  background: linear-gradient(135deg, rgba(26, 15, 46, 0.98), rgba(45, 27, 78, 0.95));
}

.waiting {
  text-align: center;
  padding: 20px;
  color: var(--retro-gold);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

.forced-tip-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
}

.reopen-switch-btn {
  border: 2px solid var(--retro-gold);
  background: linear-gradient(135deg, rgba(184, 134, 11, 0.3), rgba(255, 215, 0, 0.2));
  color: var(--retro-gold);
  border-radius: 6px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 600;
  text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
  transition: all 0.3s;
}
.reopen-switch-btn:hover {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.4), rgba(255, 215, 0, 0.3));
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
}

.forced-switch-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 15;
  backdrop-filter: blur(3px);
}

.forced-switch-dialog {
  width: min(560px, 92%);
  border-radius: 8px;
  border: 4px double var(--retro-gold);
  background: linear-gradient(135deg, rgba(26, 15, 46, 0.98), rgba(45, 27, 78, 0.95));
  box-shadow:
    0 0 30px rgba(255, 215, 0, 0.6),
    0 20px 60px rgba(0, 0, 0, 0.8),
    inset 0 2px 0 rgba(255, 215, 0, 0.3);
  padding: 20px;
  position: relative;
}
/* 对话框四角装饰 */
.forced-switch-dialog::before,
.forced-switch-dialog::after {
  content: '◆';
  position: absolute;
  color: var(--retro-gold);
  font-size: 16px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
}
.forced-switch-dialog::before {
  top: 8px;
  left: 8px;
}
.forced-switch-dialog::after {
  top: 8px;
  right: 8px;
}

@media (max-width: 860px) {
  .hud-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .enemy-silhouette {
    transform: translate(-50%, -50%) scale(0.9);
  }

  .ally-silhouette {
    transform: translate(-50%, -50%) scale(0.9);
  }
}

@media (max-width: 620px) {
  .battle-screen {
    --hud-height: 300px;
  }

  .enemy-silhouette,
  .ally-silhouette {
    width: 170px;
    height: 170px;
  }

  .silhouette {
    width: 110px;
    height: 110px;
  }

  .forced-switch-list,
  .dialog-actions {
    grid-template-columns: 1fr;
  }
}

.dialog-title {
  font-size: 20px;
  color: var(--retro-gold);
  font-weight: 700;
  text-align: center;
  text-shadow:
    0 0 10px rgba(255, 215, 0, 0.8),
    2px 2px 0 rgba(0, 0, 0, 0.8);
  letter-spacing: 0.05em;
}

.dialog-tip {
  margin-top: 8px;
  color: #d4c5a9;
  font-size: 14px;
  text-align: center;
}

.forced-switch-list {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.forced-switch-unit {
  border-radius: 6px;
  border: 2px solid var(--retro-gold-dark);
  background: linear-gradient(135deg, rgba(184, 134, 11, 0.2), rgba(139, 69, 19, 0.3));
  color: #f0e6d2;
  padding: 12px 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: flex-start;
  transition: all 0.3s;
  font-weight: 600;
}
.forced-switch-unit:hover:not(.defeated) {
  border-color: var(--retro-gold);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(184, 134, 11, 0.4));
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
}

.forced-switch-unit.selected {
  border-color: var(--retro-gold);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.4), rgba(255, 215, 0, 0.3));
  box-shadow:
    0 0 20px rgba(255, 215, 0, 0.8),
    inset 0 0 20px rgba(255, 215, 0, 0.2);
}

.forced-switch-unit.defeated {
  opacity: 0.3;
  cursor: not-allowed;
  filter: grayscale(1);
}

.unit-hp {
  font-size: 11px;
  color: #c9b896;
}

.dialog-actions {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.dialog-btn {
  border-radius: 6px;
  padding: 10px 12px;
  cursor: pointer;
  border: 2px solid;
  font-weight: 700;
  transition: all 0.3s;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.dialog-btn.confirm {
  border-color: #32cd32;
  background: linear-gradient(135deg, rgba(50, 205, 50, 0.3), rgba(34, 139, 34, 0.4));
  color: #98fb98;
}
.dialog-btn.confirm:hover {
  background: linear-gradient(135deg, rgba(50, 205, 50, 0.5), rgba(34, 139, 34, 0.6));
  box-shadow: 0 0 15px rgba(50, 205, 50, 0.6);
}

.dialog-btn.restart {
  border-color: #ffa500;
  background: linear-gradient(135deg, rgba(255, 165, 0, 0.3), rgba(255, 140, 0, 0.4));
  color: #ffd700;
}
.dialog-btn.restart:hover {
  background: linear-gradient(135deg, rgba(255, 165, 0, 0.5), rgba(255, 140, 0, 0.6));
  box-shadow: 0 0 15px rgba(255, 165, 0, 0.6);
}

.dialog-btn.close {
  border-color: #808080;
  background: linear-gradient(135deg, rgba(128, 128, 128, 0.3), rgba(105, 105, 105, 0.4));
  color: #d3d3d3;
}
.dialog-btn.close:hover {
  background: linear-gradient(135deg, rgba(128, 128, 128, 0.5), rgba(105, 105, 105, 0.6));
  box-shadow: 0 0 15px rgba(128, 128, 128, 0.4);
}
</style>
