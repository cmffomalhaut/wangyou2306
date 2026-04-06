// ====================================================================
// 战斗系统脚本入口 - 宝可梦风格3v3重构
// ====================================================================

import { createScriptIdIframe, teleportStyle } from '@util/script';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { useBattleStore } from './store';
import type {
  BattleConsole,
  BattleItem,
  BattleResult,
  BattleUnit,
  Element,
  PassiveSkillData,
  SkillData,
  SkillTargetType,
} from './types';

function normalizeSkillTargetType(raw: unknown): SkillTargetType | undefined {
  if (typeof raw !== 'string') return undefined;
  const normalized = raw.trim().toLowerCase();

  const mapping: Record<string, SkillTargetType> = {
    single_enemy: 'single_enemy',
    enemy: 'single_enemy',
    敌方单体: 'single_enemy',
    单体敌方: 'single_enemy',
    self: 'self',
    自身: 'self',
    自己: 'self',
    ally: 'ally',
    友方单体: 'ally',
    单体友方: 'ally',
    all_enemies: 'all_enemies',
    敌方全体: 'all_enemies',
    all_allies: 'all_allies',
    友方全体: 'all_allies',
  };

  return mapping[normalized];
}

/** 从 MVU 角色数据提取 BattleUnit */
function extractBattleUnit(name: string, charData: Record<string, any>): BattleUnit {
  const skills: SkillData[] = [];
  const passives: PassiveSkillData[] = [];
  const rawSkills = charData.技能 ?? {};

  for (const [skillName, s] of Object.entries(rawSkills) as [string, any][]) {
    if (!s) continue;

    if (s.类型 === '被动' || s.类型 === '天赋' || s.类型 === '光环') {
      passives.push({
        name: skillName,
        类型: s.类型,
        描述: s.描述 ?? '',
        效果公式: s.效果公式 ?? '',
        数值参数: s.数值参数 ?? {},
      });
      continue;
    }

    skills.push({
      name: skillName,
      类型: s.类型 ?? '主动',
      稀有度: s.稀有度 ?? 'N',
      元素属性: (s.元素属性 ?? '无') as Element,
      消耗MP: Number(s.消耗MP) || 0,
      冷却回合: Number(s.冷却回合) || 0,
      基础威力: Number(s.基础威力) || 0,
      描述: s.描述 ?? '',
      效果公式: s.效果公式 ?? '',
      目标类型: normalizeSkillTargetType(s.目标类型),
      数值参数: s.数值参数 ?? {},
    });
  }

  return {
    name,
    等级: Number(charData.等级) || 1,
    稀有度: charData.稀有度,
    战斗类型: charData.战斗类型,
    元素属性: (charData.元素属性 ?? '无') as Element,
    攻击力: Number(charData.攻击力) || 10,
    防御力: Number(charData.防御力) || 10,
    特攻: Number(charData.特攻) || 10,
    特防: Number(charData.特防) || 10,
    速度: Number(charData.速度) || 10,
    HP: Number(charData.生命值?.当前值) || 100,
    HPMax: Number(charData.生命值?.最大值) || 100,
    MP: Number(charData.法力值?.当前值) || 50,
    MPMax: Number(charData.法力值?.最大值) || 50,
    shield: Number(charData.护盾?.当前值) || 0,
    shieldMax: Number(charData.护盾?.最大值) || 0,
    skills,
    passives,
    cooldowns: {},
    statusEffects: [],
  };
}

/** 从背包变量中提取可用战斗道具 */
function extractBattleItems(statData: Record<string, any>): BattleItem[] {
  const items: BattleItem[] = [];
  const backpack = _.get(statData, '背包', {}) as Record<string, any>;

  for (const [itemName, itemData] of Object.entries(backpack)) {
    if (!itemData || Number(itemData.数量 ?? itemData.count ?? 0) <= 0) continue;
    const count = Number(itemData.数量 ?? itemData.count ?? 0);

    if (itemName.includes('精华')) {
      const elementMap: Record<string, Element> = {
        风之精华: '风',
        水之精华: '水',
        火之精华: '火',
        地之精华: '地',
        光之精华: '光',
        暗之精华: '暗',
      };
      const element = elementMap[itemName];
      if (element) items.push({ name: itemName, category: '属性增强药', element, count });
      continue;
    }

    if (itemName.includes('技能增强')) {
      items.push({ name: itemName, category: '技能增强药', count });
      continue;
    }

    if (itemName.includes('伤药')) {
      let healLevel: '初级' | '中级' | '高级' = '初级';
      if (itemName.includes('中级')) healLevel = '中级';
      else if (itemName.includes('高级')) healLevel = '高级';
      items.push({ name: itemName, category: '伤药', healLevel, count });
      continue;
    }
  }

  return items;
}

function buildTeamNames(consoleData: BattleConsole, side: 'ally' | 'enemy'): string[] {
  const main = side === 'ally' ? consoleData.己方出战 : consoleData.敌方出战;
  const list = (side === 'ally' ? consoleData.己方队伍 : consoleData.敌方队伍) ?? [];
  const merged = [main, ...list].filter(Boolean);
  return [...new Set(merged)].slice(0, 3);
}

/** 将战斗结果写回 MVU 变量（3v3） */
async function writeBattleResult(
  allyTeamNames: string[],
  enemyTeamNames: string[],
  result: BattleResult,
  messageId: number,
  usedItemName: string | null,
) {
  await waitGlobalInitialized('Mvu');
  const variables = Mvu.getMvuData({ type: 'message', message_id: messageId });
  const statData = _.get(variables, 'stat_data', {});

  allyTeamNames.forEach((name, idx) => {
    const allyData = _.get(statData, `角色数据.${name}`);
    if (!allyData) return;
    const state = result.allyTeamState[idx];
    if (!state) return;
    _.set(allyData, '生命值.当前值', state.HP);
    _.set(allyData, '法力值.当前值', state.MP);
    if (result.expGained > 0 && idx === 0) {
      const curExp = Number(_.get(allyData, '经验值.当前值', 0));
      _.set(allyData, '经验值.当前值', curExp + result.expGained);
    }
  });

  enemyTeamNames.forEach((name, idx) => {
    const enemyData = _.get(statData, `角色数据.${name}`);
    if (!enemyData) return;
    const state = result.enemyTeamState[idx];
    if (!state) return;
    _.set(enemyData, '生命值.当前值', state.HP);
    _.set(enemyData, '法力值.当前值', state.MP);
    if (state.HP <= 0) _.set(enemyData, '状态', '濒死');
  });

  if (result.goldGained > 0) {
    const curGold = Number(_.get(statData, '金币', 0));
    _.set(statData, '金币', curGold + result.goldGained);
  }

  if (usedItemName) {
    const itemPath = `背包.${usedItemName}.数量`;
    const currentCount = Number(_.get(statData, itemPath, 0));
    if (currentCount > 0) {
      _.set(statData, itemPath, Math.max(0, currentCount - 1));
      if (Number(_.get(statData, itemPath, 0)) <= 0) {
        _.unset(statData, `背包.${usedItemName}`);
      }
    }
  }

  _.set(statData, '战斗控制台.进行中', false);
  await Mvu.replaceMvuData(variables, { type: 'message', message_id: messageId });
  console.info('[战斗系统] 战斗结果已写回 MVU 变量');
}

// ====================================================================
// 主入口: 战斗 UI 管理
// ====================================================================

let vueApp: ReturnType<typeof createApp> | null = null;
let $iframe: JQuery<HTMLIFrameElement> | null = null;
let destroyTeleportedStyle: (() => void) | null = null;
let battleMessageId = -1;
let battleAllyTeamNames: string[] = [];
let battleEnemyTeamNames: string[] = [];

function startBattle(messageId: number) {
  const variables = Mvu.getMvuData({ type: 'message', message_id: messageId });
  const statData = _.get(variables, 'stat_data', {});
  const consoleData: BattleConsole = _.get(statData, '战斗控制台', {}) as BattleConsole;

  if (!consoleData.进行中) return;

  const allyNames = buildTeamNames(consoleData, 'ally');
  const enemyNames = buildTeamNames(consoleData, 'enemy');

  const allyUnits = allyNames
    .map(name => ({ name, data: _.get(statData, `角色数据.${name}`) }))
    .filter(x => !!x.data)
    .map(x => extractBattleUnit(x.name, x.data));

  const enemyUnits = enemyNames
    .map(name => ({ name, data: _.get(statData, `角色数据.${name}`) }))
    .filter(x => !!x.data)
    .map(x => extractBattleUnit(x.name, x.data));

  if (allyUnits.length === 0 || enemyUnits.length === 0) {
    console.error('[战斗系统] 找不到有效队伍数据:', allyNames, enemyNames);
    return;
  }

  battleMessageId = messageId;
  battleAllyTeamNames = allyUnits.map(x => x.name);
  battleEnemyTeamNames = enemyUnits.map(x => x.name);

  const items = extractBattleItems(statData);
  console.info(`[战斗系统] 开始战斗: [${battleAllyTeamNames.join(', ')}] vs [${battleEnemyTeamNames.join(', ')}]`);

  createBattleIframe(allyUnits, enemyUnits, consoleData.战斗类型, items, consoleData.敌方训练家信息);
}

function createBattleIframe(
  allyUnits: BattleUnit[],
  enemyUnits: BattleUnit[],
  type: BattleConsole['战斗类型'],
  items: BattleItem[],
  enemyTrainerInfo?: BattleConsole['敌方训练家信息'],
) {
  if ($iframe) destroyBattle();

  $iframe = createScriptIdIframe()
    .css({
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      border: 'none',
      borderRadius: '0',
      zIndex: '99999',
      background: 'transparent',
    })
    .appendTo('body')
    .on('load', () => {
      const iframeDoc = $iframe![0].contentDocument!;
      const { destroy } = teleportStyle(iframeDoc.head);
      destroyTeleportedStyle = destroy;

      const pinia = createPinia();
      vueApp = createApp(App).use(pinia);

      const store = useBattleStore(pinia);
      store.initBattle(allyUnits, enemyUnits, type, items, enemyTrainerInfo);

      store.registerOnBattleEnd(async (result: BattleResult) => {
        await writeBattleResult(battleAllyTeamNames, battleEnemyTeamNames, result, battleMessageId, store.usedItemName);
        destroyBattle();
      });

      vueApp.mount(iframeDoc.body);
    });
}

function destroyBattle() {
  if (vueApp) {
    vueApp.unmount();
    vueApp = null;
  }
  if (destroyTeleportedStyle) {
    destroyTeleportedStyle();
    destroyTeleportedStyle = null;
  }
  if ($iframe) {
    $iframe.remove();
    $iframe = null;
  }
}

function closeBattleUI() {
  if ($iframe) $iframe.css('display', 'none');
}

function showBattleUI() {
  if ($iframe) $iframe.css('display', '');
}

function findLatestBattleMessageId(scanDepth = 12): number {
  const latest = getLastMessageId();
  if (latest < 0) return -1;

  const minId = Math.max(0, latest - scanDepth + 1);
  for (let id = latest; id >= minId; id--) {
    const vars = Mvu.getMvuData({ type: 'message', message_id: id });
    const bc = _.get(vars, 'stat_data.战斗控制台');
    if (bc?.进行中) return id;
  }
  return -1;
}

$(() => {
  errorCatched(async () => {
    await waitGlobalInitialized('Mvu');
    console.info('[战斗系统] 脚本已加载');

    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (variables: any) => {
      const bc = _.get(variables, 'stat_data.战斗控制台');
      if (!bc) return;
      if (bc.进行中 && !$iframe) {
        const messageId = findLatestBattleMessageId();
        if (messageId >= 0 && !$iframe) startBattle(messageId);
      }
    });

    const latestBattleMessageId = findLatestBattleMessageId();
    if (latestBattleMessageId >= 0 && !$iframe) {
      console.info('[战斗系统] 检测到战斗进行中，主动启动');
      startBattle(latestBattleMessageId);
    }

    eventOn(getButtonEvent('开始战斗'), () => {
      if ($iframe) {
        showBattleUI();
      } else {
        const messageId = findLatestBattleMessageId();
        if (messageId >= 0) startBattle(messageId);
      }
    });

    const onBattleCloseMessage = (e: MessageEvent) => {
      if (e.source !== $iframe?.[0]?.contentWindow) return;
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'battle-close' && e.data?.source === 'th-battle-ui') {
        closeBattleUI();
      }
    };

    window.addEventListener('message', onBattleCloseMessage);

    $(window).on('pagehide', () => {
      window.removeEventListener('message', onBattleCloseMessage);
      destroyBattle();
    });
  })();
});
