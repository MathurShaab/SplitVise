/**
 * SplitTrack — Production
 * ─────────────────────────────────────────────────────────────
 * APPS SCRIPT (paste exactly, deploy as NEW VERSION)
 * ─────────────────────────────────────────────────────────────
 *
 * const EXPENSES_SHEET = 'Expenses';
 * const GROUPS_SHEET   = 'Groups';
 * const ARCHIVE_SHEET  = 'Archive';
 *
 * function getSheet(name) {
 *   return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
 * }
 *
 * function doGet(e) {
 *   const action  = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';
 *   const groupId = e && e.parameter ? e.parameter.groupId : null;
 *
 *   if (action === 'ping') return respond({ ok: true });
 *
 *   if (action === 'read') {
 *     const sheet = getSheet(EXPENSES_SHEET);
 *     const data  = sheet.getDataRange().getValues();
 *     if (data.length <= 1) return respond([]);
 *     const headers = data[0];
 *     const rows = data.slice(1)
 *       .filter(r => String(r[0]).trim() !== '' && (!groupId || String(r[1]).trim() === groupId))
 *       .map(row => { const obj = {}; headers.forEach((h,i) => { obj[String(h).trim()] = String(row[i]).trim(); }); return obj; });
 *     return respond(rows);
 *   }
 *
 *   if (action === 'readGroups') {
 *     const sheet = getSheet(GROUPS_SHEET);
 *     const data  = sheet.getDataRange().getValues();
 *     if (data.length <= 1) return respond([]);
 *     const headers = data[0];
 *     const rows = data.slice(1)
 *       .filter(r => String(r[0]).trim() !== '')
 *       .map(row => { const obj = {}; headers.forEach((h,i) => { obj[String(h).trim()] = String(row[i]).trim(); }); return obj; });
 *     return respond(rows);
 *   }
 *
 *   if (action === 'add') {
 *     const d = JSON.parse(decodeURIComponent(e.parameter.data));
 *     getSheet(EXPENSES_SHEET).appendRow([d.expenseId,d.groupId,d.amount,d.description,d.date,d.paidBy,d.splitWith,d.createdAt,d.updatedAt]);
 *     return respond({ success: true });
 *   }
 *
 *   if (action === 'edit') {
 *     const d = JSON.parse(decodeURIComponent(e.parameter.data));
 *     const sheet = getSheet(EXPENSES_SHEET);
 *     const rows = sheet.getDataRange().getValues();
 *     for (let i = 1; i < rows.length; i++) {
 *       if (String(rows[i][0]).trim() === String(d.expenseId).trim()) {
 *         sheet.getRange(i+1,1,1,9).setValues([[d.expenseId,d.groupId,d.amount,d.description,d.date,d.paidBy,d.splitWith,rows[i][7],d.updatedAt]]);
 *         break;
 *       }
 *     }
 *     return respond({ success: true });
 *   }
 *
 *   if (action === 'delete') {
 *     const d = JSON.parse(decodeURIComponent(e.parameter.data));
 *     const sheet = getSheet(EXPENSES_SHEET);
 *     const rows = sheet.getDataRange().getValues();
 *     for (let i = 1; i < rows.length; i++) {
 *       if (String(rows[i][0]).trim() === String(d.expenseId).trim()) { sheet.deleteRow(i+1); break; }
 *     }
 *     return respond({ success: true });
 *   }
 *
 *   if (action === 'createGroup') {
 *     const d = JSON.parse(decodeURIComponent(e.parameter.data));
 *     getSheet(GROUPS_SHEET).appendRow([d.groupId,d.groupName,d.inviteCode,d.members,d.createdAt]);
 *     return respond({ success: true });
 *   }
 *
 *   if (action === 'joinGroup') {
 *     const d = JSON.parse(decodeURIComponent(e.parameter.data));
 *     const sheet = getSheet(GROUPS_SHEET);
 *     const rows = sheet.getDataRange().getValues();
 *     for (let i = 1; i < rows.length; i++) {
 *       if (String(rows[i][2]).trim().toUpperCase() === String(d.inviteCode).trim().toUpperCase()) {
 *         const existing = String(rows[i][3]).trim();
 *         const members = existing ? existing.split(',').map(s=>s.trim()) : [];
 *         if (!members.includes(d.memberName)) { members.push(d.memberName); sheet.getRange(i+1,4).setValue(members.join(',')); }
 *         return respond({ success:true, groupId:String(rows[i][0]).trim(), groupName:String(rows[i][1]).trim(), members:members.join(',') });
 *       }
 *     }
 *     return respond({ success: false, error: 'Invalid invite code' });
 *   }
 *
 *   if (action === 'settle') {
 *     const d = JSON.parse(decodeURIComponent(e.parameter.data));
 *     const expSheet = getSheet(EXPENSES_SHEET);
 *     const arcSheet = getSheet(ARCHIVE_SHEET);
 *     const settledAt = new Date().toISOString();
 *     const rows = expSheet.getDataRange().getValues();
 *     const toDelete = [];
 *     for (let i = 1; i < rows.length; i++) {
 *       if (String(rows[i][1]).trim() === String(d.groupId).trim()) {
 *         arcSheet.appendRow([rows[i][0],rows[i][1],rows[i][2],rows[i][3],rows[i][4],rows[i][5],rows[i][6],rows[i][7],settledAt]);
 *         toDelete.push(i+1);
 *       }
 *     }
 *     for (let i = toDelete.length-1; i >= 0; i--) expSheet.deleteRow(toDelete[i]);
 *     return respond({ success: true });
 *   }
 *
 *   return respond({ error: 'Unknown action: ' + action });
 * }
 *
 * function respond(data) {
 *   return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
 * }
 */

// ─────────────────────────────────────────────────────────────
//  CONFIG — paste your Apps Script URL here
// ─────────────────────────────────────────────────────────────
const CONFIG = {
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxhMg4Mpr6ujC1xP--Porhw43CEyNaxOIG-F1pO8-tLyubOVPHgt48MPQANBkwPq6V6/exec',
};
const IS_CONFIGURED = CONFIG.APPS_SCRIPT_URL.startsWith('https://script.google.com');

// ─────────────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────────────
let currentUser       = null;
let currentGroup      = null;
let expenses          = [];
let allGroups         = [];
let editingId         = null;
let pendingSettlement = null;

const $ = id => document.getElementById(id);

// ─────────────────────────────────────────────────────────────
//  BOOT — runs once on page load
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log('[SplitTrack] Boot start');
  applyTheme();

  // Bind ALL static events once here at boot — never again
  bindAllEvents();

  if (!IS_CONFIGURED) {
    $('setup-guide').classList.remove('hidden');
    return;
  }

  bootApp();
});

// ─────────────────────────────────────────────────────────────
//  BIND ALL EVENTS — called ONCE at DOMContentLoaded
// ─────────────────────────────────────────────────────────────
function bindAllEvents() {
  console.log('[SplitTrack] Binding all events');

  // Setup guide
  $('skip-setup').addEventListener('click', () => {
    $('setup-guide').classList.add('hidden');
    bootApp();
  });

  // Registration
  $('reg-continue').addEventListener('click', doRegister);
  $('reg-name').addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });

  // Hub — settings
  $('hub-settings-btn').addEventListener('click', e => {
    e.stopPropagation();
    console.log('[HUB] settings toggle');
    $('hub-settings').classList.toggle('hidden');
  });
  $('hub-settings-close').addEventListener('click', () => $('hub-settings').classList.add('hidden'));
  $('hub-save-upi').addEventListener('click', () => {
    currentUser.upiId = $('hub-upi').value.trim();
    localStorage.setItem('splittrack_user', JSON.stringify(currentUser));
    showToast('UPI ID saved!', 'success');
    $('hub-settings').classList.add('hidden');
  });
  $('hub-reset').addEventListener('click', () => {
    if (confirm('Clear your identity and all local data?')) {
      localStorage.clear();
      location.reload();
    }
  });

  // Hub — create group
  $('btn-create-group').addEventListener('click', () => {
    console.log('[HUB] Create Group button clicked');
    $('new-group-name').value = '';
    $('modal-create-group').classList.remove('hidden');
    console.log('[HUB] modal-create-group shown');
  });
  $('confirm-create-group').addEventListener('click', () => {
    console.log('[HUB] confirm-create-group clicked');
    doCreateGroup();
  });
  $('new-group-name').addEventListener('keydown', e => { if (e.key === 'Enter') doCreateGroup(); });
  $('create-group-close').addEventListener('click',  () => $('modal-create-group').classList.add('hidden'));
  $('create-group-cancel').addEventListener('click', () => $('modal-create-group').classList.add('hidden'));
  $('modal-create-group').addEventListener('click', e => {
    if (e.target === $('modal-create-group')) $('modal-create-group').classList.add('hidden');
  });

  // Hub — join group
  $('btn-join-group').addEventListener('click', () => {
    console.log('[HUB] Join Group button clicked');
    $('join-code-input').value = '';
    $('modal-join-group').classList.remove('hidden');
    console.log('[HUB] modal-join-group shown');
  });
  $('confirm-join-group').addEventListener('click', () => {
    console.log('[HUB] confirm-join-group clicked');
    doJoinGroup();
  });
  $('join-code-input').addEventListener('keydown', e => { if (e.key === 'Enter') doJoinGroup(); });
  $('join-group-close').addEventListener('click',  () => $('modal-join-group').classList.add('hidden'));
  $('join-group-cancel').addEventListener('click', () => $('modal-join-group').classList.add('hidden'));
  $('modal-join-group').addEventListener('click', e => {
    if (e.target === $('modal-join-group')) $('modal-join-group').classList.add('hidden');
  });

  // Close settings on outside click
  document.addEventListener('click', () => $('hub-settings').classList.add('hidden'));
  $('hub-settings').addEventListener('click', e => e.stopPropagation());

  // App — header
  $('back-btn').addEventListener('click', () => showGroupsHub());
  $('dark-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('splittrack_theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });
  $('app-settings-btn').addEventListener('click', e => {
    e.stopPropagation();
    $('app-settings-panel').classList.toggle('hidden');
  });
  $('app-settings-close').addEventListener('click', () => $('app-settings-panel').classList.add('hidden'));
  $('app-settings-panel').addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', () => $('app-settings-panel').classList.add('hidden'));

  $('copy-invite-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(currentGroup.inviteCode)
      .then(() => showToast('Code copied!', 'success'))
      .catch(() => showToast('Code: ' + currentGroup.inviteCode));
  });
  $('share-invite-btn').addEventListener('click', () => {
    const msg = `Join my group "${currentGroup.groupName}" on SplitTrack!\nInvite code: *${currentGroup.inviteCode}*`;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  });

  // App — expense
  $('fab').addEventListener('click', openAddModal);
  $('refresh-btn').addEventListener('click', loadExpenses);
  $('modal-close').addEventListener('click', closeExpenseModal);
  $('cancel-btn').addEventListener('click', closeExpenseModal);
  $('modal-overlay').addEventListener('click', e => {
    if (e.target === $('modal-overlay')) closeExpenseModal();
  });
  $('expense-form').addEventListener('submit', handleFormSubmit);

  // App — settle
  $('settle-close').addEventListener('click',  () => $('modal-settle').classList.add('hidden'));
  $('settle-cancel').addEventListener('click', () => $('modal-settle').classList.add('hidden'));
  $('modal-settle').addEventListener('click', e => {
    if (e.target === $('modal-settle')) $('modal-settle').classList.add('hidden');
  });
  $('confirm-settle-pay').addEventListener('click', doSettlePay);
  $('confirm-settle-clear').addEventListener('click', doSettleClear);
}

// ─────────────────────────────────────────────────────────────
//  BOOT APP
// ─────────────────────────────────────────────────────────────
function bootApp() {
  const saved = localStorage.getItem('splittrack_user');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      currentUser = (parsed && parsed.name) ? parsed : { name: saved.trim(), upiId: '' };
    } catch (e) {
      currentUser = { name: saved.trim(), upiId: '' };
    }
    localStorage.setItem('splittrack_user', JSON.stringify(currentUser));
    showGroupsHub();
  } else {
    showScreen('screen-register');
  }
}

// ─────────────────────────────────────────────────────────────
//  REGISTRATION
// ─────────────────────────────────────────────────────────────
function doRegister() {
  const name = $('reg-name').value.trim();
  if (!name) { showToast('Enter your name', 'error'); return; }
  currentUser = { name, upiId: '' };
  localStorage.setItem('splittrack_user', JSON.stringify(currentUser));
  showGroupsHub();
}

// ─────────────────────────────────────────────────────────────
//  GROUPS HUB — only updates UI, never rebinds events
// ─────────────────────────────────────────────────────────────
async function showGroupsHub() {
  console.log('[SplitTrack] showGroupsHub');
  hideAllScreens();
  showScreen('screen-groups');
  $('hub-username').textContent      = currentUser.name;
  $('hub-settings-name').textContent = currentUser.name;
  $('hub-upi').value                 = currentUser.upiId || '';
  await loadGroups();
}

// ─────────────────────────────────────────────────────────────
//  LOAD GROUPS
// ─────────────────────────────────────────────────────────────
async function loadGroups() {
  const stored = localStorage.getItem('splittrack_groups');
  allGroups = stored ? JSON.parse(stored) : [];

  if (IS_CONFIGURED) {
    try {
      const res = await sheetGet('readGroups');
      if (Array.isArray(res)) {
        res.forEach(g => {
          const members = parseMemberStr(g.members);
          if (members.includes(currentUser.name)) {
            const idx = allGroups.findIndex(lg => lg.groupId === g.groupId);
            if (idx === -1) allGroups.push({ ...g, members });
            else allGroups[idx] = { ...g, members };
          }
        });
        localStorage.setItem('splittrack_groups', JSON.stringify(allGroups));
      }
    } catch (e) { console.warn('[loadGroups] fetch failed, using cache', e); }
  }
  renderGroupsList();
}

function renderGroupsList() {
  const list = $('groups-list');
  list.innerHTML = '';
  const mine = allGroups.filter(g => {
    const m = Array.isArray(g.members) ? g.members : parseMemberStr(g.members);
    return m.includes(currentUser.name);
  });
  if (mine.length === 0) {
    list.innerHTML = `<div class="groups-empty">No groups yet. Create or join one!</div>`;
    return;
  }
  mine.forEach(group => {
    const members = Array.isArray(group.members) ? group.members : parseMemberStr(group.members);
    const card = document.createElement('div');
    card.className = 'group-card';
    card.innerHTML = `
      <div class="group-card-left">
        <div class="group-card-name">${escHtml(group.groupName)}</div>
        <div class="group-card-meta">${members.length} member${members.length !== 1 ? 's' : ''} &nbsp;·&nbsp; Code: <strong>${group.inviteCode}</strong></div>
      </div>
      <div class="group-card-right">→</div>`;
    card.addEventListener('click', () => enterGroup(group));
    list.appendChild(card);
  });
}

// ─────────────────────────────────────────────────────────────
//  CREATE GROUP
// ─────────────────────────────────────────────────────────────
async function doCreateGroup() {
  console.log('[doCreateGroup] called');
  const name = $('new-group-name').value.trim();
  console.log('[doCreateGroup] name:', name);
  if (!name) { showToast('Enter a group name', 'error'); return; }

  const group = {
    groupId:    'grp_' + Date.now(),
    groupName:  name,
    inviteCode: genInviteCode(name),
    members:    [currentUser.name],
    createdAt:  new Date().toISOString(),
  };
  console.log('[doCreateGroup] group object:', group);

  $('modal-create-group').classList.add('hidden');
  $('new-group-name').value = '';
  showLoader();

  try {
    if (IS_CONFIGURED) {
      const payload = {
        groupId:    group.groupId,
        groupName:  group.groupName,
        inviteCode: group.inviteCode,
        members:    group.members.join(','),
        createdAt:  group.createdAt,
      };
      console.log('[doCreateGroup] sending to sheet:', payload);
      const res = await sheetGet('createGroup', { data: encodeURIComponent(JSON.stringify(payload)) });
      console.log('[doCreateGroup] sheet response:', res);
      if (res && res.error) throw new Error(res.error);
    }
    allGroups.push(group);
    localStorage.setItem('splittrack_groups', JSON.stringify(allGroups));
    renderGroupsList();
    showToast('Group created! Code: ' + group.inviteCode, 'success');
    console.log('[doCreateGroup] SUCCESS, invite code:', group.inviteCode);
  } catch (e) {
    console.error('[doCreateGroup] ERROR:', e);
    showToast('Error: ' + e.message, 'error');
  } finally {
    hideLoader();
  }
}

// ─────────────────────────────────────────────────────────────
//  JOIN GROUP
// ─────────────────────────────────────────────────────────────
async function doJoinGroup() {
  console.log('[doJoinGroup] called');
  const code = $('join-code-input').value.trim().toUpperCase();
  console.log('[doJoinGroup] code:', code);
  if (!code) { showToast('Enter an invite code', 'error'); return; }

  $('modal-join-group').classList.add('hidden');
  $('join-code-input').value = '';
  showLoader();

  try {
    if (IS_CONFIGURED) {
      const payload = { inviteCode: code, memberName: currentUser.name };
      console.log('[doJoinGroup] sending:', payload);
      const res = await sheetGet('joinGroup', { data: encodeURIComponent(JSON.stringify(payload)) });
      console.log('[doJoinGroup] response:', res);
      if (!res.success) throw new Error(res.error || 'Invalid invite code');
      const members = parseMemberStr(res.members);
      const group = { groupId: res.groupId, groupName: res.groupName, inviteCode: code, members, createdAt: '' };
      const idx = allGroups.findIndex(g => g.groupId === group.groupId);
      if (idx === -1) allGroups.push(group); else allGroups[idx] = group;
      localStorage.setItem('splittrack_groups', JSON.stringify(allGroups));
      renderGroupsList();
      showToast('Joined "' + res.groupName + '"!', 'success');
    } else {
      const found = allGroups.find(g => g.inviteCode === code);
      if (!found) throw new Error('Code not found locally. Need network to join.');
      if (!found.members.includes(currentUser.name)) found.members.push(currentUser.name);
      localStorage.setItem('splittrack_groups', JSON.stringify(allGroups));
      renderGroupsList();
      showToast('Joined!', 'success');
    }
  } catch (e) {
    console.error('[doJoinGroup] ERROR:', e);
    showToast('Error: ' + e.message, 'error');
  } finally {
    hideLoader();
  }
}

// ─────────────────────────────────────────────────────────────
//  ENTER GROUP
// ─────────────────────────────────────────────────────────────
function enterGroup(group) {
  currentGroup = { ...group, members: Array.isArray(group.members) ? group.members : parseMemberStr(group.members) };
  showApp();
}

function showApp() {
  hideAllScreens();
  $('app').classList.remove('hidden');
  $('group-name-header').textContent  = currentGroup.groupName;
  $('group-members-count').textContent = currentGroup.members.length + ' members';
  $('user-badge').textContent          = currentUser.name;
  $('invite-code-display').textContent = currentGroup.inviteCode;
  renderMembersList();
  loadExpenses();
}

function renderMembersList() {
  const list = $('members-list');
  list.innerHTML = '';
  const colors = ['#e85d3a','#3a7bd5','#27ae60','#9b59b6','#f39c12','#16a085'];
  currentGroup.members.forEach((m, i) => {
    const item = document.createElement('div');
    item.className = 'member-item';
    item.innerHTML = `
      <div class="member-avatar" style="background:${colors[i%colors.length]}">${m[0].toUpperCase()}</div>
      <span class="member-name">${escHtml(m)}</span>
      ${m === currentUser.name ? '<span class="member-you">(you)</span>' : ''}`;
    list.appendChild(item);
  });
}

// ─────────────────────────────────────────────────────────────
//  LOAD EXPENSES
// ─────────────────────────────────────────────────────────────
async function loadExpenses() {
  showLoader();
  try {
    if (!IS_CONFIGURED) {
      expenses = JSON.parse(localStorage.getItem('splittrack_expenses_' + currentGroup.groupId) || '[]');
    } else {
      const data = await sheetGet('read', { groupId: encodeURIComponent(currentGroup.groupId) });
      if (!Array.isArray(data)) throw new Error('Expected array, got: ' + JSON.stringify(data).slice(0,80));
      expenses = data.map(sanitizeRow).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    renderExpenses();
    renderDashboard();
  } catch (err) {
    console.error('[loadExpenses]', err);
    expenses = JSON.parse(localStorage.getItem('splittrack_expenses_' + currentGroup.groupId) || '[]');
    renderExpenses();
    renderDashboard();
    showToast('Load error: ' + err.message, 'error');
  } finally {
    hideLoader();
  }
}

// ─────────────────────────────────────────────────────────────
//  ADD / EDIT MODAL
// ─────────────────────────────────────────────────────────────
function openAddModal() {
  editingId = null;
  $('expense-form').reset();
  $('edit-id').value             = '';
  $('modal-title').textContent   = 'Add Expense';
  $('submit-btn').textContent    = 'Save Expense';
  $('f-date').value              = today();
  $('paid-by-label').textContent = currentUser.name;
  renderSplitChips(currentGroup.members, currentGroup.members);
  $('modal-overlay').classList.remove('hidden');
}

function openEditModal(expense) {
  editingId                      = expense.expenseId;
  $('edit-id').value             = expense.expenseId;
  $('modal-title').textContent   = 'Edit Expense';
  $('submit-btn').textContent    = 'Update';
  $('f-amount').value            = expense.amount;
  $('f-desc').value              = expense.description;
  $('f-date').value              = expense.date;
  $('paid-by-label').textContent = expense.paidBy;
  const selected = expense.splitWith ? parseMemberStr(expense.splitWith) : currentGroup.members;
  renderSplitChips(currentGroup.members, selected);
  $('modal-overlay').classList.remove('hidden');
}

function closeExpenseModal() {
  $('modal-overlay').classList.add('hidden');
  $('expense-form').reset();
  editingId = null;
}

function renderSplitChips(members, selected) {
  const container = $('split-members');
  container.innerHTML = '';
  members.forEach(m => {
    const isSelected = selected.includes(m);
    const chip = document.createElement('label');
    chip.className = 'split-chip' + (isSelected ? ' checked' : '');
    chip.innerHTML = `
      <input type="checkbox" value="${escHtml(m)}" ${isSelected ? 'checked' : ''} />
      <span class="split-chip-dot"></span>${escHtml(m)}`;
    chip.querySelector('input').addEventListener('change', function() {
      chip.classList.toggle('checked', this.checked);
    });
    container.appendChild(chip);
  });
}

function getSelectedSplitMembers() {
  return [...$('split-members').querySelectorAll('input:checked')].map(i => i.value);
}

// ─────────────────────────────────────────────────────────────
//  FORM SUBMIT
// ─────────────────────────────────────────────────────────────
async function handleFormSubmit(e) {
  e.preventDefault();
  const amount      = parseFloat($('f-amount').value);
  const description = $('f-desc').value.trim();
  const date        = $('f-date').value;
  const splitWith   = getSelectedSplitMembers();

  if (!amount || !description || !date) { showToast('Fill in all fields', 'error'); return; }
  if (splitWith.length === 0) { showToast('Select at least one person', 'error'); return; }

  const now = new Date().toISOString();
  if (editingId) {
    const original = expenses.find(ex => ex.expenseId === editingId);
    await callSheet('edit', {
      expenseId:   editingId,
      groupId:     currentGroup.groupId,
      amount, description, date,
      paidBy:    original ? original.paidBy : currentUser.name,
      splitWith: splitWith.join(','),
      createdAt: original ? original.createdAt : now,
      updatedAt: now,
    });
  } else {
    const newExp = {
      expenseId: generateId(),
      groupId:   currentGroup.groupId,
      amount, description, date,
      paidBy:    currentUser.name,
      splitWith: splitWith.join(','),
      createdAt: now,
      updatedAt: now,
    };
    closeExpenseModal();
    expenses.unshift(newExp);
    renderExpenses();
    renderDashboard();
    await callSheet('add', newExp);
  }
}

// ─────────────────────────────────────────────────────────────
//  CALL SHEET
// ─────────────────────────────────────────────────────────────
async function callSheet(action, data) {
  closeExpenseModal();
  showLoader();
  if (!IS_CONFIGURED) {
    if (action === 'add')    expenses.unshift(data);
    else if (action === 'edit')   { const i = expenses.findIndex(e => e.expenseId === data.expenseId); if (i !== -1) expenses[i] = data; }
    else if (action === 'delete') expenses = expenses.filter(e => e.expenseId !== data.expenseId);
    localStorage.setItem('splittrack_expenses_' + currentGroup.groupId, JSON.stringify(expenses));
    renderExpenses(); renderDashboard();
    showToast(action === 'delete' ? 'Deleted!' : 'Saved!', 'success');
    hideLoader(); return;
  }
  try {
    const res = await sheetGet(action, { data: encodeURIComponent(JSON.stringify(data)) });
    if (res && res.error) throw new Error(res.error);
    await loadExpenses();
    showToast(action === 'delete' ? 'Deleted!' : 'Saved!', 'success');
  } catch (err) {
    console.error('[callSheet]', err);
    showToast('Error: ' + err.message, 'error');
    hideLoader();
  }
}

// ─────────────────────────────────────────────────────────────
//  RENDER EXPENSES
// ─────────────────────────────────────────────────────────────
function renderExpenses() {
  const tbody = $('expense-body');
  const cards = $('expense-cards');
  tbody.innerHTML = '';
  cards.innerHTML = '';

  if (!expenses || expenses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No expenses yet. Add one!</td></tr>`;
    cards.innerHTML = `<div class="expense-cards-empty">No expenses yet. Add one!</div>`;
    return;
  }

  const colors = ['#e85d3a','#3a7bd5','#27ae60','#9b59b6','#f39c12','#16a085'];
  expenses.forEach((exp, idx) => {
    const splitArr   = exp.splitWith ? parseMemberStr(exp.splitWith) : currentGroup.members;
    const splitLabel = splitArr.length === currentGroup.members.length ? 'Everyone' : splitArr.join(', ');
    const ci         = currentGroup.members.indexOf(exp.paidBy);
    const color      = colors[ci >= 0 ? ci % colors.length : 0];

    const tr = document.createElement('tr');
    tr.style.animationDelay = (idx * 0.03) + 's';
    tr.innerHTML = `
      <td>${formatDate(exp.date)}</td>
      <td>${escHtml(exp.description)}</td>
      <td><span class="paid-badge" style="background:${color}22;color:${color}">${escHtml(exp.paidBy)}</span></td>
      <td class="split-cell">${escHtml(splitLabel)}</td>
      <td class="amount-cell">₹${parseFloat(exp.amount||0).toFixed(2)}</td>
      <td><div class="actions-cell">
        <button class="btn-edit" data-id="${exp.expenseId}">Edit</button>
        <button class="btn-delete" data-id="${exp.expenseId}">Delete</button>
      </div></td>`;
    tbody.appendChild(tr);

    const card = document.createElement('div');
    card.className = 'expense-card';
    card.style.animationDelay = (idx * 0.04) + 's';
    card.innerHTML = `
      <div class="expense-card-top">
        <div class="expense-card-desc">${escHtml(exp.description)}</div>
        <div class="expense-card-amount">₹${parseFloat(exp.amount||0).toFixed(2)}</div>
      </div>
      <div class="expense-card-split">Split: ${escHtml(splitLabel)}</div>
      <div class="expense-card-bottom">
        <div class="expense-card-meta">
          <span class="expense-card-date">${formatDate(exp.date)}</span>
          <span class="paid-badge" style="background:${color}22;color:${color}">${escHtml(exp.paidBy)}</span>
        </div>
        <div class="expense-card-actions">
          <button class="btn-edit" data-id="${exp.expenseId}">Edit</button>
          <button class="btn-delete" data-id="${exp.expenseId}">Delete</button>
        </div>
      </div>`;
    cards.appendChild(card);
  });

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const exp = expenses.find(e => e.expenseId === btn.dataset.id);
      if (exp) openEditModal(exp);
    });
  });
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const exp = expenses.find(e => e.expenseId === btn.dataset.id);
      if (exp && confirm(`Delete "${exp.description}"?`))
        callSheet('delete', { expenseId: exp.expenseId, groupId: currentGroup.groupId });
    });
  });
}

// ─────────────────────────────────────────────────────────────
//  RENDER DASHBOARD
// ─────────────────────────────────────────────────────────────
function renderDashboard() {
  const members = currentGroup.members;
  const paid = {}, owed = {};
  members.forEach(m => { paid[m] = 0; owed[m] = 0; });

  expenses.forEach(exp => {
    const amount   = parseFloat(exp.amount || 0);
    const payer    = (exp.paidBy || '').trim();
    const splitArr = exp.splitWith ? parseMemberStr(exp.splitWith) : members;
    const share    = amount / (splitArr.length || 1);
    if (payer in paid) paid[payer] += amount;
    splitArr.forEach(m => { if (m in owed) owed[m] += share; });
  });

  const tripTotal = Object.values(paid).reduce((s, v) => s + v, 0);
  $('trip-total').textContent  = '₹' + tripTotal.toFixed(2);
  $('equal-share').textContent = '₹' + (owed[currentUser.name] || 0).toFixed(2);

  const grid = $('member-cards-grid');
  grid.innerHTML = '';
  const colors = ['#e85d3a','#3a7bd5','#27ae60','#9b59b6','#f39c12','#16a085'];
  members.forEach((m, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.setProperty('--delay', (i * 0.05) + 's');
    card.style.borderColor = colors[i % colors.length] + '33';
    card.innerHTML = `
      <div class="card-label" style="color:${colors[i%colors.length]}">${escHtml(m)}</div>
      <div class="card-value">₹${paid[m].toFixed(2)}</div>
      <div class="card-sub">paid</div>`;
    grid.appendChild(card);
  });

  const net = {};
  members.forEach(m => net[m] = (paid[m] || 0) - (owed[m] || 0));
  renderSettlements(calcSettlements(net));
}

function calcSettlements(net) {
  const creditors = [], debtors = [], results = [];
  Object.entries(net).forEach(([m, v]) => {
    if (v > 0.01)  creditors.push({ name: m, amount: v });
    if (v < -0.01) debtors.push({ name: m, amount: -v });
  });
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);
  let ci = 0, di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const t = Math.min(creditors[ci].amount, debtors[di].amount);
    if (t > 0.01) results.push({ from: debtors[di].name, to: creditors[ci].name, amount: t });
    creditors[ci].amount -= t;
    debtors[di].amount   -= t;
    if (creditors[ci].amount < 0.01) ci++;
    if (debtors[di].amount   < 0.01) di++;
  }
  return results;
}

function renderSettlements(settlements) {
  const container = $('settlements-container');
  container.innerHTML = '';
  if (settlements.length === 0) {
    container.innerHTML = `<div class="settlement-row settled"><div class="settlement-info"><div class="settlement-icon">✓</div><div class="settlement-text">All settled up!</div></div></div>`;
    return;
  }
  settlements.forEach(s => {
    const isMe = s.from === currentUser.name || s.to === currentUser.name;
    const row  = document.createElement('div');
    row.className = 'settlement-row owes';
    row.innerHTML = `
      <div class="settlement-info">
        <div class="settlement-icon">⚖</div>
        <div class="settlement-text">${escHtml(s.from)} owes ${escHtml(s.to)} ₹${s.amount.toFixed(2)}</div>
      </div>
      ${isMe ? `<button class="settle-btn" data-from="${escHtml(s.from)}" data-to="${escHtml(s.to)}" data-amount="${s.amount.toFixed(2)}">Settle 💸</button>` : ''}`;
    const btn = row.querySelector('.settle-btn');
    if (btn) btn.addEventListener('click', () => openSettleModal({ from: s.from, to: s.to, amount: s.amount }));
    container.appendChild(row);
  });
}

// ─────────────────────────────────────────────────────────────
//  SETTLE UP
// ─────────────────────────────────────────────────────────────
function openSettleModal(s) {
  pendingSettlement = s;
  const iAmPaying = s.from === currentUser.name;
  $('settle-summary').innerHTML = `
    <div class="settle-desc">${escHtml(s.from)} pays ${escHtml(s.to)}</div>
    <div class="settle-amount">₹${s.amount.toFixed(2)}</div>`;
  $('upi-label').textContent                = s.to + "'s UPI ID";
  $('settle-upi').value                     = '';
  $('upi-entry-group').style.display        = iAmPaying ? 'block' : 'none';
  $('confirm-settle-pay').style.display     = iAmPaying ? '' : 'none';
  $('settle-after').style.display           = iAmPaying ? 'none' : 'block';
  $('modal-settle').classList.remove('hidden');
}

function doSettlePay() {
  if (!pendingSettlement) return;
  const upiId = $('settle-upi').value.trim();
  if (!upiId) { showToast('Enter UPI ID', 'error'); return; }
  const amount = pendingSettlement.amount.toFixed(2);
  const note   = encodeURIComponent('SplitTrack: ' + pendingSettlement.from + ' to ' + pendingSettlement.to);
  window.location.href = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(pendingSettlement.to)}&am=${amount}&cu=INR&tn=${note}`;
  setTimeout(() => {
    $('upi-entry-group').style.display    = 'none';
    $('confirm-settle-pay').style.display = 'none';
    $('settle-after').style.display       = 'block';
  }, 1500);
}

async function doSettleClear() {
  if (!confirm('Archive all expenses and clear this group?')) return;
  $('modal-settle').classList.add('hidden');
  showLoader();
  try {
    if (IS_CONFIGURED) {
      await sheetGet('settle', { data: encodeURIComponent(JSON.stringify({ groupId: currentGroup.groupId })) });
    } else {
      localStorage.removeItem('splittrack_expenses_' + currentGroup.groupId);
    }
    expenses = [];
    renderExpenses();
    renderDashboard();
    showToast('Settled! All expenses cleared ✓', 'success');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  } finally {
    hideLoader();
  }
}

// ─────────────────────────────────────────────────────────────
//  SHEET API
// ─────────────────────────────────────────────────────────────
async function sheetGet(action, params = {}) {
  let url = CONFIG.APPS_SCRIPT_URL + '?action=' + encodeURIComponent(action);
  Object.entries(params).forEach(([k, v]) => { url += '&' + k + '=' + v; });
  console.log('[sheetGet]', action, url.slice(0, 200));
  const res  = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  console.log('[sheetGet] response:', text.slice(0, 200));
  try { return JSON.parse(text); }
  catch (e) { throw new Error('Bad JSON: ' + text.slice(0, 120)); }
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function showScreen(id)   { $(id).classList.remove('hidden'); }
function hideAllScreens() { ['screen-register','screen-groups','app'].forEach(id => $(id).classList.add('hidden')); }

function parseMemberStr(str) {
  if (Array.isArray(str)) return str;
  return String(str || '').split(',').map(s => s.trim()).filter(Boolean);
}
function sanitizeRow(row) {
  const c = {};
  for (const k in row) c[k.trim()] = typeof row[k] === 'string' ? row[k].trim() : row[k];
  return c;
}
function genInviteCode(name) {
  return name.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}
function generateId() { return 'exp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6); }
function today()      { return new Date().toISOString().split('T')[0]; }

function formatDate(str) {
  if (!str) return '';
  let d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str.trim())) {
    const [y, m, day] = str.trim().split('-').map(Number);
    d = new Date(y, m - 1, day);
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str.trim())) {
    const p = str.trim().split('/').map(Number);
    d = p[0] > 12 ? new Date(p[2], p[1]-1, p[0]) : new Date(p[2], p[0]-1, p[1]);
  } else { d = new Date(str); }
  if (!d || isNaN(d.getTime())) return str;
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' });
}

function applyTheme() {
  if (localStorage.getItem('splittrack_theme') === 'dark') document.body.classList.add('dark');
}
function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}

let loaderTimeout;
function showLoader() { loaderTimeout = setTimeout(() => $('loader').classList.remove('hidden'), 300); }
function hideLoader()  { clearTimeout(loaderTimeout); $('loader').classList.add('hidden'); }

let toastTimer;
function showToast(msg, type = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className   = 'toast ' + type + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}
