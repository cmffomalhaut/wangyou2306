import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

// ====================================================================
// 1. 工具函数
// ====================================================================

function parseSafeNumber(val, defaultVal = 0) {
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^\d.-]/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? defaultVal : num;
  }
  return defaultVal;
}

function getDaysPassed(currentDateStr) {
  const match = currentDateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!match) return 0;
  const current = new Date(match[1], match[2] - 1, match[3]);
  const start = new Date(2022, 4, 8); // 2022-05-08
  const diffTime = Math.abs(current - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ====================================================================
// 2. 计算核心 (规则配置)
// ====================================================================

const getRules = () => ({
  QUALITY: { E: [225, 10], D: [260, 12], C: [305, 14], B: [350, 16], A: [400, 18], S: [450, 20] },
  TALENT: { 平庸: 0.9, 普通: 1.0, 优秀: 1.1, 天才: 1.2 },
  COMBAT_TYPE: {
    均衡型: [0.2, 0.2, 0.2, 0.2, 0.2],
    强攻型: [0.3, 0.2, 0.1, 0.1, 0.3],
    重盾型: [0.1, 0.4, 0.1, 0.3, 0.1],
    魔导型: [0.1, 0.1, 0.4, 0.3, 0.1],
    敏捷型: [0.2, 0.1, 0.2, 0.1, 0.4],
  },
  NATURE: {
    固执: [0, 2],
    孤僻: [0, 1],
    勇敢: [0, 4],
    调皮: [0, 3],
    内敛: [2, 0],
    稳重: [2, 1],
    冷静: [2, 4],
    马虎: [2, 3],
    胆小: [4, 0],
    急躁: [4, 1],
    开朗: [4, 2],
    天真: [4, 3],
    大胆: [1, 0],
    悠闲: [1, 4],
    淘气: [1, 2],
    温和: [3, 0],
    自大: [3, 4],
    慎重: [3, 2],
    坦率: [null, null],
    认真: [null, null],
    害羞: [null, null],
  },
  FORM_BONUS: {
    无: { atk: 0, def: 0, spA: 0, spD: 0, spd: 0 },
    天使化: { atk: 0, def: 0, spA: 0.25, spD: 0.25, spd: 0.25 },
    恶魔化: { atk: 0, def: 0, spA: 0.25, spD: 0.25, spd: 0.25 },
    精灵化: { atk: 0, def: 0, spA: 0.2, spD: 0.2, spd: 0.2 },
    兽人化: { atk: 0.2, def: 0.2, spA: 0, spD: 0, spd: 0.2 },
  },
  FORM_ELEMENT_RESTRICTION: {
    天使化: ['光'],
    恶魔化: ['暗'],
    精灵化: ['地', '火', '水', '风', '光', '暗'],
    兽人化: ['地', '火', '水', '风', '光', '暗'],
  },
  COLLECTION_CAPACITY: { 1: 5, 2: 10, 3: 30, 4: 50, 5: 100 },
  COLLECTION_AFFECTION_BONUS: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 },
  WORK_AREA_NAMES: { 1: '咖啡厅', 2: '餐厅', 3: '高级餐厅', 4: '豪华会所', 5: '顶级俱乐部' },
  WORK_AREA_CAPACITY: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 8 },
  WORK_AREA_INCOME: { 1: 50, 2: 100, 3: 200, 4: 350, 5: 500 },
});

function calculateLevelFromExp(currentExp) {
  const safeExp = parseSafeNumber(currentExp, 0);
  const exp = Math.max(0, safeExp);
  let level = Math.floor((1 + Math.sqrt(1 + 0.08 * exp)) / 2);
  level = _.clamp(level, 1, 100);
  const nextLevelExp = 50 * level * (level + 1);
  return { level: level, maxExp: nextLevelExp };
}

function calculateMinExpForLevel(targetLevel) {
  const lv = _.clamp(targetLevel, 1, 100);
  if (lv === 1) return 0;
  const term = 2 * lv - 1;
  return Math.floor(12.5 * (term * term - 1));
}

function calculateStats(charData, realLevel) {
  const RULES = getRules();
  const quality = RULES.QUALITY[charData.品质] ? charData.品质 : 'E';
  const talent = RULES.TALENT[charData.资质] ? charData.资质 : '普通';
  const type = RULES.COMBAT_TYPE[charData.战斗类型] ? charData.战斗类型 : '均衡型';
  const nature = RULES.NATURE[charData.性格] ? charData.性格 : '认真';
  const form = RULES.FORM_BONUS[charData.变化形态] ? charData.变化形态 : '无';
  const level = parseSafeNumber(realLevel, 1);

  const [baseBST, baseGPT] = RULES.QUALITY[quality];
  const talentMod = RULES.TALENT[talent];
  const distribution = RULES.COMBAT_TYPE[type];

  const totalPoints = Math.floor((baseBST + baseGPT * (level - 1)) * talentMod) || 200;
  let rawStats = distribution.map(pct => Math.floor(totalPoints * pct));

  const natureMod = RULES.NATURE[nature];
  const [upIdx, downIdx] = natureMod;
  if (upIdx !== null && rawStats[upIdx]) rawStats[upIdx] = Math.floor(rawStats[upIdx] * 1.1);
  if (downIdx !== null && rawStats[downIdx]) rawStats[downIdx] = Math.floor(rawStats[downIdx] * 0.9);

  let [bATK, bDEF, bSpA, bSpD, bSPD] = rawStats;
  const formBonus = RULES.FORM_BONUS[form];
  bATK = Math.floor(bATK * (1 + formBonus.atk));
  bDEF = Math.floor(bDEF * (1 + formBonus.def));
  bSpA = Math.floor(bSpA * (1 + formBonus.spA));
  bSpD = Math.floor(bSpD * (1 + formBonus.spD));
  bSPD = Math.floor(bSPD * (1 + formBonus.spd));

  return {
    攻击力: Math.floor(bATK / 2) + 10 || 10,
    防御力: Math.floor(bDEF / 2) + 10 || 10,
    特攻: Math.floor(bSpA / 2) + 10 || 10,
    特防: Math.floor(bSpD / 2) + 10 || 10,
    速度: Math.floor(bSPD / 2) + 10 || 10,
    HP最大值: (bDEF + bSpD) * 2 + 60 || 100,
    MP最大值: Math.floor((bSpA + bSpD) * 1.5 + 40) || 50,
  };
}

function calculateCombatModifier(affection, corruption) {
  const safeAffection = _.clamp(parseSafeNumber(affection, 0), -100, 200);
  const safeCorruption = _.clamp(parseSafeNumber(corruption, 0), 0, 100);

  let affectionMod = 1.0;
  if (safeAffection < 0) affectionMod = 0.7;
  else if (safeAffection < 50) affectionMod = 0.85;
  else if (safeAffection < 100) affectionMod = 1.0;
  else if (safeAffection < 150) affectionMod = 1.1;
  else affectionMod = 1.2;

  let corruptionAtkBonus = 1.0;
  let corruptionDefPenalty = 1.0;
  let corruptionSpdBonus = 1.0;

  if (safeCorruption >= 60) {
    corruptionAtkBonus = 1.15;
    corruptionDefPenalty = 0.85;
    corruptionSpdBonus = 1.1;
  } else if (safeCorruption >= 30) {
    corruptionAtkBonus = 1.05;
    corruptionDefPenalty = 0.95;
  }

  return {
    好感度修正: affectionMod,
    堕落值攻击加成: corruptionAtkBonus,
    堕落值防御惩罚: corruptionDefPenalty,
    堕落值速度加成: corruptionSpdBonus,
  };
}

// ====================================================================
// 3. Schema 定义
// ====================================================================

const safeEnum = (values, defaultValue) => z.enum(values).catch(defaultValue).prefault(defaultValue);

const SkillSchema = z.object({
  类型: safeEnum(['主动', '被动', '光环', '天赋'], '主动'),
  稀有度: safeEnum(['普通', '稀有', '史诗', '传说', '神话'], '普通'),
  元素属性: safeEnum(['地', '火', '水', '风', '光', '暗', '无'], '无'),
  消耗MP: z.coerce.number().prefault(0),
  冷却回合: z.coerce.number().prefault(0),
  基础威力: z.coerce.number().prefault(0),
  描述: z.string().prefault(''),
  效果公式: z.string().prefault(''),
  数值参数: z.record(z.string(), z.coerce.number()).prefault({}),
});

const TrainerSkillSchema = z.object({
  类型: safeEnum(['主动', '被动'], '被动'),
  稀有度: safeEnum(['普通', '稀有', '史诗', '传说', '神话'], '稀有'),
  获取途径: z.string().prefault(''),
  解锁条件: z.string().prefault(''),
  已解锁: z.boolean().prefault(false),
  冷却回合: z.coerce.number().prefault(0),
  使用次数: z.coerce.number().prefault(-1),
  描述: z.string().prefault(''),
  效果: z.string().prefault(''),
  效果公式: z.string().prefault(''),
  数值参数: z.record(z.string(), z.coerce.number()).prefault({}),
});

const TrainerEquipmentSchema = z.object({
  名称: z.string().prefault(''),
  稀有度: safeEnum(['普通', '稀有', '史诗', '传说', '神话'], '普通'),
  获取途径: z.string().prefault(''),
  描述: z.string().prefault(''),
  效果: z.string().prefault(''),
  效果公式: z.string().prefault(''),
  数值参数: z.record(z.string(), z.coerce.number()).prefault({}),
});

const CollectionRoomSchema = z
  .object({
    已解锁: z.boolean().prefault(false),
    解锁条件: z.string().prefault('据点解锁后自动解锁'),
    等级: z.coerce
      .number()
      .transform(v => _.clamp(v, 0, 5))
      .prefault(0),
    容量上限: z.coerce.number().prefault(5),
    当前效果: z.string().prefault(''),
    每日好感加成: z.coerce.number().prefault(0),
    升级费用: z.coerce.number().prefault(0),
    当前使用: z.array(z.string()).prefault([]),
  })
  .prefault({});

const WorkAreaSchema = z
  .object({
    已解锁: z.boolean().prefault(false),
    解锁条件: z.string().prefault(''),
    解锁方式: safeEnum(['等级', '任务', '金币', '特殊'], '等级'),
    解锁需求值: z.coerce.number().prefault(0),
    等级: z.coerce
      .number()
      .transform(v => _.clamp(v, 0, 5))
      .prefault(0),
    名称: z.string().prefault(''),
    当前效果: z.string().prefault(''),
    效果数值: z.coerce.number().prefault(0),
    升级费用: z.coerce.number().prefault(0),
    当前使用: z.array(z.string()).prefault([]),
    容量上限: z.coerce.number().prefault(3),
  })
  .prefault({});

const BaseSystemSchema = z
  .object({
    已解锁: z.boolean().prefault(false),
    解锁条件: z.string().prefault('训练家等级达到Lv.5'),
    收藏室: CollectionRoomSchema,
    工作区: WorkAreaSchema,
  })
  .prefault({});

const TrainerSchema = z
  .object({
    身份: z.string().prefault(''),
    等级: z.coerce.number().prefault(1),
    经验值: z
      .object({
        当前值: z.coerce.number().prefault(0),
        升级所需值: z.coerce.number().prefault(100),
      })
      .prefault({}),
    技能: z.record(z.string(), TrainerSkillSchema).prefault({}),
    特殊装备: z
      .array(TrainerEquipmentSchema)
      .transform(items => items.slice(-3))
      .prefault([]),
    据点: BaseSystemSchema,
  })
  .prefault({});

const TaskSchema = z.object({
  名称: z.string().prefault(''),
  要求: z.string().prefault(''),
  奖励: z.string().prefault(''),
  类型: safeEnum(['日常任务', '周常任务', '剧情任务', '限时任务'], '日常任务'),
  期限: z.string().prefault(''),
  已完成: z.boolean().prefault(false),
  已过期: z.boolean().prefault(false),
  进度: z.string().prefault(''),
  标签: z.array(z.string()).prefault([]),
});

const ProfileSchema = z
  .object({
    原身份: z.string().prefault(''),
    捕获经过: z.string().prefault(''),
    过往经历: z.string().prefault(''),
    与训练家关系: z.string().prefault(''),
    喜好体位: z.string().prefault(''),
    性癖: z.string().prefault(''),
    性格特征: z.string().prefault(''),
  })
  .prefault({});

const SexualPartSchema = z
  .object({
    开发度: z.coerce
      .number()
      .transform(v => _.clamp(v, 0, 100))
      .prefault(0),
    当前状态描述: z.string().prefault(''),
  })
  .prefault({});

const SexualStateSchema = z
  .object({
    胸部: SexualPartSchema,
    阴部: SexualPartSchema,
    阴蒂: SexualPartSchema,
    后庭: SexualPartSchema,
    子宫: SexualPartSchema,
    口腔: SexualPartSchema,
    整体淫乱度: z.coerce
      .number()
      .transform(v => _.clamp(v, 0, 100))
      .prefault(0),
    性经验次数: z.coerce.number().prefault(0),
    高潮体质: safeEnum(['难以高潮', '普通', '容易高潮', '连续高潮体质', '潮吹体质'], '普通'),
    当前性欲: z.coerce
      .number()
      .transform(v => _.clamp(v, 0, 100))
      .prefault(0),
  })
  .prefault({});

const SingleCharacterSchema = z.object({
  状态: safeEnum(['正常', '濒死', '死亡', '异常'], '正常'),
  从属训练家: z.string().prefault(''),
  归属状态: safeEnum(['出战', '已储存', '离场'], '出战'),
  个人资料: ProfileSchema,
  等级: z.coerce.number().prefault(1),
  品质: safeEnum(['E', 'D', 'C', 'B', 'A', 'S'], 'E'),
  资质: safeEnum(['天才', '优秀', '普通', '平庸'], '普通'),
  性格: safeEnum(
    [
      '固执',
      '孤僻',
      '勇敢',
      '调皮',
      '内敛',
      '稳重',
      '冷静',
      '马虎',
      '胆小',
      '急躁',
      '开朗',
      '天真',
      '大胆',
      '悠闲',
      '淘气',
      '温和',
      '自大',
      '慎重',
      '坦率',
      '认真',
      '害羞',
    ],
    '认真',
  ),
  战斗类型: safeEnum(['均衡型', '强攻型', '重盾型', '魔导型', '敏捷型'], '均衡型'),
  元素属性: safeEnum(['地', '火', '水', '风', '光', '暗'], '地'),
  好感度: z.coerce
    .number()
    .transform(v => _.clamp(v, -100, 200))
    .prefault(0),
  堕落值: z.coerce
    .number()
    .transform(v => _.clamp(v, 0, 100))
    .prefault(0),
  当前想法: z.string().prefault(''),
  已触发事件: z.record(z.string(), z.boolean()).prefault({}),
  生命值: z
    .object({
      当前值: z.coerce.number().prefault(0),
      最大值: z.coerce.number().prefault(0),
    })
    .prefault({}),
  法力值: z
    .object({
      当前值: z.coerce.number().prefault(0),
      最大值: z.coerce.number().prefault(0),
    })
    .prefault({}),
  经验值: z
    .object({
      当前值: z.coerce.number().prefault(0),
      升级所需值: z.coerce.number().prefault(100),
    })
    .prefault({}),
  攻击力: z.coerce.number().prefault(0),
  防御力: z.coerce.number().prefault(0),
  特攻: z.coerce.number().prefault(0),
  特防: z.coerce.number().prefault(0),
  速度: z.coerce.number().prefault(0),
  变化形态: safeEnum(['无', '天使化', '恶魔化', '精灵化', '兽人化'], '无'),
  技能: z.record(z.string(), SkillSchema).prefault({}),
  着装: z
    .object({
      上装: z.string().prefault(''),
      下装: z.string().prefault(''),
      内衣: z.string().prefault(''),
      鞋袜: z.string().prefault(''),
      饰品: z.string().prefault(''),
    })
    .prefault({}),
  战斗衣着: z.string().prefault(''),
  性器状态: SexualStateSchema,
});

const AUTO_EVENTS = [
  { id: '特殊事件_喜欢', condition: char => char.好感度 >= 100 && !char.已触发事件['特殊事件_喜欢'] },
  { id: '特殊事件_初次亲吻', condition: char => char.好感度 >= 105 && !char.已触发事件['特殊事件_初次亲吻'] },
  {
    id: '特殊事件_深情告白',
    condition: char => char.好感度 >= 110 && char.已触发事件['特殊事件_喜欢'] && !char.已触发事件['特殊事件_深情告白'],
  },
  { id: '特殊事件_形态觉醒', condition: char => char.好感度 >= 149 && !char.已触发事件['特殊事件_形态觉醒'] },
  { id: '特殊事件_羁绊技能', condition: char => char.好感度 >= 199 && !char.已触发事件['特殊事件_羁绊技能'] },
];

// ====================================================================
// 4. 主 Schema
// ====================================================================

export const Schema = z
  .object({
    current_target: z.string().prefault(''),
    current_event: z.string().prefault(''),
    玩家名: z.string().prefault('lin'),
    世界: z
      .object({
        时间: z.string().prefault('08:00'),
        日期: z.string().prefault('2022年5月8日'),
        星期: safeEnum(['周一', '周二', '周三', '周四', '周五', '周六', '周日'], '周日'),
        地点: z.string().prefault('初始城镇'),
        天气: z.string().prefault('晴'),
        近期事务: z.string().prefault('无'),
        _上次结算日期: z.string().prefault('2022年5月8日'),
      })
      .prefault({}),
    金币: z.coerce.number().prefault(0),
    训练家: TrainerSchema,
    收藏室: z.array(z.string()).prefault([]),
    背包: z
      .record(
        z.string(),
        z.object({
          描述: z.string().prefault(''),
          数量: z.coerce.number().prefault(1),
        }),
      )
      .transform(items => _.pickBy(items, i => i.数量 > 0))
      .prefault({}),
    任务列表: z
      .record(z.string(), TaskSchema)
      .transform(tasks => {
        return _.pickBy(tasks, (task, taskId) => {
          if (task.已完成 || task.已过期) return false;
          if (!task.名称 || task.名称.trim() === '') return false;
          if (!taskId || taskId.trim() === '') return false;
          return true;
        });
      })
      .prefault({}),
    角色数据: z.record(z.string(), SingleCharacterSchema).prefault({}),
  })
  .transform(data => {
    const RULES = getRules();

    // ====== 训练家计算 ======
    if (data.训练家) {
      const trainer = data.训练家;
      const safeTrainerExp = trainer.经验值 ? parseSafeNumber(trainer.经验值.当前值, 0) : 0;
      const trainerLevelInfo = calculateLevelFromExp(safeTrainerExp);
      trainer.等级 = trainerLevelInfo.level;
      trainer.经验值.升级所需值 = trainerLevelInfo.maxExp;

      if (trainer.等级 >= 5 && !trainer.据点.已解锁) {
        trainer.据点.已解锁 = true;
        trainer.据点.收藏室.已解锁 = true;
      }

      if (trainer.据点.已解锁 && trainer.据点.收藏室.已解锁) {
        const collectionRoom = trainer.据点.收藏室;
        if (collectionRoom.等级 > 0) {
          const capacity = RULES.COLLECTION_CAPACITY[collectionRoom.等级] || 5;
          const affectionBonus = RULES.COLLECTION_AFFECTION_BONUS[collectionRoom.等级] || 0;
          collectionRoom.容量上限 = capacity;
          collectionRoom.每日好感加成 = affectionBonus;
          collectionRoom.当前效果 = `容量: ${capacity}人，每日恢复30%HP/MP，每日好感度+${affectionBonus}`;
          collectionRoom.升级费用 = [0, 1000, 3000, 8000, 20000, 0][collectionRoom.等级] || 0;
        }
      }

      if (trainer.据点.已解锁 && trainer.据点.工作区.已解锁) {
        const workArea = trainer.据点.工作区;
        if (workArea.等级 > 0) {
          const areaName = RULES.WORK_AREA_NAMES[workArea.等级] || '咖啡厅';
          const capacity = RULES.WORK_AREA_CAPACITY[workArea.等级] || 3;
          const income = RULES.WORK_AREA_INCOME[workArea.等级] || 50;
          workArea.名称 = areaName;
          workArea.容量上限 = capacity;
          workArea.效果数值 = income;
          workArea.当前效果 = `${areaName}，容量: ${capacity}人，金币产出${income}/天/人`;
          workArea.升级费用 = [0, 1000, 3000, 8000, 20000, 0][workArea.等级] || 0;
        }
      }
    }

    // ====== 日常结算检测 ======
    const currentDate = data.世界.日期;
    const lastSettlementDate = data.世界._上次结算日期 || currentDate;

    if (currentDate !== lastSettlementDate) {
      console.log(`[日常结算] 检测到日期变化: ${lastSettlementDate} → ${currentDate}`);
      if (data.训练家.据点.已解锁 && data.训练家.据点.收藏室.已解锁) {
        const collectionRoom = data.训练家.据点.收藏室;
        if (collectionRoom.等级 > 0 && collectionRoom.当前使用.length > 0) {
          const affectionBonus = RULES.COLLECTION_AFFECTION_BONUS[collectionRoom.等级] || 0;
          for (const senkiName of collectionRoom.当前使用) {
            if (data.角色数据[senkiName]) {
              const char = data.角色数据[senkiName];
              char.好感度 = _.clamp(char.好感度 + affectionBonus, -100, 200);
              const hpRecover = Math.floor(char.生命值.最大值 * 0.3);
              const mpRecover = Math.floor(char.法力值.最大值 * 0.3);
              char.生命值.当前值 = _.clamp(char.生命值.当前值 + hpRecover, 0, char.生命值.最大值);
              char.法力值.当前值 = _.clamp(char.法力值.当前值 + mpRecover, 0, char.法力值.最大值);
            }
          }
        }
      }
      if (data.训练家.据点.已解锁 && data.训练家.据点.工作区.已解锁) {
        const workArea = data.训练家.据点.工作区;
        if (workArea.等级 > 0 && workArea.当前使用.length > 0) {
          const incomePerPerson = workArea.效果数值 || RULES.WORK_AREA_INCOME[workArea.等级] || 0;
          data.金币 += incomePerPerson * workArea.当前使用.length;
        }
      }
      data.世界._上次结算日期 = currentDate;

      // ====== 周常秘境自动任务 ======
      // 如果今天是周日，且没有接过周常任务，自动发布
      if (data.世界.星期 === '周日') {
        const taskID = `周常_虚拟秘境_${data.世界.日期}`;
        if (!data.任务列表[taskID]) {
          data.任务列表[taskID] = {
            名称: '周常秘境·大逃杀',
            要求: '进入并探索虚拟秘境一次',
            奖励: '金币×500, 高级捕捉球×1, 稀有技能学习机×1',
            类型: '周常任务',
            期限: '今日23:59前',
            已完成: false,
            已过期: false,
            进度: '0/1',
            标签: ['系统推送'],
          };
          console.log(`[系统任务] 自动发布周常秘境任务: ${taskID}`);
        }
      }

      // ====== 大秘境随机任务 ======
      const daysPassed = getDaysPassed(data.世界.日期);
      if (daysPassed > 14 && daysPassed < 30) {
        const dateNum = parseSafeNumber(data.世界.日期.replace(/[^\d]/g, ''), 0);
        const isGrandRealmDay = dateNum % 13 === 5; // 简单的伪随机条件

        if (isGrandRealmDay) {
          const taskID = `大秘境_历史战姬_${data.世界.日期}`;
          if (!data.任务列表[taskID]) {
            data.任务列表[taskID] = {
              名称: '月度·历史战姬大秘境',
              要求: '前往大秘境入口并参与探索',
              奖励: '大量金币, A级战姬素体, 传说技能学习机',
              类型: '限时任务',
              期限: '今日23:59前',
              已完成: false,
              已过期: false,
              进度: '0/1',
              标签: ['系统推送', '高难度'],
            };
            if (data.世界.近期事务 === '无') {
              data.世界.近期事务 = '大秘境活动中';
            }
            console.log(`[系统任务] 自动发布大秘境任务: ${taskID}`);
          }
        }
      }
    }

    // ====== 收藏室列表自动维护 ======
    const 储存列表 = [];
    for (const name in data.角色数据) {
      const char = data.角色数据[name];
      if ((char.从属训练家 === data.玩家名 || char.从属训练家 === '') && char.归属状态 === '已储存') {
        储存列表.push(name);
      }
    }
    data.收藏室 = 储存列表;

    // ====== 自动事件与任务 ======
    if (data.current_target && !data.current_event) {
      const char = data.角色数据[data.current_target];
      if (char) {
        for (const event of AUTO_EVENTS) {
          if (event.condition(char)) {
            data.current_event = event.id;
            break;
          }
        }
      }
    }
    if (data.current_target && data.current_event) {
      if (data.角色数据[data.current_target]) {
        data.角色数据[data.current_target].已触发事件[data.current_event] = true;
      }
    }

    // ====== 角色计算循环 ======
    for (const name in data.角色数据) {
      const char = data.角色数据[name];

      // 变化形态元素限制
      if (char.变化形态 !== '无') {
        const allowedElements = RULES.FORM_ELEMENT_RESTRICTION[char.变化形态];
        if (allowedElements && !allowedElements.includes(char.元素属性)) {
          char.变化形态 = '无';
        }
      }

      // ====== 任务自动触发 (移除强制锁止，仅保留任务推送) ======

      // 1. 形态觉醒任务推送
      if (!char.已触发事件['特殊事件_形态觉醒'] && char.好感度 >= 149) {
        // 自动发布形态觉醒任务，但不卡数值
        const taskID = `觉醒_${name}_形态`;
        if (!data.任务列表[taskID]) {
          data.任务列表[taskID] = {
            名称: `觉醒任务·${name}`,
            要求: `与${name}完成一次深入的心灵交流或共同经历一次生死战斗`,
            奖励: '解锁变化形态, 属性上限突破, 史诗被动技能',
            类型: '剧情任务',
            期限: '无限制',
            已完成: false,
            已过期: false,
            进度: '0/1',
            标签: ['羁绊任务', name],
          };
          console.log(`[系统任务] 触发形态觉醒任务: ${taskID}`);
        }
      }

      // 2. 羁绊技能任务推送
      else if (!char.已触发事件['特殊事件_羁绊技能'] && char.好感度 >= 199) {
        // 自动发布羁绊任务，但不卡数值
        const taskID = `羁绊_${name}_誓约`;
        if (!data.任务列表[taskID]) {
          data.任务列表[taskID] = {
            名称: `誓约任务·${name}`,
            要求: `与${name}在据点进行誓约仪式`,
            奖励: '获得专属羁绊技能(传说/神话), 永恒誓约',
            类型: '剧情任务',
            期限: '无限制',
            已完成: false,
            已过期: false,
            进度: '0/1',
            标签: ['羁绊任务', name],
          };
          console.log(`[系统任务] 触发羁绊誓约任务: ${taskID}`);
        }
      }

      // 属性更新
      const safeExp = char.经验值 ? parseSafeNumber(char.经验值.当前值, 0) : 0;
      const levelInfo = calculateLevelFromExp(safeExp);
      const newLevel = levelInfo.level;
      const isLevelUp = newLevel > char.等级;

      if (char.等级 > 1 && safeExp === 0) {
        char.经验值.当前值 = calculateMinExpForLevel(char.等级);
      } else {
        char.等级 = newLevel;
      }
      char.经验值.升级所需值 = levelInfo.maxExp;

      const stats = calculateStats(char, char.等级);
      const combatMod = calculateCombatModifier(char.好感度, char.堕落值);
      const affectionMultiplier = combatMod.好感度修正;
      const corruptionAtkBonus = combatMod.堕落值攻击加成;
      const corruptionDefPenalty = combatMod.堕落值防御惩罚;
      const corruptionSpdBonus = combatMod.堕落值速度加成;

      char.攻击力 = Math.floor(stats.攻击力 * affectionMultiplier * corruptionAtkBonus);
      char.特攻 = Math.floor(stats.特攻 * affectionMultiplier * corruptionAtkBonus);
      char.防御力 = Math.floor(stats.防御力 * affectionMultiplier * corruptionDefPenalty);
      char.特防 = Math.floor(stats.特防 * affectionMultiplier * corruptionDefPenalty);
      char.速度 = Math.floor(stats.速度 * affectionMultiplier * corruptionSpdBonus);
      char.生命值.最大值 = Math.floor(stats.HP最大值 * affectionMultiplier);
      char.法力值.最大值 = Math.floor(stats.MP最大值 * affectionMultiplier);

      if (isLevelUp || char.生命值.当前值 <= 0) char.生命值.当前值 = char.生命值.最大值;
      if (isLevelUp || char.法力值.当前值 <= 0) char.法力值.当前值 = char.法力值.最大值;
      char.生命值.当前值 = _.clamp(char.生命值.当前值, 0, char.生命值.最大值);
      char.法力值.当前值 = _.clamp(char.法力值.当前值, 0, char.法力值.最大值);

      if (char.性器状态) {
        const s = char.性器状态;
        const weights = { 胸部: 0.15, 阴部: 0.3, 阴蒂: 0.15, 后庭: 0.2, 子宫: 0.1, 口腔: 0.1 };
        let totalDev = 0;
        totalDev += (s.胸部?.开发度 || 0) * weights.胸部;
        totalDev += (s.阴部?.开发度 || 0) * weights.阴部;
        totalDev += (s.阴蒂?.开发度 || 0) * weights.阴蒂;
        totalDev += (s.后庭?.开发度 || 0) * weights.后庭;
        totalDev += (s.子宫?.开发度 || 0) * weights.子宫;
        totalDev += (s.口腔?.开发度 || 0) * weights.口腔;
        s.整体淫乱度 = Math.floor(_.clamp(totalDev, 0, 100));
      }
    }

    return data;
  });

// ====================================================================
// 5. 注册
// ====================================================================

$(() => {
  registerMvuSchema(Schema);
});
