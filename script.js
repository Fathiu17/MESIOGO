/* ==========================================================================
   MESIOGO — script.js
   Full game engine: rendering, movement, doubles & jail rules, building,
   mortgaging, bankruptcy, rule-based AI, bilingual log, scoring and the
   screenshot-friendly game-over card (+ PNG export). No frameworks.
   ========================================================================== */
'use strict';

/* ==========================================================================
   1. STATE
   ========================================================================== */
const state = {
  lang: (function () { try { return localStorage.getItem('mesiogo-lang') || 'en'; } catch (e) { return 'en'; } })(),
  soundOn: true,
  screen: 'start',
  players: [],
  turn: 0,                    // index of player whose turn it is (0 = human, 1 = AI)
  turnsPlayed: { 0: 0, 1: 0 },
  ownership: new Array(40).fill(null),   // player index | null
  buildings: new Array(40).fill(0),      // 0–4 houses, 5 = hotel
  mortgaged: new Array(40).fill(false),
  buildingCostPaid: new Array(40).fill(0),
  decks: { chance: [], chest: [] },
  log: [],                    // entries: {key, vars, time, ai}
  gameOver: false,
  busy: false,                // true while animations/modals block input
  lastDice: { d1: 6, d2: 6, total: 12 },
  tileEls: [],
  tokenEls: [],
};

/* DOM handles (filled in init) */
let $board, $tokensLayer, $centerPanel, $turnIndicator, $spaceInfo, $playerPanels,
    $die1, $die2, $btnRoll, $btnBuild, $btnSound, $aiThinking, $logList,
    $modalOverlay, $modalBody, $modalClose;

/* ==========================================================================
   2. I18N HELPERS
   ========================================================================== */
function t(key, vars) {
  let s = (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
  if (vars) {
    for (const k in vars) s = s.split('{' + k + '}').join(String(vars[k]));
  }
  return s;
}
const fmt = n => '\u20A6' + Number(n).toLocaleString('en-US');   // ₦ formatting
const spaceName = idx => BOARD_DATA[idx].name[state.lang] || BOARD_DATA[idx].name.en;
const spaceShort = idx => BOARD_DATA[idx].short ? (BOARD_DATA[idx].short[state.lang] || BOARD_DATA[idx].short.en) : spaceName(idx);
const pName = p => (p.id === 0 ? t('you') : t('aiName'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const locale = () => { try { return t('dateLocale'); } catch (e) { return 'en-GB'; } };

/* Apply [data-i18n] / [data-i18n-aria] to every static element */
function applyStaticI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  $btnSound.textContent = state.soundOn ? t('soundOn') : t('soundOff');
  document.querySelectorAll('.lang-btn').forEach(b => {
    const on = b.dataset.lang === state.lang;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

function setLang(lang) {
  state.lang = lang;
  try { localStorage.setItem('mesiogo-lang', lang); } catch (e) { /* optional */ }
  document.documentElement.lang = lang === 'yo' ? 'yo' : 'en';
  applyStaticI18n();
  updateTileTexts();
  updateTileStates();
  updatePanels();
  updateCenter();
  renderLog();
  if (state.screen === 'over') renderGameOverCardOnly();
}

/* ==========================================================================
   3. SOUND (Web Audio, no external files)
   ========================================================================== */
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* no audio */ } }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}
function click(freq) {
  if (!state.soundOn || !audioCtx) return;
  try {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'square'; o.frequency.value = freq || 880;
    g.gain.setValueAtTime(0.07, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + 0.08);
  } catch (e) { /* ignore */ }
}

/* ==========================================================================
   4. BOARD GEOMETRY  (11×11 grid; space 0 at bottom-right, clockwise)
   ========================================================================== */
function posToGrid(s) {
  if (s <= 10)  return { row: 10, col: 10 - s };        // bottom row, right → left
  if (s <= 20)  return { row: 20 - s, col: 0 };         // left column, bottom → top
  if (s <= 30)  return { row: 0, col: s - 20 };         // top row, left → right
  return { row: s - 30, col: 10 };                      // right column, top → bottom
}
function tokenXY(s, playerId) {
  const g = posToGrid(s);
  const off = playerId === 0 ? -1.1 : 1.1;              // offset so both tokens are visible
  return {
    x: ((g.col + 0.5) / 11) * 100 + off,
    y: ((g.row + 0.5) / 11) * 100 + off,
  };
}

/* ==========================================================================
   5. RENDERING — tiles, tokens, panels, log
   ========================================================================== */
function buildBoard() {
  $board.querySelectorAll('.tile').forEach(el => el.remove());
  state.tileEls = [];
  for (let s = 0; s < 40; s++) {
    const sp = BOARD_DATA[s];
    const g = posToGrid(s);
    const el = document.createElement('div');
    el.className = 'tile' + (sp.type === 'corner' || sp.type === 'start' ? ' tile-corner' : '');
    if (sp.group) el.classList.add('g-' + sp.group);
    else el.classList.add('g-' + sp.type);              // g-transport, g-utility, g-tax
    el.style.gridRow = String(g.row + 1);
    el.style.gridColumn = String(g.col + 1);
    el.setAttribute('role', 'gridcell');
    $board.insertBefore(el, $centerPanel);
    state.tileEls.push(el);
  }
  updateTileTexts();
  updateTileStates();
}

function updateTileTexts() {
  const narrow = window.innerWidth < 480;
  for (let s = 0; s < 40; s++) {
    const sp = BOARD_DATA[s], el = state.tileEls[s];
    if (!el) continue;
    const isCorner = sp.type === 'corner' || sp.type === 'start';
    let html = '';
    if (!isCorner) html += '<div class="tile-band"></div><div class="buildings"></div>';
    html += '<div class="tile-body">';
    if (isCorner) {
      html += '<span class="corner-icon">' + sp.icon + '</span>';
      html += '<span class="tile-name">' + sp.name[state.lang] + '</span>';
      if (sp.sub) html += '<span class="tile-sub">' + sp.sub[state.lang] + '</span>';
      if (sp.flavor) html += '<span class="tile-sub">' + sp.flavor[state.lang] + '</span>';
    } else {
      const label = narrow && sp.short ? (sp.short[state.lang] || sp.short.en) : sp.name[state.lang];
      html += '<span class="tile-icon">' + sp.icon + '</span>';
      html += '<span class="tile-name">' + label + '</span>';
      if (sp.price) html += '<span class="tile-price">' + fmt(sp.price) + '</span>';
      else if (sp.amount) html += '<span class="tile-price">' + fmt(sp.amount) + '</span>';
    }
    html += '</div>';
    el.innerHTML = html;
  }
}

function updateTileStates() {
  for (let s = 0; s < 40; s++) {
    const el = state.tileEls[s];
    if (!el) continue;
    el.classList.remove('own-0', 'own-1', 'mortgaged', 'active');
    const owner = state.ownership[s];
    if (owner !== null) el.classList.add('own-' + owner);
    if (state.mortgaged[s]) el.classList.add('mortgaged');
    if (state.players.length && state.players[state.turn] && state.players[state.turn].pos === s && !state.gameOver) {
      el.classList.add('active');
    }
    const b = el.querySelector('.buildings');
    if (b) {
      b.innerHTML = '';
      const n = state.buildings[s];
      if (n === 5) { const h = document.createElement('span'); h.className = 'b-hotel'; b.appendChild(h); }
      else for (let i = 0; i < n; i++) { const h = document.createElement('span'); h.className = 'b-house'; b.appendChild(h); }
    }
  }
}

function renderTokens() {
  $tokensLayer.innerHTML = '';
  state.tokenEls = state.players.map(p => {
    const el = document.createElement('div');
    el.className = 'token p' + p.id;
    $tokensLayer.appendChild(el);
    positionToken(p);
    return el;
  });
}
function positionToken(p) {
  const el = state.tokenEls[p.id];
  if (!el) return;
  const xy = tokenXY(p.pos, p.id);
  el.style.left = xy.x + '%';
  el.style.top = xy.y + '%';
  el.classList.toggle('jailed', p.inJail);
}
async function popToken(p) {
  const el = state.tokenEls[p.id];
  if (!el) return;
  el.classList.add('landed');
  await sleep(380);
  el.classList.remove('landed');
}
function keepTileVisible(s) {
  const vp = document.getElementById('boardViewport');
  if (vp.scrollWidth <= vp.clientWidth + 4) return;
  const el = state.tileEls[s];
  vp.scrollTo({ left: el.offsetLeft - vp.clientWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' });
}

function updatePanels() {
  if (!state.players.length) return;
  $playerPanels.innerHTML = state.players.map(p => {
    const props = state.ownership.filter(o => o === p.id).length;
    const blds = state.buildings.reduce((a, n, i) => a + (state.ownership[i] === p.id ? n : 0), 0);
    return '<div class="player-panel' + (state.turn === p.id && !state.gameOver ? ' current' : '') + '">' +
      '<div class="pp-head"><span class="pp-dot p' + p.id + '"></span>' +
      '<span class="pp-name">' + pName(p) + '</span>' +
      (p.id === 1 ? '<span class="pp-badge">AI</span>' : '') +
      (p.bankrupt ? '<span class="pp-badge">\u2620</span>' : '') +
      '</div>' +
      '<div class="pp-stats">' +
      '<span>' + t('statCash') + ': <b>' + fmt(p.cash) + '</b></span>' +
      '<span>' + t('statProps') + ': <b>' + props + '</b></span>' +
      '<span>' + t('statBuildings') + ': <b>' + blds + '</b></span>' +
      '<span>' + t('statCards') + ': <b>' + p.jailCards + '</b></span>' +
      '<span>' + t('statPosition') + ': <b>' + spaceShort(p.pos) + '</b></span>' +
      '</div></div>';
  }).join('');
}

function spaceDetail(idx) {
  const sp = BOARD_DATA[idx];
  const owner = state.ownership[idx];
  switch (sp.type) {
    case 'property': {
      if (owner === null) return t('infoUnowned', { space: spaceName(idx), price: sp.price });
      const rent = computeRent(idx, owner, 7);
      return t('infoOwned', { space: spaceName(idx), owner: pName(state.players[owner]) }) +
        ' \u00B7 ' + t('infoRent', { amount: rent });
    }
    case 'transport':
      if (owner === null) return t('infoUnowned', { space: spaceName(idx), price: sp.price });
      return t('infoOwned', { space: spaceName(idx), owner: pName(state.players[owner]) }) +
        ' \u00B7 ' + t('infoRent', { amount: computeRent(idx, owner, 7) });
    case 'utility':
      if (owner === null) return t('infoUnowned', { space: spaceName(idx), price: sp.price });
      return t('infoOwned', { space: spaceName(idx), owner: pName(state.players[owner]) });
    case 'tax': return spaceName(idx) + ' \u2212' + fmt(sp.amount);
    default: return spaceName(idx);
  }
}

function updateCenter() {
  if (!state.players.length) return;
  const cur = state.players[state.turn];
  $turnIndicator.textContent = (state.turn === 0 ? t('turnYou') : t('turnAi'));
  $spaceInfo.textContent = cur.bankrupt ? '' : (spaceName(cur.pos) + ' \u2014 ' + spaceDetail(cur.pos));
}

function updateControls() {
  const humanTurn = !state.gameOver && !state.busy && state.turn === 0;
  $btnRoll.disabled = !humanTurn;
  $btnBuild.disabled = !humanTurn;
}

/* ---------- Log (stored as keys, re-rendered in the active language) ---------- */
function log(key, vars, isAI) {
  state.log.push({ key: key, vars: vars || {}, time: Date.now(), ai: !!isAI });
  if (state.log.length > 200) state.log.shift();
  renderLog();
}
function renderLog() {
  $logList.innerHTML = state.log.map(e => {
    const time = new Date(e.time).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
    return '<li' + (e.ai ? ' class="log-ai"' : '') + '><span class="log-time">' + time + '</span>' + t(e.key, e.vars) + '</li>';
  }).join('');
  $logList.scrollTop = $logList.scrollHeight;
}

/* ==========================================================================
   6. MODAL SYSTEM  (promise-based; Escape/✕ resolves null)
   ========================================================================== */
let modalResolve = null;
function openModal(html) {
  $modalBody.innerHTML = html;
  $modalOverlay.hidden = false;
  $modalBody.querySelectorAll('[data-res]').forEach(b => {
    b.addEventListener('click', () => closeModal(b.dataset.res));
  });
  $modalClose.focus();
  return new Promise(res => { modalResolve = res; });
}
function closeModal(result) {
  if ($modalOverlay.hidden) return;
  $modalOverlay.hidden = true;
  const r = modalResolve; modalResolve = null;
  if (r) r(result);
}
function wireModalChrome() {
  $modalClose.addEventListener('click', () => closeModal(null));
  $modalOverlay.addEventListener('click', e => { if (e.target === $modalOverlay) closeModal(null); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(null); });
}

async function showInfoModal(titleHTML, bodyHTML, btnLabel) {
  const html = '<h2 id="modalTitle">' + titleHTML + '</h2><div>' + bodyHTML + '</div>' +
    '<div class="modal-actions"><button class="btn btn-primary" data-res="ok">' + (btnLabel || t('btnOK')) + '</button></div>';
  const res = await openModal(html);
  return res;                                          // null (Escape) behaves like OK
}

/* ==========================================================================
   7. DICE
   ========================================================================== */
function buildDice() {
  [$die1, $die2].forEach(d => {
    let html = '';
    for (let i = 1; i <= 9; i++) html += '<span class="pip p' + i + '"></span>';
    d.innerHTML = html;
  });
}
function rollDice() {
  const d1 = 1 + Math.floor(Math.random() * 6);
  const d2 = 1 + Math.floor(Math.random() * 6);
  return { d1: d1, d2: d2, total: d1 + d2, isDoubles: d1 === d2 };
}
async function animateDice(d1, d2) {
  [$die1, $die2].forEach(d => d.classList.add('rolling'));
  click(520);
  await sleep(260);
  $die1.dataset.v = d1; $die2.dataset.v = d2;
  state.lastDice = { d1: d1, d2: d2, total: d1 + d2 };
  await sleep(300);
  [$die1, $die2].forEach(d => d.classList.remove('rolling'));
}

/* ==========================================================================
   8. MOVEMENT
   ========================================================================== */
async function moveSteps(p, steps) {
  for (let i = 0; i < steps; i++) {
    p.pos = (p.pos + 1) % 40;
    positionToken(p);
    if (p.pos === 0) {                                   // passed/collected at START
      p.cash += GAME_CONFIG.salary;
      log('logPassedStart', { p: pName(p) }, p.id === 1);
      updatePanels();
    }
    await sleep(230);
  }
  await popToken(p);
  updateTileStates(); updateCenter(); updatePanels();
  keepTileVisible(p.pos);
}

async function moveDirect(p, target, opts) {
  opts = opts || {};
  const old = p.pos;
  p.pos = target;
  if (opts.salary && target < old) {                     // wrapped past START
    p.cash += GAME_CONFIG.salary;
    log('logPassedStart', { p: pName(p) }, p.id === 1);
  }
  positionToken(p);
  await sleep(500);
  await popToken(p);
  updateTileStates(); updateCenter(); updatePanels();
  keepTileVisible(p.pos);
}

function sendToJail(p) {
  p.inJail = true;
  p.jailTurns = 0;
  p.doublesStreak = 0;
  p.pos = 10;
  positionToken(p);
  updateTileStates(); updateCenter(); updatePanels();
}

/* ==========================================================================
   9. RENT / MONEY
   ========================================================================== */
function ownsFullGroup(playerId, group) {
  return GROUPS[group].members.every(m => state.ownership[m] === playerId);
}
function computeRent(idx, ownerId, diceTotal) {
  const sp = BOARD_DATA[idx];
  if (state.mortgaged[idx]) return 0;
  if (sp.type === 'property') {
    const b = state.buildings[idx];
    let base = sp.rent[b];
    if (b === 0 && ownsFullGroup(ownerId, sp.group)) base *= 2;   // full-set bonus
    return base;
  }
  if (sp.type === 'transport') {
    let count = 0;
    BOARD_DATA.forEach((s, i) => { if (s.type === 'transport' && state.ownership[i] === ownerId && !state.mortgaged[i]) count++; });
    return sp.rentByCount[Math.max(0, count - 1)];
  }
  if (sp.type === 'utility') {
    let count = 0;
    BOARD_DATA.forEach((s, i) => { if (s.type === 'utility' && state.ownership[i] === ownerId && !state.mortgaged[i]) count++; });
    return diceTotal * (count >= 2 ? 10 : 4);
  }
  return 0;
}

/* Pay `amount`; if short, liquidate buildings then mortgages.
   Returns true if paid, false if bankrupt. */
async function payAmount(p, amount, info) {
  info = info || {};
  if (p.cash >= amount) {
    p.cash -= amount;
    if (info.to) info.to.cash += amount;
    if (info.rent) {
      log('rentPayMsg', { p: pName(p), amount: amount, owner: pName(info.to), space: spaceName(p.pos) }, p.id === 1);
      if (p.id === 0 && !state.gameOver) {
        await showInfoModal(t('rentTitle'),
          '<p>' + t('rentPayMsg', { p: pName(p), amount: amount, owner: pName(info.to), space: spaceName(p.pos) }) + '</p>');
      }
    } else if (info.tax) {
      log('taxPayMsg', { p: pName(p), amount: amount, tax: spaceName(p.pos) }, p.id === 1);
      if (p.id === 0 && !state.gameOver) {
        await showInfoModal(spaceName(p.pos),
          '<p>' + t('taxPayMsg', { p: pName(p), amount: amount, tax: spaceName(p.pos) }) + '</p>');
      }
    }
    updatePanels(); updateCenter();
    return true;
  }
  /* --- short on cash: liquidate --- */
  const ok = await liquidate(p, amount);
  if (!ok) { declareBankruptcy(p); return false; }
  p.cash -= amount;
  if (info.to) info.to.cash += amount;
  updatePanels(); updateCenter();
  return true;
}

function sellBuildingAction(p, idx) {
  const sp = BOARD_DATA[idx];
  const refund = Math.floor(sp.houseCost / 2);
  state.buildings[idx]--;
  p.cash += refund;
  log('logSoldHouse', { p: pName(p), space: spaceName(idx), cost: refund }, p.id === 1);
  updateTileStates(); updatePanels();
}
function mortgageAction(p, idx) {
  const sp = BOARD_DATA[idx];
  const amount = Math.floor(sp.price * GAME_CONFIG.mortgageRate);
  state.mortgaged[idx] = true;
  p.cash += amount;
  log('logMortgaged', { p: pName(p), space: spaceName(idx), amount: amount }, p.id === 1);
  updateTileStates(); updatePanels();
}

function availableLiquidations(p) {
  const acts = [];
  for (let i = 0; i < 40; i++) {
    if (state.ownership[i] !== p.id) continue;
    if (state.buildings[i] > 0) {
      acts.push({ kind: 'sell', idx: i, gain: Math.floor(BOARD_DATA[i].houseCost / 2) });
    } else if (!state.mortgaged[i]) {
      acts.push({ kind: 'mortgage', idx: i, gain: Math.floor(BOARD_DATA[i].price * GAME_CONFIG.mortgageRate) });
    }
  }
  return acts;
}

async function liquidate(p, amount) {
  if (p.id === 1) {
    /* AI: sell the most valuable building first, else mortgage the cheapest property */
    while (p.cash < amount) {
      const acts = availableLiquidations(p);
      if (!acts.length) return false;
      const sell = acts.filter(a => a.kind === 'sell').sort((a, b) => b.gain - a.gain)[0];
      const act = sell || acts.sort((a, b) => a.gain - b.gain)[0];
      if (act.kind === 'sell') sellBuildingAction(p, act.idx); else mortgageAction(p, act.idx);
      await sleep(350);
      if (state.gameOver) return false;
    }
    return true;
  }

  /* Human: interactive modal, rebuilt after every action */
  while (p.cash < amount) {
    const acts = availableLiquidations(p);
    if (!acts.length) return false;
    const buttons = acts.map((a, i) =>
      '<button class="btn btn-secondary" data-res="' + i + '">' +
      (a.kind === 'sell' ? '\uD83C\uDFE0 ' : '\uD83C\uDFE6 ') +
      spaceName(a.idx) + ' <b>+' + fmt(a.gain) + '</b></button>').join('');
    const html = '<h2 id="modalTitle">' + t('bankruptTitle') + '</h2>' +
      '<p>' + t('bankruptMsg', { p: pName(p), amount: amount }) + '</p>' +
      '<p class="price-line">' + t('statCash') + ': ' + fmt(p.cash) + ' / ' + fmt(amount) + '</p>' +
      '<div class="modal-actions">' + buttons +
      '<button class="btn btn-ghost" data-res="giveup">' + '\u2620 ' + t('bankruptTitle') + '</button></div>';
    const res = await openModal(html);
    if (res === null || res === 'giveup') return false;
    const act = acts[Number(res)];
    if (!act) return false;
    if (act.kind === 'sell') sellBuildingAction(p, act.idx); else mortgageAction(p, act.idx);
    await sleep(250);
  }
  return true;
}

/* ==========================================================================
   10. LANDING RESOLUTION
   ========================================================================== */
async function resolveLanding(p, dice) {
  const idx = p.pos, sp = BOARD_DATA[idx];
  log('logLanded', { p: pName(p), space: spaceName(idx) }, p.id === 1);
  switch (sp.type) {
    case 'start':
      break;
    case 'corner':
      if (sp.corner === 'jail') { log('jailVisitMsg', { p: pName(p) }, p.id === 1); }
      else if (sp.corner === 'parking') { log('freeParkingMsg', { p: pName(p) }, p.id === 1); }
      else if (sp.corner === 'gotojail') {
        log('goToJailMsg', { p: pName(p) }, p.id === 1);
        await sleep(400); sendToJail(p);
      }
      break;
    case 'tax':
      await payAmount(p, sp.amount, { tax: true });
      break;
    case 'chance':
    case 'chest': {
      const deckName = sp.type === 'chance' ? 'chance' : 'chest';
      const card = drawCard(deckName);
      const kicker = sp.type === 'chance' ? t('chanceKicker') : t('chestKicker');
      const text = card[state.lang] || card.en;
      await showInfoModal('', '<p class="modal-kicker">' + kicker + '</p>' +
        '<p style="font-size:2.2rem;margin:0">' + card.icon + '</p>' +
        '<p class="card-flavor">' + text + '</p>', t('cardOK'));
      if (state.gameOver) return;
      await applyCard(p, card);
      break;
    }
    case 'property':
    case 'transport':
    case 'utility': {
      const owner = state.ownership[idx];
      if (owner === null) {
        if (p.id === 1) {
          if (aiShouldBuy(p, sp)) { buyProperty(p, idx); }
          else log('logPassed', { p: pName(p), space: spaceName(idx) }, true);
        } else {
          const ok = await showBuyModal(idx);
          if (state.gameOver) return;
          if (ok === 'buy') buyProperty(p, idx);
          else log('logPassed', { p: pName(p), space: spaceName(idx) }, false);
        }
      } else if (owner === p.id) {
        /* own space — nothing to pay */
      } else if (state.mortgaged[idx]) {
        log('mortgagedNoRent', { space: spaceName(idx) }, p.id === 1);
        if (p.id === 0) await showInfoModal(t('rentTitle'), '<p>' + t('mortgagedNoRent', { space: spaceName(idx) }) + '</p>');
      } else {
        const rent = computeRent(idx, owner, dice.total);
        await payAmount(p, rent, { rent: true, to: state.players[owner] });
      }
      break;
    }
  }
  updateTileStates(); updateCenter(); updatePanels();
}

function buyProperty(p, idx) {
  const sp = BOARD_DATA[idx];
  p.cash -= sp.price;
  state.ownership[idx] = p.id;
  log('logBought', { p: pName(p), space: spaceName(idx), price: sp.price }, p.id === 1);
  updateTileStates(); updatePanels(); updateCenter();
}

function rentTableHTML(sp) {
  if (sp.type === 'property') {
    const rows = [
      [t('rentLabel'), fmt(sp.rent[0])],
      [t('oneHouse'), fmt(sp.rent[1])],
      [t('twoHouses'), fmt(sp.rent[2])],
      [t('threeHouses'), fmt(sp.rent[3])],
      [t('fourHouses'), fmt(sp.rent[4])],
      [t('hotel'), fmt(sp.rent[5])],
    ].map(r => '<tr><td>' + r[0] + '</td><td><b>' + r[1] + '</b></td></tr>').join('');
    return '<table>' + rows + '</table>' +
      '<p>' + t('housesCost', { cost: sp.houseCost }) + '. ' + t('fullSetBonus') + '</p>';
  }
  if (sp.type === 'transport') {
    return '<table>' + sp.rentByCount.map((r, i) =>
      '<tr><td>' + (i + 1) + '</td><td><b>' + fmt(r) + '</b></td></tr>').join('') + '</table>' +
      '<p>' + t('transportRentNote') + '</p>';
  }
  return '<p>' + t('utilityRentNote') + '</p>';
}

async function showBuyModal(idx) {
  const sp = BOARD_DATA[idx];
  const html = '<h2 id="modalTitle">' + t('buyTitle') + '</h2>' +
    '<p>' + t('buyQuestion', { space: spaceName(idx), price: sp.price }) + '</p>' +
    rentTableHTML(sp) +
    '<div class="modal-actions">' +
    '<button class="btn btn-primary" data-res="buy">' + t('btnBuy') + '</button>' +
    '<button class="btn btn-ghost" data-res="pass">' + t('btnPass') + '</button></div>';
  const res = await openModal(html);
  return res === 'buy' && state.players[0].cash >= sp.price ? 'buy' : 'pass';
                                                             }

/* ==========================================================================
   11. EVENT CARDS
   ========================================================================== */
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const tmp = a[i]; a[i] = a[j]; a[j] = tmp; }
  return a;
}
function drawCard(deckName) {
  if (!state.decks[deckName].length) {
    state.decks[deckName] = shuffle((deckName === 'chance' ? CHANCE_CARDS : COMMUNITY_CARDS).slice());
  }
  return state.decks[deckName].pop();
}
async function applyCard(p, card) {
  const e = card.effect;
  switch (e.type) {
    case 'collect': p.cash += e.amount; updatePanels(); break;
    case 'pay': await payAmount(p, e.amount, { tax: false }); break;
    case 'advanceTo': await moveDirect(p, e.space, { salary: e.passSalary }); await resolveLanding(p, state.lastDice); break;
    case 'backN': await moveStepsBack(p, e.count); await resolveLanding(p, state.lastDice); break;
    case 'jail': sendToJail(p); break;
    case 'jailFree': p.jailCards++; updatePanels(); break;
    case 'nothing': default: break;
  }
  updateTileStates(); updateCenter(); updatePanels();
}
async function moveStepsBack(p, count) {
  for (let i = 0; i < count; i++) { p.pos = (p.pos + 39) % 40; positionToken(p); await sleep(230); }
  await popToken(p);
  updateTileStates(); updateCenter();
}

/* ==========================================================================
   12. JAIL
   ========================================================================== */
async function handleJailTurn(p) {
  p.jailTurns++;
  const canCard = p.jailCards > 0;
  const mustPay = p.jailTurns >= GAME_CONFIG.jailMaxTurns;

  if (p.id === 1) {
    /* AI rule: pay if rich, else use card, else try doubles */
    if (mustPay || p.cash > 400) {
      if (p.cash >= GAME_CONFIG.jailFine) {
        p.cash -= GAME_CONFIG.jailFine;
        p.inJail = false;
        log('jailPaid', { p: pName(p) }, true);
        updatePanels(); updateCenter();
        return false;                                     // proceed to roll normally
      }
      const ok = await payAmount(p, GAME_CONFIG.jailFine, {});
      if (!ok || state.gameOver) return true;
      p.inJail = false; updatePanels(); updateCenter();
      return false;
    }
    if (canCard) {
      p.jailCards--; p.inJail = false;
      log('jailCardUsed', { p: pName(p) }, true);
      updatePanels(); updateCenter();
      return false;
    }
    const r = rollDice(); await animateDice(r.d1, r.d2);
    log('logRolled', { p: pName(p), d1: r.d1, d2: r.d2, total: r.total }, true);
    if (r.isDoubles) {
      p.inJail = false;
      log('jailDoublesOut', { p: pName(p) }, true);
      updatePanels(); updateCenter();
      await moveSteps(p, r.total);
      await resolveLanding(p, r);
      return true;                                        // escaping ends the AI turn
    }
    log('jailNoDoubles', { p: pName(p) }, true);
    return true;                                          // stays in jail, turn over
  }

  /* ----- human ----- */
  if (mustPay) {
    log('jailForcedPay', { p: pName(p) }, false);
    const ok = await payAmount(p, GAME_CONFIG.jailFine, {});
    if (!ok || state.gameOver) return true;
    p.inJail = false; updatePanels(); updateCenter();
    return false;
  }
  const html = '<h2 id="modalTitle">' + t('jailTitle') + '</h2><p>' + t('jailSub') + '</p>' +
    '<div class="modal-actions">' +
    '<button class="btn btn-primary" data-res="doubles">' + t('jailTryDoubles') + '</button>' +
    '<button class="btn btn-secondary" data-res="pay" ' + (p.cash < GAME_CONFIG.jailFine ? 'disabled' : '') + '>' + t('jailPay') + '</button>' +
    '<button class="btn btn-secondary" data-res="card" ' + (canCard ? '' : 'disabled') + '>' + t('jailUseCard') + '</button></div>';
  let res = await openModal(html);
  if (res === null) res = 'doubles';

  if (res === 'pay') {
    const ok = await payAmount(p, GAME_CONFIG.jailFine, {});
    if (!ok || state.gameOver) return true;
    p.inJail = false; updatePanels(); updateCenter();
    return false;
  }
  if (res === 'card' && canCard) {
    p.jailCards--; p.inJail = false;
    log('jailCardUsed', { p: pName(p) }, false);
    updatePanels(); updateCenter();
    return false;
  }
  /* try doubles */
  const r = rollDice(); await animateDice(r.d1, r.d2);
  log('logRolled', { p: pName(p), d1: r.d1, d2: r.d2, total: r.total }, false);
  if (r.isDoubles) {
    p.inJail = false;
    log('jailDoublesOut', { p: pName(p) }, false);
    updatePanels(); updateCenter();
    await moveSteps(p, r.total);
    await resolveLanding(p, r);
    return true;                                          // escaping consumes the turn
  }
  log('jailNoDoubles', { p: pName(p) }, false);
  return true;
}

/* ==========================================================================
   13. TURN ENGINE
   ========================================================================== */
async function takeTurn(p) {
  if (state.gameOver || p.bankrupt) return;
  if (p.inJail) {
    const turnOver = await handleJailTurn(p);
    if (turnOver || state.gameOver) { await endTurn(p); return; }
  }
  /* roll-and-move loop, honouring doubles */
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const r = rollDice();
    await animateDice(r.d1, r.d2);
    log('logRolled', { p: pName(p), d1: r.d1, d2: r.d2, total: r.total }, p.id === 1);
    if (r.isDoubles) {
      p.doublesStreak++;
      if (p.doublesStreak >= 3) {
        log('logThreeDoubles', { p: pName(p) }, p.id === 1);
        await sleep(350);
        sendToJail(p);
        break;
      }
      log('logDoubles', { p: pName(p) }, p.id === 1);
    } else {
      p.doublesStreak = 0;
    }
    await moveSteps(p, r.total);
    await resolveLanding(p, r);
    if (state.gameOver) return;
    if (p.inJail) break;                                  // e.g. Chance card sent us
    if (!r.isDoubles) break;                              // normal end of turn
    if (p.id === 0) {
      /* human rolls again — brief confirmation so they see what happened */
      await showInfoModal(t('logDoubles', { p: pName(p) }).split('.')[0], '<p>\uD83C\uDFB2 \u21BB</p>', t('btnRoll'));
      if (state.gameOver) return;
    }
  }
  await endTurn(p);
}

async function endTurn(p) {
  if (state.gameOver) return;
  p.doublesStreak = 0;
  state.turnsPlayed[p.id]++;
  if (state.turnsPlayed[0] >= GAME_CONFIG.maxTotalTurns / 2 &&
      state.turnsPlayed[1] >= GAME_CONFIG.maxTotalTurns / 2) {
    renderGameOver('turns');
    return;
  }
  state.turn = 1 - state.turn;
  const next = state.players[state.turn];
  updateTileStates(); updateCenter(); updatePanels(); updateControls();
  if (next.id === 1) {
    $aiThinking.hidden = false;
    await sleep(1200);                                    // visible "AI is playing" beat
    if (state.gameOver) { $aiThinking.hidden = true; return; }
    await aiBuildPhase(next);
    await takeTurn(next);
    $aiThinking.hidden = true;
  } else {
    updateControls();
  }
  }


/* ==========================================================================
   14. BUILDING (houses & hotels)
   ========================================================================== */
function canBuildOn(idx, p) {
  const sp = BOARD_DATA[idx];
  if (!sp || sp.type !== 'property') return { ok: false, why: 'buildEmpty' };
  if (state.ownership[idx] !== p.id) return { ok: false, why: 'buildEmpty' };
  if (!ownsFullGroup(p.id, sp.group)) return { ok: false, why: 'buildEmpty' };
  if (state.mortgaged[idx]) return { ok: false, why: 'buildEmpty' };
  if (state.buildings[idx] >= 5) return { ok: false, why: 'buildMaxed' };
  const minSib = Math.min.apply(null, GROUPS[sp.group].members.map(m => state.buildings[m]));
  if (state.buildings[idx] > minSib) return { ok: false, why: 'buildEvenRule', group: sp.group };
  if (p.cash < sp.houseCost) return { ok: false, why: 'notEnoughCash' };
  return { ok: true };
}

function buildOn(p, idx) {
  const sp = BOARD_DATA[idx];
  p.cash -= sp.houseCost;
  state.buildings[idx]++;
  state.buildingCostPaid[idx] += sp.houseCost;
  if (state.buildings[idx] === 5) log('logBuiltHotel', { p: pName(p), space: spaceName(idx), cost: sp.houseCost }, p.id === 1);
  else log('logBuiltHouse', { p: pName(p), space: spaceName(idx), cost: sp.houseCost }, p.id === 1);
  updateTileStates(); updatePanels(); updateCenter();
}

async function openBuildModal() {
  const p = state.players[0];
  const props = [];
  for (let i = 0; i < 40; i++) {
    if (state.ownership[i] === 0 && (BOARD_DATA[i].type === 'property' || state.mortgaged[i])) props.push(i);
  }
  if (!props.length) { await showInfoModal(t('buildTitle'), '<p>' + t('buildEmpty') + '</p>'); return; }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const items = props.map(i => {
      const sp = BOARD_DATA[i];
      if (state.mortgaged[i]) {
        const cost = Math.floor(sp.price * GAME_CONFIG.unmortgageRate);
        const can = p.cash >= cost;
        return '<li><span class="bl-name">\uD83C\uDFE6 ' + spaceName(i) + '</span>' +
          '<button class="btn btn-secondary" data-res="um' + i + '" ' + (can ? '' : 'disabled') + '>' +
          t('btnUnmortgage') + ' \u2212' + fmt(cost) + '</button></li>';
      }
      const chk = canBuildOn(i, p);
      const label = state.buildings[i] === 5 ? t('buildMaxed')
        : t('buildHouse', { cost: sp.houseCost }) + ' (' + (state.buildings[i] === 4 ? 'hotel' : state.buildings[i] + '/4') + ')';
      return '<li><span class="bl-name">' + spaceName(i) + '<br><span class="bl-sub">' +
        (chk.ok ? '' : t(chk.why, { space: spaceName(i), group: sp.group })) + '</span></span>' +
        '<button class="btn btn-primary" data-res="b' + i + '" ' + (chk.ok ? '' : 'disabled') + '>' + label + '</button></li>';
    }).join('');
    const html = '<h2 id="modalTitle">' + t('buildTitle') + '</h2>' +
      '<p class="price-line">' + t('statCash') + ': ' + fmt(p.cash) + '</p>' +
      '<ul class="build-list">' + items + '</ul>' +
      '<div class="modal-actions"><button class="btn btn-ghost" data-res="done">' + t('btnOK') + '</button></div>';
    const res = await openModal(html);
    if (res === null || res === 'done') return;
    if (res.charAt(0) === 'b') {
      const i = Number(res.slice(1));
      if (canBuildOn(i, p).ok) { buildOn(p, i); click(700); }
    } else if (res.slice(0, 2) === 'um') {
      const i = Number(res.slice(2));
      const cost = Math.floor(BOARD_DATA[i].price * GAME_CONFIG.unmortgageRate);
      if (state.mortgaged[i] && p.cash >= cost) {
        p.cash -= cost; state.mortgaged[i] = false;
        log('logUnmortgaged', { p: pName(p), space: spaceName(i), amount: cost }, false);
        updateTileStates(); updatePanels();
      }
    }
    if (state.gameOver) return;
  }
}

/* AI building: one house per turn on the cheapest buildable property of any full group */
async function aiBuildPhase(p) {
  let guard = 8;
  while (p.cash > 600 && guard-- > 0) {
    const candidates = [];
    for (const g in GROUPS) {
      if (!ownsFullGroup(p.id, g)) continue;
      GROUPS[g].members.forEach(i => {
        if (canBuildOn(i, p).ok) candidates.push(i);
      });
    }
    if (!candidates.length) return;
    candidates.sort((a, b) => BOARD_DATA[a].houseCost - BOARD_DATA[b].houseCost || state.buildings[a] - state.buildings[b]);
    buildOn(p, candidates[0]);
    await sleep(400);
  }
      }


/* ==========================================================================
   15. AI DECISIONS
   ========================================================================== */
function aiShouldBuy(p, sp) {
  if (p.cash - sp.price >= 200) return true;
  if (sp.type === 'property' && GROUPS[sp.group]) {
    const completes = GROUPS[sp.group].members.every(m => state.ownership[m] === p.id || m === p.pos);
    if (completes) return true;
  }
  return false;
}

/* ==========================================================================
   16. BANKRUPTCY & GAME OVER
   ========================================================================== */
function declareBankruptcy(p) {
  p.bankrupt = true;
  const winner = state.players[1 - p.id];
  log('bankruptEnd', { p: pName(p), winner: pName(winner) }, p.id === 1);
  renderGameOver('bankrupt');
}

function calculateTotalPoints(p) {
  let propVal = 0, buildVal = 0, debts = 0;
  for (let i = 0; i < 40; i++) {
    if (state.ownership[i] !== p.id) continue;
    propVal += BOARD_DATA[i].price;
    buildVal += state.buildingCostPaid[i];
    if (state.mortgaged[i]) debts += Math.floor(BOARD_DATA[i].price * GAME_CONFIG.mortgageRate);
  }
  const total = p.cash + propVal + buildVal + p.jailCards * GAME_CONFIG.jailCardValue - debts;
  return { cash: p.cash, propVal: propVal, buildVal: buildVal, debts: debts, jailCards: p.jailCards, total: total };
}

function renderGameOver(reason) {
  state.gameOver = true;
  state.busy = false;
  updateControls();
  $aiThinking.hidden = true;
  renderGameOverCardOnly(reason);
  document.getElementById('gameScreen').hidden = true;
  document.getElementById('overScreen').hidden = false;
  state.screen = 'over';
  window.scrollTo(0, 0);
}

function renderGameOverCardOnly(reason) {
  const s0 = calculateTotalPoints(state.players[0]);
  const s1 = calculateTotalPoints(state.players[1]);
  let winnerIdx = s0.total === s1.total ? -1 : (s0.total > s1.total ? 0 : 1);

  const $wt = document.getElementById('winnerText');
  if (reason === 'bankrupt') winnerIdx = state.players[0].bankrupt ? 1 : 0;
  if (winnerIdx === -1) $wt.textContent = t('tieResult');
  else $wt.textContent = t('winnerIs', { name: pName(state.players[winnerIdx]) });
  document.querySelector('.winner-banner .crown').style.display = winnerIdx === -1 ? 'none' : '';

  const row = (p, s) => '<tr class="' + (winnerIdx === p.id ? 'winner-row' : '') + '">' +
    '<td>' + pName(p) + '</td><td>' + fmt(s.cash) + '</td><td>' + fmt(s.propVal) + '</td>' +
    '<td>' + fmt(s.buildVal) + '</td><td>' + fmt(s.debts) + '</td><td>' + fmt(s.total) + '</td></tr>';
  document.getElementById('scoreBody').innerHTML = row(state.players[0], s0) + row(state.players[1], s1);
  document.getElementById('scoreFormula').textContent = t('formula');
  let dateStr;
  try { dateStr = new Date().toLocaleString(locale()); }
  catch (e) { dateStr = new Date().toLocaleString('en-GB'); }
  document.getElementById('resDateTime').textContent = dateStr;
  document.getElementById('resLang').textContent = t('langUsed') + ': ' + (state.lang === 'yo' ? 'YO' : 'EN');
}

/* ---------- PNG export of the result card (canvas, no backend) ---------- */
function downloadResultPng() {
  const s0 = calculateTotalPoints(state.players[0]);
  const s1 = calculateTotalPoints(state.players[1]);
  let winnerIdx = s0.total === s1.total ? -1 : (s0.total > s1.total ? 0 : 1);

  const W = 1000, H = 1240;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');

  c.fillStyle = '#0B3D2E'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#F5EFE0';
  roundRect(c, 40, 40, W - 80, H - 80, 24); c.fill();
  c.strokeStyle = '#D4A017'; c.lineWidth = 8;
  roundRect(c, 40, 40, W - 80, H - 80, 24); c.stroke();

  c.textAlign = 'center';
  c.fillStyle = '#0B3D2E';
  c.font = '900 84px "Noto Serif", serif';
  c.fillText('MESIOGO', W / 2, 160);
  c.fillStyle = '#C45A2C';
  c.font = 'italic 30px "Noto Serif", serif';
  c.fillText('\u201CA\u0300K\u0301IKANJU\u0301 IB\u0300AD\u0300AN\u201D \u00B7 \u201CTHE COURAGE OF IBADAN\u201D', W / 2, 205);

  if (winnerIdx !== -1) {
    c.font = '60px serif';
    c.fillText('\uD83D\uDC51', W / 2 - 260, 290);
    c.fillStyle = '#0B3D2E';
    c.font = '700 44px "Noto Serif", serif';
    c.fillText(t('winnerIs', { name: pName(state.players[winnerIdx]) }), W / 2 + 40, 285);
  } else {
    c.fillStyle = '#0B3D2E';
    c.font = '700 44px "Noto Serif", serif';
    c.fillText(t('tieResult'), W / 2, 285);
  }

  /* table */
  const cols = [t('colPlayer'), t('colCash'), t('colProperty'), t('colBuildings'), t('colDebts'), t('colTotal')];
  const rows = [
    [pName(state.players[0]), fmt(s0.cash), fmt(s0.propVal), fmt(s0.buildVal), fmt(s0.debts), fmt(s0.total)],
    [pName(state.players[1]), fmt(s1.cash), fmt(s1.propVal), fmt(s1.buildVal), fmt(s1.debts), fmt(s1.total)],
  ];
  const tx = 70, ty = 340, tw = W - 140, rh = 74;
  const cw = [tw * .22, tw * .16, tw * .17, tw * .17, tw * .14, tw * .14];
  c.font = '700 24px "Noto Sans", sans-serif';
  c.fillStyle = '#2E2A6E';
  roundRect(c, tx, ty, tw, rh, 8); c.fill();
  c.fillStyle = '#F5EFE0';
  let x = tx;
  cols.forEach((h, i) => { c.fillText(h, x + cw[i] / 2, ty + 47); x += cw[i]; });
  rows.forEach((r, ri) => {
    const y = ty + rh * (ri + 1);
    c.fillStyle = winnerIdx === ri ? 'rgba(212,160,23,.35)' : (ri === 1 ? '#EFE7D2' : '#F5EFE0');
    c.fillRect(tx, y, tw, rh);
    c.strokeStyle = '#E0D5B8'; c.strokeRect(tx, y, tw, rh);
    c.fillStyle = '#1E1B16';
    x = tx;
    r.forEach((v, i) => { c.fillText(String(v), x + cw[i] / 2, y + 47); x += cw[i]; });
  });

  c.fillStyle = '#5C3B1E';
  c.font = '20px "Noto Sans", sans-serif';
  wrapText(c, t('formula'), W / 2, ty + rh * 3 + 50, tw - 60, 26);

  let dateStr;
  try { dateStr = new Date().toLocaleString(locale()); } catch (e) { dateStr = new Date().toLocaleString('en-GB'); }
  c.fillText(dateStr + '  \u00B7  ' + t('langUsed') + ': ' + (state.lang === 'yo' ? 'YO' : 'EN'), W / 2, H - 150);
  c.fillStyle = '#C45A2C';
  c.font = '700 30px "Noto Sans", sans-serif';
  c.fillText('\uD83D\uDCF8 ' + t('screenshotMsg'), W / 2, H - 100);

  const a = document.createElement('a');
  a.download = 'mesiogo-result.png';
  a.href = cv.toDataURL('image/png');
  a.click();
}
function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function wrapText(c, text, cx, y, maxW, lh) {
  const words = text.split(' ');
  let line = '', yy = y;
  words.forEach(w => {
    if (c.measureText(line + ' ' + w).width > maxW && line) { c.fillText(line, cx, yy); line = w; yy += lh; }
    else line = line ? line + ' ' + w : w;
  });
  c.fillText(line, cx, yy);
}

/* ==========================================================================
   17. GAME LIFECYCLE
   ========================================================================== */
function resetGame() {
  state.players = [
    { id: 0, isAI: false, cash: GAME_CONFIG.startCash, pos: 0, inJail: false, jailTurns: 0, jailCards: 0, doublesStreak: 0, bankrupt: false },
    { id: 1, isAI: true,  cash: GAME_CONFIG.startCash, pos: 0, inJail: false, jailTurns: 0, jailCards: 0, doublesStreak: 0, bankrupt: false },
  ];
  state.turn = 0;
  state.turnsPlayed = { 0: 0, 1: 0 };
  state.ownership.fill(null);
  state.buildings.fill(0);
  state.mortgaged.fill(false);
  state.buildingCostPaid.fill(0);
  state.decks = { chance: shuffle(CHANCE_CARDS.slice()), chest: shuffle(COMMUNITY_CARDS.slice()) };
  state.log = [];
  state.gameOver = false;
  state.busy = false;
  state.lastDice = { d1: 6, d2: 6, total: 12 };
  $die1.dataset.v = 6; $die2.dataset.v = 6;
}

function startGame() {
  resetGame();
  buildBoard();
  renderTokens();
  renderLog();
  updatePanels(); updateCenter(); updateTileStates(); updateControls();
  document.getElementById('startScreen').hidden = true;
  document.getElementById('howToScreen').hidden = true;
  document.getElementById('overScreen').hidden = true;
  document.getElementById('gameScreen').hidden = false;
  state.screen = 'game';
  log('logLanded', { p: pName(state.players[0]), space: spaceName(0) }, false);
}

function showScreen(name) {
  state.screen = name;
  document.getElementById('startScreen').hidden = name !== 'start';
  document.getElementById('howToScreen').hidden = name !== 'howto';
  document.getElementById('gameScreen').hidden = name !== 'game';
  document.getElementById('overScreen').hidden = name !== 'over';
}

/* ==========================================================================
   18. INIT & EVENT WIRING
   ========================================================================== */
function init() {
  $board = document.getElementById('board');
  $tokensLayer = document.getElementById('tokensLayer');
  $centerPanel = document.getElementById('centerPanel');
  $turnIndicator = document.getElementById('turnIndicator');
  $spaceInfo = document.getElementById('spaceInfo');
  $playerPanels = document.getElementById('playerPanels');
  $die1 = document.getElementById('die1');
  $die2 = document.getElementById('die2');
  $btnRoll = document.getElementById('btnRoll');
  $btnBuild = document.getElementById('btnBuild');
  $btnSound = document.getElementById('btnSound');
  $aiThinking = document.getElementById('aiThinking');
  $logList = document.getElementById('logList');
  $modalOverlay = document.getElementById('modalOverlay');
  $modalBody = document.getElementById('modalBody');
  $modalClose = document.getElementById('modalClose');

  buildDice();
  wireModalChrome();
  applyStaticI18n();

  /* language toggle */
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.addEventListener('click', () => { ensureAudio(); click(660); setLang(b.dataset.lang); });
  });

  /* sound toggle */
  $btnSound.addEventListener('click', () => {
    state.soundOn = !state.soundOn;
    ensureAudio();
    $btnSound.textContent = state.soundOn ? t('soundOn') : t('soundOff');
    if (state.soundOn) click(660);
  });

  /* start screen */
  document.getElementById('btnStart').addEventListener('click', () => { ensureAudio(); click(700); startGame(); });
  document.getElementById('btnHowTo').addEventListener('click', () => { ensureAudio(); click(600); showScreen('howto'); });
  document.getElementById('btnHowToBack').addEventListener('click', () => { click(500); showScreen('start'); });

  /* game controls */
  $btnRoll.addEventListener('click', async () => {
    if (state.busy || state.gameOver || state.turn !== 0) return;
    state.busy = true; updateControls();
    await takeTurn(state.players[0]);
    state.busy = false; updateControls();
  });
  $btnBuild.addEventListener('click', async () => {
    if (state.busy || state.gameOver || state.turn !== 0) return;
    state.busy = true; updateControls();
    await openBuildModal();
    state.busy = false; updateControls();
  });

  /* game over */
  document.getElementById('btnPlayAgain').addEventListener('click', () => {
    click(700);
    document.getElementById('overScreen').hidden = true;
    startGame();
  });
  document.getElementById('btnDownloadPng').addEventListener('click', () => { click(600); downloadResultPng(); });

  /* audio unlock on first interaction */
  document.addEventListener('pointerdown', ensureAudio, { once: true });

  /* re-render tile labels on resize (short vs full names) */
  let rzT = null;
  window.addEventListener('resize', () => {
    clearTimeout(rzT);
    rzT = setTimeout(() => { if (state.screen === 'game') { updateTileTexts(); updateTileStates(); } }, 200);
  });

  showScreen('start');
}

document.addEventListener('DOMContentLoaded', init);
