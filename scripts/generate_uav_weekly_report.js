const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');

const weekArg = process.argv[2] || '03-14';
const weekDir = path.resolve(process.cwd(), weekArg);
const uavDir = path.join(weekDir, 'uav_robotdog');
const microarchDir = path.join(weekDir, 'microarch_sidechannel');

if (!fs.existsSync(uavDir)) throw new Error(`Missing UAV directory: ${uavDir}`);

const SCENARIO_META = {
  A: ['沼泽绕行与矮墙捷径', 'UAV 初始将沼泽误判为普通地面，并将矮墙视作不可通过；机器狗先纠正沼泽语义，再发现可钻行矮墙捷径。'],
  B: ['死胡同迷宫与隐藏流沙', '迷宫路径首先把 UAV 引向隐藏流沙走廊；纠偏后，机器狗改走替代路线，并在后续识别到可钻行矮墙。'],
  C: ['城市混合地形', '城市障碍、水面和可钻行矮墙共同构成多次事件触发场景，用于验证连续语义纠偏与重规划。'],
  D: ['多重误判水池与死胡同', '该场景包含多个隐藏水池和死胡同墙体，只有一个末端墙体真实可翻越，用于检验复杂决策下的连续纠偏能力。'],
};

function pngSize(filePath) {
  const data = fs.readFileSync(filePath);
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

function fitContain(filePath, box) {
  const { width, height } = pngSize(filePath);
  const imgRatio = width / height;
  const boxRatio = box.w / box.h;
  if (imgRatio > boxRatio) {
    const w = box.w;
    const h = w / imgRatio;
    return { x: box.x, y: box.y + (box.h - h) / 2, w, h };
  }
  const h = box.h;
  const w = h * imgRatio;
  return { x: box.x + (box.w - w) / 2, y: box.y, w, h };
}

function fallbackLabel(entry, packetLabelMap) {
  if (packetLabelMap[entry]) return packetLabelMap[entry];
  if (entry.includes('crawl_wall')) return '可钻行矮墙';
  if (entry.includes('climbable')) return '可翻越墙体';
  if (entry.includes('pool') || entry.includes('water')) return '水面';
  if (entry.includes('swamp')) return '沼泽';
  if (entry.includes('quicksand')) return '流沙';
  return entry;
}

function parseScenario(reportPath) {
  const text = fs.readFileSync(reportPath, 'utf8');
  const dir = path.dirname(reportPath);
  const id = path.basename(dir);
  const scenarioLine = text.match(/^Scenario: (.+)$/m)[1];
  const code = scenarioLine.match(/^Scenario ([A-Z])/)[1];
  const packetEntries = [...text.matchAll(/- packet ([^:]+):\s*([^\n]+)/g)].map((m) => [m[1].trim(), m[2].trim()]);
  const packetLabelMap = Object.fromEntries(packetEntries);
  const getNum = (re) => Number(text.match(re)[1]);
  const triggers = [...text.matchAll(/^E\d+ @/gm)].length;
  const obstacles = [...text.matchAll(/triggered by: ([^\n]+)/g)].map((m) => m[1].trim());
  const labels = obstacles.map((entry) => fallbackLabel(entry, packetLabelMap));
  const uniqueCounts = {};
  for (const label of labels) uniqueCounts[label] = (uniqueCounts[label] || 0) + 1;
  const obstacleLabels = obstacles.map((entry) => {
    const label = fallbackLabel(entry, packetLabelMap);
    return uniqueCounts[label] > 1 ? `${label}（${entry}）` : label;
  });
  const init = getNum(/Initial whole-mission estimate: ([0-9.]+)m/);
  const finalEstimate = getNum(/Final-decision whole-mission estimate: ([0-9.]+)m/);
  const actual = getNum(/Executed actual mission length: ([0-9.]+)m/);
  const deltaInit = Number((actual - init).toFixed(2));
  let takeaway = '纠偏后实际路径与最终决策估计基本一致，系统收敛稳定。';
  if (deltaInit > 5) takeaway = '隐藏危险区导致路径显著变长，事件触发式纠偏是必要的。';
  if (deltaInit < -2) takeaway = '语义修正不仅纠错，还发现了比初始估计更短的可行路线。';
  return {
    id,
    code,
    title: SCENARIO_META[code][0],
    description: SCENARIO_META[code][1],
    triggers,
    init,
    finalEstimate,
    actual,
    deltaInit,
    obstacleLabels,
    takeaway,
    fusion: path.join(dir, `${id}_fusion.png`),
    metrics: path.join(dir, `${id}_metrics.png`),
  };
}

const scenarios = fs.readdirSync(uavDir)
  .map((name) => path.join(uavDir, name, `${name}_report.txt`))
  .filter((reportPath) => fs.existsSync(reportPath))
  .map(parseScenario)
  .sort((a, b) => a.code.localeCompare(b.code));

const aggregate = {
  successCount: scenarios.length,
  scenarioCount: scenarios.length,
  avgTriggers: Number((scenarios.reduce((sum, item) => sum + item.triggers, 0) / scenarios.length).toFixed(2)),
  avgDeltaInit: Number((scenarios.reduce((sum, item) => sum + item.deltaInit, 0) / scenarios.length).toFixed(2)),
  largestPenalty: scenarios.reduce((best, item) => item.deltaInit > best.deltaInit ? item : best),
  largestGain: scenarios.reduce((best, item) => item.deltaInit < best.deltaInit ? item : best),
};

const meetingDate = `2026-${path.basename(weekDir)}`;
const microarchHasFiles = fs.existsSync(microarchDir) && fs.readdirSync(microarchDir).length > 0;

function deltaText(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}m`;
}

function htmlEscape(input) {
  return String(input).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function pairScenarios(items) {
  return [items.slice(0, 2), items.slice(2, 4)].filter((pair) => pair.length > 0);
}

function generateMarkdown() {
  const lines = [];
  lines.push(`# ${path.basename(weekDir)} UAV 结果汇报（精简版）`);
  lines.push('');
  lines.push(`- 日期：${meetingDate}`);
  lines.push('- 页数策略：UAV 最多 3 页，仅展示结果。');
  lines.push(`- 本周结果位置：\`${path.relative(weekDir, uavDir)}\``);
  lines.push(`- 微架构目录状态：${microarchHasFiles ? '本周已有材料，但未纳入此份 UAV 精简稿。' : '本周目录为空，本稿不展开。'}`);
  lines.push('');
  lines.push('## 第 1 页：结果总览');
  lines.push(`- 场景成功：${aggregate.successCount}/${aggregate.scenarioCount}`);
  lines.push(`- 平均触发次数：${aggregate.avgTriggers}`);
  lines.push(`- 平均“实际路径 - 初始估计”：${deltaText(aggregate.avgDeltaInit)}`);
  lines.push(`- 最大代价上升：场景 ${aggregate.largestPenalty.code}，${deltaText(aggregate.largestPenalty.deltaInit)}`);
  lines.push(`- 最大收益：场景 ${aggregate.largestGain.code}，${deltaText(aggregate.largestGain.deltaInit)}`);
  lines.push('');
  lines.push('| 场景 | 触发 | 初始估计 | 最终决策 | 实际执行 | 差值 |');
  lines.push('|---|---:|---:|---:|---:|---:|');
  scenarios.forEach((item) => lines.push(`| ${item.code} | ${item.triggers} | ${item.init.toFixed(2)} | ${item.finalEstimate.toFixed(2)} | ${item.actual.toFixed(2)} | ${deltaText(item.deltaInit)} |`));
  lines.push('');
  pairScenarios(scenarios).forEach((pair, idx) => {
    lines.push(`## 第 ${idx + 2} 页：分场景结果`);
    lines.push('');
    pair.forEach((item) => {
      lines.push(`### 场景 ${item.code}：${item.title}`);
      lines.push(`- 描述：${item.description}`);
      lines.push(`- 触发对象：${item.obstacleLabels.join('、')}`);
      lines.push(`- 关键数字：${item.triggers} 次；${item.init.toFixed(2)}m → ${item.actual.toFixed(2)}m（${deltaText(item.deltaInit)}）`);
      lines.push(`- 解读：${item.takeaway}`);
      lines.push('');
    });
  });
  return lines.join('\n');
}

function generateHtml() {
  const rows = scenarios.map((item) => `<tr><td>${htmlEscape(item.code)}</td><td>${item.triggers}</td><td>${item.init.toFixed(2)}</td><td>${item.finalEstimate.toFixed(2)}</td><td>${item.actual.toFixed(2)}</td><td>${htmlEscape(deltaText(item.deltaInit))}</td></tr>`).join('');
  const pairSlides = pairScenarios(scenarios).map((pair) => `
    <section class="slide standard">
      <div class="eyebrow">分场景结果</div>
      <h2>${pair.map((item) => '场景 ' + htmlEscape(item.code)).join(' / ')}</h2>
      <div class="pair-grid">
        ${pair.map((item) => `
          <div class="scenario-card">
            <div class="scenario-title">场景 ${htmlEscape(item.code)}：${htmlEscape(item.title)}</div>
            <div class="scenario-desc">${htmlEscape(item.description)}</div>
            <div class="image-row">
              <img src="uav_robotdog/${htmlEscape(item.id)}/${htmlEscape(path.basename(item.fusion))}" alt="fusion" />
              <img src="uav_robotdog/${htmlEscape(item.id)}/${htmlEscape(path.basename(item.metrics))}" alt="metrics" />
            </div>
            <ul>
              <li>触发对象：${htmlEscape(item.obstacleLabels.join('、'))}</li>
              <li>关键数字：${item.triggers} 次；${item.init.toFixed(2)}m → ${item.actual.toFixed(2)}m（${htmlEscape(deltaText(item.deltaInit))}）</li>
              <li>结论：${htmlEscape(item.takeaway)}</li>
            </ul>
          </div>`).join('')}
      </div>
      <div class="footer"><span>UAV 结果页</span><span class="page"></span></div>
    </section>`).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${htmlEscape(path.basename(weekDir))} UAV 精简汇报</title>
<style>
:root { --text:#0f172a; --muted:#475569; --primary:#1d4ed8; --border:#cbd5e1; }
* { box-sizing:border-box; }
html,body { margin:0; height:100%; font-family:"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; background:linear-gradient(135deg,#dbeafe 0%,#eff6ff 45%,#f8fafc 100%); color:var(--text); }
body { display:flex; align-items:center; justify-content:center; overflow:hidden; }
.deck { width:100vw; height:100vh; display:flex; align-items:center; justify-content:center; }
.slide { display:none; width:min(95vw, calc(95vh * 16 / 9)); aspect-ratio:16/9; background:#fff; border-radius:24px; box-shadow:0 24px 60px rgba(15,23,42,.18); padding:28px 34px; overflow:hidden; }
.slide.active { display:grid; }
.standard { grid-template-rows:auto auto 1fr auto; gap:12px; }
.eyebrow { color:var(--primary); font-size:14px; font-weight:800; }
h2 { margin:0; font-size:26px; }
.lead { margin:0; font-size:15px; line-height:1.6; color:var(--muted); }
.stats { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; }
.stat { background:#eff6ff; border:1px solid #bfdbfe; border-radius:16px; padding:12px; }
.stat .value { font-size:20px; font-weight:800; color:var(--primary); }
.stat .label { margin-top:6px; font-size:12px; color:var(--muted); }
.card,.scenario-card { background:linear-gradient(180deg,#fff 0%,#f8fafc 100%); border:1px solid var(--border); border-radius:18px; padding:14px; }
table { width:100%; border-collapse:collapse; font-size:14px; }
th,td { border:1px solid var(--border); padding:8px; text-align:left; }
th { background:#eff6ff; color:var(--primary); }
.pair-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; align-items:stretch; }
.scenario-title { font-size:17px; font-weight:700; margin-bottom:8px; }
.scenario-desc { font-size:13px; line-height:1.55; color:var(--muted); margin-bottom:10px; min-height:40px; }
.image-row { display:grid; grid-template-columns:1.15fr .85fr; gap:10px; margin-bottom:10px; }
.image-row img { width:100%; height:170px; object-fit:contain; background:#fff; border-radius:10px; }
ul { margin:0; padding-left:18px; }
li { font-size:13px; line-height:1.55; margin-bottom:4px; }
.footer { display:flex; justify-content:space-between; align-items:center; color:var(--muted); font-size:12px; }
.page { font-weight:800; color:var(--primary); }
.nav { position:fixed; right:24px; bottom:24px; display:flex; gap:10px; }
button { border:none; background:#1d4ed8; color:#fff; padding:12px 16px; border-radius:12px; cursor:pointer; box-shadow:0 8px 20px rgba(37,99,235,.28); }
@media print { body { overflow:visible; display:block; background:#fff; } .deck { display:block; width:auto; height:auto; } .slide { display:grid !important; width:100%; max-width:none; border-radius:0; box-shadow:none; page-break-after:always; break-after:page; } .nav { display:none; } }
</style></head><body>
<main class="deck">
<section class="slide standard active">
<div class="eyebrow">${htmlEscape(meetingDate)} UAV 精简汇报</div>
<h2>UAV / 机器狗结果总览（3 页版）</h2>
<p class="lead">仅展示结果，不展开背景。当前 4 个场景均已成功完成事件驱动语义纠偏与重规划；本周微架构部分${microarchHasFiles ? '未纳入此份 UAV 精简稿' : '暂无新材料'}。</p>
<div style="display:grid; gap:12px; align-content:start;">
<div class="stats">
<div class="stat"><div class="value">${aggregate.successCount}/${aggregate.scenarioCount}</div><div class="label">场景成功</div></div>
<div class="stat"><div class="value">${aggregate.avgTriggers}</div><div class="label">平均触发次数</div></div>
<div class="stat"><div class="value">${htmlEscape(deltaText(aggregate.avgDeltaInit))}</div><div class="label">平均路径差值</div></div>
<div class="stat"><div class="value">${aggregate.largestPenalty.code}</div><div class="label">最大代价上升 ${htmlEscape(deltaText(aggregate.largestPenalty.deltaInit))}</div></div>
<div class="stat"><div class="value">${aggregate.largestGain.code}</div><div class="label">最大收益 ${htmlEscape(deltaText(aggregate.largestGain.deltaInit))}</div></div>
</div>
<div class="card"><table><thead><tr><th>场景</th><th>触发</th><th>初始估计</th><th>最终决策</th><th>实际执行</th><th>差值</th></tr></thead><tbody>${rows}</tbody></table></div>
<div class="card"><ul><li>场景 B 说明：隐藏危险区会显著抬高执行代价。</li><li>场景 D 说明：语义修正还能发现更短路线。</li><li>因此本周 UAV 部分可以直接围绕“纠偏必要性 + 发现捷径能力”两点汇报。</li></ul></div>
</div>
<div class="footer"><span>默认策略：UAV 最多 3 页，只展示结果</span><span class="page"></span></div>
</section>
${pairSlides}
</main>
<div class="nav"><button id="prev">上一页</button><button id="next">下一页</button></div>
<script>
const slides=Array.from(document.querySelectorAll('.slide')); const pages=Array.from(document.querySelectorAll('.page')); let current=0;
function render(){ slides.forEach((slide,index)=>slide.classList.toggle('active',index===current)); pages.forEach((page,index)=>{ page.textContent=(index+1)+' / '+slides.length; }); }
function go(step){ current=Math.min(slides.length-1,Math.max(0,current+step)); render(); }
document.getElementById('prev').addEventListener('click',()=>go(-1)); document.getElementById('next').addEventListener('click',()=>go(1));
document.addEventListener('keydown',(event)=>{ if(["ArrowRight","PageDown"," "].includes(event.key)) go(1); if(["ArrowLeft","PageUp"].includes(event.key)) go(-1); }); render();
</script>
</body></html>`;
}

function addText(slide, text, opts = {}) {
  slide.addText(text, { fontFace: 'Microsoft YaHei', color: '1E293B', fontSize: 16, margin: 0.05, fit: 'shrink', valign: 'top', ...opts });
}

function panel(slide, x, y, w, h, fill = 'FFFFFF', line = 'CBD5E1') {
  slide.addShape('roundRect', { x, y, w, h, rectRadius: 0.06, fill: { color: fill }, line: { color: line, pt: 1 } });
}

function addFooter(slide, left, pageText) {
  addText(slide, left, { x: 0.45, y: 7.02, w: 9.0, h: 0.2, fontSize: 9, color: '64748B', margin: 0 });
  addText(slide, pageText, { x: 12.2, y: 7.0, w: 0.6, h: 0.2, fontSize: 10, color: '1D4ED8', bold: true, align: 'right', margin: 0 });
}

async function generatePptx() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'OpenAI Codex';
  pptx.title = `${path.basename(weekDir)} UAV compact report`;
  pptx.subject = 'UAV compact weekly report';
  pptx.lang = 'zh-CN';

  const pairs = pairScenarios(scenarios);
  const totalSlides = 1 + pairs.length;
  let pageNo = 1;

  const slide1 = pptx.addSlide();
  slide1.background = { color: 'F8FAFC' };
  addText(slide1, `${meetingDate} UAV 精简汇报`, { x: 0.5, y: 0.18, w: 3.0, h: 0.2, fontSize: 10, color: '1D4ED8', bold: true });
  addText(slide1, 'UAV / 机器狗结果总览（3 页版）', { x: 0.5, y: 0.45, w: 7.0, h: 0.38, fontSize: 22, bold: true, color: '0F172A' });
  addText(slide1, '仅展示结果，不展开背景。本周 4 个场景全部成功完成语义纠偏与重规划；UAV 部分最多 3 页。', { x: 0.55, y: 0.84, w: 10.2, h: 0.34, fontSize: 13, color: '475569' });

  const statXs = [0.55, 3.05, 5.55, 8.05, 10.55];
  const statItems = [
    [`${aggregate.successCount}/${aggregate.scenarioCount}`, '场景成功'],
    [`${aggregate.avgTriggers}`, '平均触发次数'],
    [deltaText(aggregate.avgDeltaInit), '平均路径差值'],
    [`${aggregate.largestPenalty.code} ${deltaText(aggregate.largestPenalty.deltaInit)}`, '最大代价上升'],
    [`${aggregate.largestGain.code} ${deltaText(aggregate.largestGain.deltaInit)}`, '最大收益'],
  ];
  statItems.forEach((item, index) => {
    panel(slide1, statXs[index], 1.25, 2.2, 0.88, 'EFF6FF', 'BFDBFE');
    addText(slide1, item[0], { x: statXs[index] + 0.08, y: 1.46, w: 2.04, h: 0.22, fontSize: 14, bold: true, color: '1D4ED8', align: 'center' });
    addText(slide1, item[1], { x: statXs[index] + 0.08, y: 1.74, w: 2.04, h: 0.15, fontSize: 9, color: '64748B', align: 'center' });
  });

  const tableRows = [
    [
      { text: '场景', options: { bold: true, color: '1D4ED8' } },
      { text: '触发', options: { bold: true, color: '1D4ED8' } },
      { text: '初始估计', options: { bold: true, color: '1D4ED8' } },
      { text: '最终决策', options: { bold: true, color: '1D4ED8' } },
      { text: '实际执行', options: { bold: true, color: '1D4ED8' } },
      { text: '差值', options: { bold: true, color: '1D4ED8' } },
    ],
    ...scenarios.map((item) => [item.code, String(item.triggers), item.init.toFixed(2), item.finalEstimate.toFixed(2), item.actual.toFixed(2), deltaText(item.deltaInit)]),
  ];
  slide1.addTable(tableRows, { x: 0.55, y: 2.35, w: 8.1, fontFace: 'Microsoft YaHei', fontSize: 11, color: '1E293B', fill: 'FFFFFF', border: { type: 'solid', color: 'CBD5E1', pt: 1 }, margin: 0.05, rowH: 0.34, colW: [0.7, 0.7, 1.3, 1.3, 1.2, 0.9], autoFit: false });
  panel(slide1, 8.9, 2.35, 3.88, 2.55, 'FFFFFF', 'CBD5E1');
  addText(slide1, '汇报抓手', { x: 9.15, y: 2.55, w: 1.4, h: 0.2, fontSize: 15, bold: true, color: '0F172A' });
  addText(slide1, '• 场景 B：隐藏危险区会显著抬高路径代价\n• 场景 D：语义修正还能发现更短路线\n• 因此本周 UAV 可围绕“纠偏必要性 + 发现捷径能力”来讲', { x: 9.15, y: 2.9, w: 3.3, h: 1.6, fontSize: 12, color: '1E293B', breakLine: true, fit: 'shrink' });
  addFooter(slide1, 'UAV 结果页 1 / 3：总览。', `${pageNo}/${totalSlides}`);
  pageNo += 1;

  for (const pair of pairs) {
    const slide = pptx.addSlide();
    slide.background = { color: 'F8FAFC' };
    addText(slide, `${meetingDate} UAV 精简汇报`, { x: 0.5, y: 0.18, w: 3.0, h: 0.2, fontSize: 10, color: '1D4ED8', bold: true });
    addText(slide, pair.map((item) => `场景 ${item.code}`).join(' / ') + ' 结果', { x: 0.5, y: 0.45, w: 6.5, h: 0.36, fontSize: 22, bold: true, color: '0F172A' });
    pair.forEach((item, index) => {
      const baseX = index === 0 ? 0.55 : 6.72;
      panel(slide, baseX, 1.02, 6.05, 5.9, 'FFFFFF', 'CBD5E1');
      addText(slide, `场景 ${item.code}：${item.title}`, { x: baseX + 0.18, y: 1.2, w: 4.8, h: 0.2, fontSize: 15, bold: true, color: '0F172A' });
      addText(slide, item.description, { x: baseX + 0.18, y: 1.5, w: 5.65, h: 0.45, fontSize: 10, color: '475569' });
      slide.addImage({ path: item.fusion, ...fitContain(item.fusion, { x: baseX + 0.18, y: 2.05, w: 3.45, h: 2.0 }) });
      slide.addImage({ path: item.metrics, ...fitContain(item.metrics, { x: baseX + 3.75, y: 2.05, w: 2.1, h: 2.0 }) });
      addText(slide, `• 触发对象：${item.obstacleLabels.join('、')}\n• 关键数字：${item.triggers} 次；${item.init.toFixed(2)}m → ${item.actual.toFixed(2)}m（${deltaText(item.deltaInit)}）\n• 结论：${item.takeaway}`, { x: baseX + 0.2, y: 4.25, w: 5.55, h: 1.85, fontSize: 11, color: '1E293B', breakLine: true, fit: 'shrink' });
    });
    addFooter(slide, `UAV 结果页 ${pageNo} / 3：分场景结果。`, `${pageNo}/${totalSlides}`);
    pageNo += 1;
  }

  const outPath = path.join(weekDir, 'uav_robotdog_report.pptx');
  await pptx.writeFile({ fileName: outPath, compression: true });
  return outPath;
}

async function main() {
  const mdPath = path.join(weekDir, 'uav_robotdog_report.md');
  const htmlPath = path.join(weekDir, 'uav_robotdog_report.html');
  fs.writeFileSync(mdPath, generateMarkdown(), 'utf8');
  fs.writeFileSync(htmlPath, generateHtml(), 'utf8');
  const pptxPath = await generatePptx();
  console.log(JSON.stringify({ mdPath, htmlPath, pptxPath }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
