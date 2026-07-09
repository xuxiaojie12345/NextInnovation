---
name: code-retention-stats
description: '统计分析 Git 提交采纳率：代码留存率、开发者提交存活度、文件稳定性、代码流失率等。固定分析 5 个远端分支 (origin/user/*) 的 api-ud/src/ 和 react-ud/src/ 下所有历史源文件，用 Python 实现，生成带图表的 HTML 报告。'
user-invocable: true
argument-hint: '分析时间范围（如 "30d"、"90d"、"all"），默认 all'
---

# Git 提交采纳率统计

## 使用场景
- 需要量化团队提交的代码最终被保留了多少（采纳率）
- 发现哪些开发者/模块的代码反复被重写（低采纳率）
- 识别高流失率的"问题文件"，辅助代码审查
- 评估代码稳定性，为重构决策提供数据支撑

## 核心概念

**代码采纳率** = 各远端分支上仍然存活的代码行 / 历史上所有提交添加的代码行 × 100%

> 脚本固定分析 5 个远端分支：`origin/user/duyage`、`origin/user/haohetao`、`origin/user/wangluxing`、`origin/user/wangqun`、`origin/user/yanwenjing`
>
> 只统计以下 5 位作者的提交：`yanwenjing`、`Awangluxing`、`haohetao20240507`、`duyage`、`wangqun`
>
> 每个提交的存活行数 = 该提交在所有分支上的最大存活行数（取 MAX）

## 统计指标

| 指标 | 说明 | 计算方式 |
|------|------|----------|
| **整体采纳率** | 项目所有提交的代码存活比例 | `所有分支存活行之和 / 历史新增行 × 100%` |
| **开发者采纳率** | 每位开发者提交代码的存活比例 | `该开发者存活行 / 该开发者新增行 × 100%` |
| **代码流失率** | 代码被删除/修改的频率 | `总删除行 / (总新增行 + 总删除行) × 100%` |
| **文件稳定度** | 文件创建后变更次数 | 按文件统计 commits 数量 |
| **高流失文件** | 新增后快速被删除/重写的文件 | 删除行 / 新增行 > 50% 的文件 |
| **周采纳趋势** | 每周提交的代码在各分支的存活情况 | 按周聚合的留存率折线图 |
| **提交类型分布** | 按 commit message 分类（feature/fix/refactor） | 正则匹配提交信息关键词 |
| **头部贡献者** | 代码净贡献量排名 | `新增行 - 删除行` 排名 |

## 使用方法

```bash
# 分析全部历史（默认）— 自动拉取远端最新数据
python scripts/stats.py

# 离线模式：跳过 git fetch，直接分析本地已缓存的数据
python scripts/stats.py --offline

# 分析最近 30 天的提交
python scripts/stats.py --since 30d

# 分析最近 90 天的提交
python scripts/stats.py --since 90d

# 指定输出目录
python scripts/stats.py --output ./report

# 组合使用
python scripts/stats.py --offline --since 30d --output ./my_report
```

> **注意**: 脚本启动时会先执行 `git fetch origin --prune` 拉取远端最新数据。
> 如果网络不通，会提示错误并终止执行。
> 使用 `--offline` 参数可跳过此步骤，直接使用本地已缓存的数据。

## 输出产物

| 文件 | 说明 |
|------|------|
| `report/adoption_report.html` | HTML 报告（含 ECharts 图表） |
| `report/adoption_report.json` | JSON 原始数据 |
| `report/high_churn_files.txt` | 高流失率文件列表 |
| `report/dev_retention_details.txt` | 各开发者详细留存数据 |

## 执行流程（内部逻辑）

[stats.py](./scripts/stats.py) 脚本按以下步骤执行：

### 0. 远端数据拉取
- 启动后首先执行 `git fetch origin --prune`，拉取远端仓库所有分支的最新数据
- 设置 60 秒超时，网络不通时提示错误并终止
- 指定 `--offline` 参数可跳过此步骤

### 1. Git 历史采集
- 在项目根目录执行 `git log --all` 获取全部提交历史
- 对每个 commit 解析：hash、作者、日期、提交信息、变更文件列表
- 通过 `git diff` 逐 commit 统计新增行数和删除行数
- 排除 merge commit（不统计代码变更）

### 2. 分支与作者过滤
- 取 5 个固定远端分支的提交并集：`origin/user/duyage`、`origin/user/haohetao`、`origin/user/wangluxing`、`origin/user/wangqun`、`origin/user/yanwenjing`
- 只保留属于这 5 个分支的提交，排除其他分支（如 `origin/user/mengxianqing`、`origin/user/wangjiande` 等）的独立提交
- 进一步只保留以下 5 位目标作者的提交：`yanwenjing`、`Awangluxing`、`haohetao20240507`、`duyage`、`wangqun`（排除基础框架提交等非目标贡献）
- 确保报告中的开发者、提交数、新增行数只反映这 5 位作者的工作量

### 3. 全分支遍历 — 代码存活计算
- 固定 5 个远端分支：`origin/user/duyage`、`origin/user/haohetao`、`origin/user/wangluxing`、`origin/user/wangqun`、`origin/user/yanwenjing`
- 对每个分支，用 `git log <branch>` 获取该分支的所有提交
- 用 `git ls-tree -r <branch>` 获取该分支独有的源文件列表（各分支文件列表不同）
- 对每个分支，用 `git blame <branch> --line-porcelain` 追踪每行代码的原始提交
- **存活行数** = 每个提交在所有分支上的最大存活行数（取 MAX）
  - 公共祖先提交的代码会被所有分支计入，取最大值
  - 各分支独有的文件只在该分支上被 blame 统计
- **采纳率** = 存活行数 / 该 commit 新增行数 × 100%

### 4. 文件稳定性分析
- 通过 `git log --all --numstat` 统计每个文件的修改次数
- 通过 `git diff` 统计每个文件的新增/删除行比
- 识别"一次性文件"（新增后很少修改）和"问题文件"（反复修改）

### 5. 提交分类
- 通过 commit message 关键词自动分类：
  - `feature/add/new/feat` → 功能开发
  - `fix/bug/hotfix/correct` → 缺陷修复
  - `refactor/重构/改善/optimize` → 重构优化
  - `docs/comment/doc` → 文档注释
  - `chore/update/upd/merge` → 日常维护

### 6. 报告生成
- 使用 ECharts（CDN 加载）生成交互式图表
- 生成带样式的自包含 HTML 报告
- 导出 JSON 供进一步分析
