#!/usr/bin/env python3
"""
Git 提交采纳率统计工具 — NextInnovation 项目
基于 Git 历史分析：代码留存率、开发者采纳率、文件稳定度、代码流失趋势。
"""
import os
import re
import json
import argparse
import subprocess
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timedelta, timezone

# ── 配置 ──────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parents[4]
REPORT_DIR = PROJECT_ROOT / ".github" / "skills" / "code-retention-stats" / "report"
JST = timezone(timedelta(hours=9))
SOURCE_EXTENSIONS = {".java", ".ts", ".tsx", ".css", ".js", ".xml"}
SINCE_MAP = {"30d": "2026-06-08", "60d": "2026-05-09", "90d": "2026-04-09", "all": None}

def is_src_file(fpath):
    """判断文件路径是否属于 api-ud/src/ 或 react-ud/src/"""
    return fpath.startswith("api-ud/src/") or fpath.startswith("react-ud/src/")

# ═══════════════════════════════════════════════════════
#  分支配置 — 固定分析的远端分支列表
# ═══════════════════════════════════════════════════════
FIXED_BRANCHES = [
    "origin/user/duyage",
    "origin/user/haohetao",
    "origin/user/wangluxing",
    "origin/user/wangqun",
    "origin/user/yanwenjing",
]

# 只统计以下作者（排除基础框架提交的贡献者）
TARGET_AUTHORS = {"yanwenjing", "Awangluxing", "haohetao20240507", "duyage", "wangqun"}

def get_all_branches():
    """返回固定的远端分支列表"""
    return list(FIXED_BRANCHES)

def get_branch_commits(branch):
    """获取某个分支上的所有提交哈希集合"""
    cmd = ["git", "log", branch, "--format=%H"]
    result = subprocess.run(cmd, cwd=PROJECT_ROOT, capture_output=True, text=True, encoding="utf-8")
    if result.returncode != 0:
        return set()
    return {h.strip() for h in result.stdout.strip().splitlines() if h.strip()}

def get_branch_source_files(branch):
    """获取指定分支上属于 src/ 的源文件列表"""
    cmd = ["git", "ls-tree", "-r", branch, "--name-only", "api-ud/src/", "react-ud/src/"]
    result = subprocess.run(cmd, cwd=PROJECT_ROOT, capture_output=True, text=True, encoding="utf-8")
    if result.returncode != 0:
        return []
    return [f for f in result.stdout.strip().splitlines() if Path(f).suffix.lower() in SOURCE_EXTENSIONS]

# ═══════════════════════════════════════════════════════
#  Git 辅助函数
# ═══════════════════════════════════════════════════════
def git_log_numstat(since=None):
    """获取所有提交的详细信息（含文件级增删行数，只保留 src/ 下的文件）"""
    cmd = ["git", "log", "--all", "--numstat", "--format=COMMIT%n%H%n%ai%n%an%n%ae%n%s%n---"]
    if since:
        cmd.extend(["--since", since])
    result = subprocess.run(cmd, cwd=PROJECT_ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if result.returncode != 0:
        print(f"  ❌ git log 失败: {result.stderr}")
        return []
    commits = []
    current = None
    for line in result.stdout.strip().splitlines():
        line = line.strip()
        if line == "COMMIT":
            if current:
                commits.append(current)
            current = {"hash": "", "date": "", "author": "", "email": "", "message": "", "files": {}}
        elif current:
            if not current["hash"]:
                current["hash"] = line
            elif not current["date"]:
                current["date"] = line
            elif not current["author"]:
                current["author"] = line
            elif not current["email"]:
                current["email"] = line
            elif current["message"] == "" and line != "---":
                current["message"] = line
            elif line == "---":
                continue
            else:
                parts = line.split("\t")
                if len(parts) == 3:
                    adds, dels, fpath = parts
                    if adds != "-" and is_src_file(fpath):
                        current["files"][fpath] = {"added": int(adds), "deleted": int(dels) if dels != "-" else 0}
    if current:
        commits.append(current)
    return commits

def get_source_files():
    """获取项目中所有需要跟踪的源文件列表（相对路径）"""
    cmd = ["git", "ls-files", "api-ud/src/", "react-ud/src/"]
    result = subprocess.run(cmd, cwd=PROJECT_ROOT, capture_output=True, text=True, encoding="utf-8")
    if result.returncode != 0:
        return []
    return [f for f in result.stdout.strip().splitlines() if Path(f).suffix.lower() in SOURCE_EXTENSIONS]

def git_blame_surviving_on_branch(branch, source_files, commit_set):
    """对指定分支运行 git blame，返回 {commit_hash: 存活行数}"""
    if not source_files:
        return {}
    line_count = defaultdict(int)
    total_lines = 0
    for i, fpath in enumerate(source_files):
        if (i + 1) % 30 == 0:
            print(f"    进度: {i+1}/{len(source_files)}")
        cmd = ["git", "blame", "--line-porcelain", branch, "--", fpath]
        result = subprocess.run(cmd, cwd=PROJECT_ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
        if result.returncode != 0:
            continue
        for line_blob in result.stdout.split("\n"):
            line_blob = line_blob.strip()
            if not line_blob or line_blob.startswith("\t"):
                continue
            if any(line_blob.startswith(p) for p in [
                "author ", "committer ", "summary ", "previous ",
                "boundary", "filename ", "author-mail", "author-time",
                "author-tz", "committer-mail", "committer-time", "committer-tz"
            ]):
                continue
            potential_hash = line_blob.split()[0] if " " in line_blob else line_blob
            if len(potential_hash) == 40 and all(c in "0123456789abcdef" for c in potential_hash):
                if potential_hash in commit_set:
                    line_count[potential_hash] += 1
                    total_lines += 1
    return dict(line_count), total_lines

def git_blame_all_branches(branches, all_commits):
    """遍历所有固定分支，对每个分支运行 blame，汇总后每个提交取最大存活数"""
    all_commit_hashes = {c["hash"] for c in all_commits}
    per_commit_per_branch = defaultdict(dict)

    for b in branches:
        branch_commits = get_branch_commits(b) & all_commit_hashes
        if not branch_commits:
            print(f"  ⏭️  跳过 {b}（无相关提交）")
            continue
        # 获取该分支独有的源文件列表
        branch_files = get_branch_source_files(b)
        if not branch_files:
            print(f"  ⏭️  跳过 {b}（无源文件）")
            continue
        print(f"  🔍 正在分析分支: {b}（{len(branch_commits)} 个提交，{len(branch_files)} 个文件）...")
        result, total = git_blame_surviving_on_branch(b, branch_files, branch_commits)
        for ch, count in result.items():
            per_commit_per_branch[ch][b] = count
        print(f"    ✅ 存活 {total} 行，来自 {len(result)} 个提交")

    # 每个 commit 取最大存活数
    surviving = {}
    total_survived_all = 0
    for ch, branch_counts in per_commit_per_branch.items():
        max_val = max(branch_counts.values())
        surviving[ch] = max_val
        total_survived_all += max_val

    print(f"\n  📊 全部分支汇总: {total_survived_all} 行存活代码，来自 {len(surviving)} 个提交")
    return surviving

def git_file_churn(since=None):
    """统计每个文件的修改次数和增删行数"""
    cmd = ["git", "log", "--all", "--numstat", "--format="]
    if since:
        cmd.extend(["--since", since])
    result = subprocess.run(cmd, cwd=PROJECT_ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if result.returncode != 0:
        return {}
    file_stats = defaultdict(lambda: {"commits": 0, "added": 0, "deleted": 0})
    for line in result.stdout.strip().splitlines():
        parts = line.split("\t")
        if len(parts) == 3:
            adds, dels, fpath = parts
            if adds != "-" and Path(fpath).suffix.lower() in SOURCE_EXTENSIONS and is_src_file(fpath):
                file_stats[fpath]["commits"] += 1
                file_stats[fpath]["added"] += int(adds)
                file_stats[fpath]["deleted"] += int(dels) if dels != "-" else 0
    return dict(file_stats)

# ═══════════════════════════════════════════════════════
#  提交分类
# ═══════════════════════════════════════════════════════
def classify_commit(message):
    msg_lower = message.lower()
    patterns = {
        "功能开发": [r"\b(feature|feat|add|new)\b", "新規", "追加"],
        "缺陷修复": [r"\b(fix|bug|hotfix|correct)\b", "修正", "修復", "バグ"],
        "重构优化": [r"\b(refactor|optimize|improve|restruct)\b", "重构", "改善", "最適化", "リファクタ"],
        "文档注释": [r"\b(doc|comment|readme)\b", "ドキュメント", "コメント"],
        "日常维护": [r"\b(chore|update|upd|merge|clean|remove|delete)\b", "更新", "削除", "マージ"],
    }
    for category, pattern_list in patterns.items():
        for p in pattern_list:
            if re.search(p, msg_lower):
                return category
    return "其他"

# ═══════════════════════════════════════════════════════
#  核心分析
# ═══════════════════════════════════════════════════════
def analyze(commits, surviving, file_churn):
    total_added = 0
    total_survived = 0
    commit_details = []
    for c in commits:
        added = sum(f["added"] for f in c["files"].values())
        survived = surviving.get(c["hash"], 0)
        retention = round(survived / max(added, 1) * 100, 2)
        total_added += added
        total_survived += survived
        commit_details.append({
            "hash": c["hash"][:8], "full_hash": c["hash"], "date": c["date"],
            "author": c["author"], "email": c["email"], "message": c["message"],
            "category": classify_commit(c["message"]),
            "added": added, "survived": survived, "retention": retention,
        })
    # 按开发者聚合
    dev_stats = defaultdict(lambda: {"commits": 0, "added": 0, "survived": 0, "deleted": 0})
    for c in commits:
        a = c["author"]
        added = sum(f["added"] for f in c["files"].values())
        deleted = sum(f["deleted"] for f in c["files"].values())
        survived = surviving.get(c["hash"], 0)
        dev_stats[a]["commits"] += 1
        dev_stats[a]["added"] += added
        dev_stats[a]["survived"] += survived
        dev_stats[a]["deleted"] += deleted
    dev_summary = []
    for author, s in sorted(dev_stats.items(), key=lambda x: -x[1]["added"]):
        retention = round(s["survived"] / max(s["added"], 1) * 100, 2)
        churn = round(s["deleted"] / max(s["added"] + s["deleted"], 1) * 100, 2)
        dev_summary.append({"author": author, "commits": s["commits"], "added": s["added"],
            "survived": s["survived"], "deleted": s["deleted"], "retention": retention,
            "churn": churn, "net": s["added"] - s["deleted"]})
    # 按周聚合
    week_trend = defaultdict(lambda: {"added": 0, "survived": 0})
    for c in commit_details:
        try:
            dt = datetime.fromisoformat(c["date"])
            wk = dt.strftime("%Y-W%V")
            week_trend[wk]["added"] += c["added"]
            week_trend[wk]["survived"] += c["survived"]
        except ValueError:
            continue
    trend = [{"week": wk, "added": t["added"], "survived": t["survived"],
        "retention": round(t["survived"] / max(t["added"], 1) * 100, 2)}
        for wk, t in sorted(week_trend.items())]
    # 文件统计
    file_list = []
    for fpath, s in sorted(file_churn.items(), key=lambda x: -x[1]["commits"]):
        cr = round(s["deleted"] / max(s["added"], 1) * 100, 2)
        file_list.append({"file": fpath, "commits": s["commits"], "added": s["added"],
            "deleted": s["deleted"], "churn_rate": cr})
    high_churn_files = [f for f in file_list if f["churn_rate"] > 50 and f["added"] > 5]
    # 提交类型分布
    category_dist = defaultdict(lambda: {"count": 0, "added": 0, "survived": 0})
    for c in commit_details:
        cat = c["category"]
        category_dist[cat]["count"] += 1
        category_dist[cat]["added"] += c["added"]
        category_dist[cat]["survived"] += c["survived"]
    overall_retention = round(total_survived / max(total_added, 1) * 100, 2)
    return {
        "overall": {"total_commits": len(commits), "total_added": total_added,
            "total_survived": total_survived, "overall_retention": overall_retention,
            "total_developers": len(dev_summary)},
        "dev_summary": dev_summary, "trend": trend,
        "file_churn": file_list[:50], "high_churn_files": high_churn_files[:30],
        "commit_details": commit_details, "category_dist": dict(category_dist),
    }

# ═══════════════════════════════════════════════════════
#  HTML 报告生成（使用 template + replace 避免大括号冲突）
# ═══════════════════════════════════════════════════════
_TEMPLATE = Path(__file__).parent / "report_template.html"

def build_html(result):
    o = result["overall"]
    devs = result["dev_summary"]
    cat_dist = result["category_dist"]

    rc = "good" if o["overall_retention"] >= 70 else "warn" if o["overall_retention"] >= 40 else "bad"

    def cls(v, t70=70, t40=40):
        return "good" if v >= t70 else "warn" if v >= t40 else "bad"

    # 行模板
    dr = lambda d: (
        f'<tr><td><strong>{d["author"]}</strong></td><td>{d["commits"]}</td>'
        f'<td>{d["added"]}</td><td>{d["survived"]}</td><td>{d["deleted"]}</td>'
        f'<td class="{cls(d["retention"])}">{d["retention"]}%</td>'
        f'<td class="{cls(d["churn"],30,60)}">{d["churn"]}%</td>'
        f'<td>{d["net"]:+d}</td></tr>')
    fr = lambda f: (
        f'<tr><td style="font-size:12px;">{f["file"]}</td>'
        f'<td>{f["commits"]}</td><td>{f["added"]}</td><td>{f["deleted"]}</td>'
        f'<td class="{cls(f["churn_rate"],20,50)}">{f["churn_rate"]}%</td></tr>')
    hr = lambda f: (
        f'<tr><td style="font-size:12px;">{f["file"]}</td>'
        f'<td>{f["commits"]}</td><td>{f["added"]}</td><td>{f["deleted"]}</td>'
        f'<td class="bad">{f["churn_rate"]}%</td></tr>')
    mr = lambda c: (
        f'<tr><td><code>{c["hash"]}</code></td><td style="font-size:12px;">{c["date"][:10]}</td>'
        f'<td>{c["author"]}</td><td>{c["category"]}</td>'
        f'<td style="font-size:12px;max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="{c["message"]}">{c["message"][:40]}</td>'
        f'<td>{c["added"]}</td><td>{c["survived"]}</td>'
        f'<td class="{cls(c["retention"])}">{c["retention"]}%</td></tr>')

    # 预渲染 JS 数据（避免在 HTML 模板中嵌入 Python 表达式）
    dev_names = json.dumps([d["author"] for d in devs])
    dev_ret = json.dumps([d["retention"] for d in devs])
    dev_added = json.dumps([d["added"] for d in devs])
    dev_survived = json.dumps([d["survived"] for d in devs])
    cat_names = json.dumps(list(cat_dist.keys()))
    cat_ret = json.dumps([round(v["survived"] / max(v["added"],1)*100,1) for v in cat_dist.values()])
    pie_items = ", ".join(f'{{name:"{k}",value:{v["count"]}}}' for k,v in cat_dist.items())
    trend = result["trend"][-20:]
    trend_wk = json.dumps([t["week"] for t in trend])
    trend_rt = json.dumps([t["retention"] for t in trend])
    trend_ad = json.dumps([t["added"] for t in trend])

    # 开发者采纳率颜色数据
    dev_ret_colored = json.dumps([
        {"value": d["retention"],
         "itemStyle": {"color": "#27ae60" if d["retention"] >= 70 else "#f39c12" if d["retention"] >= 40 else "#e74c3c"}}
        for d in devs
    ])

    # 读模板
    tpl = _TEMPLATE.read_text("utf-8")

    # 替换
    subs = {
        "__NOW__": datetime.now(JST).strftime("%Y-%m-%d %H:%M"),
        "__TOTAL_COMMITS__": str(o["total_commits"]),
        "__TOTAL_DEVS__": str(o["total_developers"]),
        "__TOTAL_ADDED__": str(o["total_added"]),
        "__TOTAL_SURVIVED__": str(o["total_survived"]),
        "__RET_CLASS__": rc,
        "__RETENTION__": str(o["overall_retention"]),
        "__DEV_ROWS__": "".join(dr(d) for d in devs),
        "__FILE_ROWS__": "".join(fr(f) for f in result["file_churn"][:30]),
        "__HC_ROWS__": "".join(hr(f) for f in result["high_churn_files"]) or '<tr><td colspan="5" style="text-align:center;color:#999;">暂无高流失文件 ✅</td></tr>',
        "__COMMIT_ROWS__": "".join(mr(c) for c in result["commit_details"][:50]),
        "__TREND_WEEKS__": trend_wk,
        "__TREND_RET__": trend_rt,
        "__TREND_ADDED__": trend_ad,
        "__DEV_NAMES__": dev_names,
        "__DEV_RET__": dev_ret_colored,
        "__DEV_ADDED__": dev_added,
        "__DEV_SURVIVED__": dev_survived,
        "__CAT_NAMES__": cat_names,
        "__CAT_RET__": cat_ret,
        "__PIE_ITEMS__": pie_items,
    }
    for k, v in subs.items():
        tpl = tpl.replace(k, v)
    return tpl

# ═══════════════════════════════════════════════════════
#  主入口
# ═══════════════════════════════════════════════════════
def main():
    parser = argparse.ArgumentParser(description="Git 提交采纳率统计工具")
    parser.add_argument("--since", default="all", help="分析时间范围: 30d / 60d / 90d / all")
    parser.add_argument("--output", default=str(REPORT_DIR), help="报告输出目录")
    parser.add_argument("--offline", action="store_true", help="跳过 git fetch，直接分析本地已缓存的数据")
    args = parser.parse_args()
    since_param = SINCE_MAP.get(args.since, args.since)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    if not (PROJECT_ROOT / ".git").exists():
        print(f"❌ 不是 Git 仓库: {PROJECT_ROOT}")
        return
    print(f"📊 Git 提交采纳率统计\n📁 项目: {PROJECT_ROOT}\n📅 时间范围: {args.since} ({since_param or '全部历史'})\n")

    # 先拉取远端最新数据（除非指定 --offline）
    if args.offline:
        print("⏳ --offline 模式已启用，跳过 git fetch，直接使用本地已缓存的数据\n")
    else:
        print("⏳ 正在拉取远端仓库最新数据（git fetch origin --prune）...")
        try:
            result = subprocess.run(
                ["git", "fetch", "origin", "--prune"],
                cwd=PROJECT_ROOT,
                capture_output=True, text=True, encoding="utf-8",
                timeout=60,
            )
            if result.returncode != 0:
                stderr_preview = result.stderr.strip()[:200]
                print(f"\n{'='*55}")
                print(f"  ❌ git fetch 失败 (exit code {result.returncode})")
                print(f"     错误信息: {stderr_preview}")
                print(f"\n  ⚠️  无法连接到远端仓库，请检查网络后重试。")
                print(f"{'='*55}\n")
                return
            output = result.stdout.strip()
            if output:
                for line in output.splitlines()[:10]:
                    print(f"  {line}")
            else:
                print(f"  ✅ 远端已是最新，无需更新")
        except subprocess.TimeoutExpired:
            print(f"\n{'='*55}")
            print(f"  ❌ git fetch 超时（超过 60 秒无响应）")
            print(f"\n  ⚠️  无法连接到远端仓库（网络超时），请检查网络后重试。")
            print(f"{'='*55}\n")
            return
        except Exception as e:
            print(f"\n{'='*55}")
            print(f"  ❌ git fetch 发生未知错误: {e}")
            print(f"\n  ⚠️  请检查网络后重试。")
            print(f"{'='*55}\n")
            return
        print()

    print("⏳ 正在获取提交历史...")
    commits = git_log_numstat(since_param)
    print(f"  ✅ 共获取 {len(commits)} 个提交\n")
    if not commits:
        print("❌ 没有获取到提交数据")
        return
    print("⏳ 正在获取全部分支...")
    branches = get_all_branches()
    print(f"  ✅ 共 {len(branches)} 个固定分支: {', '.join(branches)}\n")

    # 只保留属于这5个分支且由目标作者提交的历史
    print("⏳ 正在过滤提交，只保留5个分支上的历史...")
    branch_commit_union = set()
    for b in branches:
        branch_commit_union |= get_branch_commits(b)
    before = len(commits)
    commits = [c for c in commits if c["hash"] in branch_commit_union]
    print(f"  ✅ 分支过滤后: {len(commits)}/{before} 个提交")

    before2 = len(commits)
    commits = [c for c in commits if c["author"] in TARGET_AUTHORS]
    print(f"  ✅ 作者过滤后: {len(commits)}/{before2} 个提交（仅保留 {', '.join(sorted(TARGET_AUTHORS))}）\n")

    print("⏳ 正在遍历所有固定分支，逐个分析代码存活情况（使用各分支独有的文件列表）...")
    surviving = git_blame_all_branches(branches, commits)
    print()

    print("⏳ 正在统计文件变更情况...")
    file_churn = git_file_churn(since_param)
    print(f"  ✅ 共 {len(file_churn)} 个文件有变更记录\n")

    print("⏳ 正在聚合计算...")
    result = analyze(commits, surviving, file_churn)
    o = result["overall"]
    print(f"\n{'='*55}\n  📊 整体采纳率:     {o['overall_retention']}%\n  📝 总提交数:       {o['total_commits']}\n  👥 开发者数:       {o['total_developers']}\n  ➕ 历史新增行:     {o['total_added']}\n  💚 当前存活行:     {o['total_survived']}\n")
    print(f"  👨‍💻 开发者采纳率 TOP 3:")
    for d in result["dev_summary"][:3]:
        print(f"    {d['author']:20s}  {d['retention']:6.2f}%  ({d['survived']}/{d['added']})")
    print(f"{'='*55}\n")
    json_path = output_dir / "adoption_report.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"✅ JSON: {json_path}")
    hc_path = output_dir / "high_churn_files.txt"
    with open(hc_path, "w", encoding="utf-8") as f:
        for hf in result["high_churn_files"]:
            f.write(f"{hf['file']}\t流失率:{hf['churn_rate']}%\t修改:{hf['commits']}次\t新增:{hf['added']}\t删除:{hf['deleted']}\n")
    print(f"✅ 高流失文件: {hc_path}")
    dev_path = output_dir / "dev_retention_details.txt"
    with open(dev_path, "w", encoding="utf-8") as f:
        f.write(f"{'开发者':20s} {'提交数':>6s} {'新增行':>8s} {'存活行':>8s} {'删除行':>8s} {'采纳率':>8s} {'流失率':>8s} {'净贡献':>8s}\n" + "-"*75 + "\n")
        for d in result["dev_summary"]:
            f.write(f"{d['author']:20s} {d['commits']:6d} {d['added']:8d} {d['survived']:8d} {d['deleted']:8d} {d['retention']:7.2f}% {d['churn']:7.2f}% {d['net']:+8d}\n")
    print(f"✅ 开发者详情: {dev_path}")
    html = build_html(result)
    html_path = output_dir / "adoption_report.html"
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"✅ HTML 报告: {html_path}\n📊 请在浏览器中打开 HTML 文件查看可视化报告。")

if __name__ == "__main__":
    main()
