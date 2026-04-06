import type { BattleResultSummary, BattleState, BattleUnitState, SideKey, StatData } from './types';

type EnemyDropConfig = {
  itemId: string;
  chance: number;
  minCount: number;
  maxCount: number;
};

function clone<T>(value: T): T {
  return _.cloneDeep(value);
}

function clamp(value: number, min: number, max: number): number {
  return _.clamp(value, min, max);
}

function getEnemyUnits(state: BattleState): BattleUnitState[] {
  return state.参战方.enemy.单位列表;
}

function getAllyUnits(state: BattleState): BattleUnitState[] {
  return state.参战方.ally.单位列表;
}

function getLevelExpRequirement(level: number): number {
  return 100 + Math.max(0, level - 1) * 60;
}

function buildExpGain(data: StatData, state: BattleState, winner: SideKey | 'draw' | 'escape'): number {
  if (winner !== 'ally') return 0;
  return getEnemyUnits(state).reduce((sum, unit) => {
    const record = data.角色档案[unit.sourceCharacterId];
    return sum + (record?.等级 ?? 1) * 18;
  }, 0);
}

function buildGoldGain(data: StatData, state: BattleState, winner: SideKey | 'draw' | 'escape'): number {
  if (winner !== 'ally') return 0;

  const base = data.规则配置.资源规则.战斗金币基础值 ?? 12;
  const ratio = data.规则配置.资源规则.战斗金币等级系数 ?? 4;
  return getEnemyUnits(state).reduce((sum, unit) => {
    const level = data.角色档案[unit.sourceCharacterId]?.等级 ?? 1;
    return sum + base + level * ratio;
  }, 0);
}

function buildDrops(
  data: StatData,
  state: BattleState,
  winner: SideKey | 'draw' | 'escape',
): BattleResultSummary['itemDrops'] {
  if (winner !== 'ally') return [];

  const configuredDrops = (
    data.规则配置 as StatData['规则配置'] & {
      敌方掉落表?: Record<string, EnemyDropConfig[]>;
    }
  ).敌方掉落表;
  const dropRate = data.规则配置.资源规则.战斗掉落基础概率 ?? 0.35;
  const candidateItems = Object.values(data.背包).filter(item => item.战斗可用);
  if (!candidateItems.length && !configuredDrops) return [];

  const drops = new Map<string, number>();
  getEnemyUnits(state).forEach(enemy => {
    const record = data.角色档案[enemy.sourceCharacterId];
    const dropTable = configuredDrops?.[enemy.sourceCharacterId];

    if (dropTable?.length) {
      dropTable.forEach(entry => {
        const chance = clamp(entry.chance, 0, 1);
        if (Math.random() > chance) return;
        const minCount = Math.max(1, entry.minCount);
        const maxCount = Math.max(minCount, entry.maxCount);
        const count = _.random(minCount, maxCount);
        drops.set(entry.itemId, (drops.get(entry.itemId) ?? 0) + count);
      });
      return;
    }

    if (!candidateItems.length) return;
    const chance = clamp(dropRate + (record?.等级 ?? 1) * 0.04, 0, 0.9);
    if (Math.random() > chance) return;

    const preferred = candidateItems.find(item => item.类型 === 'healing' || item.类型 === 'mana') ?? candidateItems[0];
    const count = preferred.类型 === 'healing' ? 1 : _.random(1, 2);
    drops.set(preferred.id, (drops.get(preferred.id) ?? 0) + count);
  });

  return [...drops.entries()].map(([itemId, count]) => ({ itemId, count }));
}

function buildOutcomeSummary(state: BattleState, winner: SideKey | 'draw' | 'escape'): string {
  const roundText = `共经历 ${state.回合数} 回合`;
  if (winner === 'ally') return `我方胜利，${roundText}。`;
  if (winner === 'enemy') return `敌方胜利，${roundText}。`;
  if (winner === 'escape') return `我方成功撤离战斗，${roundText}。`;
  return `战斗以平局结束，${roundText}。`;
}

function buildRewardTexts(
  data: StatData,
  summary: Pick<BattleResultSummary, 'expGain' | 'goldGain' | 'itemDrops'>,
): string[] {
  const rewards: string[] = [];
  if (summary.expGain > 0) {
    rewards.push(`经验 +${summary.expGain}`);
  }
  if (summary.goldGain > 0) {
    rewards.push(`金币 +${summary.goldGain}`);
  }
  summary.itemDrops.forEach(drop => {
    const itemName = data.背包[drop.itemId]?.名称 ?? drop.itemId;
    rewards.push(`掉落 ${itemName} x${drop.count}`);
  });
  if (!rewards.length) {
    rewards.push('无额外奖励');
  }
  return rewards;
}

function buildCharacterChanges(
  data: StatData,
  state: BattleState,
  winner: SideKey | 'draw' | 'escape',
  expGain: number,
): BattleResultSummary['characterChanges'] {
  const allyUnits = getAllyUnits(state);
  const enemyUnits = getEnemyUnits(state);

  return [...allyUnits, ...enemyUnits].map(unit => {
    const record = data.角色档案[unit.sourceCharacterId];
    const gainedExp = winner === 'ally' && unit.阵营 === 'ally' ? expGain : undefined;
    let newLevel: number | undefined;

    if (record && gainedExp) {
      let projectedLevel = record.等级;
      let projectedExp = record.经验值.当前值 + gainedExp;
      let threshold = record.经验值.升级所需值 || getLevelExpRequirement(projectedLevel);
      let projectedGainLevels = 0;

      while (projectedExp >= threshold && projectedLevel < data.规则配置.数值规则.等级上限) {
        projectedExp -= threshold;
        projectedLevel += 1;
        projectedGainLevels += 1;
        threshold = getLevelExpRequirement(projectedLevel);
      }

      if (projectedLevel !== record.等级) {
        newLevel = projectedLevel;
        const perLevelAttributePoint = data.规则配置.数值规则.每级属性点 ?? 1;
        return {
          characterId: unit.sourceCharacterId,
          hpAfter: unit.当前资源.HP,
          mpAfter: unit.当前资源.MP,
          gainedExp,
          newLevel,
          gainedAttributePoints: projectedGainLevels * perLevelAttributePoint,
          defeated: !unit.是否存活,
        };
      }
    }

    return {
      characterId: unit.sourceCharacterId,
      hpAfter: unit.当前资源.HP,
      mpAfter: unit.当前资源.MP,
      gainedExp,
      newLevel,
      defeated: !unit.是否存活,
    };
  });
}

export function buildSummary(
  data: StatData,
  state: BattleState,
  winner: SideKey | 'draw' | 'escape',
): BattleResultSummary {
  const expGain = buildExpGain(data, state, winner);
  const goldGain = buildGoldGain(data, state, winner);
  const itemDrops = buildDrops(data, state, winner);
  const characterChanges = buildCharacterChanges(data, state, winner, expGain);
  const summary = buildOutcomeSummary(state, winner);
  const rewardTexts = buildRewardTexts(data, { expGain, goldGain, itemDrops });

  return {
    winner,
    rounds: state.回合数,
    expGain,
    goldGain,
    summary,
    rewardTexts,
    itemDrops,
    characterChanges,
  };
}

function appendBattleArchive(next: StatData, state: BattleState, summary: BattleResultSummary): void {
  next.战斗归档.push({
    battleId: state.battleId,
    winner: summary.winner,
    rounds: summary.rounds,
    summary: summary.summary,
    rewards: summary.rewardTexts,
    timestamp: next.世界.时间,
  });
}

function applyItemDrops(next: StatData, summary: BattleResultSummary): void {
  summary.itemDrops.forEach(drop => {
    const current = next.背包[drop.itemId];
    if (current) {
      current.数量 += drop.count;
      return;
    }

    next.背包[drop.itemId] = {
      id: drop.itemId,
      名称: drop.itemId,
      类型: 'buff',
      描述: '战斗掉落生成的临时占位物品。',
      目标类型: 'self',
      数量: drop.count,
      战斗可用: false,
    };
  });
}

function applyLevelProgress(
  record: StatData['角色档案'][string],
  gainedExp: number,
  levelCap: number,
  perLevelAttributePoint: number,
): number | undefined {
  let nextLevel = record.等级;
  let currentExp = record.经验值.当前值 + gainedExp;
  let required = record.经验值.升级所需值 || getLevelExpRequirement(nextLevel);
  let gainedLevels = 0;

  while (currentExp >= required && nextLevel < levelCap) {
    currentExp -= required;
    nextLevel += 1;
    gainedLevels += 1;
    required = getLevelExpRequirement(nextLevel);
  }

  record.经验值.当前值 = currentExp;
  record.经验值.升级所需值 = required;

  if (nextLevel !== record.等级) {
    record.等级 = nextLevel;
    record.成长.未分配属性点 += gainedLevels * perLevelAttributePoint;
    return nextLevel;
  }

  return undefined;
}

export function applyBattleSummaryToRecords(data: StatData): StatData {
  if (!data.战斗状态?.结算结果) return data;

  const next = clone(data);
  const state = next.战斗状态;
  if (!state?.结算结果) return next;

  const summary = state.结算结果;
  next.金币 += summary.goldGain;

  summary.characterChanges.forEach(change => {
    const record = next.角色档案[change.characterId];
    if (!record) return;

    record.资源.生命值.当前值 = clamp(change.hpAfter, 0, record.资源.生命值.最大值);
    record.资源.法力值.当前值 = clamp(change.mpAfter, 0, record.资源.法力值.最大值);

    if (record.阵营 !== 'enemy' && change.gainedExp) {
      const perLevelAttributePoint = next.规则配置.数值规则.每级属性点 ?? 1;
      const oldPoints = record.成长.未分配属性点;
      const newLevel = applyLevelProgress(
        record,
        change.gainedExp,
        next.规则配置.数值规则.等级上限,
        perLevelAttributePoint,
      );
      if (newLevel) {
        change.newLevel = newLevel;
        change.gainedAttributePoints = record.成长.未分配属性点 - oldPoints;
      }
    }
  });

  applyItemDrops(next, summary);
  appendBattleArchive(next, state, summary);
  next.战斗状态 = null;
  return next;
}
