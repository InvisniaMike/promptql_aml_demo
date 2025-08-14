(function(){
  const sourceSelect = document.getElementById('sourceSelect');
  const reloadBtn = document.getElementById('reloadBtn');
  const tsSvg = document.getElementById('tsSvg');
  const tsEmpty = document.getElementById('tsEmpty');
  const matrixDots = document.getElementById('matrixDots');
  const matrixEmpty = document.getElementById('matrixEmpty');
  const lineageBox = document.getElementById('lineageBox');
  const kpiWrap = document.getElementById('kpis');
  const detailsBody = document.getElementById('detailsBody');
  const dqNulls = document.getElementById('dqNulls');
  const dqDupes = document.getElementById('dqDupes');
  const dqGaps = document.getElementById('dqGaps');

  function fmtNum(n){ if(n==null || isNaN(n)) return '—'; return Number(n).toFixed(2); }
  function escapeHtml(str){ return String(str).replace(/[&<>"']/g, m => ({'&':'&','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]||m)); }

  function renderDetails(it){
    if(!it){
      detailsBody.innerHTML = '<tr><td colspan="2" class="muted">Click a matrix dot to view details, reason codes, and SLA info.</td></tr>';
      lineageBox.textContent = '';
      return;
    }
    const rows = [];
    const add = (k,v)=> rows.push(`<tr><td class="key">${k}</td><td>${v ?? '—'}</td></tr>`);
    add('Label', escapeHtml(it.label ?? '—'));
    add('Risk Today', fmtNum(it.risk_today));
    add('Risk Trajectory', fmtNum(it.risk_trajectory));
    add('Exposure Amount', it.exposure_amount != null ? String(it.exposure_amount) : '—');
    add('Tx Count', it.tx_count != null ? String(it.tx_count) : '—');
    add('First Seen', it.first_seen ?? '—');
    add('Last Seen', it.last_seen ?? '—');
    add('SLA Hours to Case', it.sla_hours_to_case != null ? String(it.sla_hours_to_case) : '—');
    add('Match Confidence', it.match_confidence != null ? String(it.match_confidence) : '—');
    const rc = Array.isArray(it.reason_codes) ? it.reason_codes.join(', ') : (it.reason_code ?? '—');
    add('Reason Codes', escapeHtml(rc));
    detailsBody.innerHTML = rows.join('');
    lineageBox.textContent = JSON.stringify(it.lineage ?? {note:'No lineage provided'}, null, 2);
  }

  function renderDQ(dqObjects){
    let nulls = [], dupes = [], gaps = [];
    dqObjects.forEach(dq=>{
      if(!dq) return;
      if(dq.nulls != null) nulls.push(dq.nulls);
      if(dq.duplicate_ids != null) dupes.push(dq.duplicate_ids);
      if(dq.timestamp_gaps != null) gaps.push(dq.timestamp_gaps);
    });
    const agg = (arr, unit)=>{
      if(!arr.length) return '—';
      const sum = arr.reduce((a,b)=>a + Number(b||0), 0);
      const val = sum / arr.length;
      return unit==='pct' ? (val.toFixed(1)+'%') : String(Math.round(val));
    };
    dqNulls.textContent = agg(nulls, 'pct');
    dqDupes.textContent = agg(dupes, 'count');
    dqGaps.textContent = agg(gaps, 'count');
  }

  function renderKPIs(meta){
    kpiWrap.innerHTML = '';
    [
      {label:'Flagged Entities (12m)', value: meta?.flagged_entities ?? '—'},
      {label:'% SLA Breach', value: meta?.sla_breach_pct ?? '—'},
      {label:'Repeat-SAR Gaps', value: meta?.repeat_sar_gaps ?? '—'},
      {label:'Dormant→Burst Accounts', value: meta?.mule_bursts ?? '—'},
    ].forEach(c=>{
      const div = document.createElement('div');
      div.className = 'kpi';
      div.innerHTML = `<div class="label">${c.label}</div><div class="value">${c.value}</div>`;
      kpiWrap.appendChild(div);
    });
  }

  function renderTimeSeries(series){
    while (tsSvg.firstChild) tsSvg.removeChild(tsSvg.firstChild);
    if(!series || !series.length){ tsEmpty.style.display='block'; return; }
    tsEmpty.style.display='none';

    const W=800, H=220, P=24;
    const ys = series.map(d=>+d.value||0);
    const ymin = Math.min(...ys), ymax = Math.max(...ys)||1;

    function sx(i,len){ return P + (W-2*P)*(i)/(Math.max(1,len-1)); }
    function sy(v){ return H-P - (H-2*P)*(v - ymin)/(ymax - ymin || 1); }

    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    let d='';
    series.forEach((pt,i)=>{
      const x=sx(i,series.length), y=sy(+pt.value||0);
      d += (i?' L ':'M ')+x+' '+y;
    });
    path.setAttribute('d', d);
    path.setAttribute('fill','none');
    path.setAttribute('stroke','#111');
    path.setAttribute('stroke-width','1.5');
    tsSvg.appendChild(path);

    series.forEach((pt,i)=>{
      if(pt.is_anomaly){
        const cx=sx(i,series.length), cy=sy(+pt.value||0);
        const circ=document.createElementNS('http://www.w3.org/2000/svg','circle');
        circ.setAttribute('cx', cx); circ.setAttribute('cy', cy); circ.setAttribute('r', 3.5);
        circ.setAttribute('fill', '#d11');
        tsSvg.appendChild(circ);
      }
    });
  }

  function renderMatrix(items){
    matrixDots.innerHTML='';
    if(!items || !items.length){ matrixEmpty.style.display='block'; return; }
    matrixEmpty.style.display='none';
    const clamp = (v)=>Math.max(0, Math.min(1, Number(v)||0));
    items.forEach(it=>{
      const dot = document.createElement('div');
      dot.className='dot';
      dot.style.left = (clamp(it.risk_today)*100)+'%';
      dot.style.bottom = (clamp(it.risk_trajectory)*100)+'%';
      dot.title = `${it.label} (RT ${Number(it.risk_today).toFixed(2)}, RTr ${Number(it.risk_trajectory).toFixed(2)})`;
      dot.addEventListener('click', ()=>{ renderDetails(it); });
      matrixDots.appendChild(dot);
    });
  }

  async function loadJSON(path){
    try{
      const res = await fetch(path);
      if(!res.ok) throw new Error('HTTP '+res.status);
      return await res.json();
    }catch{ return null; }
  }

  async function reload(){
    const base = sourceSelect.value;
    const leakage = await loadJSON(`${base}/leakage.json`);
    const repeatSar = await loadJSON(`${base}/repeat_sar.json`);
    const mule = await loadJSON(`${base}/mule_burst.json`);

    const meta = {
      flagged_entities: leakage?.entities?.length ?? '—',
      sla_breach_pct: leakage?.meta?.sla_breach_pct ?? '—',
      repeat_sar_gaps: repeatSar?.entities?.length ?? '—',
      mule_bursts: mule?.entities?.length ?? '—',
    };
    renderKPIs(meta);

    renderTimeSeries(leakage?.timeseries ?? []);

    const merged = []
      .concat(leakage?.entities ?? [])
      .concat(repeatSar?.entities ?? [])
      .concat(mule?.entities ?? [])
      .map((e,i)=> ({
        id: e.entity_id || e.customer_id || e.account_id || ('id_'+i),
        label: e.label || e.entity_name || e.customer_id || e.account_id || ('entity_'+i),
        risk_today: Number(e.risk_today ?? 0),
        risk_trajectory: Number(e.risk_trajectory ?? 0),
        exposure_amount: e.exposure_amount,
        tx_count: e.tx_count,
        first_seen: e.first_seen,
        last_seen: e.last_seen,
        sla_hours_to_case: e.sla_hours_to_case,
        match_confidence: e.match_confidence,
        reason_codes: e.reason_codes,
        reason_code: e.reason_code,
        lineage: e.lineage || null
      }));
    renderMatrix(merged);

    const dqs = [leakage?.meta?.data_quality, repeatSar?.meta?.data_quality, mule?.meta?.data_quality];
    renderDQ(dqs);
  }

  reloadBtn.addEventListener('click', reload);
  sourceSelect.addEventListener('change', reload);
  reload();
})();