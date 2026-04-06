<template>
  <section v-if="result" class="result-card">
    <div class="result-topline">
      <div>
        <div class="panel-title">战斗结果</div>
        <div class="result-summary">{{ result.summary }}</div>
      </div>
      <div class="result-winner-pill" :class="result.winner">{{ winnerText }}</div>
    </div>

    <div class="result-grid">
      <div>
        <div class="result-value">{{ result.rounds }}</div>
        <div class="panel-phase">{{ result.rounds }} 回合结束</div>
      </div>
      <div>
        <div class="result-label">经验</div>
        <div class="result-value">{{ result.expGain }}</div>
      </div>
      <div>
        <div class="result-label">金币</div>
        <div class="result-value">{{ result.goldGain }}</div>
      </div>
    </div>

    <div v-if="result.rewardTexts.length" class="result-reward-list">
      <div v-for="reward in result.rewardTexts" :key="reward" class="result-reward-item">{{ reward }}</div>
    </div>

    <button class="action-btn" @click="$emit('settle')">执行战后结算</button>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BattleResultSummary } from '@/wangyou/脚本/战斗系统/types';

const props = defineProps<{
  result?: BattleResultSummary;
}>();

const result = computed(() => props.result);

defineEmits<{
  (e: 'settle'): void;
}>();

const winnerText = computed(() => {
  if (!props.result) return '';
  if (props.result.winner === 'ally') return '我方获胜';
  if (props.result.winner === 'enemy') return '敌方获胜';
  if (props.result.winner === 'escape') return '成功脱战';
  return '战斗平局';
});
</script>
