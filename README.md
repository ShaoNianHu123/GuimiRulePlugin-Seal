# 诡秘之主 D20 规则 —— 海豹 (SealDice) 移植版

原 [GuimiRulePlugin](https://github.com/ShaoNianHu123/GuimiRulePlugin) (OlivOS/Python) 和 [GuimiRulePlugin-Dice](https://github.com/ShaoNianHu123/GuimiRulePlugin-Dice) (Dice!/Lua) 的海豹 (SealDice) JavaScript 移植版。

> ⚠️ 声明：本项目由 AI 辅助编程完成，使用前请自行测试。

## 功能

| 指令 | 说明 | 示例 |
|------|------|------|
| `.诡秘 [数量]` | 随机生成人物属性（2d3，2~6） | `.诡秘` `.诡秘5` |
| `.诡秘4.0 [数量]` | 使用 4.0 预览属性表生成 | `.诡秘4.0` |
| `.gm <技能/属性>` | D20 技能/属性检定 | `.gm力量` `.gm格斗` |
| `.gmb <技能/属性>` | 奖励投（2d20 取高） | `.gmb力量` |
| `.gmp <技能/属性>` | 惩罚投（2d20 取低） | `.gmp格斗` |
| `.gmsc [成功损/失败损]` | 理智检定（rd20 vs 理智） | `.gmsc` `.gmsc 1d2/1d4` |
| `.gmri` | 先攻检定（rd20 + 敏捷） | `.gmri` |
| `.gminit list/clr/del` | 先攻列表管理 | `.gminit list` |
| `.gmsn` | 查看角色卡摘要 | `.gmsn` |
| `.gmst <属性> <值>` | 录入/查看角色属性 | `.gmst 力量 5` |

### 进阶用法

- **手动加值**：`.gm力量+2` `.gm格斗-1` `.gm格斗+2+3+4`（无限累加）
- **绝对指定**：`.gm力量5`（替换卡片值，而非叠加）
- **改判属性**：`.gm驯兽/教育`（用教育替代驯兽默认的力量关联）
- **奖励/惩罚投**：`.gm 优势 力量` / `.gm 劣势 格斗`
- **50+ 技能**自动匹配关联属性
- **大成功** (rd20=20) / **大失败** (rd20=1) 判定
- **SC** 半疯/真疯/失控阈值警告

## 安装

1. 将 `guimi_rule.js` 放入海豹的 `plugin/` 目录（通常在 `[SealDice]/data/plugin/`）
2. 重启海豹，或在 WebUI 中「扩展功能 → JavaScript 插件」中点击「重载 JS」
3. 在群内使用 `.ext GuimiRulePlugin on` 开启扩展

```
[SealDice]
  └── data/
       └── plugin/
            └── guimi_rule.js   ← 就这一个文件
```

## 快速上手

```
.gmst 力量 5           ← 录入属性
.gmst 体质 4
.gmst 敏捷 3
.gmst 灵感 6
.gmst 意志 5
.gmst 教育 4
.gmst 幸运 3
.gmst 格斗 2           ← 录入技能等级 (0~6)
.gmst 理智 20          ← 录入理智值
.诡秘                   ← 随机生成属性
.gm力量                 ← D20 属性检定
.gm格斗                 ← D20 技能检定
.gmsc 1/1d2             ← 理智检定
.gmri                   ← 先攻检定
.gmsn                   ← 查看角色卡摘要
```

## 技能等级加值

| 等级 | 加值 | 说明 |
|------|------|------|
| 0 | -4 | 未受训 |
| 1 | +2 | 受训 |
| 2 | +4 | 熟练 |
| 3 | +5 | 进阶 |
| 4 | +6 | 精通 |
| 5 | +7 | 博学 |
| 6 | +8 | 大师 |

技能等级通过 `.gmst 技能名 等级` 录入，如 `.gmst 格斗 2` 表示格斗为「熟练」。

## 可配置模板

在 WebUI 的「扩展功能 → JavaScript 插件 → GuimiRulePlugin」中，可编辑以下模板：

- 属性生成标题、D20检定各环节文案、SC理智检定文案、先攻检定文案
- 大成功/大失败/半疯/真疯/失控提示
- 错误提示文本

所有模板使用 `{变量名}` 占位符，运行时自动替换。

## 参考

- [GuimiRulePlugin](https://github.com/ShaoNianHu123/GuimiRulePlugin) — OlivOS 原版 (Python)
- [GuimiRulePlugin-Dice](https://github.com/ShaoNianHu123/GuimiRulePlugin-Dice) — Dice! Lua 移植版
