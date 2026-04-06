<template>
  <section class="log-panel subpanel">
    <div class="panel-title">战斗日志</div>
    <div class="log-list">
      <div v-for="entry in logs" :key="entry.id" class="log-item" :class="entry.type">
        <span class="log-turn">T{{ entry.turn }}</span>
        <span>{{ entry.text }}</span>
      </div>
      <div v-if="logs.length === 0" class="empty-text">暂无战斗日志</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { BattleLogEntry } from '@/wangyou/脚本/战斗系统/types';

defineProps<{
  logs: BattleLogEntry[];
}>();
</script>
