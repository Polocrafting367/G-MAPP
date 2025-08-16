<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Gestion PDF locale — mobile</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>
  :root{
    --bg:#0b0b0c; --txt:#f2f2f2; --muted:#b9b9b9; --panel:#151518; --b:#2a2a2e; --a:#3b82f6; --ok:#22c55e; --warn:#f59e0b; --err:#ef4444;
    --pad:10px; --radius:10px;
  }
  @media (prefers-color-scheme: light){
    :root{ --bg:#ffffff; --txt:#111; --muted:#555; --panel:#f6f7f9; --b:#dadde5; --a:#2563eb; --ok:#16a34a; --warn:#d97706; --err:#dc2626; }
  }
  *{ box-sizing: border-box }
  html,body{ height:100%; margin:0; background:var(--bg); color:var(--txt); font:15px/1.4 system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif }
  header{ position:sticky; top:0; z-index:10; background:var(--panel); border-bottom:1px solid var(--b); padding:env(safe-area-inset-top) var(--pad) var(--pad) var(--pad); }
  .hrow{ display:flex; gap:8px; align-items:center; flex-wrap:wrap }
  .brand{ font-weight:600 }
  .filepick{ display:flex; gap:8px; width:100% }
  .filepick input[type=file]{ flex:1; background:transparent; color:var(--txt) }
  .btn{ background:#1f2937; color:#fff; border:1px solid #374151; padding:10px 14px; border-radius:10px; cursor:pointer; font-weight:600 }
  .btn[disabled]{ opacity:.45; cursor:not-allowed }
  .btn.primary{ background:var(--a); border-color:var(--a) }
  .btn.ghost{ background:transparent; color:var(--txt); border:1px solid var(--b) }
  .btn.warn{ background:var(--warn); border-color:var(--warn); color:#000 }
  .layout{ display:flex; height:calc(100% - 130px); }
  .left{ width: 100%; max-width: 480px; border-right:1px solid var(--b); background:var(--panel); padding:10px; display:flex; flex-direction:column; gap:10px }
  .thumbsWrap{ overflow:auto; -webkit-overflow-scrolling: touch; }
  .thumbs{ display:flex; gap:10px; padding:2px }
  .thumb{ flex:0 0 120px; background:#0e0e10; border:2px solid transparent; border-radius:10px; padding:6px; position:relative }
  .thumb.selected{ border-color:var(--a) }
  .thumb canvas{ width:100%; height:auto; display:block; background:#fff; border-radius:6px }
  .meta{ display:flex; justify-content:space-between; font-size:12px; color:var(--muted); margin-top:4px }
  .badges{ position:absolute; top:6px; left:6px; display:flex; gap:6px }
  .badge{ font-size:11px; border:1px solid var(--b); background:#111; color:#ddd; padding:1px 6px; border-radius:999px }
  .main{ flex:1; min-width:0; display:flex; flex-direction:column; padding:10px; gap:10px }
  .toolbarTop{ display:flex; align-items:center; gap:8px; flex-wrap:wrap }
  .docInfo{ color:var(--muted) }
  .previewWrap{ position:relative; flex:1; min-height:200px; display:grid; place-items:center; background:#0e0e10; border:1px solid var(--b); border-radius:10px; overflow:auto }
  canvas#preview{ max-width:100%; height:auto; display:block; background:#fff; border-radius:6px; touch-action:none }
  #overlay{ position:absolute; inset:0; pointer-events:none }
  #overlayCanvas{ position:absolute; top:0; left:0; pointer-events:auto }
  .log{ background:#0e0e10; border:1px solid var(--b); border-radius:10px; padding:10px; height:100px; overflow:auto; font:12px/1.4 ui-monospace,Menlo,Consolas,monospace; color:#d1d5db }
  /* bottom actions bar */
  .actions{ position:sticky; bottom:0; z-index:10; padding:10px env(safe-area-inset-right) calc(env(safe-area-inset-bottom) + 10px) env(safe-area-inset-left); background:linear-gradient(180deg, rgba(0,0,0,0) 0%, var(--bg) 25%);
            border-top:1px solid var(--b) }
  .actRow{ display:flex; gap:8px; overflow:auto; -webkit-overflow-scrolling:touch; padding-bottom:2px }
  .actRow .btn{ flex:0 0 auto; padding:10px 12px }
  .seg{ display:flex; gap:8px; padding:6px; border:1px solid var(--b); border-radius:12px; background:var(--panel) }
  select, .select{ background:transparent; color:var(--txt); border:1px solid var(--b); border-radius:8px; padding:8px 10px }
  .sr{ display:none }
  @media (min-width: 900px){
    .layout{ gap:0 }
    .left{ width:360px }
  }
</style>
</head>
<body>
<header>
  <div class="hrow">
    <div class="brand">PDF local</div>
    <div class="sr" id="cspWarn">CSP bloque le JS inline.</div>
  </div>
  <div class="hrow filepick">
    <input id="file" type="file" accept="application/pdf">
    <input id="fileMerge" type="file" accept="application/pdf" multiple>
    <button id="btnExport" class="btn primary" disabled>Exporter</button>
  </div>
</header>

<div class="layout">
  <aside class="left">
    <div class="thumbsWrap">
      <div id="thumbs" class="thumbs"></div>
    </div>
    <div class="seg">
      <button id="btnSelectAll" class="btn ghost" disabled>Tout</button>
      <button id="btnSelectNone" class="btn ghost" disabled>Aucune</button>
      <button id="btnInvert" class="btn ghost" disabled>Inverser</button>
      <select id="zoom" disabled>
        <option value="0.8">0.8x</option><option value="1" selected>1x</option>
        <option value="1.25">1.25x</option><option value="1.5">1.5x</option><option value="2">2x</option>
      </select>
    </div>
  </aside>

  <main class="main">
    <div class="toolbarTop">
      <span id="docInfo" class="docInfo">Aucun document</span>
      <div class="seg">
        <button id="btnRotateL" class="btn ghost" disabled>−90°</button>
        <button id="btnRotateR" class="btn ghost" disabled>+90°</button>
        <button id="btnRotate180" class="btn ghost" disabled>180°</button>
        <button id="btnDelete" class="btn warn" disabled>Supprimer</button>
      </div>
      <div class="seg">
        <button id="btnMoveStart" class="btn ghost" disabled>Début</button>
        <button id="btnMoveUp" class="btn ghost" disabled>↑</button>
        <button id="btnMoveDown" class="btn ghost" disabled>↓</button>
        <button id="btnMoveEnd" class="btn ghost" disabled>Fin</button>
      </div>
      <div class="seg">
        <button id="btnAnnotText" class="btn ghost" disabled>Texte</button>
        <button id="btnAnnotDraw" class="btn ghost" disabled>Dessin</button>
        <button id="btnAnnotClear" class="btn ghost" disabled>Effacer</button>
      </div>
    </div>

    <div class="previewWrap">
      <canvas id="preview"></canvas>
      <div id="overlay"><canvas id="overlayCanvas"></canvas></div>
    </div>

    <pre id="log" class="log"></pre>
  </main>
</div>

<div class="actions">
  <div class="actRow">
    <button id="btnReRender" class="btn ghost" disabled>Rafraîchir</button>
    <div class="seg">
      <button id="btnToggleOCR" class="btn ghost" disabled>OCR off</button>
      <select id="lang" disabled>
        <option value="fra">fra</option><option value="eng">eng</option><option value="deu">deu</option>
        <option value="spa">spa</option><option value="ita">ita</option>
      </select>
    </div>
    <div class="seg">
      <button id="btnDuplicate" class="btn ghost" disabled>Dupliquer</button>
      <button id="btnAddBlank" class="btn ghost" disabled>Page blanche</button>
      <button id="btnExtract" class="btn ghost" disabled>Extraire → PDF</button>
    </div>
  </div>
</div>

<!-- Libs locales -->
<script src="./lib/pdf.min.js" defer></script>
<script>
  // Fix worker (pas de preload)
  document.addEventListener('DOMContentLoaded', ()=>{ if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = "./lib/pdf.worker.min.js"; });
</script>
<script src="./lib/pdf-lib.min.js" defer></script>
<script src="./lib/tesseract.min.js" defer></script>

<script>
/* ====== CONFIG ====== */
const TESSERACT_PATHS = {
  workerPath: "./lib/tesseract.worker.min.js",
  corePath: "./lib/tesseract-core.wasm.js",
  langPath: "./lib/lang-data"
};

/* ====== ÉTAT ====== */
let originalPdfBytes = null;
let pdfDocProxy = null;
let pages = []; // [{sourceId,num, rotationDeg, selected, ocr, thumbCanvas, scaleForThumb, ann}]
let currentIndex = -1;

let ocrWorker = null;
const sources = []; // [{id, name, bytes(Uint8Array), pdfProxy}]
let sourceCounter = 0;

/* ====== UI refs ====== */
const els = {};
const ids = ['file','fileMerge','thumbs','preview','overlayCanvas','docInfo','log','btnExport',
'btnRotateL','btnRotateR','btnRotate180','btnDelete','btnSelectAll','btnSelectNone','btnInvert','btnReRender',
'btnToggleOCR','lang','zoom','btnMoveUp','btnMoveDown','btnMoveStart','btnMoveEnd',
'btnAnnotText','btnAnnotDraw','btnAnnotClear','btnDuplicate','btnAddBlank','btnExtract'];
document.addEventListener('DOMContentLoaded', ()=>{
  ids.forEach(id=> els[id]=document.getElementById(id));
  // diag de base
  L("DOM prêt.");
  L("pdfjsLib: "+!!window.pdfjsLib+" | PDFLib: "+!!window.PDFLib+" | Tesseract: "+!!window.Tesseract);
  if(!pdfjsLib) { L("pdf.min.js introuvable."); return; }
  if(!PDFLib) { L("pdf-lib.min.js introuvable."); return; }
  enableControls(false);
  attachEvents();
});

/* ====== LOG ====== */
function L(m){ const el=document.getElementById('log'); if(!el) return; el.textContent += m+"\n"; el.scrollTop = el.scrollHeight; }
window.addEventListener('error', e=> L("[Erreur] "+(e.message||e.error||"inconnu")));
window.addEventListener('unhandledrejection', e=> L("[Promise] "+(e.reason?.message||e.reason||'inconnu')));

/* ====== Utils ====== */
function enableControls(enabled){
  ['btnRotateL','btnRotateR','btnRotate180','btnDelete','btnExport','btnSelectAll','btnSelectNone','btnInvert',
   'btnReRender','btnToggleOCR','lang','zoom','btnMoveUp','btnMoveDown','btnMoveStart','btnMoveEnd',
   'btnAnnotText','btnAnnotDraw','btnAnnotClear','btnDuplicate','btnAddBlank','btnExtract']
   .forEach(k=> els[k] && (els[k].disabled = !enabled));
}
function bytesToArrayBuffer(bytes){ return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); }
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
function isTouch(){ return matchMedia("(pointer: coarse)").matches; }

/* ====== Chargement / Fusion ====== */
async function addSource(bytes, name){
  const id = ++sourceCounter;
  const proxy = await pdfjsLib.getDocument({ data: bytesToArrayBuffer(bytes) }).promise;
  sources.push({ id, name, bytes, proxy });
  return id;
}
async function addPdfPagesFromSource(sourceId){
  const src = sources.find(s=>s.id===sourceId);
  for(let i=1;i<=src.proxy.numPages;i++){
    pages.push({ sourceId, num:i, rotationDeg:0, selected:false, ocr:false, thumbCanvas:null, scaleForThumb:1, ann:{texts:[],drawings:[]} });
  }
}
async function loadPdfFromBytes(bytes, name){
  resetAll();
  originalPdfBytes = bytes;
  const sid = await addSource(bytes, name||'document.pdf');
  pdfDocProxy = sources.find(s=>s.id===sid).proxy;
  els.docInfo.textContent = `Pages: ${pdfDocProxy.numPages}`;
  await addPdfPagesFromSource(sid);
  enableControls(true);
  els.zoom.disabled = false;
  await renderAllThumbnails();
  selectOnly(0);
  await renderPreview(0);
}
async function mergeFromFileList(fileList){
  if(!fileList || fileList.length===0) return;
  L(`Fusion: ${fileList.length} fichier(s)`);
  for(const f of fileList){
    const arr = new Uint8Array(await f.arrayBuffer());
    const sid = await addSource(arr, f.name);
    await addPdfPagesFromSource(sid);
  }
  els.docInfo.textContent = `Pages: ${pages.length} (fusion)`;
  await renderAllThumbnails();
  if(currentIndex<0 && pages.length>0){ selectOnly(0); await renderPreview(0); }
}
function resetAll(){
  pages=[]; currentIndex=-1; originalPdfBytes=null; pdfDocProxy=null;
  els.thumbs.innerHTML=''; const c=els.preview.getContext('2d'); c.clearRect(0,0,els.preview.width,els.preview.height);
  enableControls(false); els.docInfo.textContent='Aucun document'; els.log.textContent='';
}

/* ====== Rendu ====== */
let isRenderingThumbs = false;
async function renderAllThumbnails(){
  if(isRenderingThumbs) return; isRenderingThumbs=true;
  els.thumbs.innerHTML='';
  if(pages.length===0){ isRenderingThumbs=false; return; }
  const zoom = parseFloat(els.zoom.value||'1');
  for(let i=0;i<pages.length;i++){
    const p = pages[i];
    const src = sources.find(s=>s.id===p.sourceId);
    const page = await src.proxy.getPage(p.num);
    const viewport = page.getViewport({ scale: 0.33 * zoom });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = Math.floor(viewport.width); canvas.height = Math.floor(viewport.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    p.thumbCanvas = canvas; p.scaleForThumb = zoom;

    const wrap = document.createElement('div');
    wrap.className='thumb'; wrap.draggable=!isTouch(); wrap.dataset.index=String(i);

    const badges = document.createElement('div'); badges.className='badges';
    const bRot = document.createElement('span'); bRot.className='badge'; bRot.textContent='0°';
    const bOcr = document.createElement('span'); bOcr.className='badge'; bOcr.textContent='OCR'; bOcr.style.display='none';
    badges.appendChild(bRot); badges.appendChild(bOcr);

    const meta = document.createElement('div'); meta.className='meta';
    meta.innerHTML = `<span>#${i+1}</span><span>src:${p.sourceId} p.${p.num}</span>`;

    wrap.appendChild(badges); wrap.appendChild(canvas); wrap.appendChild(meta);
    els.thumbs.appendChild(wrap);

    // tactile: appui long = multi-sélection, tap = focus
    let timer=null;
    wrap.addEventListener('touchstart', ()=>{ timer=setTimeout(()=>{ pages[i].selected=!pages[i].selected; updateThumbClasses(); timer=null; }, 450); }, {passive:true});
    wrap.addEventListener('touchend', ()=>{ if(timer){ clearTimeout(timer); timer=null; selectOnly(i); renderPreview(i);} }, {passive:true});

    wrap.addEventListener('click', ()=>{ toggleSelect(i, true); renderPreview(i); });
    initDragForThumb(wrap);

    p._bRot=bRot; p._bOcr=bOcr;
  }
  updateThumbClasses();
  isRenderingThumbs=false;
}
async function renderPreview(index){
  if(index<0 || index>=pages.length) return;
  currentIndex = index;
  const p = pages[index];
  const src = sources.find(s=>s.id===p.sourceId);
  const page = await src.proxy.getPage(p.num);
  const viewport = page.getViewport({ scale: 1.25 });
  const canvas = els.preview;
  canvas.width = Math.floor(viewport.width); canvas.height = Math.floor(viewport.height);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  rotateCanvasPreview(p.rotationDeg);

  const ov = els.overlayCanvas;
  ov.width = canvas.width; ov.height = canvas.height;
  const octx = ov.getContext('2d'); octx.clearRect(0,0,ov.width,ov.height);
  drawAnnotationsOnOverlay(index);
}
function rotateCanvasPreview(deg){
  const src = els.preview; if(deg % 360 === 0) return;
  const tmp = document.createElement('canvas'); tmp.width = src.width; tmp.height = src.height;
  tmp.getContext('2d').drawImage(src,0,0);
  if(deg % 180 === 0){
    const ctx = src.getContext('2d');
    ctx.clearRect(0,0,src.width,src.height);
    ctx.save(); ctx.translate(src.width/2, src.height/2); ctx.rotate(deg*Math.PI/180);
    ctx.drawImage(tmp, -src.width/2, -src.height/2); ctx.restore();
  } else {
    const w=src.width,h=src.height; src.width=h; src.height=w;
    const ctx2=src.getContext('2d');
    ctx2.save(); ctx2.translate(src.width/2, src.height/2); ctx2.rotate(deg*Math.PI/180);
    ctx2.drawImage(tmp, -w/2, -h/2); ctx2.restore();
  }
}

/* Gestes swipe pour changer de page */
(function swipe(){
  let x0=0,y0=0;
  document.addEventListener('DOMContentLoaded', ()=>{
    els.preview.addEventListener('touchstart', e=>{ if(e.touches.length!==1) return; x0=e.touches[0].clientX; y0=e.touches[0].clientY; }, {passive:true});
    els.preview.addEventListener('touchend', e=>{
      const t=e.changedTouches[0], dx=t.clientX-x0, dy=t.clientY-y0;
      if(Math.abs(dx)>60 && Math.abs(dy)<50){ if(dx<0) selectNext(); else selectPrev(); }
    }, {passive:true});
  });
})();

/* ====== Sélection / réorg ====== */
function updateThumbClasses(){
  const children = els.thumbs.children;
  for(let i=0;i<children.length;i++){
    children[i].classList.toggle('selected', !!pages[i].selected);
    if(pages[i]._bRot) pages[i]._bRot.textContent = `${((pages[i].rotationDeg%360)+360)%360}°`;
    if(pages[i]._bOcr) pages[i]._bOcr.style.display = pages[i].ocr ? '' : 'none';
  }
}
function selectOnly(i){ for(const p of pages) p.selected=false; if(i>=0&&i<pages.length) pages[i].selected=true; updateThumbClasses(); }
function toggleSelect(i, exclusive=false){ if(exclusive) selectOnly(i); else { pages[i].selected=!pages[i].selected; updateThumbClasses(); } }
function getSelectedIndices(){ return pages.map((p,idx)=>p.selected?idx:-1).filter(i=>i>=0); }
function initDragForThumb(node){
  if(isTouch()) return;
  node.addEventListener('dragstart', e=>{
    node.classList.add('dragging'); e.dataTransfer.setData('text/plain', node.dataset.index); e.dataTransfer.effectAllowed='move';
  });
  node.addEventListener('dragend', ()=> node.classList.remove('dragging'));
  node.addEventListener('dragover', e=>{ e.preventDefault(); node.classList.add('drag-over'); e.dataTransfer.dropEffect='move'; });
  node.addEventListener('dragleave', ()=> node.classList.remove('drag-over'));
  node.addEventListener('drop', e=>{
    e.preventDefault(); node.classList.remove('drag-over');
    const from = parseInt(e.dataTransfer.getData('text/plain'),10); const to = parseInt(node.dataset.index,10);
    movePage(from,to);
  });
}
function movePage(from,to){
  if(from===to) return;
  const item = pages.splice(from,1)[0];
  pages.splice(to,0,item);
  renderAllThumbnails().then(()=>{ updateThumbClasses(); currentIndex=clamp(to,0,pages.length-1); renderPreview(currentIndex); });
}
function moveSelected(delta){
  const idxs=getSelectedIndices(); if(idxs.length!==1) return;
  const from=idxs[0]; const to=clamp(from+delta,0,pages.length-1); movePage(from,to);
}
function moveSelectedTo(pos){
  const idxs=getSelectedIndices(); if(idxs.length!==1) return;
  const from=idxs[0]; const to=(pos==='start'?0:pages.length-1); movePage(from,to);
}

/* ====== Rotations / suppression / OCR flag ====== */
function rotateSelected(delta){
  const idxs=getSelectedIndices(); if(idxs.length===0 && currentIndex>=0) idxs.push(currentIndex);
  idxs.forEach(i=> pages[i].rotationDeg=(pages[i].rotationDeg+delta)%360);
  updateThumbClasses(); if(idxs.length===1) renderPreview(idxs[0]); else if(currentIndex>=0) renderPreview(currentIndex);
}
function deleteSelected(){
  const idxs=new Set(getSelectedIndices()); if(idxs.size===0) return;
  pages=pages.filter((_,i)=>!idxs.has(i));
  renderAllThumbnails().then(()=>{ updateThumbClasses(); currentIndex=clamp(currentIndex,0,pages.length-1); if(pages.length>0) renderPreview(currentIndex); });
}
function toggleOCRForSelection(flag){
  const idxs=getSelectedIndices(); if(idxs.length===0 && currentIndex>=0) idxs.push(currentIndex);
  idxs.forEach(i=> pages[i].ocr = flag!==undefined? flag : !pages[i].ocr);
  updateThumbClasses();
}

/* ====== Annotations ====== */
let drawMode=false, textMode=false, drawing=false, drawPath=[];
document.addEventListener('DOMContentLoaded', ()=>{
  if(!els.overlayCanvas) return;
  els.overlayCanvas.addEventListener('pointerdown', e=>{
    if(drawMode){ drawing=true; drawPath=[{x:e.offsetX,y:e.offsetY}]; }
    else if(textMode){
      const txt = prompt('Texte:',''); if(txt){ pages[currentIndex].ann.texts.push({ x:e.offsetX, y:els.overlayCanvas.height - e.offsetY, text:txt, size:16 }); drawAnnotationsOnOverlay(currentIndex); }
    }
  });
  els.overlayCanvas.addEventListener('pointermove', e=>{
    if(drawMode && drawing){ drawPath.push({x:e.offsetX,y:e.offsetY}); drawAnnotationsOnOverlay(currentIndex, drawPath); }
  });
  window.addEventListener('pointerup', ()=>{ if(drawMode && drawing){ drawing=false; pages[currentIndex].ann.drawings.push(drawPath.slice()); drawPath=[]; } });
});
function drawAnnotationsOnOverlay(index, livePath){
  const ov=els.overlayCanvas; if(!ov) return; const ctx=ov.getContext('2d');
  ctx.clearRect(0,0,ov.width,ov.height);
  const ann=pages[index].ann;
  ctx.save(); ctx.fillStyle="#000";
  for(const t of ann.texts){ ctx.font=`${t.size||16}px sans-serif`; ctx.fillText(t.text, t.x, ov.height - t.y); }
  ctx.restore();
  ctx.lineWidth=3; ctx.lineJoin='round'; ctx.lineCap='round';
  for(const path of ann.drawings){ ctx.beginPath(); for(let i=0;i<path.length;i++){ const p=path[i]; if(i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y);} ctx.stroke(); }
  if(livePath && livePath.length){ ctx.beginPath(); for(let i=0;i<livePath.length;i++){ const p=livePath[i]; if(i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y);} ctx.stroke(); }
}

/* ====== Export / OCR ====== */
async function ensureOcrWorker(lang){
  if(ocrWorker) return ocrWorker;
  L("Init OCR…");
  // IMPORTANT: pas de logger (évite DataCloneError côté Worker sur certains navigateurs)
  ocrWorker = await Tesseract.createWorker({
    workerPath: TESSERACT_PATHS.workerPath,
    corePath: TESSERACT_PATHS.corePath,
    langPath: TESSERACT_PATHS.langPath
  });
  await ocrWorker.loadLanguage(lang);
  await ocrWorker.initialize(lang);
  return ocrWorker;
}
async function overlayToPNG(index){
  const p=pages[index]; const src=sources.find(s=>s.id===p.sourceId); const page=await src.proxy.getPage(p.num);
  const viewport=page.getViewport({ scale:1.25 }); const c=document.createElement('canvas'); c.width=Math.floor(viewport.width); c.height=Math.floor(viewport.height);
  const ctx=c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height);
  const ann=p.ann; ctx.save(); ctx.fillStyle="#000";
  for(const t of ann.texts){ ctx.font=`${t.size||16}px sans-serif`; ctx.fillText(t.text, t.x, c.height - t.y); }
  ctx.restore(); ctx.lineWidth=3; ctx.lineJoin='round'; ctx.lineCap='round';
  for(const path of ann.drawings){ ctx.beginPath(); for(let i=0;i<path.length;i++){ const pt=path[i]; if(i===0) ctx.moveTo(pt.x,pt.y); else ctx.lineTo(pt.x,pt.y);} ctx.stroke(); }
  return await new Promise(res=> c.toBlob(b=>{ if(!b) res(null); else { const fr=new FileReader(); fr.onload=()=>res(new Uint8Array(fr.result)); fr.readAsArrayBuffer(b); } }, 'image/png'));
}
async function rasterizePageForOCR(pageObj){
  const src=sources.find(s=>s.id===pageObj.sourceId); const page=await src.proxy.getPage(pageObj.num);
  const viewport=page.getViewport({ scale:2.0 }); const c=document.createElement('canvas'); c.width=Math.floor(viewport.width); c.height=Math.floor(viewport.height);
  await page.render({ canvasContext:c.getContext('2d'), viewport }).promise;
  if(pageObj.rotationDeg % 360 !== 0){
    const tmp=document.createElement('canvas'); tmp.width=c.width; tmp.height=c.height; tmp.getContext('2d').drawImage(c,0,0);
    const deg=pageObj.rotationDeg % 360; const ctx=c.getContext('2d');
    if(deg % 180 !== 0){ c.width=tmp.height; c.height=tmp.width; }
    ctx.save(); ctx.clearRect(0,0,c.width,c.height); ctx.translate(c.width/2,c.height/2); ctx.rotate(deg*Math.PI/180); ctx.drawImage(tmp,-tmp.width/2,-tmp.height/2); ctx.restore();
  }
  return c;
}
async function embedSearchableText(doc, pageIndex, rawText){
  const page=doc.getPage(pageIndex); const font=await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  const fontSize=8, margin=12; const text=(rawText||'').replace(/\s+\n/g,'\n').trim(); if(!text) return;
  const { width,height }=page.getSize(); const maxWidth=width - margin*2;
  const lines=(function wrap(text){ const words=text.split(/\s+/), lines=[]; let cur=''; for(const w of words){ const t=cur?cur+' '+w:w; const wid=font.widthOfTextAtSize(t,fontSize); if(wid<=maxWidth){ cur=t; }else{ if(cur) lines.push(cur); cur=w; } } if(cur) lines.push(cur); return lines; })(text);
  let y=height - margin; const lineHeight=fontSize*1.2;
  for(const line of lines){ if(y<margin) break; page.drawText(line,{x:margin,y,size:fontSize,font,opacity:0.01}); y-=lineHeight; }
}
async function doExport(){
  if(pages.length===0) return;
  els.btnExport.disabled=true;
  try{
    L("Prépare export…");
    const outPdf=await PDFLib.PDFDocument.create();
    const cache={}; for(const s of sources){ cache[s.id]=await PDFLib.PDFDocument.load(s.bytes,{ignoreEncryption:true}); }
    for(let i=0;i<pages.length;i++){
      const p=pages[i]; const [cop]=await outPdf.copyPages(cache[p.sourceId],[p.num-1]);
      const deg=((p.rotationDeg%360)+360)%360; if(deg!==0) cop.setRotation(PDFLib.degrees(deg));
      outPdf.addPage(cop);
    }
    const anyOCR=pages.some(p=>p.ocr); if(anyOCR){ const lang=(els.lang.value||'fra'); await ensureOcrWorker(lang); }
    for(let i=0;i<pages.length;i++){
      const page=outPdf.getPage(i); const ann=pages[i].ann;
      if(ann && (ann.texts.length || ann.drawings.length)){
        const font=await outPdf.embedFont(PDFLib.StandardFonts.Helvetica);
        for(const t of ann.texts){ page.drawText(t.text,{x:t.x,y:t.y,size:t.size||16,font,color:PDFLib.rgb(0,0,0)}); }
        const png=await overlayToPNG(i); if(png){ const img=await outPdf.embedPng(png); const {width,height}=page.getSize(); page.drawImage(img,{x:0,y:0,width,height,opacity:0.9}); }
      }
      if(pages[i].ocr){ L(`OCR page ${i+1}…`); const img=await rasterizePageForOCR(pages[i]); const {data:{text}}=await ocrWorker.recognize(img); await embedSearchableText(outPdf,i,text); }
    }
    const out=await outPdf.save({ addDefaultPage:false, updateFieldAppearances:false, useObjectStreams:true });
    const blob=new Blob([out],{type:'application/pdf'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='document_modifie.pdf'; a.click(); URL.revokeObjectURL(url); L("Export terminé.");
  }catch(e){ console.error(e); L("Erreur export: "+e.message); }
  finally{ els.btnExport.disabled=false; }
}

/* ====== Actions ====== */
function attachEvents(){
  // fichiers
  els.file?.addEventListener('change', async e=>{
    const f=e.target.files && e.target.files[0]; if(!f) return;
    const arr=new Uint8Array(await f.arrayBuffer()); L(`Chargé: ${f.name} (${arr.byteLength} octets)`); await loadPdfFromBytes(arr, f.name);
  });
  els.fileMerge?.addEventListener('change', async e=>{ await mergeFromFileList(e.target.files); });

  // boutons
  els.btnExport?.addEventListener('click', ()=> doExport());
  els.btnRotateL?.addEventListener('click', ()=> rotateSelected(-90));
  els.btnRotateR?.addEventListener('click', ()=> rotateSelected(90));
  els.btnRotate180?.addEventListener('click', ()=> rotateSelected(180));
  els.btnDelete?.addEventListener('click', ()=> deleteSelected());
  els.btnSelectAll?.addEventListener('click', ()=>{ pages.forEach(p=>p.selected=true); updateThumbClasses(); });
  els.btnSelectNone?.addEventListener('click', ()=>{ pages.forEach(p=>p.selected=false); updateThumbClasses(); });
  els.btnInvert?.addEventListener('click', ()=>{ pages.forEach(p=>p.selected=!p.selected); updateThumbClasses(); });
  els.btnReRender?.addEventListener('click', ()=> renderAllThumbnails());
  els.btnToggleOCR?.addEventListener('click', ()=>{ toggleOCRForSelection(); const anySel=getSelectedIndices().some(i=>pages[i].ocr); els.btnToggleOCR.textContent='OCR '+(anySel?'on':'off'); });
  els.lang?.addEventListener('change', async ()=>{ if(ocrWorker){ await ocrWorker.loadLanguage(els.lang.value); await ocrWorker.initialize(els.lang.value); } });
  els.zoom?.addEventListener('change', ()=> renderAllThumbnails());
  els.btnMoveUp?.addEventListener('click', ()=> moveSelected(-1));
  els.btnMoveDown?.addEventListener('click', ()=> moveSelected(+1));
  els.btnMoveStart?.addEventListener('click', ()=> moveSelectedTo('start'));
  els.btnMoveEnd?.addEventListener('click', ()=> moveSelectedTo('end'));

  // annotations
  els.btnAnnotText?.addEventListener('click', ()=>{ textMode=!textMode; drawMode=false; els.overlayCanvas.style.pointerEvents = textMode ? 'auto' : 'none'; });
  els.btnAnnotDraw?.addEventListener('click', ()=>{ drawMode=!drawMode; textMode=false; els.overlayCanvas.style.pointerEvents = drawMode ? 'auto' : 'none'; });
  els.btnAnnotClear?.addEventListener('click', ()=>{ if(currentIndex>=0){ pages[currentIndex].ann={texts:[],drawings:[]}; drawAnnotationsOnOverlay(currentIndex); } });

  // clavier
  window.addEventListener('keydown', e=>{
    if(pages.length===0) return;
    if(e.key==='ArrowLeft') { selectPrev(); e.preventDefault(); }
    if(e.key==='ArrowRight'){ selectNext(); e.preventDefault(); }
    if((e.ctrlKey||e.metaKey) && e.key==='s'){ e.preventDefault(); doExport(); }
    if((e.ctrlKey||e.metaKey) && e.key==='a'){ e.preventDefault(); pages.forEach(p=>p.selected=true); updateThumbClasses(); }
  });

  new ResizeObserver(()=>{ if(currentIndex>=0) renderPreview(currentIndex); }).observe(document.querySelector('.previewWrap'));
}
function selectPrev(){ if(currentIndex>0){ selectOnly(currentIndex-1); renderPreview(currentIndex-1); } }
function selectNext(){ if(currentIndex<pages.length-1){ selectOnly(currentIndex+1); renderPreview(currentIndex+1); } }
</script>
</body>
</html>
