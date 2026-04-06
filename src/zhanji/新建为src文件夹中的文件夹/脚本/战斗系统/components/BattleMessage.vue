<template>
  <div ref="msgBox" class="battle-msg">
    <div class="msg-line system">— 战斗开始 —</div>
    <TransitionGroup name="msg">
      <div v-for="(entry, i) in log" :key="i" class="msg-line" :class="entry.type">
        <span v-if="entry.turn" class="turn-tag">R{{ entry.turn }}</span>
        {{ entry.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import type { BattleLogEntry } from '../types';

const props = defineProps<{ log: BattleLogEntry[] }>();
const msgBox = ref<HTMLElement>();

watch(
  () => props.log.length,
  async () => {
    await nextTick();
    if (msgBox.value) {
      msgBox.value.scrollTop = msgBox.value.scrollHeight;
    }
  },
);
</script>

<style scoped>
.battle-msg {
  max-height: 160px;
  overflow-y: auto;
  padding: 8px 14px;
  background: linear-gradient(180deg, #1a0f2e 0%, #2d1b4e 100%);
  border-top: 2px solid #ffd700;
  font-size: 12.5px;
  line-height: 1.7;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.5);
}
.battle-msg::-webkit-scrollbar {
  width: 6px;
}
.battle-msg::-webkit-scrollbar-track {
  background: rgba(26, 15, 46, 0.5);
  border-radius: 3px;
}
.battle-msg::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #ffd700, #b8860b);
  border-radius: 3px;
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.4);
}
.msg-line {
  color: #f0e6d2;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}
.msg-line.damage {
  color: #ff6b6b;
  text-shadow: 0 0 4px rgba(255, 107, 107, 0.4);
}
.msg-line.heal {
  color: #66bb6a;
  text-shadow: 0 0 4px rgba(102, 187, 106, 0.4);
}
.msg-line.buff {
  color: #4169e1;
  text-shadow: 0 0 4px rgba(65, 105, 225, 0.4);
}
.msg-line.debuff {
  color: #ff9800;
  text-shadow: 0 0 4px rgba(255, 152, 0, 0.4);
}
.msg-line.crit {
  color: #ffd700;
  font-weight: bold;
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.6);
}
.msg-line.effective {
  color: #dc143c;
  text-shadow: 0 0 4px rgba(220, 20, 60, 0.4);
}
.msg-line.resist {
  color: #9ca3af;
}
.msg-line.passive {
  color: #ce93d8;
  text-shadow: 0 0 4px rgba(206, 147, 216, 0.4);
}
.msg-line.shield {
  color: #ab47bc;
  text-shadow: 0 0 4px rgba(171, 71, 188, 0.4);
}
.msg-line.item {
  color: #4dd0e1;
  text-shadow: 0 0 4px rgba(77, 208, 225, 0.4);
}
.msg-line.defeat {
  color: #dc143c;
  font-weight: bold;
  text-shadow: 0 0 6px rgba(220, 20, 60, 0.5);
}
.msg-line.victory {
  color: #ffd700;
  font-weight: bold;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
}
.msg-line.switch {
  color: #80cbc4;
}
.msg-line.cooldown {
  color: #ffcc80;
}
.msg-line.mp {
  color: #81d4fa;
}
.msg-line.speed {
  color: #f48fb1;
}
.msg-line.status {
  color: #d1d5db;
}
.msg-line.system {
  color: #b8860b;
  font-style: italic;
}
.turn-tag {
  display: inline-block;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(184, 134, 11, 0.2));
  padding: 0 5px;
  border-radius: 4px;
  font-size: 9px;
  margin-right: 5px;
  color: #ffd700;
  border: 1px solid #ffd700;
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.3);
  font-weight: 700;
}

.msg-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}
.msg-enter-active {
  transition: all 0.22s ease;
}
</style>
