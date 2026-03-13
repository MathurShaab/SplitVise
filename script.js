/**
 * SplitTrack — Jatin & Nikhil
 * =====================================================================
 * APPS SCRIPT CODE (paste this EXACTLY, then deploy as NEW VERSION)
 * =====================================================================
 *
 * const SHEET_NAME = 'Expenses';
 *
 * function doGet(e) {
 *   const sheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
 *   const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'read';
 *
 *   if (action === 'read') {
 *     const data = sheet.getDataRange().getValues();
 *     if (data.length <= 1) return respond([]);
 *     const headers = data[0];
 *     const rows = data.slice(1)
 *       .filter(r => String(r[0]).trim() !== '')
 *       .map(row => {
 *         const obj = {};
 *         headers.forEach((h, i) => { obj[String(h).trim()] = String(row[i]).trim(); });
 *         return obj;
 *       });
 *     return respond(rows);
 *   }
 *
 *   if (action === 'add') {
 *     const d = JSON.parse(decodeURIComponent(e.parameter.data));
 *     sheet.appendRow([d.expenseId, d.amount, d.description, d.date, d.paidBy, d.createdAt, d.updatedAt]);
 *     return respond({ success: true });
 *   }
 *
 *   if (action === 'edit') {
 *     const d    = JSON.parse(decodeURIComponent(e.parameter.data));
 *     const rows = sheet.getDataRange().getValues();
 *     for (let i = 1; i < rows.length; i++) {
 *       if (String(rows[i][0]).trim() === String(d.expenseId).trim()) {
 *         sheet.getRange(i + 1, 1, 1, 7).setValues([[
 *           d.expenseId, d.amount, d.description, d.date, d.paidBy, rows[i][5], d.updatedAt
 *         ]]);
 *         break;
 *       }
 *     }
 *     return respond({ success: true });
 *   }
 *
 *   if (action === 'delete') {
 *     const d    = JSON.parse(decodeURIComponent(e.parameter.data));
 *     const rows = sheet.getDataRange().getValues();
 *     for (let i = 1; i < rows.length; i++) {
 *       if (String(rows[i][0]).trim() === String(d.expenseId).trim()) {
 *         sheet.deleteRow(i + 1);
 *         break;
 *       }
 *     }
 *     return respond({ success: true });
 *   }
 *
 *   return respond({ error: 'Unknown action: ' + action });
 * }
 *
 * function respond(data) {
 *   return ContentService
 *     .createTextOutput(JSON.stringify(data))
 *     .setMimeType(ContentService.MimeType.JSON);
 * }
 *
 * =====================================================================
 * DEPLOY STEPS (do this every time you change the script):
 *   1. Save (Ctrl+S)
 *   2. Deploy → Manage Deployments
 *   3. Click the pencil (edit) icon on your existing deployment
 *   4. Version → select "New version"
 *   5. Click Deploy
 *   6. Copy the URL → paste below as APPS_SCRIPT_URL
 * =====================================================================
 */

// ====================================================================
//  ⚙  YOUR CONFIG
// ====================================================================
const CONFIG = {
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxhMg4Mpr6ujC1xP--Porhw43CEyNaxOIG-F1pO8-tLyubOVPHgt48MPQANBkwPq6V6/exec',
  // e.g. 'https://script.google.com/macros/s/AKfycbx.../exec'
};
// ====================================================================

const IS_CONFIGURED = CONFIG.APPS_SCRIPT_URL.startsWith('https://script.google.com');

// State
let currentUser = null;
let expenses    = [];
let editingId   = null;

const $ = id => document.getElementById(id);

// ====================================================================
//  BOOT
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  currentUser = localStorage.getItem('splittrack_user');

  if (!IS_CONFIGURED) {
    $('setup-guide').classList.remove('hidden');
    $('skip-setup').addEventListener('click', () => {
      $('setup-guide').classList.add('hidden');
      init();
    });
    return;
  }

  init();
});

function init() {

  // warm up Apps Script
  if (IS_CONFIGURED) {
    fetch(CONFIG.APPS_SCRIPT_URL + "?action=read").catch(()=>{});
  }

  currentUser ? showApp() : showRegistration();
}

// ====================================================================
//  REGISTRATION
// ====================================================================
function showRegistration() {
  $('registration-screen').classList.remove('hidden');
  $('app').classList.add('hidden');
  document.querySelectorAll('.reg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentUser = btn.dataset.name;
      localStorage.setItem('splittrack_user', currentUser);
      $('registration-screen').classList.add('hidden');
      showApp();
    });
  });
}

// ====================================================================
//  SHOW APP
// ====================================================================
function showApp() {
  $('app').classList.remove('hidden');
  $('user-badge').textContent      = currentUser;
  $('settings-user').textContent   = currentUser;
  $('paid-by-label').textContent   = currentUser;
  bindEvents();
  loadExpenses();
}

// ====================================================================
//  EVENTS
// ====================================================================
function bindEvents() {
  $('dark-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('splittrack_theme',
      document.body.classList.contains('dark') ? 'dark' : 'light');
  });

  $('settings-btn').addEventListener('click', () =>
    $('settings-panel').classList.toggle('hidden'));
  $('close-settings').addEventListener('click', () =>
    $('settings-panel').classList.add('hidden'));

  $('reset-identity').addEventListener('click', () => {
    if (confirm('Clear your identity from this device?')) {
      localStorage.removeItem('splittrack_user');
      currentUser = null;
      $('app').classList.add('hidden');
      $('settings-panel').classList.add('hidden');
      showRegistration();
    }
  });

  $('fab').addEventListener('click', openAddModal);
  $('refresh-btn').addEventListener('click', loadExpenses);
  $('modal-close').addEventListener('click', closeModal);
  $('cancel-btn').addEventListener('click', closeModal);
  $('modal-overlay').addEventListener('click', e => {
    if (e.target === $('modal-overlay')) closeModal();
  });
  $('expense-form').addEventListener('submit', handleFormSubmit);

  document.addEventListener('click', e => {
    const panel = $('settings-panel');
    if (!panel.classList.contains('hidden') &&
        !panel.contains(e.target) &&
        e.target !== $('settings-btn')) {
      panel.classList.add('hidden');
    }
  });
}

// ====================================================================
//  THEME
// ====================================================================
function applyTheme() {
  if (localStorage.getItem('splittrack_theme') === 'dark')
    document.body.classList.add('dark');
}

// ====================================================================
//  MODAL
// ====================================================================
function openAddModal() {
  editingId = null;
  $('expense-form').reset();
  $('edit-id').value             = '';
  $('modal-title').textContent   = 'Add Expense';
  $('submit-btn').textContent    = 'Save Expense';
  $('f-date').value              = today();
  $('paid-by-label').textContent = currentUser;
  $('modal-overlay').classList.remove('hidden');
}

function openEditModal(expense) {
  editingId                      = expense.expenseId;
  $('edit-id').value             = expense.expenseId;
  $('modal-title').textContent   = 'Edit Expense';
  $('submit-btn').textContent    = 'Update Expense';
  $('f-amount').value            = expense.amount;
  $('f-desc').value              = expense.description;
  $('f-date').value              = expense.date;
  $('paid-by-label').textContent = expense.paidBy;
  $('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  $('modal-overlay').classList.add('hidden');
  $('expense-form').reset();
  editingId = null;
}

// ====================================================================
//  FORM SUBMIT
// ====================================================================
async function handleFormSubmit(e) {
  e.preventDefault();
  const amount      = parseFloat($('f-amount').value);
  const description = $('f-desc').value.trim();
  const date        = $('f-date').value;

  if (!amount || !description || !date) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  const now = new Date().toISOString();

  if (editingId) {
    const original = expenses.find(ex => ex.expenseId === editingId);
    await callSheet('edit', {
      expenseId:   editingId,
      amount,
      description,
      date,
      paidBy:    original ? original.paidBy : currentUser,
      createdAt: original ? original.createdAt : now,
      updatedAt: now,
    });
  } else {
     {

  const newExpense = {
    expenseId: generateId(),
    amount,
    description,
    date,
    paidBy: currentUser,
    createdAt: now,
    updatedAt: now
  };

  // Update UI immediately
  expenses.push(newExpense);
  renderExpenses();
  renderDashboard();

  // Send to Google Sheet
  await callSheet('add', newExpense);
}
  }
}

// ====================================================================
//  CORE SHEET FUNCTION — GET with query params (no CORS issues)
// ====================================================================
async function callSheet(action, data) {
  closeModal();
  showLoader();

  // Offline/demo mode
  if (!IS_CONFIGURED) {
    if (action === 'add') {
      expenses.push(data);
    } else if (action === 'edit') {
      const i = expenses.findIndex(e => e.expenseId === data.expenseId);
      if (i !== -1) expenses[i] = data;
    } else if (action === 'delete') {
      expenses = expenses.filter(e => e.expenseId !== data.expenseId);
    }
    localStorage.setItem('splittrack_expenses', JSON.stringify(expenses));
    renderExpenses();
    renderDashboard();
    showToast(action === 'delete' ? 'Deleted!' : 'Saved!', 'success');
    hideLoader();
    return;
  }

  // Live mode — send as GET with encoded query params
  try {
    const encoded = encodeURIComponent(JSON.stringify(data));
    const url     = `${CONFIG.APPS_SCRIPT_URL}?action=${action}&data=${encoded}`;

    console.log('[callSheet] URL:', url);

    const res  = await fetch(url, { redirect: 'follow' });
    const text = await res.text();

    console.log('[callSheet] Raw response:', text);

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error('Non-JSON response: ' + text.slice(0, 200));
    }

    if (json && json.error) throw new Error('Sheet error: ' + json.error);
    if (!json || !json.success) throw new Error('Unexpected response: ' + text.slice(0, 200));

    await loadExpenses();
    showToast(action === 'delete' ? 'Deleted!' : 'Saved!', 'success');

  } catch (err) {
    console.error('[callSheet] Error:', err);
    showToast('Failed: ' + err.message, 'error');
    hideLoader();
  }
}

// ====================================================================
//  LOAD EXPENSES
// ====================================================================
async function loadExpenses() {
  showLoader();
  try {
    if (!IS_CONFIGURED) {
      const stored = localStorage.getItem('splittrack_expenses');
      expenses = stored ? JSON.parse(stored) : [];
    } else {
      const url  = `${CONFIG.APPS_SCRIPT_URL}?action=read`;
      console.log('[loadExpenses] URL:', url);

      const res  = await fetch(url, { redirect: 'follow' });
      const text = await res.text();
      console.log('[loadExpenses] Raw response:', text.slice(0, 300));

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('Bad JSON from Apps Script: ' + text.slice(0, 200));
      }

      if (!Array.isArray(parsed)) {
        throw new Error('Expected array, got: ' + text.slice(0, 200));
      }

      expenses = parsed
  .map(row => {
    const clean = {};
    for (const k in row) {
      clean[k.trim()] = typeof row[k] === 'string' ? row[k].trim() : row[k];
    }
    return clean;
  })
  .sort((a,b)=> new Date(b.date) - new Date(a.date));
    }

    renderExpenses();
    renderDashboard();

  } catch (err) {
    console.error('[loadExpenses] Error:', err);
    const stored = localStorage.getItem('splittrack_expenses');
    expenses = stored ? JSON.parse(stored) : [];
    renderExpenses();
    renderDashboard();
    showToast('Load error: ' + err.message, 'error');
  } finally {
    hideLoader();
  }
}

// ====================================================================
//  DEBUG / DIAGNOSTICS
// ====================================================================
function debugLog(msg, type = 'info') {
  const box = $('debug-output');
  const line = document.createElement('div');
  line.className = 'debug-line debug-' + type;
  line.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
  box.prepend(line);
}

async function runDiagnostics() {
  const box = $('debug-output');
  box.innerHTML = '';
  debugLog('=== DIAGNOSTICS START ===');
  debugLog('IS_CONFIGURED: ' + IS_CONFIGURED);
  debugLog('URL: ' + CONFIG.APPS_SCRIPT_URL);
  debugLog('currentUser: ' + currentUser);
  debugLog('expenses in memory: ' + expenses.length);
  if (IS_CONFIGURED) {
    debugLog('Testing read from sheet...');
    await debugTestRead();
  }
}

async function debugTestRead() {
  debugLog('--- TEST READ ---');
  try {
    const url = `${CONFIG.APPS_SCRIPT_URL}?action=read`;
    debugLog('Fetching: ' + url);
    const res  = await fetch(url, { redirect: 'follow' });
    const text = await res.text();
    debugLog('HTTP status: ' + res.status);
    debugLog('Response: ' + text.slice(0, 500), text.startsWith('[') || text.startsWith('{') ? 'ok' : 'error');
    try {
      const json = JSON.parse(text);
      debugLog('Parsed OK. Type: ' + (Array.isArray(json) ? 'array' : typeof json) + ', length: ' + (Array.isArray(json) ? json.length : 'n/a'), 'ok');
    } catch {
      debugLog('JSON parse FAILED', 'error');
    }
  } catch (err) {
    debugLog('Fetch error: ' + err.message, 'error');
  }
}

async function debugTestAdd() {
  debugLog('--- TEST ADD ---');
  const testData = {
    expenseId:   'TEST_' + Date.now(),
    amount:      '1',
    description: 'DEBUG TEST - DELETE ME',
    date:        today(),
    paidBy:      currentUser || 'Jatin',
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
  };
  try {
    const encoded = encodeURIComponent(JSON.stringify(testData));
    const url     = `${CONFIG.APPS_SCRIPT_URL}?action=add&data=${encoded}`;
    debugLog('Sending add request...');
    debugLog('URL length: ' + url.length + ' chars');
    const res  = await fetch(url, { redirect: 'follow' });
    const text = await res.text();
    debugLog('HTTP status: ' + res.status);
    debugLog('Response: ' + text, text.includes('success') ? 'ok' : 'error');
  } catch (err) {
    debugLog('Fetch error: ' + err.message, 'error');
  }
}

// ====================================================================
//  RENDER EXPENSES (table for desktop, cards for mobile)
// ====================================================================
function renderExpenses() {
  const tbody  = $('expense-body');
  const cards  = $('expense-cards');
  tbody.innerHTML = '';
  cards.innerHTML = '';

  if (!expenses || expenses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No expenses yet. Add one!</td></tr>`;
    cards.innerHTML = `<div class="expense-cards-empty">No expenses yet. Add one!</div>`;
    return;
  }

//   const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
 // ✅ FIX: sort newest first
 expenses.sort((a, b) => {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
});
  expenses.forEach((exp, idx) => {
    const paidLower = (exp.paidBy || '').trim().toLowerCase();
    const paidClass = paidLower === 'jatin' ? 'jatin' : 'nikhil';

    // ── Desktop table row ──────────────────────────────────────
    const tr = document.createElement('tr');
    tr.style.animationDelay = (idx * 0.04) + 's';
    tr.innerHTML = `
      <td>${formatDate(exp.date)}</td>
      <td>${escHtml(exp.description)}</td>
      <td><span class="paid-badge ${paidClass}">${escHtml(exp.paidBy)}</span></td>
      <td class="amount-cell">₹${parseFloat(exp.amount || 0).toFixed(2)}</td>
      <td>
        <div class="actions-cell">
          <button class="btn-edit"   data-id="${exp.expenseId}">Edit</button>
          <button class="btn-delete" data-id="${exp.expenseId}">Delete</button>
        </div>
      </td>`;
    tbody.appendChild(tr);

    // ── Mobile card ────────────────────────────────────────────
    const card = document.createElement('div');
    card.className = 'expense-card';
    card.style.animationDelay = (idx * 0.05) + 's';
    card.innerHTML = `
      <div class="expense-card-top">
        <div class="expense-card-desc">${escHtml(exp.description)}</div>
        <div class="expense-card-amount">₹${parseFloat(exp.amount || 0).toFixed(2)}</div>
      </div>
      <div class="expense-card-bottom">
        <div class="expense-card-meta">
          <span class="expense-card-date">${formatDate(exp.date)}</span>
          <span class="paid-badge ${paidClass}">${escHtml(exp.paidBy)}</span>
        </div>
        <div class="expense-card-actions">
          <button class="btn-edit"   data-id="${exp.expenseId}">Edit</button>
          <button class="btn-delete" data-id="${exp.expenseId}">Delete</button>
        </div>
      </div>`;
    cards.appendChild(card);
  });

  // Bind edit/delete for both table and cards
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const exp = expenses.find(e => e.expenseId === btn.dataset.id);
      if (exp) openEditModal(exp);
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const exp = expenses.find(e => e.expenseId === btn.dataset.id);
      if (exp && confirm(`Delete "${exp.description}"?`)) {
        callSheet('delete', { expenseId: exp.expenseId });
      }
    });
  });
}

// ====================================================================
//  RENDER DASHBOARD
// ====================================================================
function renderDashboard() {
  const jatinTotal = expenses
    .filter(e => (e.paidBy || '').trim().toLowerCase() === 'jatin')
    .reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  const nikhilTotal = expenses
    .filter(e => (e.paidBy || '').trim().toLowerCase() === 'nikhil')
    .reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  const tripTotal  = jatinTotal + nikhilTotal;
  const equalShare = tripTotal / 2;

  $('jatin-total').textContent  = `₹${jatinTotal.toFixed(2)}`;
  $('nikhil-total').textContent = `₹${nikhilTotal.toFixed(2)}`;
  $('trip-total').textContent   = `₹${tripTotal.toFixed(2)}`;
  $('equal-share').textContent  = `₹${equalShare.toFixed(2)}`;

  const box  = $('settlement-box');
  const msg  = $('settlement-msg');
  const icon = $('settlement-icon');
  const diff = jatinTotal - nikhilTotal;

  box.classList.remove('owes', 'settled');

  if (Math.abs(diff) < 0.01) {
    icon.textContent = '✓';
    msg.textContent  = 'All settled up!';
    box.classList.add('settled');
  } else {
    icon.textContent = '⚖';
    const amount = Math.abs(diff / 2).toFixed(2);
    msg.textContent  = diff > 0
      ? `Nikhil owes Jatin ₹${amount}`
      : `Jatin owes Nikhil ₹${amount}`;
    box.classList.add('owes');
  }
}

// ====================================================================
//  HELPERS
// ====================================================================
let loaderTimeout;

function showLoader() {
  loaderTimeout = setTimeout(() => {
    $('loader').classList.remove('hidden');
  }, 300);
}
function hideLoader() {
  clearTimeout(loaderTimeout);
  $('loader').classList.add('hidden');
}

let toastTimer;
function showToast(msg, type = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className   = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

function generateId() {
  return 'exp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(str) {
  if (!str || str === '') return '';
  let d;
  // ISO format: 2025-01-15
  if (/^\d{4}-\d{2}-\d{2}$/.test(str.trim())) {
    const [y, m, day] = str.trim().split('-').map(Number);
    d = new Date(y, m - 1, day);
  // DD/MM/YYYY or MM/DD/YYYY from Google Sheets
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str.trim())) {
    const parts = str.trim().split('/').map(Number);
    d = parts[0] > 12
      ? new Date(parts[2], parts[1] - 1, parts[0])   // DD/MM/YYYY
      : new Date(parts[2], parts[0] - 1, parts[1]);  // MM/DD/YYYY
  // Fallback: let browser parse it
  } else {
    d = new Date(str);
  }
  if (!d || isNaN(d.getTime())) return str;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}
