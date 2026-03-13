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
  img.result {
    max-width: 100%;
    max-height: 320px;
    display: block;
    margin: 0 auto;
  }
  footer {
    color: #64748b;
  }
---

<!-- _class: title -->

# [本周汇报标题]

<div class="lead">
[用一句话概括本周核心进展、关键结果，或本周最值得汇报的结论。]
</div>

<div class="meta">
日期：[YYYY-MM-DD]　|　汇报人：[你的名字]　|　研究主题：[课题名称]
</div>

---

## 1. 本周目标

<div class="grid3">
<div class="box">

### 目标 1
[目标描述]

</div>
<div class="box">

### 目标 2
[目标描述]

</div>
<div class="box">

### 目标 3
[目标描述]

</div>
</div>

<div class="small">
建议每个目标只写 1 句，讲清“要解决什么问题”。
</div>

---

## 2. 本周完成工作

<div class="grid2">
<div class="box">

### 任务推进
- 完成事项 1
- 完成事项 2
- 完成事项 3

</div>
<div class="box">

### 材料与产出
- 新增图片 / 截图：
- 新增实验结果：
- 新增代码 / 文档：

</div>
</div>

<div class="small">
这一页适合概括“本周做了什么”和“留下了哪些可展示的材料”。
</div>

---

## 3. 方法 / 实验 / 实现过程

<div class="grid2">
<div class="box">

### 过程说明
- 步骤 1：
- 步骤 2：
- 步骤 3：
- 关键实现点：

</div>
<div class="box">

### 插图位置
将这里替换为你的截图或流程图，例如：

`![w:520 result](./figures/process.png)`

如果暂时没有图片，也可以先写一段 2 到 3 句的说明。

</div>
</div>

---

## 4. 关键结果与结论

<div class="grid3">
<div class="metric"><b>[指标 A]</b> [指标解释]</div>
<div class="metric"><b>[指标 B]</b> [指标解释]</div>
<div class="metric"><b>[指标 C]</b> [指标解释]</div>
</div>

<div class="grid2" style="margin-top:18px;">
<div class="box">

### 结果图位置
`![w:520 result](./figures/result.png)`

</div>
<div class="box">

### 结果解读
- 结果 1：发生了什么变化
- 结果 2：为什么重要
- 结果 3：是否符合预期
- 一句话结论：

</div>
</div>

---

## 5. 问题与分析

<div class="grid2">
<div class="box">

### 当前问题
- 问题 1：
- 问题 2：
- 风险点：

</div>
<div class="box">

### 原因与处理
- 原因分析：
- 当前处理状态：
- 下一步准备：

</div>
</div>

---

## 6. 下周计划 / 讨论问题

<div class="grid2">
<div class="box">

### 下周计划
- 计划 1：
- 计划 2：
- 计划 3：

</div>
<div class="box">

### 需要讨论的问题
- 讨论点 1：
- 讨论点 2：

</div>
</div>

<div class="small">
如果内容较少，可以把“问题分析”和“下周计划”合并成最后一页。
</div>
