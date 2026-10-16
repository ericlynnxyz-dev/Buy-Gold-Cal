// ============================================================
// Print Invoice page
//
// Builds a customer-facing invoice for either a purchase or a sale, from
// figures typed in by hand or pulled from a saved calculation, and hands it
// to the printer or exports it as a PDF.
//
// The paper is 2 inches wide and grows as long as the content needs — a till
// roll rather than a fixed page — so nothing is ever clipped.
// ============================================================
import { tr, getLang, setLang, applyLangClass, translateStatic, QUALITY_KEYS, TYPE_KEY } from './i18n.js';
import { onAuthStateChange, getCalculations, claimInvoiceNumber, saveIssuedInvoice, getIssuedInvoices } from './auth-utils.js';

const $ = (id) => document.getElementById(id);
const t = tr;

// Paper width in inches. Height is measured from the rendered content.
const PAPER_W_IN = 2;

// ---------- shared helpers (same rules as the calculator) ----------
const parseNum = (v) => {
  if (v === null || v === undefined) return 0;
  const n = parseFloat(String(v).replace(/,/g, '').trim());
  return isNaN(n) ? 0 : n;
};
const fmt = (n) => (Math.round(isFinite(n) ? n : 0)).toLocaleString('en-US');
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
// 1 K = 16 P = 128 Y
function toKyat(K, P, Y) { return parseNum(K) + parseNum(P) / 16 + parseNum(Y) / 128; }
function diamondToKyat(x) { return (parseNum(x) * 1.25) / 128; }

const PURITY_NAME  = ['16K', '15K', '14.5K', '14K', '12K'];

function fmtWeight(K, P, Y) {
  const parts = [];
  if (parseNum(K)) parts.push(parseNum(K) + t('unitK'));
  if (parseNum(P)) parts.push(parseNum(P) + t('unitP'));
  if (parseNum(Y)) parts.push(parseNum(Y) + t('unitY'));
  return parts.length ? parts.join(' ') : '0' + t('unitK');
}

// ---------- state ----------
let txnMode = 'sale';       // 'sale' | 'purchase'
let source  = 'manual';     // 'manual' | 'saved'
let calcs   = [];           // saved calculations for the signed-in user
let pickedInvoiceNo = '';   // number carried over from a chosen saved calculation
let pickedCalcId = '';      // and that calculation's id
let totalEdited = false;    // has the user typed their own total?
let savedDiverged = false;  // saved figures loaded, then a weight/price changed
let activeUser = null;      // issuing needs an account
let issued = [];            // invoices already issued (printed / exported)
let issuedRecord = null;    // the invoice issued from what is on screen now
let invoiceDirty = true;    // anything changed since that invoice was issued?

// ---------- inputs ----------
const F = {
  name: $('invItemName'), type: $('invItemType'),
  iwK: $('invIwK'), iwP: $('invIwP'), iwY: $('invIwY'),
  lwK: $('invLwK'), lwP: $('invLwP'), lwY: $('invLwY'),
  gwK: $('invGwK'), gwP: $('invGwP'), gwY: $('invGwY'),
  dia: $('invDiaWeight'),
  purity: $('invPurity'), gold: $('invGoldPrice'), total: $('invTotalInput'),
  cName: $('custName'), cPhone: $('custPhone'), cAddress: $('custAddress'),
  invNo: $('invNoInput'),
};

function attachCommaInput(el) {
  el.addEventListener('input', () => {
    const raw = el.value.replace(/[^\d]/g, '');
    el.value = raw ? Number(raw).toLocaleString('en-US') : '';
  });
}
attachCommaInput(F.gold);
attachCommaInput(F.total);

// ---------- the arithmetic ----------
// Mirrors the calculator: gold is what is left once the stones come out of
// the weighed total, priced at the rate for the chosen purity.
//
// Only the fields on this page feed in, so a stone's own value and any
// crafting fee are NOT part of this figure — those come across when a saved
// calculation is used, and can always be typed over by hand.
function computeTotal() {
  const itemK = toKyat(F.iwK.value, F.iwP.value, F.iwY.value);
  const lossK = (txnMode === 'purchase') ? 0 : toKyat(F.lwK.value, F.lwP.value, F.lwY.value);
  let stoneK = 0;
  if (F.type.value === 'gold-gem')      stoneK = toKyat(F.gwK.value, F.gwP.value, F.gwY.value);
  if (F.type.value === 'gold-diamond')  stoneK = diamondToKyat(F.dia.value);
  const goldK = Math.max(0, itemK + lossK - stoneK);
  return goldK * parseNum(F.gold.value);
}

function refreshTotal() {
  if (!totalEdited) {
    const v = computeTotal();
    F.total.value = v ? fmt(v) : '';
  }
  updateDivergeNote();
  renderPaper();
}

// The total taken from a saved calculation includes stone value and any
// crafting fee, neither of which this page holds a price for. So it is kept
// as-is when the weights are edited — and flagged, so the mismatch is never
// silent.
function updateDivergeNote() {
  const note = $('divergeNote');
  if (note) note.hidden = !(source === 'saved' && savedDiverged);
}

// ---------- invoice number ----------
// An invoice gets its number when it is ISSUED — that is, the first time it
// is exported or printed — never before. Until then the paper reads DRAFT.
//
// Manual invoices draw from the same per-mode daily counter the calculator
// uses, so the two can never collide. Invoices made from a saved calculation
// keep that calculation's number: it is the same sale or purchase.
function invDayKey(d) {
  return String(d.getDate()).padStart(2, '0') +
         String(d.getMonth() + 1).padStart(2, '0') +
         String(d.getFullYear()).slice(-2);
}
const tsDate = (ts) => ts ? (ts.toDate ? ts.toDate() : new Date(ts)) : new Date();

// Highest sequence already used today in this mode, across saved
// calculations and issued invoices. Only matters before the day's counter
// exists; after that the counter is authoritative.
function usedSeqToday() {
  const today = invDayKey(new Date());
  let highest = 0, legacy = 0;
  const sameMode = (r) => ((r.txnMode === 'purchase') ? 'purchase' : 'sale') === txnMode;
  calcs.filter(sameMode).forEach(c => {
    const str = c.invoiceNo ? String(c.invoiceNo) : '';
    if (str.slice(0, 6) === today) highest = Math.max(highest, parseInt(str.slice(6), 10) || 0);
    else if (!str && invDayKey(tsDate(c.timestamp)) === today) legacy += 1;
  });
  issued.filter(sameMode).forEach(r => {
    const str = r.invoiceNumber ? String(r.invoiceNumber) : '';
    if (str.slice(0, 6) === today) highest = Math.max(highest, parseInt(str.slice(6), 10) || 0);
  });
  return Math.max(highest, legacy);
}

// What the number field and the paper show right now.
function shownNumber() {
  if (issuedRecord && !invoiceDirty) return issuedRecord.invoiceNumber;
  if (source === 'saved' && pickedInvoiceNo) return pickedInvoiceNo;
  return '';
}

// Any edit after issuing means the next export/print issues a fresh invoice.
function markDirty() {
  invoiceDirty = true;
  showMessage('');
}

function showMessage(msg) {
  const el = $('invoiceMessage');
  if (!el) return;
  el.textContent = msg || '';
  el.hidden = !msg;
}

// ---------- the printed invoice ----------
function renderPaper() {
  const purchase = (txnMode === 'purchase');
  $('piKind').textContent = purchase ? t('purchaseInvoice') : t('salesInvoice');
  $('piDate').textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const no = shownNumber();
  F.invNo.value = no || t('invDraft');
  $('piNumber').textContent = no ? '#' + no : t('invDraft');
  $('piTotalLabel').textContent = t('totalCost');

  const rows = [];
  const push = (k, v) => rows.push([k, v]);

  // Customer first — this is their copy.
  if (F.cName.value.trim())    push(t('custName'), F.cName.value.trim());
  if (F.cPhone.value.trim())   push(t('phoneLabel'), F.cPhone.value.trim());
  if (F.cAddress.value.trim()) push(t('custAddress'), F.cAddress.value.trim());
  const custCount = rows.length;

  if (F.name.value.trim()) push(t('itemNameLabel'), F.name.value.trim());
  push(t('itemTypeLabel'), t(TYPE_KEY[F.type.value] || 'typeGold'));
  push(t('itemWeight'), fmtWeight(F.iwK.value, F.iwP.value, F.iwY.value));
  if (!purchase && (parseNum(F.lwK.value) || parseNum(F.lwP.value) || parseNum(F.lwY.value))) {
    push(t('lossWeight'), fmtWeight(F.lwK.value, F.lwP.value, F.lwY.value));
  }
  if (F.type.value === 'gold-gem') {
    push(t('gemWeight'), fmtWeight(F.gwK.value, F.gwP.value, F.gwY.value));
  }
  if (F.type.value === 'gold-diamond' && parseNum(F.dia.value)) {
    push(t('diamondWeight'), String(parseNum(F.dia.value)));
  }
  // Translated, so Myanmar prints ၁၄ ပဲရည် rather than 14K.
  push(t('goldPurity'), t(QUALITY_KEYS[Number(F.purity.value) || 0]));
  push(t('goldPrice'), fmt(parseNum(F.gold.value)) + ' ' + t('mmk'));

  $('piBody').innerHTML = rows.map(([k, v], i) => {
    // A rule under the customer block separates them from the goods.
    const sep = (custCount && i === custCount) ? ' pi-row-sep' : '';
    return `<div class="pi-row${sep}"><span>${escapeHtml(k)}</span><span>${escapeHtml(v)}</span></div>`;
  }).join('');

  $('piTotalValue').textContent = fmt(parseNum(F.total.value)) + ' ' + t('mmk');
  $('piFoot').textContent = t('invoiceFooter');
}

// ---------- which fields are relevant ----------
function applyVisibility() {
  const purchase = (txnMode === 'purchase');
  $('invLossRow').hidden = purchase;                       // no loss weight on a purchase
  $('invGemRow').hidden  = F.type.value !== 'gold-gem';
  $('invDiaRow').hidden  = F.type.value !== 'gold-diamond';

  document.querySelectorAll('.txn-mode-btn').forEach(b =>
    b.classList.toggle('active', (b.dataset.txn === 'purchase') === purchase));
  document.querySelectorAll('.cost-mode-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.src === source));

  const useSaved = (source === 'saved');
  $('savedPickRow').hidden = !useSaved;
  $('savedHint').hidden = !(useSaved && matchingCalcs().length === 0);
}

// ---------- saved calculations ----------
// Only the ones from the same side of the counter: a sales invoice should
// not offer a purchase to fill it in.
function matchingCalcs() {
  return calcs.filter(c => ((c.txnMode === 'purchase') ? 'purchase' : 'sale') === txnMode);
}

function fillSavedPicker() {
  const list = matchingCalcs();
  $('savedPick').innerHTML = list.map((c, i) => {
    const d = c.timestamp ? (c.timestamp.toDate ? c.timestamp.toDate() : new Date(c.timestamp)) : new Date();
    const when = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const label = (c.invoiceNo ? '#' + c.invoiceNo + '  ' : '') + when + '  ·  ' + fmt(c.itemCost) + ' ' + t('mmk');
    return `<option value="${i}">${escapeHtml(label)}</option>`;
  }).join('');
  if (list.length) applySaved(0);
}

// Copy a saved calculation into the form. The item NAME is deliberately left
// alone — it is re-typed each time so the printed invoice can be more
// specific than the calculator's fixed list.
function applySaved(idx) {
  const c = matchingCalcs()[idx];
  if (!c) return;
  const set = (el, v) => { el.value = (v === 0 || v) ? String(v) : ''; };
  F.type.value = c.itemType || 'gold';
  set(F.iwK, c.weightK); set(F.iwP, c.weightP); set(F.iwY, c.weightY);
  set(F.lwK, c.lossWeightK); set(F.lwP, c.lossWeightP); set(F.lwY, c.lossWeightY);
  set(F.gwK, c.gemWeightK); set(F.gwP, c.gemWeightP); set(F.gwY, c.gemWeightY);
  set(F.dia, c.diamondWeight);
  const qi = PURITY_NAME.indexOf(c.goldPurity);
  F.purity.value = String(qi >= 0 ? qi : 0);
  F.gold.value  = c.goldPricePerK ? fmt(c.goldPricePerK) : '';
  // The saved total is the complete one (stones and fee included), so it
  // wins over anything this page could recompute from its own fields.
  F.total.value = c.itemCost ? fmt(c.itemCost) : '';
  totalEdited = true;
  savedDiverged = false;
  pickedInvoiceNo = c.invoiceNo ? String(c.invoiceNo) : '';
  pickedCalcId = c.id || '';
  markDirty();
  applyVisibility();
  updateDivergeNote();   // a freshly loaded record is by definition not diverged
  renderPaper();
}

// ---------- wiring ----------
document.querySelectorAll('.txn-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    txnMode = (btn.dataset.txn === 'purchase') ? 'purchase' : 'sale';
    pickedInvoiceNo = '';
    savedDiverged = false;
    markDirty();
    if (source === 'saved') fillSavedPicker();
    applyVisibility();
    refreshTotal();
  });
});
document.querySelectorAll('.cost-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    source = (btn.dataset.src === 'saved') ? 'saved' : 'manual';
    if (source === 'saved') { fillSavedPicker(); }
    else { pickedInvoiceNo = ''; totalEdited = false; savedDiverged = false; }
    markDirty();
    applyVisibility();
    refreshTotal();
  });
});
$('savedPick').addEventListener('change', (e) => applySaved(Number(e.target.value)));

// Editing any figure that feeds the total marks a loaded record as diverged.
const markDiverged = () => { markDirty(); if (source === 'saved') savedDiverged = true; };
F.type.addEventListener('change', () => { markDiverged(); applyVisibility(); refreshTotal(); });
[F.iwK, F.iwP, F.iwY, F.lwK, F.lwP, F.lwY, F.gwK, F.gwP, F.gwY, F.dia, F.gold, F.purity]
  .forEach(el => el.addEventListener('input', () => { markDiverged(); refreshTotal(); }));
F.purity.addEventListener('change', () => { markDiverged(); refreshTotal(); });
// Typing a total by hand takes over; clearing it hands control back.
// Clearing the field hands control back to the automatic figure at once —
// re-rendering alone left it stubbornly blank until some other input fired.
F.total.addEventListener('input', () => {
  markDirty();
  totalEdited = F.total.value.trim() !== '';
  if (totalEdited) renderPaper(); else refreshTotal();
});
[F.name, F.cName, F.cPhone, F.cAddress].forEach(el => el.addEventListener('input', () => { markDirty(); renderPaper(); }));

// ---------- validation ----------
// An invoice that goes out to a customer must be complete. Returns the first
// problem found, or '' when it is ready to issue.
function validateInvoice() {
  const purchase = (txnMode === 'purchase');
  const groups = [[[F.iwK, F.iwP, F.iwY], t('itemWeight')]];
  if (!purchase) groups.push([[F.lwK, F.lwP, F.lwY], t('lossWeight')]);
  if (F.type.value === 'gold-gem') groups.push([[F.gwK, F.gwP, F.gwY], t('gemWeight')]);
  for (const [els, label] of groups) {
    const v = els.map(el => el.value.trim() === '' ? 0 : Number(el.value.replace(/,/g, '')));
    if (v.some(n => !Number.isFinite(n) || n < 0)) return t('vNonNeg').replace('{x}', label);
    // 1 K = 16 P and 1 P = 8 Y, so a P of 16 or a Y of 8 belongs in the next unit.
    if (v[1] >= 16 || v[2] >= 8) return t('vPYRange').replace('{x}', label);
  }
  const itemK = toKyat(F.iwK.value, F.iwP.value, F.iwY.value);
  const lossK = purchase ? 0 : toKyat(F.lwK.value, F.lwP.value, F.lwY.value);
  if (itemK <= 0) return t('vItemWeight');
  let stoneK = 0;
  if (F.type.value === 'gold-gem') stoneK = toKyat(F.gwK.value, F.gwP.value, F.gwY.value);
  if (F.type.value === 'gold-diamond') {
    const d = F.dia.value.trim() === '' ? 0 : Number(F.dia.value.replace(/,/g, ''));
    if (!Number.isFinite(d) || d < 0) return t('vNonNeg').replace('{x}', t('diamondWeight'));
    stoneK = diamondToKyat(d);
  }
  if (stoneK > itemK + lossK) return t('vStoneHeavy');
  if (!F.name.value.trim()) return t('vItemName');
  if (!(parseNum(F.gold.value) > 0)) return t('vGoldPrice');
  if (!(parseNum(F.total.value) > 0)) return t('vTotal');
  if (!F.cName.value.trim() || !F.cPhone.value.trim() || !F.cAddress.value.trim()) return t('vCustomer');
  return '';
}

// ---------- issuing ----------
function buildIssuedInvoice(invoiceNumber) {
  const purchase = (txnMode === 'purchase');
  const data = {
    txnMode, source,
    sourceCalcId: (source === 'saved' && pickedCalcId) ? pickedCalcId : '',
    invoiceNumber,
    itemName: F.name.value.trim(),
    itemType: F.type.value,
    weightK: parseNum(F.iwK.value), weightP: parseNum(F.iwP.value), weightY: parseNum(F.iwY.value),
    lossWeightK: purchase ? 0 : parseNum(F.lwK.value),
    lossWeightP: purchase ? 0 : parseNum(F.lwP.value),
    lossWeightY: purchase ? 0 : parseNum(F.lwY.value),
    goldPurity: PURITY_NAME[Number(F.purity.value) || 0],
    goldPrice: parseNum(F.gold.value),
    totalCost: parseNum(F.total.value),
    customer: { name: F.cName.value.trim(), phone: F.cPhone.value.trim(), address: F.cAddress.value.trim() },
  };
  if (F.type.value === 'gold-gem') {
    data.gemWeightK = parseNum(F.gwK.value); data.gemWeightP = parseNum(F.gwP.value); data.gemWeightY = parseNum(F.gwY.value);
  }
  if (F.type.value === 'gold-diamond') data.diamondWeight = parseNum(F.dia.value);
  return data;
}

// Make sure what is on screen has been issued, issuing it if needed. Returns
// true when it is safe to export or print. Re-printing unchanged content
// does not issue a second invoice.
let issuing = false;
async function ensureIssued() {
  const problem = validateInvoice();
  if (problem) { showMessage(problem); return false; }
  if (!activeUser) { showMessage(t('errSignInToIssue')); return false; }
  if (issuedRecord && !invoiceDirty) return true;
  if (issuing) return false;
  issuing = true;
  try {
    const number = (source === 'saved' && pickedInvoiceNo)
      ? pickedInvoiceNo
      : await claimInvoiceNumber(txnMode, usedSeqToday());
    const data = buildIssuedInvoice(number);
    const res = await saveIssuedInvoice(data);
    issuedRecord = { id: res.id, ...data, timestamp: new Date() };
    issued.unshift(issuedRecord);
    invoiceDirty = false;
    showMessage('');
    updateCustomerSuggestions();
    renderPaper();
    return true;
  } catch (e) {
    showMessage(t('couldNotIssue') + ((e && e.message) || e));
    return false;
  } finally {
    issuing = false;
  }
}

// ---------- returning customers ----------
// Typing a name that has been invoiced before offers it, and choosing it
// fills in the phone and address from the most recent invoice to them.
function updateCustomerSuggestions() {
  const list = $('customerSuggestions');
  if (!list) return;
  const q = F.cName.value.trim().toLowerCase();
  const seen = new Map();
  issued.forEach(r => {
    const c = r.customer || {};
    const key = (c.name || '').toLowerCase();
    if (key && key.startsWith(q) && !seen.has(key)) seen.set(key, c);
  });
  list.innerHTML = Array.from(seen.values()).slice(0, 8)
    .map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.phone || '')}</option>`).join('');
}
function fillReturningCustomer() {
  const key = F.cName.value.trim().toLowerCase();
  const hit = issued.find(r => r.customer && (r.customer.name || '').toLowerCase() === key);
  if (!hit) return;
  F.cPhone.value = hit.customer.phone || '';
  F.cAddress.value = hit.customer.address || '';
  markDirty();
  renderPaper();
}
F.cName.addEventListener('input', updateCustomerSuggestions);
F.cName.addEventListener('change', fillReturningCustomer);

// ---------- export / print ----------
// The paper is measured, not assumed: height comes from the rendered node so
// a long invoice is never cut off.
async function paperCanvas() {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  return html2canvas($('invPaper'), { backgroundColor: '#ffffff', scale: 4, useCORS: true, logging: false });
}

$('exportBtn').addEventListener('click', async () => {
  const btn = $('exportBtn');
  btn.disabled = true;
  try {
    if (!await ensureIssued()) return;
    const canvas = await paperCanvas();
    const hIn = PAPER_W_IN * (canvas.height / canvas.width);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'in', format: [PAPER_W_IN, hIn], orientation: 'portrait' });
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, PAPER_W_IN, hIn);
    const name = txnMode + '-invoice-' + shownNumber() + '.pdf';

    // Offer the native share sheet when the device has one, so the PDF can go
    // straight to a chat or mail app; otherwise fall back to a download.
    const blob = pdf.output('blob');
    const file = new File([blob], name, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: name });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;   // user dismissed the sheet
      }
    }
    pdf.save(name);
  } catch (e) {
    alert(t('couldNotSaveImage') + (e && e.message || e));
  } finally {
    btn.disabled = false;
  }
});

// Printing uses the browser's own dialog. A print stylesheet hides the app
// chrome and sets the page to 2in wide with automatic length.
$('printBtn').addEventListener('click', async () => {
  if (!await ensureIssued()) return;
  document.body.classList.add('printing');
  const done = () => {
    document.body.classList.remove('printing');
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  window.print();
  // Safari/iOS do not always fire afterprint.
  setTimeout(done, 3000);
});

// ---------- language ----------
const langOptions = document.querySelectorAll('.opt-lang-btn');
function applyLanguage(lang) {
  const l = (lang === 'mm') ? 'mm' : 'en';
  setLang(l);
  applyLangClass(l);
  translateStatic(l);
  langOptions.forEach(o => o.classList.toggle('active', o.dataset.lang === l));
  if (source === 'saved') fillSavedPicker();
  renderPaper();
}
langOptions.forEach(o => o.addEventListener('click', () => applyLanguage(o.dataset.lang)));

// ---------- menu + nav ----------
const optionsMenu = $('optionsMenu');
const closeOptions = () => optionsMenu.classList.add('hidden');
$('optionsToggle').addEventListener('click', () => optionsMenu.classList.remove('hidden'));
$('optBackdrop').addEventListener('click', closeOptions);
$('optEditPrice').addEventListener('click', () => { location.href = 'index.html#pricing'; });
$('optHistory').addEventListener('click', () => { location.href = 'history.html'; });
$('optEditInfo').addEventListener('click', () => { location.href = 'profile.html#edit'; });
$('optCompare').addEventListener('click', () => { location.href = 'compare.html'; });
$('optPrintInvoice').addEventListener('click', closeOptions);

$('navPricing').addEventListener('click', () => { location.href = 'index.html#pricing'; });
$('navHome').addEventListener('click', () => { location.href = 'index.html'; });
$('navCompare').addEventListener('click', () => { location.href = 'compare.html'; });
$('navProfile').addEventListener('click', () => { location.href = 'profile.html'; });
$('navInvoice').addEventListener('click', () => {});

// ---------- start ----------
applyLanguage(getLang());
applyVisibility();
refreshTotal();

// Saved calculations need an account; without one the page still works by hand.
onAuthStateChange(async (user) => {
  activeUser = user || null;
  if (!user) { calcs = []; issued = []; applyVisibility(); renderPaper(); return; }
  try {
    [calcs, issued] = await Promise.all([
      getCalculations(),
      getIssuedInvoices().catch(() => []),   // e.g. rules not deployed yet
    ]);
  } catch (e) {
    calcs = [];
  }
  updateCustomerSuggestions();
  if (source === 'saved') fillSavedPicker();
  applyVisibility();
  renderPaper();
});
