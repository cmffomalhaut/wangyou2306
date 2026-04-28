import { onMounted, watch, ref } from 'vue';
import type { StatData } from '../../wangyou/脚本/战斗系统/types';

function isEncounterPending(data: StatData): boolean {
  const phase = data.世界.剧情状态;
  return (phase === '战斗' || phase === '偷袭') && data.战斗状态 === null;
}

function triggerButton(name: string): void {
  emitEvent(getButtonEvent(name));
}

export function useAutoBattle(store: { data: StatData }) {
  const hasHandled = ref(false);

  onMounted(() => {
    const data = store.data;
    if (isEncounterPending(data) && !hasHandled.value) {
      hasHandled.value = true;
      setTimeout(() => {
        triggerButton('开始战斗');
      }, 300);
    }
  });

  watch(
    () => store.data.战斗状态,
    (battleState) => {
      if (!hasHandled.value) return;

      if (battleState?.状态 === 'ended') {
        triggerButton('战斗结算');
      }

      // 结算完成后重置，允许下次遇敌自动触发
      if (battleState === null) {
        hasHandled.value = false;
      }
    },
  );
}
