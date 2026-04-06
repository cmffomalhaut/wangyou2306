import type { BattleState, PendingCommand, StatData } from './types';
import { patchBattleStatData, readBattleStatData, type BattleMessageId } from './bridge';

function applyPlayerInputFromCommand(state: BattleState, command?: PendingCommand): void {
  state.待处理指令 = command;
  state.玩家输入态.待选技能Id = command?.actionType === 'skill' ? command.skillId : undefined;
  state.玩家输入态.待选目标Id = command?.targetIds?.[0];
}

export function getStatData(messageId: BattleMessageId = -1): StatData {
  return readBattleStatData(messageId);
}

export function getBattleState(messageId: BattleMessageId = -1): BattleState | null {
  return getStatData(messageId).战斗状态;
}

export async function setBattleState(next: BattleState | null, messageId: BattleMessageId = -1): Promise<StatData> {
  return patchBattleStatData(statData => {
    statData.战斗状态 = next;
    return statData;
  }, messageId);
}

export async function patchBattleState(
  updater: (battleState: BattleState | null, statData: StatData) => BattleState | null | void,
  messageId: BattleMessageId = -1,
): Promise<StatData> {
  return patchBattleStatData(statData => {
    const nextBattleState = updater(statData.战斗状态, statData);
    if (nextBattleState !== undefined) {
      statData.战斗状态 = nextBattleState;
    }
    return statData;
  }, messageId);
}

export async function clearBattleState(messageId: BattleMessageId = -1): Promise<StatData> {
  return setBattleState(null, messageId);
}

export async function clearPendingCommand(messageId: BattleMessageId = -1): Promise<StatData> {
  return patchBattleState(battleState => {
    if (!battleState) return battleState;
    applyPlayerInputFromCommand(battleState, undefined);
    return battleState;
  }, messageId);
}

export async function writePlayerInput(command?: PendingCommand, messageId: BattleMessageId = -1): Promise<StatData> {
  return patchBattleState(battleState => {
    if (!battleState) return battleState;
    applyPlayerInputFromCommand(battleState, command);
    return battleState;
  }, messageId);
}
