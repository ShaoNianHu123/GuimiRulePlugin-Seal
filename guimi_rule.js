// ==UserScript==
// @name         诡秘之主D20规则插件 (海豹移植版)
// @author       少年狐 (ShaoNianHu123)
// @version      1.0.0
// @description 诡秘之主D20跑团规则插件 —— 属性生成、D20检定、理智检定、先攻管理。从 OlivOS GuimiRulePlugin 移植到海豹 SealDice。
// @timestamp    1752768000
// @license      MIT
// @homepageURL  https://github.com/ShaoNianHu123/GuimiRulePlugin-Seal
// ==/UserScript==

// ============================================================
//  扩展注册（重载 JS 时先清理旧扩展，防止重复触发）
// ============================================================

let ext = seal.ext.find('GuimiRulePlugin');
let isNew = false;
if (!ext) {
  ext = seal.ext.new('GuimiRulePlugin', '少年狐', '1.0.0');
  isNew = true;
} else {
  // 重载时清理旧指令映射
  for (const key in ext.cmdMap) {
    delete ext.cmdMap[key];
  }
}

// ============================================================
//  配置数据
// ============================================================

  const MAX_GEN = 10;

  const ATTRS_V3 = [
    {name: '力量', var: 'str'},
    {name: '体质', var: 'con'},
    {name: '敏捷', var: 'dex'},
    {name: '魅力', var: 'app'},
    {name: '灵感', var: 'int'},
    {name: '意志', var: 'pow'},
    {name: '教育', var: 'edu'},
    {name: '幸运', var: 'luck'},
  ];

  const ATTRS_V4 = [
    {name: '力量', var: 'str'},
    {name: '体质', var: 'con'},
    {name: '敏捷', var: 'dex'},
    {name: '心灵', var: 'lingx'},
    {name: '智力', var: 'int1'},
    {name: '灵感', var: 'int'},
    {name: '精神', var: 'app'},
    {name: '意志', var: 'pow'},
    {name: '幸运', var: 'luck'},
  ];

  // 合并 V3+V4 全部属性名（用于判断是否为纯属性检定）
  const ALL_ATTR_NAMES = {};
  ATTRS_V3.forEach(a => { ALL_ATTR_NAMES[a.name] = true; });
  ATTRS_V4.forEach(a => { ALL_ATTR_NAMES[a.name] = true; });
  ALL_ATTR_NAMES['体型基数'] = true;

  // 技能 → 关联属性映射
  const SKILL_ATTR_MAP = {
    // 力量相关
    '攀爬': '力量', '跳跃': '力量', '格斗': '力量',
    '肉搏': '力量', '刀剑': '力量', '长柄武器': '力量',
    '巨型武器': '力量', '特种武器': '力量', '投掷': '力量',
    '恐吓': '力量', '驯兽': '力量',
    // 敏捷相关
    '潜行': '敏捷', '隐匿': '敏捷', '妙手': '敏捷',
    '巧手': '敏捷', '偷窃': '敏捷', '游泳': '敏捷',
    '锁匠': '敏捷', '射击': '敏捷', '手枪': '敏捷',
    '步枪': '敏捷', '猎枪': '敏捷', '机枪': '敏捷',
    '弓箭': '敏捷', '弩': '敏捷', '闪避': '敏捷',
    '驾驶': '敏捷', '骑乘': '敏捷', '厨艺': '敏捷',
    // 魅力相关
    '取悦': '魅力', '信誉': '魅力', '欺骗': '魅力',
    '说服': '魅力', '挑衅': '魅力', '心理学': '魅力',
    '心理引导': '魅力', '表演': '魅力', '乔装': '魅力',
    '乐理': '魅力',
    // 灵感相关
    '聆听': '灵感', '侦查': '灵感', '搜索': '灵感',
    '读唇': '灵感', '追踪': '灵感', '机械维修': '灵感',
    '贸易': '灵感', '歌唱': '灵感', '工艺制造': '灵感', '神秘学': '灵感',
    '占卜': '灵感', '通灵': '灵感', '星象学': '灵感',
    '仪式魔法': '灵感', '非凡之物学': '灵感',
    '神秘历史学': '灵感', '非凡学识': '灵感',
    // 教育相关
    '图书馆使用': '教育', '领航': '教育', '生存': '教育',
    '医学': '教育', '写作': '教育', '爆破': '教育',
    '法律': '教育', '潜水': '教育', '考古': '教育',
    '现实学识': '教育', '化学': '教育', '药学': '教育',
    '社会学': '教育', '植物学': '教育', '农业': '教育',
    '天文学': '教育', '历史': '教育', '工程学': '教育',
    '博物学': '教育', '生物学': '教育', '科学': '教育',
    '宗教': '教育',
    // 语言类 (教育)
    '鲁恩语': '教育', '因蒂斯语': '教育', '弗萨克语': '教育',
    '高原语': '教育', '伦堡语': '教育', '古弗萨克语': '教育',
    '都坦语': '教育', '高地语': '教育', '旧日语言': '教育',
    // 神秘学语言 (灵感)
    '赫密斯语': '灵感', '古赫密斯语': '灵感', '巨人语': '灵感',
    '巨龙语': '灵感', '精灵语': '灵感',
  };

  // 属性中英文别名
  const ATTR_ALIASES = {
    '力量': ['力量', 'str', 'STR'],
    '体质': ['体质', 'con', 'CON'],
    '敏捷': ['敏捷', 'dex', 'DEX'],
    '魅力': ['魅力', 'app', 'APP'],
    '灵感': ['灵感', 'int', 'INT'],
    '意志': ['意志', 'pow', 'POW'],
    '教育': ['教育', 'edu', 'EDU'],
    '幸运': ['幸运', 'luck', 'LUCK'],
    '心灵': ['心灵', 'lingx', 'LINGX'],
    '智力': ['智力', 'int1', 'INT1'],
    '精神': ['精神', '精神'],
    '灵性': ['灵性', '灵性值', 'lingx', 'mp', 'MP'],
    '灵性值': ['灵性值', '灵性', 'lingx', 'mp', 'MP'],
  };

  // 理智相关属性名
  const SAN_NAMES = ['理智', 'san', 'SAN', 'sanity'];

  // .gm 检定排除列表（衍生属性/特殊字段不可直接检定）
  const GM_EXCLUDED_TARGETS = {
    '序列': true, '消化': true, '消化度': true, '位格': true,
    '理智': true, '血量': true, '血量上限': true, '生命值': true,
    '生命值上限': true, '灵性': true, '灵性值': true, '灵体强度': true,
    '移动力': true, '物理防御': true, '意志防御': true, '体质防御': true,
    '神性补正': true, 'san': true, 'SAN': true, 'sanity': true,
  };

  // 技能等级加值 (0-based)
  const SKILL_LEVELS = [
    {bonus: -4, name: '未受训'},
    {bonus:  2, name: '受训'},
    {bonus:  4, name: '熟练'},
    {bonus:  5, name: '进阶'},
    {bonus:  6, name: '精通'},
    {bonus:  7, name: '博学'},
    {bonus:  8, name: '大师'},
  ];

  const HELP_TEXT = `【诡秘之主D20规则 - 帮助】
.诡秘 [数量]         随机生成人物属性（2d3，2~6）
.诡秘4.0 [数量]      使用4.0预览属性表生成
.gm<技能/属性>       D20技能或属性检定
  手动加值：.gm力量+2 / .gm力量-1
  绝对指定：.gm力量5（替换卡片值）
  无限累加：.gm格斗+2+3+4
  改判属性：.gm驯兽/教育
  奖励投：.gmb力量 / .gm 优势 力量
  惩罚投：.gmp力量 / .gm 劣势 力量
.gmsc [损失骰]        理智检定（rd20 vs 理智）
  .gmsc                 默认损失 1/1d2
  .gmsc 1d2/1d4         成功损失1d2，失败损失1d4
.gmri                先攻检定（rd20 + 敏捷）
.gminit list          查看先攻列表
.gminit clr           清空先攻列表
.gminit del <名称>    移除指定人员
.gmst <属性> <值>     录入/查看属性或技能等级(0~6)
  支持批量录入：.gmst 力量7体质6敏捷6...
  支持无空格：.gmst 幸运5
  查看属性：.gmst 力量

—— 技能等级加值 ——
未受训(-4) 受训(+2) 熟练(+4) 进阶(+5) 精通(+6) 博学(+7) 大师(+8)

—— 常用录入示例 ——
.gmst 力量5体质4敏捷3魅力4灵感6意志5教育4幸运3
.gmst 格斗2闪避1侦查1神秘学2
.gmst 理智20生命值34灵性值32序列9`;

  // ============================================================
  //  工具函数
  // ============================================================

  // 获取配置模板（带缓存）
  function getTmpl(key) {
    return seal.ext.getStringConfig(ext, key);
  }

  // 简单模板替换 {var} → value
  function t(tmpl, vars) {
    if (!vars) return tmpl;
    var s = tmpl;
    for (var k in vars) {
      if (vars.hasOwnProperty(k)) {
        s = s.split('{' + k + '}').join(String(vars[k]));
      }
    }
    return s;
  }

  // 渲染配置模板
  function render(key, vars) {
    return t(getTmpl(key), vars);
  }

  // 2d3 属性掷骰
  function rollStat() {
    return Math.floor(Math.random() * 3) + 1 + Math.floor(Math.random() * 3) + 1;
  }

  function trim(s) {
    if (!s) return '';
    return s.replace(/^\s+|\s+$/g, '');
  }

  // 读取玩家属性值（尝试中英文别名）
  // 优先级：seal.vars($m) > seal.format(角色卡) > 0
  function getCardAttr(ctx, statName) {
    const aliases = ATTR_ALIASES[statName];

    // 1) seal.vars ($m 变量)
    if (aliases) {
      for (let i = 0; i < aliases.length; i++) {
        const result = seal.vars.intGet(ctx, '$m' + aliases[i]);
        if (result[1] && result[0] !== 0) return result[0];
      }
    } else {
      const result = seal.vars.intGet(ctx, '$m' + statName);
      if (result[1] && result[0] !== 0) return result[0];
    }

    // 2) seal.format 回退（兼容 .st 录入的海豹角色卡数据）
    const names = aliases ? [statName].concat(aliases) : [statName];
    for (let i = 0; i < names.length; i++) {
      try {
        const formatted = seal.format(ctx, '{' + names[i] + '}');
        const parsed = parseInt(formatted, 10);
        if (!isNaN(parsed) && parsed !== 0) return parsed;
      } catch (e) {}
    }

    return 0;
  }

  // 读取技能等级（返回卡片存储的等级值 0~6）
  // 优先级：seal.vars($m) > seal.format(角色卡) > 0
  function getCardSkill(ctx, skillName) {
    // 1) seal.vars
    const result = seal.vars.intGet(ctx, '$m' + skillName);
    if (result[1] && result[0] !== 0) return result[0];

    // 2) seal.format 回退
    try {
      const formatted = seal.format(ctx, '{' + skillName + '}');
      const parsed = parseInt(formatted, 10);
      if (!isNaN(parsed) && parsed !== 0) return parsed;
    } catch (e) {}

    return 0;
  }

  // 读取理智值
  // 优先级：seal.vars($m) > seal.format(角色卡) > 意志推算
  function getCardSan(ctx) {
    // 1) seal.vars
    for (let i = 0; i < SAN_NAMES.length; i++) {
      const result = seal.vars.intGet(ctx, '$m' + SAN_NAMES[i]);
      if (result[1] && result[0] !== 0) return result[0];
    }

    // 2) seal.format 回退
    for (let i = 0; i < SAN_NAMES.length; i++) {
      try {
        const formatted = seal.format(ctx, '{' + SAN_NAMES[i] + '}');
        const parsed = parseInt(formatted, 10);
        if (!isNaN(parsed) && parsed !== 0) return parsed;
      } catch (e) {}
    }

    // 3) 回退：理智 = 10 + 意志
    const will = getCardAttr(ctx, '意志');
    if (will > 0) return 10 + will;
    return 10;
  }

  // 设置理智值（写回角色卡）
  function setCardSan(ctx, value) {
    seal.vars.intSet(ctx, '$m理智', value);
  }

  // 解析技能等级 → {name, bonus}
  function parseSkillLevel(skillValue) {
    if (!skillValue || skillValue < 0) skillValue = 0;
    if (skillValue > 6) skillValue = 6;
    return SKILL_LEVELS[skillValue];
  }

  // 获取显示名称：玩家昵称 > 用户ID
  function getDisplayName(ctx) {
    const name = ctx.player.name;
    if (name && name !== '') return name;
    return ctx.player.userId;
  }

  function intStr(n) {
    if (typeof n !== 'number' || isNaN(n)) return '0';
    return String(Math.floor(n));
  }

  // 模糊匹配技能/属性名
  function fuzzyMatch(input) {
    // 精确匹配技能
    if (SKILL_ATTR_MAP[input]) return [input, false];
    // 精确匹配属性
    if (ALL_ATTR_NAMES[input]) return [input, true];
    // 模糊匹配技能
    for (const skillName in SKILL_ATTR_MAP) {
      if (skillName === input || skillName.indexOf(input) === 0) {
        return [skillName, false];
      }
    }
    // 模糊匹配属性
    for (let i = 0; i < ATTRS_V3.length; i++) {
      if (ATTRS_V3[i].name === input || ATTRS_V3[i].name.indexOf(input) === 0) {
        return [ATTRS_V3[i].name, true];
      }
    }
    for (let i = 0; i < ATTRS_V4.length; i++) {
      if (ATTRS_V4[i].name === input || ATTRS_V4[i].name.indexOf(input) === 0) {
        return [ATTRS_V4[i].name, true];
      }
    }
    return [input, false]; // 未知，当技能处理
  }

  // ============================================================
  //  解析手动加值/改判属性后缀
  //  例: '力量+5' → {clean: '力量', value: 5, mode: 'adjust', override: null}
  //      '格斗-2' → {clean: '格斗', value: -2, mode: 'adjust', override: null}
  //      '格斗+2+3' → {clean: '格斗', value: 5, mode: 'adjust', override: null}
  //      '力量5' → {clean: '力量', value: 5, mode: 'absolute', override: null}
  //      '驯兽/教育' → {clean: '驯兽', value: null, mode: null, override: '教育'}
  //      '格斗+3/灵感' → {clean: '格斗', value: 3, mode: 'adjust', override: '灵感'}
  // ============================================================

  function parseManualModifier(rawTarget) {
    let overrideAttr = null;
    let rollMode = null;

    // 提取 adv/dis/优势/劣势 后缀
    const advMatch = rawTarget.match(/\s+(adv|优势|dis|劣势)\s*$/i);
    if (advMatch) {
      const keyword = advMatch[1].toLowerCase();
      rollMode = (keyword === 'adv' || keyword === '优势') ? 'adv' : 'dis';
      rawTarget = rawTarget.substring(0, advMatch.index).trim();
    }

    // 提取 /属性 后缀（改判属性）
    const slashIdx = rawTarget.lastIndexOf('/');
    if (slashIdx > 0) {
      overrideAttr = rawTarget.substring(slashIdx + 1).trim();
      rawTarget = rawTarget.substring(0, slashIdx).trim();
    }

    // 匹配带符号的：+N 或 -N 序列（全部累加为一个总调整值）
    const signedMatch = rawTarget.match(/((?:[+\-]\d+)+)$/);
    if (signedMatch) {
      const modStr = signedMatch[1];
      const nums = modStr.match(/[+\-]\d+/g);
      let totalMod = 0;
      for (let i = 0; i < nums.length; i++) {
        totalMod += parseInt(nums[i], 10);
      }
      const clean = rawTarget.substring(0, signedMatch.index).trim();
      if (clean) {
        return { clean: clean, value: totalMod, mode: 'adjust', override: overrideAttr, rollMode: rollMode };
      }
    }

    // 匹配纯数字后缀（绝对指定）
    const numMatch = rawTarget.match(/(\d+)$/);
    if (numMatch) {
      const clean = rawTarget.substring(0, numMatch.index).trim();
      if (clean) {
        return { clean: clean, value: parseInt(numMatch[1], 10), mode: 'absolute', override: overrideAttr, rollMode: rollMode };
      }
    }

    return { clean: rawTarget.trim(), value: null, mode: null, override: overrideAttr, rollMode: rollMode };
  }

  // ============================================================
  //  解析骰子表达式 '1d2', '2d6', '1d4'
  // ============================================================

  function rollDiceExpr(expr) {
    if (!expr || expr === '') return 0;
    expr = expr.toLowerCase().trim();
    const match = expr.match(/^(\d*)d(\d+)$/);
    if (match) {
      const count = (match[1] === '' || !match[1]) ? 1 : parseInt(match[1], 10);
      const sides = parseInt(match[2], 10);
      let total = 0;
      for (let i = 0; i < count; i++) {
        total += Math.floor(Math.random() * sides) + 1;
      }
      return total;
    }
    const num = parseInt(expr, 10);
    if (!isNaN(num)) return num;
    return 0;
  }

  // ============================================================
  //  属性生成
  // ============================================================

  function generateAttrs() {
    const stats = {};
    stats['str'] = rollStat();
    stats['con'] = rollStat();
    stats['dex'] = rollStat();
    stats['app'] = rollStat();
    stats['int'] = rollStat();
    stats['pow'] = rollStat();
    stats['edu'] = rollStat();
    stats['luck'] = rollStat();
    stats['lingx'] = rollStat();
    stats['int1'] = rollStat();
    return stats;
  }

  function formatAttrs(stats, isV4) {
    const attrs = isV4 ? ATTRS_V4 : ATTRS_V3;
    let totalAll = 0;
    let totalNoLuck = 0;
    const vals = [];

    for (let i = 0; i < attrs.length; i++) {
      const val = stats[attrs[i].var] || 0;
      totalAll += val;
      if (attrs[i].var !== 'luck') {
        totalNoLuck += val;
      }
      vals.push(attrs[i].name + ':' + intStr(val));
    }

    const lines = [];
    for (let i = 0; i < vals.length; i += 3) {
      const buf = [];
      for (let j = 0; j < 3; j++) {
        if (i + j < vals.length) {
          buf.push(vals[i + j]);
        }
      }
      lines.push(buf.join(' '));
    }
    lines.push('［' + intStr(totalNoLuck) + '/' + intStr(totalAll) + '］');

    let result = lines.join('\n');
    if (isV4) {
      result += '\n\n' + getTmpl('T_ATTR_V4_NOTE');
    }
    return result;
  }

  // 按数量生成属性并回复（返回是否已处理）
  function genAndReply(ctx, msg, count, isV4) {
    if (count < 1) {
      seal.replyToSender(ctx, msg, getTmpl('T_ERR_PARAM'));
      return true;
    }
    if (count > MAX_GEN) {
      seal.replyToSender(ctx, msg, getTmpl('T_ERR_TOO_MANY'));
      return true;
    }
    const nick = getDisplayName(ctx);
    let result = render('T_ATTR_TITLE', {nick: nick});
    for (let i = 0; i < count; i++) {
      result += '\n\n' + formatAttrs(generateAttrs(), isV4);
    }
    seal.replyToSender(ctx, msg, result);
    return true;
  }

  // 处理优势/劣势关键词（返回是否已处理）
  function handleAdvDis(ctx, msg, tail, keyword, mode) {
    if (tail.indexOf(keyword + ' ') === 0 || tail.indexOf(keyword) === 0) {
      const inner = trim(tail.substring(keyword.length));
      if (inner === '' || inner === keyword) {
        seal.replyToSender(ctx, msg, getTmpl('T_ERR_GM_NO_TARGET'));
        return true;
      }
      seal.replyToSender(ctx, msg, doGMCheck(ctx, inner, mode));
      return true;
    }
    return false;
  }

  // ============================================================
  //  D20 检定（核心）
  // ============================================================

  function performD20Check(ctx, target, nick, extraAttr, extraSkill, absoluteAttr, absoluteSkill, overrideAttr, rollMode) {
    // 奖励投/惩罚投：掷两次取高/低
    let d20, rollTag;
    if (rollMode === 'adv') {
      const d20_1 = Math.floor(Math.random() * 20) + 1;
      const d20_2 = Math.floor(Math.random() * 20) + 1;
      d20 = Math.max(d20_1, d20_2);
      rollTag = render('T_D20_TAG_ADV', {d1: d20_1, d2: d20_2, d20: d20});
    } else if (rollMode === 'dis') {
      const d20_1 = Math.floor(Math.random() * 20) + 1;
      const d20_2 = Math.floor(Math.random() * 20) + 1;
      d20 = Math.min(d20_1, d20_2);
      rollTag = render('T_D20_TAG_DIS', {d1: d20_1, d2: d20_2, d20: d20});
    } else {
      d20 = Math.floor(Math.random() * 20) + 1;
      rollTag = null;
    }

    // 判断是技能还是属性
    const isSkill = !ALL_ATTR_NAMES[target];
    // 关联属性
    const linkedAttrName = overrideAttr || (isSkill ? (SKILL_ATTR_MAP[target] || '力量') : target);

    // 读取卡片属性值
    const cardAttr = getCardAttr(ctx, linkedAttrName);

    let attrVal, attrDisplay;
    if (absoluteAttr !== null && absoluteAttr !== undefined) {
      attrVal = absoluteAttr;
      attrDisplay = linkedAttrName + '(' + attrVal + ' 手动指定)';
    } else {
      const extraA = extraAttr || 0;
      attrVal = cardAttr + extraA;
      if (extraA !== 0) {
        attrDisplay = linkedAttrName + '(卡片' + cardAttr + ' + 调整' + (extraA >= 0 ? '+' : '') + extraA + ')';
      } else {
        attrDisplay = linkedAttrName + '(' + cardAttr + ')';
      }
    }

    const hasManual = (absoluteAttr !== null && absoluteAttr !== undefined) ||
                      (absoluteSkill !== null && absoluteSkill !== undefined) ||
                      (extraAttr !== null && extraAttr !== undefined && extraAttr !== 0) ||
                      (extraSkill !== null && extraSkill !== undefined && extraSkill !== 0);

    // 组装 tag 字符串
    const tags = [];
    if (hasManual) {
      tags.push(getTmpl('T_D20_TAG_MANUAL'));
    }
    if (rollTag) {
      tags.push(rollTag);
    }
    const tagStr = tags.join(' ');

    const lines = [];
    lines.push(render('T_D20_TITLE', {nick: nick, target: target, tag: tagStr}));

    let bonus = attrVal;
    let skillInfo = '';

    if (isSkill) {
      const cardSkill = getCardSkill(ctx, target);
      const levelInfo = parseSkillLevel(cardSkill);
      const cardSkillBonus = levelInfo.bonus;

      if (absoluteSkill !== null && absoluteSkill !== undefined) {
        const lvInfo = parseSkillLevel(absoluteSkill);
        skillInfo = ' + 技能' + target + '(手动指定 等级' + absoluteSkill + ' ' + lvInfo.name + ':' + (lvInfo.bonus >= 0 ? '+' : '') + lvInfo.bonus + ')';
        bonus = attrVal + lvInfo.bonus;
      } else {
        const extraS = extraSkill || 0;
        const skillBonus = cardSkillBonus + extraS;
        if (extraS !== 0) {
          skillInfo = ' + 技能' + target + '(卡片' + levelInfo.name + ':' + (cardSkillBonus >= 0 ? '+' : '') + cardSkillBonus + ' + 调整' + (extraS >= 0 ? '+' : '') + extraS + ')';
        } else {
          skillInfo = ' + 技能' + target + '(' + levelInfo.name + ':' + (skillBonus >= 0 ? '+' : '') + skillBonus + ')';
        }
        bonus = attrVal + skillBonus;
      }
    }

    lines.push(render('T_D20_LINE', {d20: intStr(d20), attr_display: attrDisplay, skill_info: skillInfo}));
    const total = d20 + bonus;
    lines.push(render('T_D20_RESULT', {total: intStr(total)}));

    if (d20 === 20) {
      lines.push(render('T_D20_CRIT_SUCCESS', {total: intStr(total)}));
    } else if (d20 === 1) {
      lines.push(render('T_D20_CRIT_FAIL', {total: intStr(total)}));
    }

    return lines.join('\n');
  }

  // 执行 .gm 检定（带模糊匹配和手动加值解析）
  function doGMCheck(ctx, rawTarget, externalRollMode) {
    if (!rawTarget || rawTarget === '') {
      return getTmpl('T_ERR_NO_SKILL');
    }

    const nick = getDisplayName(ctx);

    const parsed = parseManualModifier(rawTarget);
    let cleanTarget = parsed.clean;
    let manualMod = parsed.value;
    let modMode = parsed.mode;
    let overrideAttr = parsed.override;
    let parsedRollMode = parsed.rollMode;

    if (externalRollMode) parsedRollMode = externalRollMode;

    const matchResult = fuzzyMatch(cleanTarget);
    const finalTarget = matchResult[0];
    const isAttr = matchResult[1];
    const isSkill = !isAttr;

    // 拒绝衍生属性/特殊字段的检定
    if (GM_EXCLUDED_TARGETS[finalTarget]) {
      return render('T_ERR_EXCLUDED', {target: finalTarget});
    }

    if (manualMod !== null && manualMod !== undefined) {
      if (modMode === 'absolute') {
        if (isSkill) {
          return performD20Check(ctx, finalTarget, nick, null, null, null, manualMod, overrideAttr, parsedRollMode);
        } else {
          return performD20Check(ctx, finalTarget, nick, null, null, manualMod, null, overrideAttr, parsedRollMode);
        }
      } else {
        if (isSkill) {
          return performD20Check(ctx, finalTarget, nick, null, manualMod, null, null, overrideAttr, parsedRollMode);
        } else {
          return performD20Check(ctx, finalTarget, nick, manualMod, null, null, null, overrideAttr, parsedRollMode);
        }
      }
    } else {
      return performD20Check(ctx, finalTarget, nick, null, null, null, null, overrideAttr, parsedRollMode);
    }
  }

  // ============================================================
  //  理智检定
  // ============================================================

  function doSCCheck(ctx, scSuccessExpr, scFailExpr) {
    if (!scSuccessExpr) scSuccessExpr = '1';
    if (!scFailExpr) scFailExpr = '1d2';

    const currentSan = getCardSan(ctx);
    const d20 = Math.floor(Math.random() * 20) + 1;
    const success = (d20 <= currentSan);
    const nick = getDisplayName(ctx);

    const lines = [];
    lines.push(render('T_SC_TITLE', {nick: nick}));
    lines.push(render('T_SC_CHECK', {d20: intStr(d20), san: intStr(currentSan)}));

    let lossExpr, loss;
    if (success) {
      lines.push(render('T_SC_SUCCESS', {d20: intStr(d20), san: intStr(currentSan)}));
      lossExpr = scSuccessExpr;
      loss = rollDiceExpr(scSuccessExpr);
    } else {
      lines.push(render('T_SC_FAIL', {d20: intStr(d20), san: intStr(currentSan)}));
      lossExpr = scFailExpr;
      loss = rollDiceExpr(scFailExpr);
    }

    lines.push(render('T_SC_LOSS', {expr: lossExpr, loss: intStr(loss)}));
    const newSan = Math.max(0, currentSan - loss);
    setCardSan(ctx, newSan);
    lines.push(render('T_SC_CHANGE', {old: intStr(currentSan), new: intStr(newSan)}));

    // 疯狂阈值警告（独立 if，非互斥）
    if (newSan <= 0 && currentSan > 0) {
      lines.push(getTmpl('T_SC_LOST'));
    }
    if (newSan <= 2 && currentSan > 2) {
      lines.push(getTmpl('T_SC_TRUE_MAD'));
    }
    if (newSan <= 4 && currentSan > 4) {
      lines.push(getTmpl('T_SC_OUT_OF_CONTROL'));
    }
    if (newSan <= 8 && currentSan > 8) {
      lines.push(getTmpl('T_SC_HALF_MAD'));
    }

    return lines.join('\n');
  }

  // ============================================================
  //  先攻检定与列表管理
  // ============================================================

  function doRiCheck(ctx) {
    const nick = getDisplayName(ctx);
    const d20 = Math.floor(Math.random() * 20) + 1;
    const dex = getCardAttr(ctx, '敏捷');
    const total = d20 + dex;

    // 加入先攻列表
    const entry = nick + '=' + intStr(total);
    const oldList = seal.vars.strGet(ctx, '$g先攻列表');
    const oldStr = oldList[1] ? oldList[0] : '';
    const newList = oldStr === '' ? entry : oldStr + ', ' + entry;
    seal.vars.strSet(ctx, '$g先攻列表', newList);

    return render('T_RI_CHECK', {nick: nick, d20: intStr(d20), dex: intStr(dex), total: intStr(total)});
  }

  function doInitManage(ctx, subCmd) {
    if (!subCmd || subCmd === 'list') {
      const result = seal.vars.strGet(ctx, '$g先攻列表');
      const initList = result[1] ? result[0] : '';
      if (initList === '') return '先攻列表为空';
      const lines = ['【先攻列表】'];
      const entries = initList.split(',').map(e => trim(e)).filter(e => e !== '');
      for (let i = 0; i < entries.length; i++) {
        lines.push((i + 1) + '. ' + entries[i]);
      }
      return lines.join('\n');
    } else if (subCmd === 'clr') {
      seal.vars.strSet(ctx, '$g先攻列表', '');
      return '先攻列表已清除';
    } else if (subCmd.indexOf('del ') === 0) {
      const target = trim(subCmd.substring(4));
      if (target === '') return '用法: .gminit del <名称>';
      const result = seal.vars.strGet(ctx, '$g先攻列表');
      const initList = result[1] ? result[0] : '';
      if (initList === '') return '先攻列表为空';
      const entries = initList.split(',').map(e => trim(e)).filter(e => e !== '');
      const newEntries = [];
      let found = false;
      for (let i = 0; i < entries.length; i++) {
        if (entries[i].indexOf(target + '=') === 0) {
          found = true;
        } else {
          newEntries.push(entries[i]);
        }
      }
      if (!found) return '未找到: ' + target;
      seal.vars.strSet(ctx, '$g先攻列表', newEntries.join(', '));
      return '已移除: ' + target;
    } else {
      return '用法: .gminit list / .gminit clr / .gminit del <名称>';
    }
  }


  // ============================================================
  //  属性录入 .gmst
  // ============================================================

  function doSt(ctx, cmdArgs) {
    const arg1 = cmdArgs.getArgN(1);
    const arg2 = cmdArgs.getArgN(2);

    if (!arg1) {
      return '用法: .gmst <属性名> <值>\n例：.gmst 力量 5\n    .gmst 格斗 2\n    .gmst 序列 9\n    .gmst 理智 20\n\n支持批量录入（属性名+数字连续写）：\n例：.gmst 力量7体质6敏捷6魅力7灵感7意志6教育6幸运6';
    }

    // 尝试批量解析：匹配连续的「属性名+数字」对
    const pairs = [];
    const re = /([\u4e00-\u9fa5a-zA-Z]+?)(-?\d+)/g;
    let m;
    while ((m = re.exec(arg1)) !== null) {
      pairs.push({ name: m[1], value: parseInt(m[2], 10) });
    }

    // 无数字匹配 + 有 arg2 → 空格分隔录入（.gmst 力量 5）
    if (pairs.length === 0 && arg2) {
      const val = parseInt(arg2, 10);
      if (isNaN(val)) return '值必须是数字';
      seal.vars.intSet(ctx, '$m' + arg1, val);
      autoSyncMaxHp(ctx, arg1, val);
      return '已设置 ' + arg1 + ' = ' + intStr(val);
    }

    // 无数字匹配 + 无 arg2 → 查看属性值（.gmst 力量）
    if (pairs.length === 0) {
      const val = getCardAttr(ctx, arg1);
      return arg1 + ' = ' + intStr(val);
    }

    // 有匹配到属性-值对 → 逐个写入
    for (let i = 0; i < pairs.length; i++) {
      seal.vars.intSet(ctx, '$m' + pairs[i].name, pairs[i].value);
      autoSyncMaxHp(ctx, pairs[i].name, pairs[i].value);
    }

    if (pairs.length === 1) {
      return '已设置 ' + pairs[0].name + ' = ' + intStr(pairs[0].value);
    }

    const names = pairs.map(function(p) { return p.name + '=' + intStr(p.value); }).join(' ');
    return '已录入 ' + pairs.length + ' 项：' + names;
  }

  // 录入血量时自动同步上限（如果上限尚未设置）
  function autoSyncMaxHp(ctx, name, value) {
    const hpAliases = ['血量', '生命', '生命值', 'hp', 'HP'];
    const maxHpAliases = ['血量上限', '生命值上限', '最大生命值', 'maxhp', 'maxHp'];

    if (hpAliases.indexOf(name) === -1) return;

    // 检查是否已有上限值
    for (let i = 0; i < maxHpAliases.length; i++) {
      const r = seal.vars.intGet(ctx, '$m' + maxHpAliases[i]);
      if (r[1] && r[0] !== 0) return; // 已有上限，不覆盖
    }

    seal.vars.intSet(ctx, '$m血量上限', value);
  }

  // ============================================================
  //  指令定义与注册
  // ============================================================

  // -- .诡秘 --
  const cmdGuimi = seal.ext.newCmdItemInfo();
  cmdGuimi.name = '诡秘';
  cmdGuimi.help = '随机生成人物属性（2d3），支持 .诡秘 [数量] 和 .诡秘4.0 [数量]';
  cmdGuimi.solve = (ctx, msg, cmdArgs) => {
    let tail = cmdArgs.getArgN(1);
    if (tail === 'help') {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }

    let isV4 = false;
    let count = 1;

    if (!tail || tail === '' || tail === '3.0' || tail === '3.5') {
      // 默认生成 1 套 3.5 版
    } else if (tail === '4.0') {
      isV4 = true;
    } else if (/^\d+$/.test(tail)) {
      count = parseInt(tail, 10);
    } else if (tail.indexOf('4.0') === 0) {
      isV4 = true;
      const numPart = trim(tail.substring(3));
      if (numPart !== '' && /^\d+$/.test(numPart)) {
        count = parseInt(numPart, 10);
      } else if (numPart !== '') {
        // 4.0 后跟技能名 → 直接走 .gm 检定
        seal.replyToSender(ctx, msg, doGMCheck(ctx, tail));
        return seal.ext.newCmdExecuteResult(true);
      }
    } else {
      // 未知参数 → 当作 .gm 目标处理
      seal.replyToSender(ctx, msg, doGMCheck(ctx, tail));
      return seal.ext.newCmdExecuteResult(true);
    }

    genAndReply(ctx, msg, count, isV4);
    return seal.ext.newCmdExecuteResult(true);
  };

  // -- .gm --
  const cmdGM = seal.ext.newCmdItemInfo();
  cmdGM.name = 'gm';
  cmdGM.help = 'D20技能/属性检定。用法：.gm<技能/属性> [手动加值] [奖励投/惩罚投]';
  cmdGM.solve = (ctx, msg, cmdArgs) => {
    let tail = cmdArgs.getArgN(1);
    if (!tail || tail === '') {
      seal.replyToSender(ctx, msg, getTmpl('T_ERR_NO_SKILL'));
      return seal.ext.newCmdExecuteResult(true);
    }

    if (tail === 'help' || tail === '帮助') {
      seal.replyToSender(ctx, msg, HELP_TEXT);
      return seal.ext.newCmdExecuteResult(true);
    }

    // 优势/劣势 关键词
    if (handleAdvDis(ctx, msg, tail, '优势', 'adv')) {
      return seal.ext.newCmdExecuteResult(true);
    }
    if (handleAdvDis(ctx, msg, tail, '劣势', 'dis')) {
      return seal.ext.newCmdExecuteResult(true);
    }

    // 纯数字 → 当 .诡秘 属性生成
    if (/^\d+$/.test(tail)) {
      genAndReply(ctx, msg, parseInt(tail, 10), false);
      return seal.ext.newCmdExecuteResult(true);
    }

    const result = doGMCheck(ctx, tail, null);
    seal.replyToSender(ctx, msg, result);
    return seal.ext.newCmdExecuteResult(true);
  };

  // -- .gmb (奖励投) --
  const cmdGMB = seal.ext.newCmdItemInfo();
  cmdGMB.name = 'gmb';
  cmdGMB.help = '奖励投检定：2d20取高。用法：.gmb<技能/属性>';
  cmdGMB.solve = (ctx, msg, cmdArgs) => {
    let tail = cmdArgs.getArgN(1);
    if (!tail || tail === '') {
      seal.replyToSender(ctx, msg, getTmpl('T_ERR_GM_NO_TARGET'));
      return seal.ext.newCmdExecuteResult(true);
    }
    // 纯数字 → 属性生成
    if (/^\d+$/.test(tail)) {
      genAndReply(ctx, msg, parseInt(tail, 10), false);
      return seal.ext.newCmdExecuteResult(true);
    }
    const result = doGMCheck(ctx, tail, 'adv');
    seal.replyToSender(ctx, msg, result);
    return seal.ext.newCmdExecuteResult(true);
  };

  // -- .gmp (惩罚投) --
  const cmdGMP = seal.ext.newCmdItemInfo();
  cmdGMP.name = 'gmp';
  cmdGMP.help = '惩罚投检定：2d20取低。用法：.gmp<技能/属性>';
  cmdGMP.solve = (ctx, msg, cmdArgs) => {
    let tail = cmdArgs.getArgN(1);
    if (!tail || tail === '') {
      seal.replyToSender(ctx, msg, getTmpl('T_ERR_GM_NO_TARGET'));
      return seal.ext.newCmdExecuteResult(true);
    }
    if (/^\d+$/.test(tail)) {
      genAndReply(ctx, msg, parseInt(tail, 10), false);
      return seal.ext.newCmdExecuteResult(true);
    }
    const result = doGMCheck(ctx, tail, 'dis');
    seal.replyToSender(ctx, msg, result);
    return seal.ext.newCmdExecuteResult(true);
  };

  // -- .gmsc --
  const cmdGMSC = seal.ext.newCmdItemInfo();
  cmdGMSC.name = 'gmsc';
  cmdGMSC.help = '理智检定（SC）：rd20 vs 理智。用法：.gmsc [成功损失/失败损失]';
  cmdGMSC.solve = (ctx, msg, cmdArgs) => {
    const tail = cmdArgs.getArgN(1);
    let scSuccess = '1';
    let scFail = '1d2';

    if (tail) {
      const parts = tail.split(/[/\s]+/).filter(p => p !== '');
      if (parts.length >= 1) scSuccess = parts[0];
      if (parts.length >= 2) scFail = parts[1];
    }

    const result = doSCCheck(ctx, scSuccess, scFail);
    seal.replyToSender(ctx, msg, result);
    return seal.ext.newCmdExecuteResult(true);
  };

  // -- .gmri --
  const cmdGMRI = seal.ext.newCmdItemInfo();
  cmdGMRI.name = 'gmri';
  cmdGMRI.help = '先攻检定：rd20 + 敏捷，自动加入先攻列表';
  cmdGMRI.solve = (ctx, msg, cmdArgs) => {
    const result = doRiCheck(ctx);
    seal.replyToSender(ctx, msg, result);
    return seal.ext.newCmdExecuteResult(true);
  };

  // -- .gminit --
  const cmdGMINIT = seal.ext.newCmdItemInfo();
  cmdGMINIT.name = 'gminit';
  cmdGMINIT.help = '先攻列表管理。用法：.gminit list / .gminit clr / .gminit del <名称>';
  cmdGMINIT.solve = (ctx, msg, cmdArgs) => {
    const tail = cmdArgs.getArgN(1);
    const result = doInitManage(ctx, tail || 'list');
    seal.replyToSender(ctx, msg, result);
    return seal.ext.newCmdExecuteResult(true);
  };

  // -- .gmst --
  const cmdGMST = seal.ext.newCmdItemInfo();
  cmdGMST.name = 'gmst';
  cmdGMST.help = '录入/查看角色属性。用法：.gmst <属性名> [值]';
  cmdGMST.solve = (ctx, msg, cmdArgs) => {
    const result = doSt(ctx, cmdArgs);
    seal.replyToSender(ctx, msg, result);
    return seal.ext.newCmdExecuteResult(true);
  };

  // 注册全部指令
  ext.cmdMap['诡秘'] = cmdGuimi;
  ext.cmdMap['gm'] = cmdGM;
  ext.cmdMap['gmb'] = cmdGMB;
  ext.cmdMap['gmp'] = cmdGMP;
  ext.cmdMap['gmsc'] = cmdGMSC;
  ext.cmdMap['gmri'] = cmdGMRI;
  ext.cmdMap['gminit'] = cmdGMINIT;
  ext.cmdMap['gmst'] = cmdGMST;

  // 注册扩展（仅首次，重载时跳过避免重复注册）
  if (isNew) {
    seal.ext.register(ext);
  }

  // ============================================================
  //  可配置模板（对应 OlivOS msgCustom，WebUI 中可编辑）
  //  必须在 seal.ext.register(ext) 之后调用
  // ============================================================

  // -- 属性生成 --
  // {nick}
  seal.ext.registerStringConfig(ext, 'T_ATTR_TITLE', '<{nick}>命运的馈赠在暗处已标注好了价码：');
  // 无变量
  seal.ext.registerStringConfig(ext, 'T_ATTR_V4_NOTE', '（4.0属性为测试内容，非最终版本）');

  // -- D20 检定 --
  // {nick} {target} {tag}
  seal.ext.registerStringConfig(ext, 'T_D20_TITLE', '<{nick}>对【{target}】进行检定：{tag}');
  // {d20} {attr_display} {skill_info}
  seal.ext.registerStringConfig(ext, 'T_D20_LINE', 'rd20({d20}) + {attr_display}{skill_info}');
  // {total}
  seal.ext.registerStringConfig(ext, 'T_D20_RESULT', '= {total}');
  // {total}
  seal.ext.registerStringConfig(ext, 'T_D20_CRIT_SUCCESS', '『大成功！』命运的眷顾降临于你。');
  // {total}
  seal.ext.registerStringConfig(ext, 'T_D20_CRIT_FAIL', '『大失败！』命运对你露出了恶意的微笑。');
  // {d1} {d2} {d20}
  seal.ext.registerStringConfig(ext, 'T_D20_TAG_ADV', '【奖励投】{d1}/{d2}→取高→{d20}');
  // {d1} {d2} {d20}
  seal.ext.registerStringConfig(ext, 'T_D20_TAG_DIS', '【惩罚投】{d1}/{d2}→取低→{d20}');
  // 无变量
  seal.ext.registerStringConfig(ext, 'T_D20_TAG_MANUAL', '【手动】');

  // -- SC 理智检定 --
  // {nick}
  seal.ext.registerStringConfig(ext, 'T_SC_TITLE', '<{nick}>进行理智检定：');
  // {d20} {san}
  seal.ext.registerStringConfig(ext, 'T_SC_CHECK', 'rd20({d20}) vs 理智({san})');
  // {d20} {san}
  seal.ext.registerStringConfig(ext, 'T_SC_SUCCESS', '{d20} ≤ {san}，【理智检定成功】');
  // {d20} {san}
  seal.ext.registerStringConfig(ext, 'T_SC_FAIL', '{d20} > {san}，【理智检定失败】');
  // {expr} {loss}
  seal.ext.registerStringConfig(ext, 'T_SC_LOSS', '损失理智: {expr} = {loss}');
  // {old} {new}
  seal.ext.registerStringConfig(ext, 'T_SC_CHANGE', '理智变化: {old} → {new}');
  // 无变量
  seal.ext.registerStringConfig(ext, 'T_SC_LOST', '☠ 理智归零，你已【失控】！');
  seal.ext.registerStringConfig(ext, 'T_SC_TRUE_MAD', '⚠⚠ 你已陷入【真疯】状态，难以沟通。');
  seal.ext.registerStringConfig(ext, 'T_SC_HALF_MAD', '⚠ 你已陷入【半疯】状态，获得随机疯狂倾向。');
  seal.ext.registerStringConfig(ext, 'T_SC_OUT_OF_CONTROL', '⚡ 你出现【失控征兆】，外表呈现途径的失控特征。');

  // -- 先攻 --
  // {nick} {d20} {dex} {total}
  seal.ext.registerStringConfig(ext, 'T_RI_CHECK', '<{nick}>先攻检定：rd20({d20}) + 敏捷({dex}) = {total}  已加入先攻列表');

  // -- 错误提示 --
  seal.ext.registerStringConfig(ext, 'T_ERR_NO_SKILL', '请指定技能或属性名称，如 .gm力量 或 .gm格斗');
  seal.ext.registerStringConfig(ext, 'T_ERR_PARAM', '参数错误');
  seal.ext.registerStringConfig(ext, 'T_ERR_TOO_MANY', '"你应该去向伟大的宿命之环祈祷，这要观察的【命运】也太多了，我没这么大能耐。"');
  seal.ext.registerStringConfig(ext, 'T_ERR_GM_NO_TARGET', '请指定技能或属性名称，如 .gm 优势 力量');
  seal.ext.registerStringConfig(ext, 'T_ERR_EXCLUDED', '"{target}" 是衍生属性或特殊字段，无法直接检定。\n请使用 .gm <技能/属性名>，如 .gm 力量 或 .gm 格斗');
  seal.ext.registerStringConfig(ext, 'T_ERR_NO_CARD', '尚未录入角色属性。请先用 .gmst <属性> <值> 录入属性。\n例：.gmst 力量 5\n    .gmst 格斗 2\n    .gmst 理智 20');

  // ============================================================
  //  注册 GM 规则模板（让海豹 .st/.pc 体系识别自定义属性）
  // ============================================================

  // 构建属性同义词 YAML
  const attrAliasYaml = [];
  attrAliasYaml.push('alias:');
  for (const key in ATTR_ALIASES) {
    if (ATTR_ALIASES.hasOwnProperty(key)) {
      attrAliasYaml.push('  ' + key + ':');
      for (let i = 0; i < ATTR_ALIASES[key].length; i++) {
        attrAliasYaml.push('    - ' + ATTR_ALIASES[key][i]);
      }
    }
  }
  // 扩展属性（非基础8属性）
  const extraAttrs = ['生命值', '血量', '血量上限', '生命值上限', '灵性值',
    '物理防御', '意志防御', '体质防御', '灵体强度', '移动力',
    '体型基数', '序列', '消化', '消化度', '位格', '神性补正'];
  for (let i = 0; i < extraAttrs.length; i++) {
    attrAliasYaml.push('  ' + extraAttrs[i] + ':');
    attrAliasYaml.push('    - ' + extraAttrs[i]);
  }

  // 尝试注册规则模板
  try {
    seal.gameSystem.newTemplateByYaml(attrAliasYaml.join('\n'));
  } catch (e) {
    // 模板格式可能不兼容，静默失败——不影响核心功能
  }
