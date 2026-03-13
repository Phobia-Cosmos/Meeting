---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  section {
    font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    font-size: 28px;
    padding: 48px 56px;
    color: #0f172a;
    background: linear-gradient(135deg, #eff6ff 0%, #ffffff 58%, #f8fafc 100%);
  }
  h1 {
    color: #1e3a8a;
    margin-bottom: 0.3em;
  }
  h2 {
    color: #1d4ed8;
    margin-bottom: 0.5em;
  }
  h3 {
    color: #334155;
    margin-bottom: 0.4em;
  }
  ul {
    line-height: 1.5;
  }
  strong {
    color: #1e40af;
  }
  section.title {
    background:
      radial-gradient(circle at top right, rgba(37, 99, 235, 0.18), transparent 22%),
      linear-gradient(135deg, #dbeafe 0%, #eff6ff 40%, #ffffff 100%);
  }
  section.title h1 {
    font-size: 2.0em;
    margin-top: 0.8em;
  }
  .lead {
    font-size: 1.05em;
    color: #475569;
    line-height: 1.7;
  }
  .meta {
    margin-top: 1.2em;
    font-size: 0.7em;
    color: #475569;
  }
  .small {
    font-size: 0.72em;
    color: #64748b;
  }
  .box {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 16px;
    padding: 16px 18px;
  }
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  .grid3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 14px;
  }
  .metric {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 16px;
    padding: 16px;
  }
  .metric b {
    display: block;
    font-size: 1.35em;
    color: #2563eb;
    margin-bottom: 6px;
  }
---

<!-- _class: title -->

# 缓存侧信道实验阶段进展

<div class="lead">
本周完成实验链路打通、脚本参数统一与首批结果采样，已经能够观察到目标事件与访存模式之间的稳定相关性。
</div>

<div class="meta">
日期：2026-03-14　|　汇报人：研究生示例　|　主题：实验验证与阶段分析
</div>

---

## 1. 本周目标

<div class="grid3">
<div class="box">

### 目标 1
完成实验环境搭建与依赖核查。

</div>
<div class="box">

### 目标 2
整理测试程序并固定输入条件。

</div>
<div class="box">

### 目标 3
采集第一批可对比的实验结果。

</div>
</div>

---

## 2. 本周完成工作

<div class="grid2">
<div class="box">

### 任务推进
- 搭建并验证实验运行环境
- 补充脚本以统一采样参数
- 生成第一版结果截图与统计摘要

</div>
<div class="box">

### 材料与产出
- 新增图片 / 截图：实验流程图、结果曲线截图
- 新增实验结果：三组对照数据
- 新增代码 / 文档：运行脚本与实验记录

</div>
</div>

<div class="small">
这一页强调“本周到底做成了什么，以及能展示什么结果”。
</div>

---

## 3. 方法与实验过程

<div class="grid2">
<div class="box">

### 执行步骤
- 固定输入参数，保证多轮实验条件一致
- 补充预热与重复采样，减少单次运行偶然性
- 记录每轮日志、截图与结果摘要，便于后续对照分析
- 将数据按实验组 / 对照组分类，形成可比较结果

</div>
<div class="box">

### 图示位置
后续这里可以直接替换成实验流程图或终端截图，例如：

`![w:520](./figures/process.png)`

</div>
</div>

---

## 4. 关键结果与阶段结论

<div class="grid3">
<div class="metric"><b>3 组</b> 已完成对照实验</div>
<div class="metric"><b>稳定</b> 主要趋势可重复观测</div>
<div class="metric"><b>可继续</b> 具备扩大样本条件</div>
</div>

<div class="grid2" style="margin-top:18px;">
<div class="box">

### 结果概览
- 重复运行后，目标模式在多轮实验中保持稳定趋势
- 在控制变量条件下，对照组与实验组出现可区分差异
- 部分噪声仍然存在，但不影响趋势判断

</div>
<div class="box">

### 一句话结论
当前方案已经具备继续放大实验规模的条件，研究重点可以从“跑通链路”转向“增强结果说服力”。

</div>
</div>

---

## 5. 问题与分析

<div class="grid2">
<div class="box">

### 当前问题
- 个别轮次数据抖动较大
- 结果规模暂时还不够大
- 还需要补充更多基线组比较

</div>
<div class="box">

### 原因与处理
- 系统后台任务与缓存状态可能引入噪声
- 准备加入更多轮次采样与预热策略
- 后续补充不同参数组合下的对比实验

</div>
</div>

---

## 6. 下周计划 / 讨论问题

<div class="grid2">
<div class="box">

### 下周计划
- 扩充样本规模并统计方差
- 补充不同参数组合下的对比结果
- 沉淀成可复现实验文档

</div>
<div class="box">

### 需要讨论的问题
- 是否需要引入更严格的基线实验
- 下一步更适合先扩展数据还是先优化攻击链路

</div>
</div>
