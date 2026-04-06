import { advanceBattle, applyBattleSummaryToRecords } from './engine';
import type { PendingCommand } from './types';
import { readBattleBridgeContext, writeBattleStatData } from './bridge';
import { clearBattleState, clearPendingCommand } from './store';

const AUTO_ADVANCE_LIMIT = 24;

function shouldPauseForPlayerInput(command: PendingCommand | undefined, messageId: number): boolean {
  const { statData } = readBattleBridgeContext(messageId);
  const state = statData.战斗状态;

  if (!state || state.状态 === 'ended') {
    return true;
  }

  return state.玩家输入态.可操作 && state.当前阶段 === 'select_action' && !command;
}

async function runBattleController(messageId: number, command?: PendingCommand) {
  let nextCommand = command;

  for (let tick = 0; tick < AUTO_ADVANCE_LIMIT; tick += 1) {
    const { variables, statData } = readBattleBridgeContext(messageId);
    const result = advanceBattle(statData, nextCommand);
    result.state.待处理指令 ??= undefined;
    statData.战斗状态 = result.state;
    await writeBattleStatData(statData, messageId, variables);

    if (result.state.状态 === 'ended') {
      return result.state;
    }

    if (result.state.玩家输入态.可操作 && result.state.当前阶段 === 'select_action') {
      return result.state;
    }

    nextCommand = result.state.待处理指令 ?? undefined;
    if (!nextCommand && shouldPauseForPlayerInput(undefined, messageId)) {
      return result.state;
    }
  }

  throw new Error(`战斗自动推进超过 ${AUTO_ADVANCE_LIMIT} 次，已中止以避免死循环。`);
}

async function runBattleTick(messageId: number, command?: PendingCommand) {
  await runBattleController(messageId, command);
}

async function settleBattle(messageId: number) {
  const { variables, statData } = readBattleBridgeContext(messageId);
  const next = applyBattleSummaryToRecords(statData);
  await writeBattleStatData(next, messageId, variables);
  await clearPendingCommand(messageId);
}

async function rebuildBattle(messageId: number) {
  await clearBattleState(messageId);
  await runBattleController(messageId);
}

async function ensureBattleInitialized(messageId: number) {
  const { statData } = readBattleBridgeContext(messageId);
  if (!statData.战斗状态) {
    return;
  }

  if (statData.战斗状态.状态 === 'preparing') {
    await runBattleController(messageId);
  }
}

$(() => {
  errorCatched(async () => {
    await waitGlobalInitialized('Mvu');
    const messageId = -1;
    await ensureBattleInitialized(messageId);

    eventOn(getButtonEvent('开始战斗'), async () => {
      await runBattleTick(messageId);
    });

    eventOn(getButtonEvent('推进战斗'), async () => {
      const { statData } = readBattleBridgeContext(messageId);
      const command = statData.战斗状态?.待处理指令;
      await runBattleTick(messageId, command ?? undefined);
    });

    eventOn(getButtonEvent('战斗结算'), async () => {
      await settleBattle(messageId);
    });

    eventOn(getButtonEvent('清理战斗状态'), async () => {
      await clearBattleState(messageId);
    });

    eventOn(getButtonEvent('强制重建战斗'), async () => {
      await rebuildBattle(messageId);
    });
  })();
});
