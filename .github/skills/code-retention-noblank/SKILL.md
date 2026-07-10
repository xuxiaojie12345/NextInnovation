---
name: code-retention-noblank
description: '统计排除空行后的 Git 提交采纳率，其余同 code-retention-stats。固定分析 5 个远端分支 (origin/user/*) 的 api-ud/src/main 和 react-ud/src/ 下所有历史源文件，空行不计入采纳率计算。'
user-invocable: true
argument-hint: '分析时间范围（如 "30d"、"90d"、"all"），默认 all'
---

# Git 提交采纳率统计（排除空行版）

## 与 code-retention-stats 的区别

| 项目 | code-retention-stats | code-retention-noblank |
|------|:---:|:---:|
| 计算空行 | ✅ 计入 | ❌ 排除 |
| 计算注释行 | ✅ 计入 | ✅ 计入 |
| 其他所有逻辑 | 相同 | 相同 |

> 空行不纳入"新增行"和"存活行"的计数，避免格式化工具带来的数据偏差。

## 核心概念

**代码采纳率** = 各远端分支上仍存活的**非空**代码行 / 历史上所有提交添加的**非空**代码行 × 100%

## 统计指标

| 指标 | 说明 |
|------|------|
| **整体采纳率** | 项目所有提交的代码存活比例（不含空行） |
| **开发者采纳率** | 每位开发者提交代码的存活比例（不含空行） |
| **代码流失率** | 代码被删除/修改的频率 |
| **文件稳定度** | 文件创建后变更次数 |
| **高流失文件** | 新增后快速被删除/重写的文件 |
| **周采纳趋势** | 每周提交的代码在各分支的存活情况 |
| **提交类型分布** | 按 commit message 分类（feature/fix/refactor） |
| **头部贡献者** | 代码净贡献量排名 |

## 使用方法

```bash
# 分析全部历史（默认）
python scripts/stats.py

# 离线模式
python scripts/stats.py --offline

# 分析最近 30 天的提交
python scripts/stats.py --since 30d

# 指定输出目录
python scripts/stats.py --output ./report
```

## 输出产物

| 文件 | 说明 |
|------|------|
| `report/adoption_report_YYYYMMDD-HHMM.html` | HTML 报告（含 ECharts 图表） |
| `report/adoption_report_YYYYMMDD-HHMM.json` | JSON 原始数据 |
| `report/high_churn_files_YYYYMMDD-HHMM.txt` | 高流失率文件列表 |
| `report/dev_retention_details_YYYYMMDD-HHMM.txt` | 各开发者详细留存数据 |

## 执行流程

[stats.py](./scripts/stats.py) 执行流程与 `code-retention-stats` 基本相同，唯一区别在于：

1. **Git 历史采集** — 同原版
2. **分支与作者过滤** — 同原版
3. **全分支遍历 — 代码存活计算** — 在 `git blame --line-porcelain` 解析时，**跳过空行**（`content.strip() == ""` 的行不计数）
4. **文件稳定性分析** — 同原版
5. **提交分类** — 同原版
6. **报告生成** — 同原版
