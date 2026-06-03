(function () {
  'use strict';

  const CARRIAGE        = 80;
  const OFFSET_CARRIAGE = 20;
  const HANDLES_WT      = 15;
  const PADS_WT         = 15;
  const PLATE_SIZES     = [45, 35, 25, 10, 5, 2.5];
  const STORAGE_KEY     = 'titan-calc-v2';

  // Limits from _data/settings.yaml (output by default.html as JSON)
  const siteSettings = (function () {
    try {
      const el = document.getElementById('calc-site-settings');
      return el ? JSON.parse(el.textContent) : {};
    } catch (_) { return {}; }
  }());
  const MAIN_MAX_PER_SIDE = siteSettings.main_max_plates_per_side || 6;
  const OFFSET_MAX_PLATES = siteSettings.offset_max_plates        || 10;

  // ── State ─────────────────────────────────────────────────────────────────

  function defaultState() {
    return {
      mode:           'target',
      mainPlates:     { '45': 0, '25': 0, '10': 0, '5': 0, '2.5': 0 },
      handles:        false,
      pads:           false,
      useCB:          false,
      offsetPlates:   { '45': 0, '25': 0, '10': 0, '5': 0, '2.5': 0 },
      targetWeight:   '',
      mainMaxPlate:   45,
      offsetMaxPlate: 45
    };
  }

  let state = (function () {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? Object.assign(defaultState(), JSON.parse(s)) : defaultState();
    } catch (_) { return defaultState(); }
  }());

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  // ── Math ──────────────────────────────────────────────────────────────────

  function fmt(n) {
    const r = Math.round(n * 10) / 10;
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
  }

  function near(a, b)         { return Math.abs(a - b) < 0.01; }
  function isMultOf(x, step)  { return near(Math.round(x / step) * step, x); }
  function acc()               { return (state.handles ? HANDLES_WT : 0) + (state.pads ? PADS_WT : 0); }
  function sumPlates(p, f)     { return PLATE_SIZES.reduce((s, k) => s + (p[String(k)] || 0) * k * f, 0); }

  // Greedy largest-first plate fill.
  // pairs=true  → each plate counted × 2 (one per side), so step = size × 2
  // pairs=false → single increments, step = size
  // maxPlate  – largest plate size allowed (filters sizes)
  // maxCount  – max plates per side (pairs=true) or total (pairs=false)
  function greedy(amount, pairs, maxPlate, maxCount) {
    const sizes  = maxPlate ? PLATE_SIZES.filter(s => s <= maxPlate) : PLATE_SIZES;
    const plates = {};
    let rem   = Math.round(amount * 1000) / 1000;
    let count = 0;
    for (const s of sizes) {
      if (maxCount !== undefined && count >= maxCount) break;
      const step = pairs ? s * 2 : s;
      let qty = Math.floor(rem / step + 1e-9);
      if (maxCount !== undefined) qty = Math.min(qty, maxCount - count);
      if (qty > 0) {
        plates[String(s)] = qty;
        rem   = Math.round((rem - qty * step) * 1000) / 1000;
        count += qty;
      }
    }
    return { plates, rem };
  }

  function calcBuild() {
    const mp = sumPlates(state.mainPlates, 2);
    const mc = CARRIAGE + mp + acc();
    const op = state.useCB ? sumPlates(state.offsetPlates, 1) : 0;
    const oc = state.useCB ? OFFSET_CARRIAGE + op : 0;
    return { mc, oc, effective: mc - oc };
  }

  // Reverse calculator.
  // Strategy:
  //   1. No counter-balance if target >= 80+acc and diff is a multiple of 5
  //      (main plates are loaded in pairs, min increment = 2×2.5 = 5)
  //   2. Otherwise use counter-balance.
  //      Effective = 60 + acc + MP - OP where MP∈{0,5,10,…} and OP∈{0,2.5,5,…}
  //      → achievable iff (target−60−acc) is a multiple of 2.5
  //   3. If target is not achievable (not a multiple of 2.5), snap to nearest 2.5.
  function computeTarget(rawTarget) {
    const a    = acc();
    const note = [];

    // Snap to nearest 2.5 lb increment
    let target = Math.round(rawTarget / 2.5) * 2.5;
    if (!near(rawTarget, target)) {
      note.push(`${rawTarget} lbs isn't exactly achievable — showing ${fmt(target)} lbs.`);
    }

    // ── Without counter-balance ──────────────────────────────────────────
    const noCBNeeded = target - CARRIAGE - a;
    if (noCBNeeded >= -0.001 && isMultOf(Math.max(0, noCBNeeded), 5)) {
      const needed = Math.max(0, noCBNeeded);
      const { plates } = greedy(needed, true, state.mainMaxPlate, MAIN_MAX_PER_SIDE);
      const mc = CARRIAGE + a + needed;
      return { useCB: false, mainPlates: plates, offsetPlates: {}, mc, oc: 0, effective: mc, note: note.join(' ') };
    }

    // ── With counter-balance ─────────────────────────────────────────────
    // effective = 60 + a + MP - OP  →  MP - OP = target - 60 - a
    const diff = target - (60 + a);
    let MP = 0, OP = 0;

    if (diff >= 0) {
      const mpFloor = Math.floor(diff / 5 + 1e-9) * 5;
      const rem     = Math.round((diff - mpFloor) * 1000) / 1000;
      if (near(rem, 0)) {
        MP = mpFloor; OP = 0;
      } else {
        // Overshoot main by one 5-lb step, compensate with offset plates
        MP = mpFloor + 5;
        OP = Math.round((MP - diff) * 1000) / 1000;
      }
    } else {
      // Target is below 60+a → load offset plates to bring it down
      OP = Math.round(Math.abs(diff) * 1000) / 1000;
    }

    const mainPlates   = MP > 0 ? greedy(MP, true,  state.mainMaxPlate,   MAIN_MAX_PER_SIDE).plates : {};
    const offsetPlates = OP > 0 ? greedy(OP, false, state.offsetMaxPlate, OFFSET_MAX_PLATES).plates : {};
    const mc  = CARRIAGE + a + MP;
    const oc  = OFFSET_CARRIAGE + OP;
    return { useCB: true, mainPlates, offsetPlates, mc, oc, effective: mc - oc, note: note.join(' ') };
  }

  // ── HTML helpers ──────────────────────────────────────────────────────────

  function plateRows(prefix) {
    return PLATE_SIZES.map(s => `
      <div class="calc-plate-row">
        <span class="calc-plate-lbl">${fmt(s)} lb</span>
        <div class="calc-stepper">
          <button class="calc-step" data-pre="${prefix}" data-sz="${s}" data-d="-1" aria-label="Remove">−</button>
          <span class="calc-step-n" id="${prefix}-n-${s}">0</span>
          <button class="calc-step" data-pre="${prefix}" data-sz="${s}" data-d="1" aria-label="Add">+</button>
        </div>
        <span class="calc-plate-sub" id="${prefix}-sub-${s}">–</span>
      </div>`).join('');
  }

  const MODAL_HTML = `
    <div class="calc-titlebar">
      <span class="calc-title">Weight Calculator</span>
      <button id="calc-close-btn" class="calc-close" aria-label="Close">&times;</button>
    </div>

    <div class="calc-tabs" role="tablist">
      <button class="calc-tab active" id="calc-tab-target" role="tab">Target Weight</button>
      <button class="calc-tab" id="calc-tab-build" role="tab">Build Weight</button>
    </div>

    <!-- ── Build panel ── -->
    <div id="calc-panel-build" class="calc-panel" style="display:none">

      <div class="calc-section">
        <div class="calc-section-head">Main Carriage</div>
        <div class="calc-fixed-row">
          <span>Base carriage</span><span>80 lbs</span>
        </div>
        <div class="calc-plates-head">Plates — loaded each side (counted ×2)</div>
        ${plateRows('mp')}
        <div class="calc-checks">
          <label class="calc-chk"><input type="checkbox" id="b-handles"> Handles <span class="calc-wt">(+15 lbs)</span></label>
          <label class="calc-chk"><input type="checkbox" id="b-pads"> Squat Pads <span class="calc-wt">(+15 lbs)</span></label>
        </div>
        <div class="calc-sub-row">
          <span>Main carriage total</span><strong id="res-mc">80 lbs</strong>
        </div>
      </div>

      <div class="calc-section">
        <label class="calc-chk calc-cb-lbl">
          <input type="checkbox" id="b-cb">
          Counter-Balance &nbsp;<span class="calc-wt">(cable C-2, −20 lb carriage)</span>
        </label>
      </div>

      <div id="calc-offset-sec" class="calc-section" style="display:none">
        <div class="calc-section-head">Offset Carriage <span class="calc-wt">(deducted)</span></div>
        <div class="calc-fixed-row">
          <span>Offset carriage</span><span>20 lbs</span>
        </div>
        <div class="calc-plates-head">Plates — single increments (each deducted)</div>
        ${plateRows('op')}
        <div class="calc-sub-row" id="res-op-plates-row" style="display:none">
          <span>Plates total</span><strong id="res-op-plates">–</strong>
        </div>
        <div class="calc-sub-row">
          <span>Offset total</span><strong id="res-oc">–</strong>
        </div>
      </div>

      <div class="calc-result-bar">
        <span>Effective weight</span>
        <strong id="res-eff">80 lbs</strong>
      </div>
    </div>

    <!-- ── Target panel ── -->
    <div id="calc-panel-target" class="calc-panel">
      <div class="calc-section">
        <label class="calc-target-lbl" for="calc-target-inp">Target weight (lbs)</label>
        <input type="number" id="calc-target-inp" class="calc-target-inp"
               min="1" step="2.5" placeholder="e.g. 135">
        <div class="calc-checks">
          <label class="calc-chk"><input type="checkbox" id="t-handles"> Handles <span class="calc-wt">(+15 lbs)</span></label>
          <label class="calc-chk"><input type="checkbox" id="t-pads"> Squat Pads <span class="calc-wt">(+15 lbs)</span></label>
        </div>
      </div>
      <div id="calc-target-out">
        <p class="calc-hint">Enter a weight above to see the plate configuration.</p>
      </div>
    </div>

    <div class="calc-footer-bar">
      <button id="calc-clear-btn" class="calc-clear-btn">Clear</button>
    </div>`;

  // ── Render ────────────────────────────────────────────────────────────────

  function renderBuild() {
    PLATE_SIZES.forEach(s => {
      const qty = state.mainPlates[String(s)] || 0;
      document.getElementById(`mp-n-${s}`).textContent   = qty;
      document.getElementById(`mp-sub-${s}`).textContent = qty > 0 ? `${fmt(qty * s * 2)} lbs` : '–';
    });
    let opPlatesTotal = 0;
    PLATE_SIZES.forEach(s => {
      const qty = state.offsetPlates[String(s)] || 0;
      document.getElementById(`op-n-${s}`).textContent   = qty;
      document.getElementById(`op-sub-${s}`).textContent = qty > 0 ? `${fmt(qty * s)} lbs` : '–';
      opPlatesTotal += qty * s;
    });
    const opPlatesRow = document.getElementById('res-op-plates-row');
    if (opPlatesRow) {
      opPlatesRow.style.display = opPlatesTotal > 0 ? 'flex' : 'none';
      document.getElementById('res-op-plates').textContent = `${fmt(opPlatesTotal)} lbs`;
    }

    document.getElementById('b-handles').checked = state.handles;
    document.getElementById('b-pads').checked    = state.pads;
    document.getElementById('b-cb').checked      = state.useCB;

    document.getElementById('calc-offset-sec').style.display = state.useCB ? 'block' : 'none';

    const { mc, oc, effective } = calcBuild();
    document.getElementById('res-mc').textContent  = `${fmt(mc)} lbs`;
    document.getElementById('res-oc').textContent  = state.useCB ? `−${fmt(oc)} lbs` : '–';
    document.getElementById('res-eff').textContent = `${fmt(effective)} lbs`;

    save();
  }

  function renderTarget() {
    document.getElementById('t-handles').checked = state.handles;
    document.getElementById('t-pads').checked    = state.pads;

    const out    = document.getElementById('calc-target-out');
    const rawVal = state.targetWeight;
    const target = parseFloat(rawVal);

    if (!rawVal || isNaN(target) || target <= 0) {
      out.innerHTML = '<p class="calc-hint">Enter a weight above to see the plate configuration.</p>';
      return;
    }

    const r = computeTarget(target);
    let html = '';

    if (r.note) html += `<div class="calc-note">${r.note}</div>`;

    const mainPlateCount = PLATE_SIZES.reduce((n, s) => n + (r.mainPlates[String(s)] || 0), 0); // per side
    const mainOverload   = mainPlateCount > MAIN_MAX_PER_SIDE;

    const mainMaxBtns = [45, 35, 25, 10].map(s =>
      `<button class="calc-max-btn${state.mainMaxPlate === s ? ' active' : ''}" data-section="main" data-max="${s}">${s}</button>`
    ).join('');
    html += `<div class="calc-res-sec${mainOverload ? ' calc-res-overload' : ''}">
      <div class="calc-res-head">
        Main Carriage
        <span class="calc-max-plate-group">max plate: ${mainMaxBtns}</span>
      </div>
      <div class="calc-res-row"><span>Base carriage</span><span>80 lbs</span></div>`;

    let perSide = 0;
    PLATE_SIZES.forEach(s => {
      const qty = r.mainPlates[String(s)] || 0;
      if (qty) {
        perSide += qty * s;
        html += `<div class="calc-res-row">
          <span>${qty}&thinsp;×&thinsp;${fmt(s)} lb plate each side</span>
          <span>+${fmt(qty * s * 2)} lbs</span>
        </div>`;
      }
    });
    if (perSide > 0) {
      html += `<div class="calc-res-row calc-res-aside"><span>Per side</span><span>${fmt(perSide)} lbs</span></div>`;
    }
    if (mainOverload) {
      html += `<div class="calc-overload-note">⚠ ${mainPlateCount} plates per side (max ${MAIN_MAX_PER_SIDE}) — consider using larger plates</div>`;
    }
    if (state.handles) html += `<div class="calc-res-row"><span>Handles</span><span>+15 lbs</span></div>`;
    if (state.pads)    html += `<div class="calc-res-row"><span>Squat Pads</span><span>+15 lbs</span></div>`;
    html += `<div class="calc-res-row calc-res-total"><span>Main total</span><span>${fmt(r.mc)} lbs</span></div>
    </div>`;

    if (r.useCB) {
      const offsetPlateCount = PLATE_SIZES.reduce((n, s) => n + (r.offsetPlates[String(s)] || 0), 0);
      const offsetOverload   = offsetPlateCount > OFFSET_MAX_PLATES;
      const maxBtns = [45, 35, 25, 10].map(s =>
        `<button class="calc-max-btn${state.offsetMaxPlate === s ? ' active' : ''}" data-section="offset" data-max="${s}">${s}</button>`
      ).join('');
      html += `<div class="calc-res-sec${offsetOverload ? ' calc-res-overload' : ''}">
        <div class="calc-res-head">
          Counter-Balance (C-2)
          <span class="calc-max-plate-group">max plate: ${maxBtns}</span>
        </div>
        <div class="calc-res-row"><span>Offset carriage</span><span>20 lbs</span></div>`;
      PLATE_SIZES.forEach(s => {
        const qty = r.offsetPlates[String(s)] || 0;
        if (qty) {
          html += `<div class="calc-res-row">
            <span>${qty}&thinsp;×&thinsp;${fmt(s)} lb plate</span>
            <span>+${fmt(qty * s)} lbs</span>
          </div>`;
        }
      });
      if (offsetOverload) {
        html += `<div class="calc-overload-note">⚠ ${offsetPlateCount} plates (max ${OFFSET_MAX_PLATES}) — consider using larger plates or a lower max plate setting</div>`;
      }
      html += `<div class="calc-res-row calc-res-total calc-res-deduct">
        <span>Offset total (deducted)</span><span>−${fmt(r.oc)} lbs</span>
      </div></div>`;
    }

    html += `<div class="calc-result-bar">
      <span>Effective weight</span>
      <strong>${fmt(r.effective)} lbs</strong>
    </div>`;

    out.innerHTML = html;
    save();
  }

  function setMode(mode) {
    state.mode = mode;
    ['build', 'target'].forEach(m => {
      document.getElementById(`calc-tab-${m}`).classList.toggle('active', m === mode);
      document.getElementById(`calc-panel-${m}`).style.display = m === mode ? 'block' : 'none';
    });
    mode === 'build' ? renderBuild() : renderTarget();
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  function init() {
    const modal    = document.getElementById('calc-modal');
    const body     = document.getElementById('calc-body');
    const openBtn  = document.getElementById('calc-open-btn');
    const backdrop = document.getElementById('calc-backdrop');
    if (!modal || !body || !openBtn) return;

    body.innerHTML = MODAL_HTML;

    function applyExerciseDefaults() {
      const el = document.getElementById('calc-exercise-data');
      if (!el) return;
      try {
        const data = JSON.parse(el.textContent);
        const acc  = Array.isArray(data.accessories) ? data.accessories : [];
        state.handles = acc.includes('S1');
        state.pads    = acc.includes('S5');
      } catch (_) {}
    }

    function openCalc() {
      applyExerciseDefaults();
      modal.classList.add('is-open');
      document.body.classList.add('calc-is-open');
      if (state.mode === 'target' && state.targetWeight) {
        document.getElementById('calc-target-inp').value = state.targetWeight;
      }
      setMode(state.mode);
    }
    function closeCalc() {
      modal.classList.remove('is-open');
      document.body.classList.remove('calc-is-open');
    }

    openBtn.addEventListener('click', openCalc);
    document.getElementById('calc-close-btn').addEventListener('click', closeCalc);
    backdrop.addEventListener('click', closeCalc);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCalc(); });

    document.getElementById('calc-tab-build').addEventListener('click',  () => setMode('build'));
    document.getElementById('calc-tab-target').addEventListener('click', () => setMode('target'));

    // Max-plate buttons (target mode)
    body.addEventListener('click', e => {
      const mb = e.target.closest('.calc-max-btn');
      if (mb) {
        const val = parseInt(mb.dataset.max, 10);
        if (mb.dataset.section === 'main') state.mainMaxPlate   = val;
        else                               state.offsetMaxPlate = val;
        renderTarget();
        return;
      }
    });

    // Stepper delegation
    body.addEventListener('click', e => {
      const btn = e.target.closest('.calc-step');
      if (!btn) return;
      const bag = btn.dataset.pre === 'mp' ? state.mainPlates : state.offsetPlates;
      bag[btn.dataset.sz] = Math.max(0, (bag[btn.dataset.sz] || 0) + parseInt(btn.dataset.d, 10));
      renderBuild();
    });

    // Build checkboxes
    document.getElementById('b-handles').addEventListener('change', e => { state.handles = e.target.checked; renderBuild(); });
    document.getElementById('b-pads').addEventListener('change',    e => { state.pads    = e.target.checked; renderBuild(); });
    document.getElementById('b-cb').addEventListener('change',      e => { state.useCB   = e.target.checked; renderBuild(); });

    // Target checkboxes + input
    document.getElementById('t-handles').addEventListener('change', e => { state.handles = e.target.checked; renderTarget(); });
    document.getElementById('t-pads').addEventListener('change',    e => { state.pads    = e.target.checked; renderTarget(); });
    document.getElementById('calc-target-inp').addEventListener('input', e => { state.targetWeight = e.target.value; renderTarget(); });

    // Clear
    document.getElementById('calc-clear-btn').addEventListener('click', () => {
      state = defaultState();
      document.getElementById('calc-target-inp').value = '';
      setMode('build');
    });

  }

  document.addEventListener('DOMContentLoaded', init);
}());
