// ---------- Translations ----------
// Single shared dictionary (also used by signin/history/compare/profile).
import { tr, getLang, setLang, applyLangClass, translateStatic, QUALITY_KEYS } from './i18n.js';
const t = tr;

// ---------- State ----------
// Two independent price books. A shop buys below the rate it sells at, so
// Sale and Purchase each carry their own gold, gem and diamond prices.
//
// goldPrice16K is always the 16K-equivalent rate, whatever purity the price
// was actually typed at on the Pricing screen. Normalising on the way in
// keeps one derivation rule for everything downstream; basePurity only
// remembers which purity the user typed into, so the screen can restore it.
function emptyPriceBook() {
  return { goldPrice16K: 0, basePurity: 0, gemPrice: 0, diamondPrice: 0 };
}

const state = {
  txnMode: 'sale',        // 'sale' | 'purchase' — which price book is live
  sale: emptyPriceBook(),
  purchase: emptyPriceBook(),
  qualityIndex: null,     // null = not selected yet (required field)
};

// The price book for the mode currently selected.
function book() { return state[state.txnMode]; }
const isPurchase = () => state.txnMode === 'purchase';

let currentLang = getLang();
function localizeNum(s) {
  // Numbers are always shown in English numerals, in both languages.
  // (Myanmar numerals remain only in fixed Gold Purity labels, which are translation text.)
  return String(s);
}

// ---------- Formatting ----------
const fmt = (n) => {
  if (!isFinite(n)) n = 0;
  const rounded = Math.round(n);
  return localizeNum(rounded.toLocaleString('en-US'));
};
const parseNum = (v) => {
  if (v === null || v === undefined) return 0;
  const s = String(v).replace(/,/g, '').trim();
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};
// Item names are free text and end up inside innerHTML, so escape them.
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ---------- Persistence ----------
function readBook(obj) {
  const b = emptyPriceBook();
  if (!obj) return b;
  b.goldPrice16K = Number(obj.goldPrice16K) || 0;
  b.basePurity   = Number(obj.basePurity) || 0;
  b.gemPrice     = Number(obj.gemPrice) || 0;
  b.diamondPrice = Number(obj.diamondPrice) || 0;
  return b;
}

function loadState() {
  try {
    const raw = localStorage.getItem('goldCalcState');
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj.sale || obj.purchase) {
        state.sale = readBook(obj.sale);
        state.purchase = readBook(obj.purchase);
      } else {
        // Saved before Purchase mode existed: the single set of prices was
        // the selling price book. Purchase starts empty.
        state.sale = readBook(obj);
        state.purchase = emptyPriceBook();
      }
      if (obj.txnMode === 'purchase' || obj.txnMode === 'sale') state.txnMode = obj.txnMode;
      // qualityIndex intentionally NOT restored — Gold Purity is a required field that must be re-selected.
      if (obj.itemNameValue) itemNameValue = obj.itemNameValue;
      if (obj.costMode === 'fixed' || obj.costMode === 'calculate') costMode = obj.costMode;
      if (obj.specificItemValue && typeof specificItem !== 'undefined') {
        specificItem.value = obj.specificItemValue;
      }
    }
  } catch (e) {}
}
function saveState() {
  const data = {
    txnMode: state.txnMode,
    sale: state.sale,
    purchase: state.purchase,
    qualityIndex: state.qualityIndex,
    itemNameValue: (typeof itemNameValue !== 'undefined') ? itemNameValue : '',
    specificItemValue: (typeof specificItem !== 'undefined' && specificItem) ? specificItem.value : '',
    costMode: costMode,
  };
  localStorage.setItem('goldCalcState', JSON.stringify(data));
}

// ---------- Gold price formulas (per Kyat) ----------
// Each purity is a fixed fraction of the 16K rate: 16 / (32 - q).
// Holding them as ratios (rather than as a switch) means the same table
// also inverts, which is what lets a price be entered at ANY purity and the
// rest derived from it.
const PURITY_RATIO = [
  1,          // 16K
  16 / 17,    // 15K
  128 / 140,  // 14.5K
  16 / 18,    // 14K
  16 / 20,    // 12K
];

function priceForQuality(x, qIdx) {
  if (!x) return 0;
  const r = PURITY_RATIO[qIdx];
  // No purity chosen: there is no price yet. Never fall back to the 16K
  // rate here — that used to quote 16K for an unselected item.
  return r ? x * r : 0;
}

// Given a price quoted at `qIdx`, what is the equivalent 16K rate?
// Everything is stored as the 16K rate, so this runs on the way in.
function baseFromQuality(price, qIdx) {
  const r = PURITY_RATIO[qIdx];
  if (!price || !r) return 0;
  return price / r;
}

// ---------- Weight conversions ----------
// 1 K = 16 P, 1 P = 8 Y, 1 K = 128 Y, 1 Y = 0.8 Yt
function toKyat(K, P, Y) {
  return K + P / 16 + Y / 128;
}
function toYati(K, P, Y) {
  // total Y, then Yt = Y * 0.8
  const totalY = K * 128 + P * 8 + Y;
  return totalY * 0.8;
}

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);

// price display
const priceValue = $('priceValue');
const priceQuality = $('priceQuality');
const qualityPill = document.querySelector('.quality-pill');

// inputs
const itemType = $('itemType');
const iwK = $('iwK'), iwP = $('iwP'), iwY = $('iwY');
const lwK = $('lwK'), lwP = $('lwP'), lwY = $('lwY');
const gwK = $('gwK'), gwP = $('gwP'), gwY = $('gwY');
const diamondWeight = $('diamondWeight');
const craftingFee = $('craftingFee');

// rows to toggle
const gemRow = $('gemRow');
const diamondRow = $('diamondRow');

// gem/diamond cost-mode toggle (calculate vs fixed)
const costModeRow   = $('costModeRow');
const costModeLabel = $('costModeLabel');
const modeCalculate = $('modeCalculate');
const modeFixed     = $('modeFixed');
const gemCostRow      = $('gemCostRow');
const gemCostInput    = $('gemCostInput');
const diamondCostRow  = $('diamondCostRow');
const diamondCostInput = $('diamondCostInput');
let costMode = 'calculate';   // 'calculate' = compute from rate, 'fixed' = type cost directly

// result
const resultValue = $('resultValue');
const summary = $('summary');
const overWeightMsg = $('overWeightMsg');

// pricing view — one set of controls per price book
const pricingView = $('pricingView');
const mainView = $('mainView');
const goldPriceInput = $('goldPriceInput');
const gemPriceInput = $('gemPriceInput');
const diamondPriceInput = $('diamondPriceInput');
const salePurity = $('salePurity');
const buyGoldPriceInput = $('buyGoldPriceInput');
const buyGemPriceInput = $('buyGemPriceInput');
const buyDiamondPriceInput = $('buyDiamondPriceInput');
const buyPurity = $('buyPurity');

// Which controls belong to which mode, so the wiring below is written once.
const PRICE_FIELDS = {
  sale:     { gold: goldPriceInput,    gem: gemPriceInput,    diamond: diamondPriceInput,    purity: salePurity, rows: 'saleAutoPrices' },
  purchase: { gold: buyGoldPriceInput, gem: buyGemPriceInput, diamond: buyDiamondPriceInput, purity: buyPurity,  rows: 'buyAutoPrices' },
};

// transaction mode toggle (hero)
const txnModeBtns = Array.from(document.querySelectorAll('.txn-mode-btn'));

// invoice modal
const invoiceModal = $('invoiceModal');
const invoiceBody = $('invoiceBody');
const invDate = $('invDate');
const invTotal = $('invTotal');

// ---------- Comma input handling ----------
function attachCommaInput(el) {
  el.addEventListener('input', () => {
    const raw = el.value.replace(/[^\d]/g, '');
    el.value = raw ? Number(raw).toLocaleString('en-US') : '';
    onAnyChange();
  });
}
attachCommaInput(craftingFee);
attachCommaInput(goldPriceInput);
attachCommaInput(gemPriceInput);
attachCommaInput(diamondPriceInput);
attachCommaInput(buyGoldPriceInput);
attachCommaInput(buyGemPriceInput);
attachCommaInput(buyDiamondPriceInput);
attachCommaInput(gemCostInput);
attachCommaInput(diamondCostInput);

// ---------- Decimal input handling (weights) ----------
function attachDecimalInput(el) {
  el.addEventListener('input', () => {
    let v = el.value.replace(/[^\d.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
    }
    if (v !== el.value) el.value = v;
  });
}
[iwK, iwP, iwY, lwK, lwP, lwY, gwK, gwP, gwY, diamondWeight].forEach(attachDecimalInput);

// ---------- UI updates ----------
function bump(el) {
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

function updatePriceDisplay() {
  // The hero shows the rate for the SELECTED purity. With no purity chosen
  // there is no rate to show, so display dashes rather than the 16K price —
  // showing 16K here made an unselected item look like a 16K quote.
  if (state.qualityIndex == null && book().goldPrice16K > 0) {
    priceValue.textContent = '---';
    bump(priceValue);
    return;
  }
  const price = priceForQuality(book().goldPrice16K, state.qualityIndex);
  // Hero price: no thousands separators
  priceValue.textContent = String(Math.round(isFinite(price) ? price : 0));
  bump(priceValue);
}

// The derived-price list under each gold price input. Which purities appear
// depends on which one the price was typed at — the entered purity is the
// input itself, so it is not repeated in the list below it.
function renderAutoPrices(mode) {
  const f = PRICE_FIELDS[mode];
  const host = $(f.rows);
  if (!host) return;
  const b = state[mode];
  const hasPrice = b.goldPrice16K > 0;
  host.innerHTML = QUALITY_KEYS.map((key, q) => {
    if (q === b.basePurity) return '';   // that one is the input
    const val = fmt(priceForQuality(b.goldPrice16K, q));
    return '<div class="auto-row"><span>' + escapeHtml(t(key)) + '</span>' +
           '<strong class="' + (hasPrice ? '' : 'empty') + '">' + escapeHtml(val) + '</strong></div>';
  }).join('');
}

function updatePricingAutoRows() {
  renderAutoPrices('sale');
  renderAutoPrices('purchase');
}

function toggleRowsForItemType() {
  const v = itemType.value;
  const isGem = (v === 'gold-gem');
  const isDiamond = (v === 'gold-diamond');
  const fixed = (costMode === 'fixed');

  gemRow.hidden = !isGem;
  diamondRow.hidden = !isDiamond;

  // Fixed/Calculate toggle only appears for Gem or Diamond
  costModeRow.hidden = !(isGem || isDiamond);
  if (isGem) costModeLabel.textContent = t('gemCost');
  else if (isDiamond) costModeLabel.textContent = t('diamondCost');

  // Fixed → direct cost input; Calculate → rate input (gem rate lives in Pricing view)
  gemCostRow.hidden     = !(isGem && fixed);
  diamondCostRow.hidden  = !(isDiamond && fixed);

  if (modeCalculate) modeCalculate.classList.toggle('active', !fixed);
  if (modeFixed)     modeFixed.classList.toggle('active', fixed);
}

// ---------- Purchase / Sale ----------
// Buying has no loss weight and no crafting fee, so those rows disappear
// rather than sitting there ignored.
function applyTxnMode() {
  const purchase = isPurchase();
  const lossRow = $('lossWeightRow');
  const feeRow  = $('craftingFeeRow');
  if (lossRow) lossRow.hidden = purchase;
  if (feeRow)  feeRow.hidden  = purchase;

  txnModeBtns.forEach(b => b.classList.toggle('active', (b.dataset.txn === 'purchase') === purchase));
  document.body.classList.toggle('mode-purchase', purchase);
}

function setTxnMode(mode) {
  const next = (mode === 'purchase') ? 'purchase' : 'sale';
  if (next === state.txnMode) return;
  state.txnMode = next;
  // A half-finished invoice priced under the other book would be misleading,
  // and its number belongs to the other sequence, so drop the edit link.
  window.__editingInvoiceId = null;
  window.__editingInvoiceNo = null;
  applyTxnMode();
  updatePriceDisplay();
  saveState();
  onAnyChange();
}

txnModeBtns.forEach(btn => {
  btn.addEventListener('click', () => setTxnMode(btn.dataset.txn));
});

// Switch between Calculate / Fixed (weights are preserved — only cost input method changes)
[modeCalculate, modeFixed].forEach(btn => {
  if (!btn) return;
  btn.addEventListener('click', () => {
    costMode = (btn.dataset.mode === 'fixed') ? 'fixed' : 'calculate';
    toggleRowsForItemType();
    saveState();
    onAnyChange();
  });
});

// ---------- Calculation ----------
// Diamond unit -> K: (x * 1.25) / 128
function diamondToKyat(x) {
  return (x * 1.25) / 128;
}

function calculate() {
  const purchase = isPurchase();
  const prices = book();

  const itemKyat = toKyat(parseNum(iwK.value), parseNum(iwP.value), parseNum(iwY.value));
  // Buying carries no loss weight — the shop weighs what is in front of it.
  const lossKyat = purchase ? 0 : toKyat(parseNum(lwK.value), parseNum(lwP.value), parseNum(lwY.value));
  const totalKyat = itemKyat + lossKyat;
  const goldPricePerK = priceForQuality(prices.goldPrice16K, state.qualityIndex);

  const fixed = (costMode === 'fixed');

  let gemKyat = 0, gemYt = 0, gemCost = 0;
  if (itemType.value === 'gold-gem') {
    const gK = parseNum(gwK.value), gP = parseNum(gwP.value), gY = parseNum(gwY.value);
    gemKyat = toKyat(gK, gP, gY);
    gemYt = toYati(gK, gP, gY);
    gemCost = fixed ? parseNum(gemCostInput.value) : gemYt * prices.gemPrice;
  }

  // Diamond is priced from the current mode's price book, like gem.
  let dWeight = 0, dPrice = 0, diamondKyat = 0, diamondCost = 0;
  if (itemType.value === 'gold-diamond') {
    dWeight = parseNum(diamondWeight.value);
    diamondKyat = diamondToKyat(dWeight);
    if (fixed) {
      diamondCost = parseNum(diamondCostInput.value);
    } else {
      dPrice = prices.diamondPrice;
      diamondCost = dWeight * dPrice;
    }
  }

  // Gold is whatever is left after the stones are taken out of the total weight.
  // If the stones weigh more than the item, the entry is wrong — clamp to 0 so
  // we never show a negative gold cost, and flag it so the UI can say why.
  const rawGoldKyat = totalKyat - gemKyat - diamondKyat;
  const overWeight = rawGoldKyat < 0;
  const goldKyat = overWeight ? 0 : rawGoldKyat;
  const goldCost = goldKyat * goldPricePerK;
  // No crafting fee when buying: the shop is paying for metal and stones only.
  const craftingFeeVal = purchase ? 0 : parseNum(craftingFee.value);
  const cost = goldCost + gemCost + diamondCost + craftingFeeVal;

  return {
    itemKyat, lossKyat, totalKyat,
    goldKyat, goldPricePerK, goldCost,
    gemKyat, gemYt, gemCost,
    diamondWeight: dWeight,
    diamondPrice: dPrice,
    diamondKyat,
    diamondCost,
    craftingFee: craftingFeeVal,
    cost,
    overWeight,
  };
}

function renderResult(r) {
  resultValue.textContent = fmt(r.cost) + ' ' + t('mmk');
  bump(resultValue);

  const rows = [];
  const nameDisplay = (typeof getItemNameDisplay === 'function') ? getItemNameDisplay() : null;
  if (nameDisplay) rows.push([t('itemNameLabel'), nameDisplay]);
  rows.push([t('quality'), state.qualityIndex == null ? '—' : t(QUALITY_KEYS[state.qualityIndex])]);
  rows.push([t('goldPrice'), fmt(r.goldPricePerK) + ' ' + t('mmk') + ' ' + t('perK')]);
  rows.push([t('itemWeight'), formatWeight(iwK.value, iwP.value, iwY.value)]);
  rows.push([t('lossWeight'), formatWeight(lwK.value, lwP.value, lwY.value)]);
  rows.push([t('goldCost'), fmt(r.goldCost) + ' ' + t('mmk')]);

  if (itemType.value === 'gold-gem') {
    rows.push([t('gemWeight'), localizeNum(r.gemYt.toFixed(2)) + ' ' + t('unitYt')]);
    if (costMode !== 'fixed') rows.push([t('gemPrice'), fmt(book().gemPrice) + ' ' + t('mmk') + ' ' + t('perYt')]);
    rows.push([t('gemCost'), fmt(r.gemCost) + ' ' + t('mmk')]);
  }
  if (itemType.value === 'gold-diamond') {
    rows.push([t('diamondWeight'), localizeNum(String(r.diamondWeight))]);
    if (costMode !== 'fixed') rows.push([t('diamondPrice'), fmt(r.diamondPrice) + ' ' + t('mmk')]);
    rows.push([t('diamondCost'), fmt(r.diamondCost) + ' ' + t('mmk')]);
  }
  rows.push([t('craftingFee'), fmt(r.craftingFee) + ' ' + t('mmk')]);

  // escapeHtml: item names are free text, so never interpolate them raw.
  summary.innerHTML = rows.map(([k, v]) =>
    `<div class="row"><span>${escapeHtml(k)}</span><span>${escapeHtml(v)}</span></div>`
  ).join('');

  // Stones heavier than the item means the weights are wrong — say so.
  if (overWeightMsg) overWeightMsg.hidden = !r.overWeight;
}

function formatWeight(K, P, Y) {
  const a = parseNum(K), b = parseNum(P), c = parseNum(Y);
  const parts = [];
  if (a) parts.push(localizeNum(String(a)) + ' ' + t('unitK'));
  if (b) parts.push(localizeNum(String(b)) + ' ' + t('unitP'));
  if (c) parts.push(localizeNum(String(c)) + ' ' + t('unitY'));
  return parts.length ? parts.join(' ') : (localizeNum('0') + ' ' + t('unitK'));
}

function onAnyChange() {
  const r = calculate();
  renderResult(r);
}

// ---------- Custom dropdown (Item Type) ----------
const itemTypePill = $('itemTypePill');
const itemTypeToggle = $('itemTypeToggle');
const itemTypeLabel = $('itemTypeLabel');
const itemTypeOptions = itemTypePill.querySelectorAll('.gold-pill-option');

const itemTypePillKeys = {
  'gold': 'typeGold',
  'gold-gem': 'typeGoldGem',
  'gold-diamond': 'typeGoldDiamond',
};

function updateItemTypeDisplay() {
  itemTypeLabel.textContent = itemType.value
    ? t(itemTypePillKeys[itemType.value])
    : t('itemTypePlaceholder');
  itemTypeOptions.forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.value === itemType.value);
  });
}

itemTypeToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  const expanded = itemTypePill.classList.toggle('open');
  itemTypeToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
});

itemTypeOptions.forEach(opt => {
  opt.addEventListener('click', (e) => {
    e.stopPropagation();
    if (itemType.value !== opt.dataset.value) {
      itemType.value = opt.dataset.value;
      itemType.dispatchEvent(new Event('change'));
    }
    itemTypePill.classList.remove('open');
    itemTypeToggle.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('click', (e) => {
  if (!itemTypePill.contains(e.target)) {
    itemTypePill.classList.remove('open');
    itemTypeToggle.setAttribute('aria-expanded', 'false');
  }
});

// Keep the custom pill label in sync with the hidden <select>
itemType.addEventListener('change', updateItemTypeDisplay);
updateItemTypeDisplay();

// ---------- Custom dropdown (Item Name) ----------
const itemNamePill = $('itemNamePill');
const itemNameToggle = $('itemNameToggle');
const itemNameLabel = $('itemNameLabel');
const itemNameOptions = itemNamePill.querySelectorAll('.gold-pill-option');
const specificItemRow = $('specificItemRow');
const specificItem = $('specificItem');

const itemNameLabels = {
  'ring': 'itemRing',
  'bracelet': 'itemBracelet',
  'earrings': 'itemEarrings',
  'pendant': 'itemPendant',
  'necklace': 'itemNecklace',
  'handchain': 'itemHandChain',
  'footchain': 'itemFootChain',
  'hairclipper': 'itemHairClipper',
  'other': 'itemOther',
};

let itemNameValue = '';

function updateItemNameDisplay() {
  const key = itemNameLabels[itemNameValue] || 'itemNamePill';
  itemNameLabel.textContent = t(key);
  itemNameOptions.forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.value === itemNameValue);
  });
  specificItemRow.hidden = itemNameValue !== 'other';
}

function getItemNameDisplay() {
  if (!itemNameValue) return null;
  if (itemNameValue === 'other') {
    const custom = specificItem.value.trim();
    return custom || t('itemOther');
  }
  return t(itemNameLabels[itemNameValue]);
}

itemNameToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  const expanded = itemNamePill.classList.toggle('open');
  itemNameToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
});

itemNameOptions.forEach(opt => {
  opt.addEventListener('click', (e) => {
    e.stopPropagation();
    const newValue = opt.dataset.value;
    if (itemNameValue !== newValue) {
      itemNameValue = newValue;
      if (newValue !== 'other') specificItem.value = '';
      updateItemNameDisplay();
      saveState();
      onAnyChange();
    }
    itemNamePill.classList.remove('open');
    itemNameToggle.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('click', (e) => {
  if (!itemNamePill.contains(e.target)) {
    itemNamePill.classList.remove('open');
    itemNameToggle.setAttribute('aria-expanded', 'false');
  }
});

specificItem.addEventListener('input', () => {
  saveState();
  onAnyChange();
});

updateItemNameDisplay();

// ---------- Event wiring ----------
[iwK, iwP, iwY, lwK, lwP, lwY, gwK, gwP, gwY, diamondWeight].forEach(el => {
  el.addEventListener('input', onAnyChange);
});
itemType.addEventListener('change', () => {
  toggleRowsForItemType();
  onAnyChange();
});

// ---------- Gold Purity dropdown ----------
const purityPill = $('purityPill');
const purityToggle = $('purityToggle');
const purityLabel = $('purityLabel');
const purityOptions = purityPill ? purityPill.querySelectorAll('.gold-pill-option') : [];

function updatePurityDisplay() {
  purityLabel.textContent = (state.qualityIndex == null)
    ? t('goldPurity')
    : t(QUALITY_KEYS[state.qualityIndex]);
  purityOptions.forEach(opt => {
    opt.classList.toggle('selected', Number(opt.dataset.value) === state.qualityIndex);
  });
}

purityToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  const expanded = purityPill.classList.toggle('open');
  purityToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
});
purityOptions.forEach(opt => {
  opt.addEventListener('click', (e) => {
    e.stopPropagation();
    state.qualityIndex = Number(opt.dataset.value);
    updatePurityDisplay();
    saveState();
    updatePriceDisplay();
    onAnyChange();
    purityPill.classList.remove('open');
    purityToggle.setAttribute('aria-expanded', 'false');
  });
});
document.addEventListener('click', (e) => {
  if (!purityPill.contains(e.target)) {
    purityPill.classList.remove('open');
    purityToggle.setAttribute('aria-expanded', 'false');
  }
});

// ---------- Pricing view ----------
// Fade the outgoing view out, then show the incoming one (which fades in via .view animation)
function switchView(hideEl, showEl) {
  // If the outgoing view is already hidden, just reveal the incoming one.
  if (hideEl.classList.contains('hidden')) { showEl.classList.remove('hidden'); return; }
  hideEl.classList.add('view-leaving');
  setTimeout(() => {
    hideEl.classList.add('hidden');
    hideEl.classList.remove('view-leaving');
    showEl.classList.remove('hidden');
  }, 180);
}
function openPricingView() {
  fillPriceInputs('sale');
  fillPriceInputs('purchase');
  updatePricingAutoRows();
  switchView(mainView, pricingView);
}
function backToMain() {
  switchView(pricingView, mainView);
}
$('backFromPricing').addEventListener('click', backToMain);

// Read one price book out of its inputs. The gold price is typed at
// whichever purity the selector shows, so it is normalised to the 16K rate
// before being stored.
function readPriceInputs(mode) {
  const f = PRICE_FIELDS[mode];
  const b = state[mode];
  b.basePurity   = Number(f.purity.value) || 0;
  b.goldPrice16K = baseFromQuality(parseNum(f.gold.value), b.basePurity);
  b.gemPrice     = parseNum(f.gem.value);
  b.diamondPrice = parseNum(f.diamond.value);
}

// Put a stored book back into its inputs, showing the gold price at the
// purity it was entered at.
function fillPriceInputs(mode) {
  const f = PRICE_FIELDS[mode];
  const b = state[mode];
  f.purity.value = String(b.basePurity || 0);
  const shown = priceForQuality(b.goldPrice16K, b.basePurity);
  f.gold.value    = shown ? Math.round(shown).toLocaleString('en-US') : '';
  f.gem.value     = b.gemPrice ? b.gemPrice.toLocaleString('en-US') : '';
  f.diamond.value = b.diamondPrice ? b.diamondPrice.toLocaleString('en-US') : '';
}

['sale', 'purchase'].forEach(mode => {
  const f = PRICE_FIELDS[mode];
  f.gold.addEventListener('input', () => { readPriceInputs(mode); renderAutoPrices(mode); });
  f.gem.addEventListener('input', () => readPriceInputs(mode));
  f.diamond.addEventListener('input', () => readPriceInputs(mode));
  // Changing the purity re-reads the SAME typed number as a price at the new
  // purity, rather than converting it — you picked the wrong label, not the
  // wrong figure.
  f.purity.addEventListener('change', () => { readPriceInputs(mode); renderAutoPrices(mode); });
});

$('savePricing').addEventListener('click', () => {
  readPriceInputs('sale');
  readPriceInputs('purchase');
  saveState();
  updatePriceDisplay();
  onAnyChange();
  backToMain();
});

// ---------- Clear ----------
$('clearBtn').addEventListener('click', () => {
  [iwK, iwP, iwY, lwK, lwP, lwY, gwK, gwP, gwY, diamondWeight, diamondCostInput, gemCostInput, craftingFee, specificItem]
    .forEach(el => { el.value = ''; });
  itemNameValue = '';
  state.qualityIndex = null;
  itemType.value = '';
  costMode = 'calculate';
  window.__editingInvoiceId = null;
  window.__editingInvoiceNo = null;
  updatePurityDisplay();
  updateItemTypeDisplay();
  toggleRowsForItemType();
  updateItemNameDisplay();
  updatePriceDisplay();
  saveState();
  onAnyChange();
  iwK.focus();
});

// ---------- Required-field validation ----------
const reminderPop = $('reminderPop');
function showReminder(fieldLabel) {
  if (!reminderPop) return;
  reminderPop.textContent = t('selPre') + fieldLabel + t('selPost');
  reminderPop.hidden = false;
  clearTimeout(showReminder._t);
  showReminder._t = setTimeout(() => { reminderPop.hidden = true; }, 1500);
}
function blinkField(pillEl) {
  if (!pillEl) return;
  // reminder shows first (~1.5s), then the button blinks red twice (0.5s x2)
  setTimeout(() => {
    pillEl.classList.remove('field-error');
    void pillEl.offsetWidth;
    pillEl.classList.add('field-error');
    setTimeout(() => pillEl.classList.remove('field-error'), 1100);
  }, 1500);
}
function firstMissingRequired() {
  // Without a gold price every invoice totals to just the crafting fee.
  if (!(book().goldPrice16K > 0))  return { label: t('pricingGoldLabel'), pill: navPricingBtn };
  if (state.qualityIndex == null) return { label: t('goldPurity'), pill: purityPill };
  if (!itemType.value)            return { label: t('itemTypePlaceholder'), pill: itemTypePill };
  if (!itemNameValue)             return { label: t('itemNameLabel'), pill: itemNamePill };
  if (itemNameValue === 'other' && !(specificItem && specificItem.value.trim()))
                                  return { label: t('specificItem'), pill: itemNamePill, focus: specificItem };
  return null;
}
function remindIfMissing() {
  const miss = firstMissingRequired();
  if (!miss) return false;
  showReminder(miss.label);
  blinkField(miss.pill);
  if (miss.focus && miss.focus.focus) { try { miss.focus.focus(); } catch (e) {} }
  return true;
}

// Nudge as soon as a weight is typed without purity/type chosen (throttled)
let lastNudge = 0;
[iwK, iwP, iwY, lwK, lwP, lwY, gwK, gwP, gwY].forEach(el => {
  el.addEventListener('input', () => {
    if (firstMissingRequired() && Date.now() - lastNudge > 3000) {
      lastNudge = Date.now();
      remindIfMissing();
    }
  });
});

// ---------- Invoice ----------
function hideInvoiceModal() {
  invoiceModal.classList.add('closing');
  setTimeout(() => { invoiceModal.classList.add('hidden'); invoiceModal.classList.remove('closing'); }, 200);
}
$('saveBtn').addEventListener('click', async () => {
  if (remindIfMissing()) return;   // block until required fields are filled in
  const data = buildCalculationData();
  const user = window.authUtils && window.authUtils.getCurrentUser && window.authUtils.getCurrentUser();
  if (!user) {
    // Not signed in → stash and send to sign-in (saved after login)
    try { window.authUtils.setPendingCalculation(data); } catch (e) {}
    window.location.href = 'signin.html';
    return;
  }

  const r = calculate();
  const editingId = window.__editingInvoiceId;

  // Save FIRST, then show the receipt. Showing it before the write meant a
  // failed save still printed a receipt (with a number that never existed).
  try {
    if (editingId && window.authUtils.updateCalculation) {
      // Editing keeps the number the invoice was issued under.
      await window.authUtils.updateCalculation(editingId, data);
      window.__editingInvoiceId = null;
      window.__editingInvoiceNo = null;
      buildInvoice(r, data.invoiceNo);
      showToast(t('invoiceUpdated'));
    } else {
      // Assign the number up front and store it on the document, so it stays
      // fixed for the life of the invoice even if earlier ones are deleted.
      const list = window.authUtils.getCalculations ? await window.authUtils.getCalculations() : [];
      data.invoiceNo = nextInvoiceNo(list, state.txnMode);
      await window.authUtils.saveCalculation(data);
      buildInvoice(r, data.invoiceNo);
      showToast(t('savedToHistory'));
    }
  } catch (err) {
    // Nothing was saved — do not show a receipt for it.
    alert(t('couldNotSave') + (err && err.message || err));
    return;
  }

  invoiceModal.classList.remove('closing');
  invoiceModal.classList.remove('hidden');
});
$('closeInvoice').addEventListener('click', hideInvoiceModal);
invoiceModal.querySelector('.modal-backdrop').addEventListener('click', hideInvoiceModal);

function formatWeightCompact(K, P, Y) {
  const a = parseNum(K), b = parseNum(P), c = parseNum(Y);
  const parts = [];
  if (a) parts.push(localizeNum(String(a)) + t('unitK'));
  if (b) parts.push(localizeNum(String(b)) + t('unitP'));
  if (c) parts.push(localizeNum(String(c)) + t('unitY'));
  return parts.length ? parts.join(' ') : localizeNum('0');
}

// 6-digit DDMMYY key for a date
function invDayKey(d) {
  return String(d.getDate()).padStart(2, '0') +
         String(d.getMonth() + 1).padStart(2, '0') +
         String(d.getFullYear()).slice(-2);
}
function invTsToDate(ts) { return ts ? (ts.toDate ? ts.toDate() : new Date(ts)) : new Date(); }

// 10-digit invoice no: DDMMYY + a 4-digit sequence within that date.
//
// The number is assigned once and STORED on the document (data.invoiceNo).
// It used to be re-derived from list position on every render, which meant
// deleting one invoice silently renumbered every later one — including
// receipts already printed and handed to a customer.
//
// Here we only work out what the next free sequence for today is: take the
// highest sequence already used today, and add one. Documents saved before
// this change have no invoiceNo, so they're counted by their timestamp
// instead and keep their old position in the day.
// Sales and purchases run SEPARATE daily sequences, so only invoices of the
// same mode are counted. The same number can therefore appear once as a sale
// and once as a purchase; the stored txnMode is what tells them apart.
function nextInvoiceNo(list, mode) {
  const today = invDayKey(new Date());
  const want = (mode === 'purchase') ? 'purchase' : 'sale';
  let highestStored = 0;   // biggest sequence already issued today in this mode
  let legacyToday = 0;     // pre-change docs from today that have no number
  (list || []).forEach(c => {
    // Documents saved before Purchase mode existed were all sales.
    const m = (c.txnMode === 'purchase') ? 'purchase' : 'sale';
    if (m !== want) return;
    const s = c.invoiceNo ? String(c.invoiceNo) : '';
    if (s.slice(0, 6) === today) {
      highestStored = Math.max(highestStored, parseInt(s.slice(6), 10) || 0);
    } else if (!s && invDayKey(invTsToDate(c.timestamp)) === today) {
      legacyToday += 1;
    }
  });
  // Whichever is further along wins, so we never reuse a number.
  const used = Math.max(highestStored, legacyToday);
  return today + String(used + 1).padStart(4, '0');
}

function buildInvoice(r, invNo) {
  const now = new Date();
  invDate.textContent = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  $('invNumber').textContent = invNo ? ('#' + invNo) : '';

  const receiptLabel = $('invReceiptLabel');
  if (receiptLabel) receiptLabel.textContent = isPurchase() ? t('purchaseReceipt') : t('salesReceipt');

  const sections = [];
  const money = (n) => fmt(n) + ' ' + t('mmk');

  // ITEM: what was actually sold. Neither of these was on the receipt before.
  const nameDisplay = getItemNameDisplay();
  const itemRows = [];
  if (nameDisplay) itemRows.push([t('itemNameLabel'), nameDisplay]);
  if (itemType.value) itemRows.push([t('itemTypeLabel'), t(itemTypePillKeys[itemType.value])]);
  if (itemRows.length) sections.push({ label: t('secItem'), rows: itemRows });

  // WEIGHT: Item, Loss (if any), Gem (if gem), Diamond (if diamond)
  const weightRows = [
    [t('itemWeight'), formatWeightCompact(iwK.value, iwP.value, iwY.value)],
  ];
  if (!isPurchase() && (parseNum(lwK.value) || parseNum(lwP.value) || parseNum(lwY.value))) {
    weightRows.push([t('lossWeight'), formatWeightCompact(lwK.value, lwP.value, lwY.value)]);
  }
  if (itemType.value === 'gold-gem') {
    weightRows.push([t('gemWeight'), formatWeightCompact(gwK.value, gwP.value, gwY.value)]);
  }
  if (itemType.value === 'gold-diamond') {
    weightRows.push([t('diamondWeight'), localizeNum(String(r.diamondWeight))]);
  }
  sections.push({ label: t('secWeights'), rows: weightRows });

  // GOLD: purity, the rate it was priced at, the gold weight left after stones,
  // and what that gold actually costs. Without these the total can't be checked.
  sections.push({
    label: t('secGold'),
    rows: [
      [t('quality'), state.qualityIndex == null ? '—' : t(QUALITY_KEYS[state.qualityIndex])],
      // No "/ K" suffix — the row label already says "per K", and the extra
      // unit pushed this row onto a second line in Myanmar.
      [t('pricePerK'), fmt(r.goldPricePerK) + ' ' + t('mmk')],
      [t('goldWeight'), localizeNum(r.goldKyat.toFixed(4).replace(/\.?0+$/, '')) + ' ' + t('unitK')],
      [t('goldCost'), money(r.goldCost)],
    ],
  });

  // GEM / DIAMOND: the stone's own cost, so the total adds up on paper.
  if (itemType.value === 'gold-gem') {
    const gemRows = [[t('gemWeight'), localizeNum(r.gemYt.toFixed(2)) + ' ' + t('unitYt')]];
    if (costMode !== 'fixed') {
      gemRows.push([t('gemPrice'), fmt(book().gemPrice) + ' ' + t('mmk') + ' ' + t('perYt')]);
    }
    gemRows.push([t('gemCost'), money(r.gemCost)]);
    sections.push({ label: t('secGem'), rows: gemRows });
  }
  if (itemType.value === 'gold-diamond') {
    // Weight already appears under WEIGHTS in the same unit — rate and cost only.
    const dRows = [];
    if (costMode !== 'fixed') {
      dRows.push([t('diamondPrice'), money(r.diamondPrice)]);
    }
    dRows.push([t('diamondCost'), money(r.diamondCost)]);
    sections.push({ label: t('secDiamond'), rows: dRows });
  }

  // FEES — a purchase has none, so the section is omitted rather than shown as 0.
  if (!isPurchase()) {
    sections.push({
      label: t('secFees'),
      rows: [[t('craftingFee'), money(r.craftingFee)]],
    });
  }

  invoiceBody.innerHTML = sections.map(sec => {
    const rowsHtml = sec.rows.map(([k, v]) =>
      `<div class="inv-row"><span>${escapeHtml(k)}</span><span>${escapeHtml(v)}</span></div>`
    ).join('');
    return `<div class="inv-section"><div class="inv-section-label">${escapeHtml(sec.label)}</div>${rowsHtml}</div>`;
  }).join('');

  invTotal.textContent = fmt(r.cost) + ' ' + t('mmk');
}

$('downloadInvoice').addEventListener('click', async () => {
  const node = document.getElementById('invoiceCanvas');
  try {
    // Wait for the webfonts before drawing. html2canvas paints whatever is
    // resolved at call time, so exporting mid-load fell back to a face with
    // no Myanmar glyphs.
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const canvas = await html2canvas(node, {
      backgroundColor: '#ffffff',
      // scale 3 — the receipt is physically small when printed or viewed on
      // a phone, and Myanmar diacritics are the first thing to blur.
      scale: 3,
      useCORS: true,
    });
    const link = document.createElement('a');
    const receiptNum = ($('invNumber').textContent || '').replace('#', '').trim();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.download = `invoice-${receiptNum || stamp}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  } catch (e) {
    alert(t('couldNotSaveImage') + e.message);
  }
});

// ---------- Language (toggle lives in the Options menu) ----------
const langOptions = document.querySelectorAll('.opt-lang-btn');

function applyLanguage(lang) {
  currentLang = lang === 'mm' ? 'mm' : 'en';
  setLang(currentLang);
  applyLangClass(currentLang);
  translateStatic(currentLang);

  langOptions.forEach(opt => {
    opt.classList.toggle('active', opt.dataset.lang === currentLang);
  });

  // The top-nav auth label depends on who is signed in, so translateStatic
  // cannot own it. Look the element up directly instead of going through
  // applyAuthState: this function runs during module evaluation, before the
  // top-nav consts further down are initialised.
  const authLink = document.getElementById('topNavAuth');
  if (authLink) {
    const signedIn = (authLink.getAttribute('href') || '').indexOf('profile') !== -1;
    authLink.setAttribute('aria-label', signedIn ? t('ariaProfile') : t('signIn'));
  }

  updatePriceDisplay();
  updatePurityDisplay();
  updateItemTypeDisplay();
  updateItemNameDisplay();
  toggleRowsForItemType();
  updatePricingAutoRows();
  onAnyChange();
}

function loadLanguage() {
  applyLanguage(getLang());
}

langOptions.forEach(opt => {
  opt.addEventListener('click', (e) => {
    e.stopPropagation();
    applyLanguage(opt.dataset.lang);
  });
});

// ---------- Theme toggle ----------
const themeToggle = $('themeToggle');
function applyTheme(theme) {
  document.body.classList.toggle('theme-dark', theme === 'dark');
  document.body.classList.toggle('theme-light', theme !== 'dark');
  try { localStorage.setItem('goldCalcTheme', theme); } catch (e) {}
}
function loadTheme() {
  let saved = null;
  try { saved = localStorage.getItem('goldCalcTheme'); } catch (e) {}
  applyTheme(saved === 'dark' ? 'dark' : 'light');
}
themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.contains('theme-dark');
  applyTheme(isDark ? 'light' : 'dark');
});
loadTheme();

// ---------- Bottom nav ----------
const navHome = $('navHome');
const navPricingBtn = $('navPricing');
const navProfile = $('navProfile');
const navCompare = $('navCompare');
const navInvoice = $('navInvoice');

function setActiveNav(btn) {
  [navHome, navPricingBtn, navProfile, navCompare, navInvoice].forEach(b => b && b.classList.remove('active'));
  btn.classList.add('active');
}

if (navCompare) {
  navCompare.addEventListener('click', () => { window.location.href = 'compare.html'; });
}
if (navInvoice) {
  navInvoice.addEventListener('click', () => { window.location.href = 'invoice.html'; });
}

navHome.addEventListener('click', () => {
  switchView(pricingView, mainView);
  setActiveNav(navHome);
});
navPricingBtn.addEventListener('click', () => {
  openPricingView();
  setActiveNav(navPricingBtn);
});
navProfile.addEventListener('click', () => {
  const user = window.authUtils && window.authUtils.getCurrentUser && window.authUtils.getCurrentUser();
  window.location.href = user ? 'profile.html' : 'signin.html';
});

// Keep nav in sync when back / save used in pricing view
$('backFromPricing').addEventListener('click', () => setActiveNav(navHome));
$('savePricing').addEventListener('click', () => setActiveNav(navHome));

// ---------- Options menu ----------
const optionsMenu = $('optionsMenu');
const optionsToggle = $('optionsToggle');
function closeOptions() { if (optionsMenu) optionsMenu.classList.add('hidden'); }
if (optionsToggle) optionsToggle.addEventListener('click', () => optionsMenu.classList.remove('hidden'));
if ($('optBackdrop')) $('optBackdrop').addEventListener('click', closeOptions);
if ($('optEditPrice')) $('optEditPrice').addEventListener('click', () => { closeOptions(); openPricingView(); setActiveNav(navPricingBtn); });
if ($('optHistory'))  $('optHistory').addEventListener('click', () => { window.location.href = 'profile.html'; });
if ($('optEditInfo')) $('optEditInfo').addEventListener('click', () => { window.location.href = 'profile.html#edit'; });
if ($('optCompare'))  $('optCompare').addEventListener('click', () => { window.location.href = 'compare.html'; });
if ($('optPrintInvoice')) $('optPrintInvoice').addEventListener('click', () => { window.location.href = 'invoice.html'; });

// ---------- Background: drift + scroll parallax ----------
const orbs = Array.from(document.querySelectorAll('.orb'));
const orbConfig = [
  { driftX: 40, driftY: 30, scrollRate: 0.18, phase: 0,    period: 22000 },
  { driftX: 35, driftY: 35, scrollRate: 0.32, phase: 1.3,  period: 26000 },
  { driftX: 28, driftY: 28, scrollRate: 0.55, phase: 2.6,  period: 19000 },
];
let lastScrollY = window.scrollY;
let targetScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  targetScrollY = window.scrollY;
}, { passive: true });

function tickOrbs(ts) {
  // smooth ease toward current scroll position
  lastScrollY += (targetScrollY - lastScrollY) * 0.12;

  orbs.forEach((orb, i) => {
    const cfg = orbConfig[i] || orbConfig[0];
    const ang = (ts / cfg.period) * Math.PI * 2 + cfg.phase;
    const dx = Math.sin(ang) * cfg.driftX;
    const dy = Math.cos(ang) * cfg.driftY;
    const sy = -lastScrollY * cfg.scrollRate;
    orb.style.transform = `translate3d(${dx}px, ${dy + sy}px, 0)`;
  });
  requestAnimationFrame(tickOrbs);
}
requestAnimationFrame(tickOrbs);

// ---------- Init ----------
loadState();
applyTxnMode();
toggleRowsForItemType();
loadLanguage();

// ---------- Loading screen ----------
setTimeout(() => {
  const ls = document.getElementById('loadingScreen');
  if (ls) ls.classList.add('hidden-fade');
}, 1500);

// ---------- Auth + History integration ----------
const toastEl = $('toast');
function showToast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.hidden = false;
  toastEl.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => { toastEl.hidden = true; }, 300);
  }, 2200);
}

function buildCalculationData() {
  const r = calculate();
  const data = {
    // Which side of the counter. Documents without it are pre-feature sales.
    txnMode: state.txnMode,
    itemNameValue: (typeof itemNameValue !== 'undefined') ? itemNameValue : '',
    specificItemValue: specificItem ? specificItem.value.trim() : '',
    itemName: (function () {
      if (!itemNameValue) return '';
      if (itemNameValue === 'other') return specificItem.value.trim() || 'Other';
      const map = {ring:'Ring',bracelet:'Bracelet',earrings:'Earrings',pendant:'Pendant',necklace:'Necklace',handchain:'Hand chain',footchain:'Foot chain',hairclipper:'Hair clipper'};
      return map[itemNameValue] || itemNameValue;
    })(),
    itemType: itemType.value,
    // '' rather than undefined — Firestore rejects undefined field values.
    goldPurity: (['16K','15K','14.5K','14K','12K'])[state.qualityIndex] || '',
    weightK: parseNum(iwK.value),
    weightP: parseNum(iwP.value),
    weightY: parseNum(iwY.value),
    lossWeightK: parseNum(lwK.value),
    lossWeightP: parseNum(lwP.value),
    lossWeightY: parseNum(lwY.value),
    craftingFee: r.craftingFee,
    itemCost: r.cost,
    goldCost: r.goldCost,
    goldPricePerK: r.goldPricePerK,
    goldKyat: r.goldKyat,
    costMode: costMode
  };
  // Editing an existing invoice must not change the number it was issued under.
  if (window.__editingInvoiceNo) data.invoiceNo = window.__editingInvoiceNo;
  if (itemType.value === 'gold-gem') {
    data.gemWeightK = parseNum(gwK.value);
    data.gemWeightP = parseNum(gwP.value);
    data.gemWeightY = parseNum(gwY.value);
    data.gemPrice   = book().gemPrice;
    data.gemCost    = r.gemCost;
    data.gemCostFixed = parseNum(gemCostInput.value);
  }
  if (itemType.value === 'gold-diamond') {
    data.diamondWeight = r.diamondWeight;
    data.diamondPrice  = r.diamondPrice;
    data.diamondCost   = r.diamondCost;
    data.diamondCostFixed = parseNum(diamondCostInput.value);
  }
  return data;
}

// Reflect auth state in the top nav
const topNavAuth   = $('topNavAuth');
const topNavAvatar = $('topNavAvatar');
const topNavText   = topNavAuth ? topNavAuth.querySelector('.top-nav-auth-text') : null;
const navProfileDefaultHTML = navProfile ? navProfile.innerHTML : '';

function genderAvatarSrc(user) {
  if (!user) return null;
  try {
    const g = localStorage.getItem('goldCalcGender_' + user.uid);
    if (g === 'male') return 'avatar-male.png';
    if (g === 'female') return 'avatar-female.png';
  } catch (e) {}
  return null;
}

function applyAuthState(user) {
  if (!topNavAuth) return;
  const gSrc = genderAvatarSrc(user);
  if (user) {
    topNavAuth.setAttribute('href', 'profile.html');
    topNavAuth.setAttribute('aria-label', t('ariaProfile'));
    if (topNavText) topNavText.hidden = true;
    if (topNavAvatar) {
      topNavAvatar.hidden = false;
      const photo = gSrc || user.photoURL;
      if (photo) {
        topNavAvatar.innerHTML = '';
        const img = document.createElement('img');
        img.src = photo;
        img.alt = '';
        img.referrerPolicy = 'no-referrer';
        topNavAvatar.appendChild(img);
      } else {
        const name = user.displayName || user.email || user.phoneNumber || 'U';
        topNavAvatar.textContent = (name.trim()[0] || 'U').toUpperCase();
      }
    }
    if (navProfile) {
      navProfile.innerHTML = gSrc
        ? '<img class="nav-avatar" src="' + gSrc + '" alt="">'
        : navProfileDefaultHTML;
    }
  } else {
    topNavAuth.setAttribute('href', 'signin.html');
    topNavAuth.setAttribute('aria-label', t('signIn'));
    if (topNavText) topNavText.hidden = false;
    if (topNavAvatar) { topNavAvatar.hidden = true; topNavAvatar.innerHTML = ''; topNavAvatar.textContent = 'U'; }
    if (navProfile) navProfile.innerHTML = navProfileDefaultHTML;
  }
}

// Wait briefly for auth-utils.js (a module) to populate window.authUtils
(function waitForAuth() {
  if (window.authUtils && window.authUtils.onAuthStateChange) {
    window.authUtils.onAuthStateChange(applyAuthState);
  } else {
    setTimeout(waitForAuth, 80);
  }
})();

// (Saving to history now happens directly from the summary "Save" button above.)

// ---------- Edit mode: load a saved invoice's values into the calculator ----------
window.__editingInvoiceId = window.__editingInvoiceId || null;
window.__editingInvoiceNo = window.__editingInvoiceNo || null;
(function loadPendingEdit() {
  let payload = null;
  try {
    const raw = sessionStorage.getItem('pendingEditInvoice');
    if (raw) payload = JSON.parse(raw);
  } catch (e) {}
  if (!payload) return;
  try { sessionStorage.removeItem('pendingEditInvoice'); } catch (e) {}

  const d = payload.data || {};
  window.__editingInvoiceId = payload.id || null;
  window.__editingInvoiceNo = d.invoiceNo || null;

  // item type
  if (d.itemType) itemType.value = d.itemType;

  // quality + reconstruct the 16K base price from the saved per-K price
  // Restore the mode BEFORE any pricing, so the rates below land in the
  // right book and the invoice keeps its own numbering sequence.
  state.txnMode = (d.txnMode === 'purchase') ? 'purchase' : 'sale';
  applyTxnMode();

  const qMap = { '16K': 0, '15K': 1, '14.5K': 2, '14K': 3, '12K': 4 };
  const qIdx = (qMap[d.goldPurity] != null) ? qMap[d.goldPurity] : 0;
  state.qualityIndex = qIdx;
  // Rebuild the 16K rate this invoice was priced at, from the rate stored
  // on it, so re-saving cannot silently reprice it at today's numbers.
  const pk = Number(d.goldPricePerK) || 0;
  book().goldPrice16K = baseFromQuality(pk, qIdx);
  if (d.gemPrice != null) book().gemPrice = Number(d.gemPrice) || 0;
  if (d.diamondPrice != null) book().diamondPrice = Number(d.diamondPrice) || 0;

  const setNum = (el, v) => { if (el) el.value = Number(v) ? String(Number(v)) : ''; };
  const setMoney = (el, v) => { if (el) el.value = Number(v) ? Number(v).toLocaleString('en-US') : ''; };

  setNum(iwK, d.weightK); setNum(iwP, d.weightP); setNum(iwY, d.weightY);
  setNum(lwK, d.lossWeightK); setNum(lwP, d.lossWeightP); setNum(lwY, d.lossWeightY);
  setNum(gwK, d.gemWeightK); setNum(gwP, d.gemWeightP); setNum(gwY, d.gemWeightY);
  setNum(diamondWeight, d.diamondWeight);
  setMoney(craftingFee, d.craftingFee);

  costMode = (d.costMode === 'fixed') ? 'fixed' : 'calculate';
  setMoney(gemCostInput, d.gemCostFixed);
  setMoney(diamondCostInput, d.diamondCostFixed);

  if (typeof d.itemNameValue === 'string') itemNameValue = d.itemNameValue;
  if (specificItem && typeof d.specificItemValue === 'string') specificItem.value = d.specificItemValue;

  // refresh everything
  toggleRowsForItemType();
  updateItemTypeDisplay();
  updatePurityDisplay();
  updateItemNameDisplay();
  updatePriceDisplay();
  updatePricingAutoRows();
  onAnyChange();
})();

// ---------- Deep-link: open the Pricing view when arriving with #pricing ----------
(function openPricingFromHash() {
  if (window.location.hash !== '#pricing') return;
  const np = document.getElementById('navPricing');
  if (np) np.click();
  try { history.replaceState(null, '', window.location.pathname); } catch (e) {}
})();
