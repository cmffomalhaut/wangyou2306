import { Schema } from '../../schema';

export type BattleMessageId = number | 'latest';

type BattleVariableOption = VariableOption & { type: 'message'; message_id: number };

export type BattleBridgeContext = {
  messageId: number;
  variableOption: BattleVariableOption;
  variables: Mvu.MvuData;
  statData: Schema;
};

function normalizeMessageId(messageId: BattleMessageId = -1): number {
  return messageId === 'latest' ? -1 : messageId;
}

export function createBattleVariableOption(messageId: BattleMessageId = -1): BattleVariableOption {
  return {
    type: 'message',
    message_id: normalizeMessageId(messageId),
  };
}

export function readBattleBridgeContext(messageId: BattleMessageId = -1): BattleBridgeContext {
  const variableOption = createBattleVariableOption(messageId);
  const variables = Mvu.getMvuData(variableOption);
  const statData = Schema.parse(_.get(variables, 'stat_data', {}));

  return {
    messageId: variableOption.message_id,
    variableOption,
    variables,
    statData,
  };
}

export function readBattleStatData(messageId: BattleMessageId = -1): Schema {
  return readBattleBridgeContext(messageId).statData;
}

export async function writeBattleStatData(
  statData: Schema,
  messageId: BattleMessageId = -1,
  existingVariables?: Mvu.MvuData,
): Promise<Schema> {
  const variableOption = createBattleVariableOption(messageId);
  const variables = _.cloneDeep(existingVariables ?? Mvu.getMvuData(variableOption));
  const parsed = Schema.parse(statData);

  _.set(variables, 'stat_data', parsed);
  await Mvu.replaceMvuData(variables, variableOption);

  return parsed;
}

export async function patchBattleStatData(
  updater: (statData: Schema) => Schema | void,
  messageId: BattleMessageId = -1,
): Promise<Schema> {
  const context = readBattleBridgeContext(messageId);
  const workingCopy = _.cloneDeep(context.statData);
  const next = updater(workingCopy) ?? workingCopy;

  return writeBattleStatData(next, context.messageId, context.variables);
}
