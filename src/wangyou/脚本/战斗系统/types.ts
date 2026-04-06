import type { Schema } from '../../schema';

export type StatData = Schema;
export type BattleState = NonNullable<Schema['战斗状态']>;
export type RuleConfig = Schema['规则配置'];
export type CharacterRecord = Schema['角色档案'][string];
export type SkillDefinition = Schema['技能定义表'][string];
export type PassiveDefinition = Schema['被动定义表'][string];
export type InventoryItem = Schema['背包'][string];
export type BattleSideState = BattleState['参战方']['ally'];
export type BattleUnitState = BattleSideState['单位列表'][number];
export type RuntimeSkillState = BattleUnitState['技能栏'][number];
export type RuntimeStatusState = BattleUnitState['状态列表'][number];
export type RuntimeModifierState = BattleUnitState['修正器列表'][number];
export type BattleLogEntry = BattleState['日志'][number];
export type BattleResultSummary = NonNullable<BattleState['结算结果']>;
export type PlayerInputState = BattleState['玩家输入态'];
export type PendingCommand = NonNullable<BattleState['待处理指令']>;

export type SideKey = 'ally' | 'enemy';
export type BattleActionType = PendingCommand['actionType'];

export type RollResult = {
  rollType: 'attack' | 'save' | 'damage' | 'escape' | 'initiative';
  actorId: string;
  targetId?: string;
  dice: string;
  rawRolls: number[];
  finalRoll: number;
  modifier: number;
  dc?: number;
  targetAC?: number;
  success: boolean;
  isCriticalSuccess: boolean;
  isCriticalFail: boolean;
};

export type EngineResolveResult = {
  state: BattleState;
  rolls: RollResult[];
  logs: BattleLogEntry[];
};

export type UnitLocator = {
  side: SideKey;
  index: number;
  unit: BattleUnitState;
};
