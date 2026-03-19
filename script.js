/**
 * SplitVise — Production v3 (Fixed)
 * Fix 1: Custom per-person exact amount splits
 * Fix 2: Settlement archives all group expenses and clears them
 */

// ─────────────────────────────────────────────────────────────
//  CONFIG
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
let settlements       = [];
let allGroups         = [];
let editingId         = null;
let pendingSettlement = null;

const $ = id => document.getElementById(id);

// LOCAL CACHE HELPERS
// All sheet data is mirrored to localStorage so the app works
// instantly on open and gracefully when offline.
const CACHE = {
  // Keys — group-scoped keys require currentGroup to be set
  expKey:      () => 'SplitVise_exp_' + (currentGroup ? currentGroup.groupId : ''),
  stlKey:      () => 'SplitVise_stl_' + (currentGroup ? currentGroup.groupId : ''),
  groupsKey:   'SplitVise_groups',

  // Groups (not group-scoped, safe to call anytime)
  saveGroups:  (d) => { try { localStorage.setItem(CACHE.groupsKey,   JSON.stringify(d)); } catch(e){} },
  loadGroups:  ()  => { try { return JSON.parse(localStorage.getItem(CACHE.groupsKey)   || '[]'); } catch(e){ return []; } },

  // Expenses & settlements (require currentGroup set)
  saveExpenses:    (d) => { try { localStorage.setItem(CACHE.expKey(), JSON.stringify(d)); } catch(e){} },
  saveSettlements: (d) => { try { localStorage.setItem(CACHE.stlKey(), JSON.stringify(d)); } catch(e){} },
  loadExpenses:    ()  => { try { return JSON.parse(localStorage.getItem(CACHE.expKey()) || '[]'); } catch(e){ return []; } },
  loadSettlements: ()  => { try { return JSON.parse(localStorage.getItem(CACHE.stlKey()) || '[]'); } catch(e){ return []; } },
};

// ─────────────────────────────────────────────────────────────
//  BOOT
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log('[SplitVise] Boot start');
  applyTheme();
  bindAllEvents();
  if (!IS_CONFIGURED) {
    $('setup-guide').classList.remove('hidden');
    return;
  }
  bootApp();
});

// ─────────────────────────────────────────────────────────────
//  BIND ALL EVENTS
// ─────────────────────────────────────────────────────────────
function bindAllEvents() {
  $('skip-setup').addEventListener('click', () => { $('setup-guide').classList.add('hidden'); bootApp(); });

  $('show-register').addEventListener('click', () => switchAuthTab('register'));
  $('show-login').addEventListener('click',    () => switchAuthTab('login'));
  $('btn-register').addEventListener('click',  doRegister);
  $('btn-login').addEventListener('click',     doLogin);
  $('auth-reg-name').addEventListener('keydown',  e => { if (e.key === 'Enter') doRegister(); });
  $('auth-reg-pass').addEventListener('keydown',  e => { if (e.key === 'Enter') doRegister(); });
  $('auth-login-name').addEventListener('keydown',e => { if (e.key === 'Enter') doLogin(); });
  $('auth-login-pass').addEventListener('keydown',e => { if (e.key === 'Enter') doLogin(); });

  $('hub-settings-btn').addEventListener('click', e => { e.stopPropagation(); $('hub-settings').classList.toggle('hidden'); });
  $('hub-settings-close').addEventListener('click', () => $('hub-settings').classList.add('hidden'));
  $('hub-settings').addEventListener('click', e => e.stopPropagation());
  $('hub-save-upi').addEventListener('click', doSaveUpi);
  $('hub-reset').addEventListener('click', () => { if (confirm('Logout and clear local data?')) { localStorage.clear(); location.reload(); } });
  document.addEventListener('click', () => $('hub-settings').classList.add('hidden'));

  $('btn-create-group').addEventListener('click', () => { $('new-group-name').value = ''; $('modal-create-group').classList.remove('hidden'); });
  $('confirm-create-group').addEventListener('click', doCreateGroup);
  $('new-group-name').addEventListener('keydown', e => { if (e.key === 'Enter') doCreateGroup(); });
  $('create-group-close').addEventListener('click',  () => $('modal-create-group').classList.add('hidden'));
  $('create-group-cancel').addEventListener('click', () => $('modal-create-group').classList.add('hidden'));
  $('modal-create-group').addEventListener('click',  e => { if (e.target === $('modal-create-group')) $('modal-create-group').classList.add('hidden'); });

  $('btn-join-group').addEventListener('click', () => { $('join-code-input').value = ''; $('modal-join-group').classList.remove('hidden'); });
  $('confirm-join-group').addEventListener('click', doJoinGroup);
  $('join-code-input').addEventListener('keydown', e => { if (e.key === 'Enter') doJoinGroup(); });
  $('join-group-close').addEventListener('click',  () => $('modal-join-group').classList.add('hidden'));
  $('join-group-cancel').addEventListener('click', () => $('modal-join-group').classList.add('hidden'));
  $('modal-join-group').addEventListener('click',  e => { if (e.target === $('modal-join-group')) $('modal-join-group').classList.add('hidden'); });

  $('back-btn').addEventListener('click', () => showGroupsHub());
  $('dark-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('SplitVise_theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });
  $('app-settings-btn').addEventListener('click', e => { e.stopPropagation(); $('app-settings-panel').classList.toggle('hidden'); });
  $('app-settings-close').addEventListener('click', () => $('app-settings-panel').classList.add('hidden'));
  $('app-settings-panel').addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', () => $('app-settings-panel').classList.add('hidden'));

  $('copy-invite-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(currentGroup.inviteCode)
      .then(() => showToast('Code copied!', 'success'))
      .catch(() => showToast('Code: ' + currentGroup.inviteCode));
  });
  $('share-invite-btn').addEventListener('click', () => {
    const msg = `Join my group "${currentGroup.groupName}" on SplitVise!\nInvite code: *${currentGroup.inviteCode}*`;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  });

  $('fab').addEventListener('click', openAddModal);
  $('refresh-btn').addEventListener('click', loadExpenses);
  $('modal-close').addEventListener('click', closeExpenseModal);
  $('cancel-btn').addEventListener('click', closeExpenseModal);
  $('modal-overlay').addEventListener('click', e => { if (e.target === $('modal-overlay')) closeExpenseModal(); });
  $('expense-form').addEventListener('submit', handleFormSubmit);

  $('settle-close').addEventListener('click',  () => $('modal-settle').classList.add('hidden'));
  $('settle-cancel').addEventListener('click', () => $('modal-settle').classList.add('hidden'));
  $('modal-settle').addEventListener('click',  e => { if (e.target === $('modal-settle')) $('modal-settle').classList.add('hidden'); });
  $('confirm-settle-pay').addEventListener('click', showQRPayment);
  $('confirm-settle-clear').addEventListener('click', doSettleClear);
}

// ─────────────────────────────────────────────────────────────
//  BOOT APP
// ─────────────────────────────────────────────────────────────
function bootApp() {
  const saved = localStorage.getItem('SplitVise_user');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.username) { currentUser = parsed; showGroupsHub(); return; }
    } catch (e) { /* fall through */ }
  }
  showScreen('screen-auth');
  switchAuthTab('login');
}

// ─────────────────────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────────────────────
function switchAuthTab(tab) {
  $('auth-register-panel').classList.toggle('hidden', tab !== 'register');
  $('auth-login-panel').classList.toggle('hidden',    tab !== 'login');
  $('show-register').classList.toggle('auth-tab-active', tab === 'register');
  $('show-login').classList.toggle('auth-tab-active',    tab === 'login');
}

async function doRegister() {
  const username = $('auth-reg-name').value.trim();
  const password = $('auth-reg-pass').value.trim();
  const upiId    = $('auth-reg-upi').value.trim();
  if (!username || !password) { showToast('Enter username and password', 'error'); return; }
  showLoader();
  try {
    if (IS_CONFIGURED) {
      const res = await sheetGet('register', { data: encodeURIComponent(JSON.stringify({ username, password, upiId })) });
      if (!res.success) throw new Error(res.error || 'Registration failed');
      currentUser = { userId: res.userId, username: res.username, upiId: res.upiId || '' };
    } else {
      currentUser = { userId: 'local_' + Date.now(), username, upiId };
    }
    localStorage.setItem('SplitVise_user', JSON.stringify(currentUser));
    showToast('Welcome, ' + currentUser.username + '!', 'success');
    showGroupsHub();
  } catch (e) { showToast(e.message, 'error'); }
  finally { hideLoader(); }
}

async function doLogin() {
  const username = $('auth-login-name').value.trim();
  const password = $('auth-login-pass').value.trim();
  if (!username || !password) { showToast('Enter username and password', 'error'); return; }
  showLoader();
  try {
    if (IS_CONFIGURED) {
      const res = await sheetGet('login', { data: encodeURIComponent(JSON.stringify({ username, password })) });
      if (!res.success) throw new Error(res.error || 'Login failed');
      currentUser = { userId: res.userId, username: res.username, upiId: res.upiId || '' };
    } else {
      currentUser = { userId: 'local_' + Date.now(), username, upiId: '' };
    }
    localStorage.setItem('SplitVise_user', JSON.stringify(currentUser));
    showToast('Welcome back, ' + currentUser.username + '!', 'success');
    showGroupsHub();
  } catch (e) { showToast(e.message, 'error'); }
  finally { hideLoader(); }
}

async function doSaveUpi() {
  const upiId = $('hub-upi').value.trim();
  currentUser.upiId = upiId;
  localStorage.setItem('SplitVise_user', JSON.stringify(currentUser));
  if (IS_CONFIGURED && currentUser.userId) {
    try { await sheetGet('updateUpi', { data: encodeURIComponent(JSON.stringify({ userId: currentUser.userId, upiId })) }); }
    catch (e) { /* non-critical */ }
  }
  showToast('UPI ID saved!', 'success');
  $('hub-settings').classList.add('hidden');
}

// ─────────────────────────────────────────────────────────────
//  GROUPS HUB
// ─────────────────────────────────────────────────────────────
async function showGroupsHub() {
  hideAllScreens();
  showScreen('screen-groups');
  $('hub-username').textContent      = currentUser.username;
  $('hub-settings-name').textContent = currentUser.username;
  $('hub-upi').value                 = currentUser.upiId || '';
  await loadGroups();
}

async function loadGroups() {
  // Show cached groups instantly
  allGroups = CACHE.loadGroups();
  renderGroupsList();

  if (!IS_CONFIGURED) return;

  // Sync from sheet in background
  try {
    const res = await sheetGet('readGroups');
    if (Array.isArray(res)) {
      res.forEach(g => {
        const members = parseMemberStr(g.members);
        if (members.includes(currentUser.username)) {
          const idx = allGroups.findIndex(lg => lg.groupId === g.groupId);
          if (idx === -1) allGroups.push({ ...g, members });
          else allGroups[idx] = { ...g, members };
        }
      });
      CACHE.saveGroups(allGroups);
      renderGroupsList();
    }
  } catch (e) {
    console.warn('[loadGroups] offline, using cache', e);
  }
}

function renderGroupsList() {
  const list = $('groups-list');
  list.innerHTML = '';
  const mine = allGroups.filter(g => {
    const m = Array.isArray(g.members) ? g.members : parseMemberStr(g.members);
    return m.includes(currentUser.username);
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

async function doCreateGroup() {
  const name = $('new-group-name').value.trim();
  if (!name) { showToast('Enter a group name', 'error'); return; }
  const group = {
    groupId:    'grp_' + Date.now(),
    groupName:  name,
    inviteCode: genInviteCode(name),
    members:    [currentUser.username],
    createdAt:  new Date().toISOString(),
  };
  $('modal-create-group').classList.add('hidden');
  $('new-group-name').value = '';
  showLoader();
  try {
    if (IS_CONFIGURED) {
      const res = await sheetGet('createGroup', { data: encodeURIComponent(JSON.stringify({ ...group, members: group.members.join(',') })) });
      if (res && res.error) throw new Error(res.error);
    }
    allGroups.push(group);
    CACHE.saveGroups(allGroups);
    renderGroupsList();
    showToast('Group created! Code: ' + group.inviteCode, 'success');
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
  finally { hideLoader(); }
}

async function doJoinGroup() {
  const code = $('join-code-input').value.trim().toUpperCase();
  if (!code) { showToast('Enter an invite code', 'error'); return; }
  $('modal-join-group').classList.add('hidden');
  $('join-code-input').value = '';
  showLoader();
  try {
    if (IS_CONFIGURED) {
      const res = await sheetGet('joinGroup', { data: encodeURIComponent(JSON.stringify({ inviteCode: code, memberName: currentUser.username })) });
      if (!res.success) throw new Error(res.error || 'Invalid invite code');
      const members = parseMemberStr(res.members);
      const group = { groupId: res.groupId, groupName: res.groupName, inviteCode: code, members, createdAt: '' };
      const idx = allGroups.findIndex(g => g.groupId === group.groupId);
      if (idx === -1) allGroups.push(group); else allGroups[idx] = group;
      CACHE.saveGroups(allGroups);
      renderGroupsList();
      showToast('Joined "' + res.groupName + '"!', 'success');
    } else {
      const found = allGroups.find(g => g.inviteCode === code);
      if (!found) throw new Error('Code not found locally');
      if (!found.members.includes(currentUser.username)) found.members.push(currentUser.username);
      CACHE.saveGroups(allGroups);
      renderGroupsList();
      showToast('Joined!', 'success');
    }
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
  finally { hideLoader(); }
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
  $('group-name-header').textContent   = currentGroup.groupName;
  $('group-members-count').textContent = currentGroup.members.length + ' members';
  $('user-badge').textContent          = currentUser.username;
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
      ${m === currentUser.username ? '<span class="member-you">(you)</span>' : ''}`;
    list.appendChild(item);
  });
}

// ─────────────────────────────────────────────────────────────
//  LOAD EXPENSES + SETTLEMENTS
// ─────────────────────────────────────────────────────────────

async function loadExpenses() {
  // Step 1: show cached data instantly (zero wait)
  const cachedExp = CACHE.loadExpenses();
  const cachedStl = CACHE.loadSettlements();
  const hasCache  = cachedExp.length > 0 || cachedStl.length > 0;
  if (hasCache) {
    expenses    = cachedExp;
    settlements = cachedStl;
    renderExpenses();
    renderDashboard();
  }

  // Step 2: sync from sheet
  if (!IS_CONFIGURED) {
    // Pure local mode
    if (!hasCache) { expenses = []; settlements = []; renderExpenses(); renderDashboard(); }
    return;
  }

  if (!hasCache) showLoader(); // only block UI on very first load

  try {
    const [expData, settleData] = await Promise.all([
      sheetGet('read',            { groupId: encodeURIComponent(currentGroup.groupId) }),
      sheetGet('readSettlements', { groupId: encodeURIComponent(currentGroup.groupId) }),
    ]);
    if (!Array.isArray(expData)) throw new Error('Bad response for expenses');

    expenses    = expData.map(sanitizeRow).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    settlements = Array.isArray(settleData) ? settleData.map(sanitizeRow) : [];

    // Persist fresh data to cache
    CACHE.saveExpenses(expenses);
    CACHE.saveSettlements(settlements);

    renderExpenses();
    renderDashboard();
  } catch (err) {
    console.error('[loadExpenses]', err);
    if (hasCache) {
      showToast('Offline — showing cached data', '');
    } else {
      showToast('Load error: ' + err.message, 'error');
    }
  } finally {
    hideLoader();
  }
}

// ─────────────────────────────────────────────────────────────
//  FIX 1: CUSTOM SPLIT HELPERS
//
//  splitWith field can now be either:
//    "A,B,C"                          → equal split (old format, backward compat)
//    {"A":200,"B":250,"C":250}        → custom exact amounts (JSON string)
// ─────────────────────────────────────────────────────────────

/**
 * Parse splitWith string → returns either:
 *   { type: 'equal', members: [...] }
 *   { type: 'custom', splits: { name: amount, ... } }
 */
function parseSplitWith(splitWithStr, fallbackMembers) {
  if (!splitWithStr) return { type: 'equal', members: fallbackMembers || [] };
  const trimmed = splitWithStr.trim();
  if (trimmed.startsWith('{')) {
    try {
      const splits = JSON.parse(trimmed);
      return { type: 'custom', splits };
    } catch (e) { /* fall through to equal */ }
  }
  return { type: 'equal', members: parseMemberStr(trimmed) };
}

/**
 * Calculate each member's owed share from an expense.
 * Returns { memberName: amountOwed }
 */
function calcOwedPerMember(exp, allMembers) {
  const amount = parseFloat(exp.amount || 0);
  const parsed = parseSplitWith(exp.splitWith, allMembers);
  const result = {};
  allMembers.forEach(m => result[m] = 0);

  if (parsed.type === 'custom') {
    Object.entries(parsed.splits).forEach(([name, amt]) => {
      if (name in result) result[name] = parseFloat(amt) || 0;
    });
  } else {
    const members = parsed.members.length ? parsed.members : allMembers;
    const share = amount / members.length;
    members.forEach(m => { if (m in result) result[m] = share; });
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
//  EXPENSE MODAL
// ─────────────────────────────────────────────────────────────
function openAddModal() {
  editingId = null;
  $('expense-form').reset();
  $('edit-id').value             = '';
  $('modal-title').textContent   = 'Add Expense';
  $('submit-btn').textContent    = 'Save Expense';
  $('f-date').value              = today();
  $('paid-by-label').textContent = currentUser.username;
  renderSplitChips(currentGroup.members, currentGroup.members, null);
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

  const parsed = parseSplitWith(expense.splitWith, currentGroup.members);
  if (parsed.type === 'custom') {
    const selectedMembers = Object.keys(parsed.splits);
    renderSplitChips(currentGroup.members, selectedMembers, parsed.splits);
  } else {
    const selected = parsed.members.length ? parsed.members : currentGroup.members;
    renderSplitChips(currentGroup.members, selected, null);
  }
  $('modal-overlay').classList.remove('hidden');
}

function closeExpenseModal() {
  $('modal-overlay').classList.add('hidden');
  $('expense-form').reset();
  editingId = null;
}

/**
 * Render split chips with optional custom amount inputs.
 * @param {string[]} members       - all group members
 * @param {string[]} selected      - pre-selected members
 * @param {object|null} customAmts - { name: amount } if editing a custom split
 */
function renderSplitChips(members, selected, customAmts) {
  const container = $('split-members');
  container.innerHTML = '';

  // ── CRITICAL: override the .split-members flex-wrap so our children
  //    layout correctly (column for the whole section wrapper) ──
  container.style.cssText = 'display:flex; flex-direction:column; gap:0; width:100%;';

  const isCustom = !!customAmts;

  // ── 1. Toggle row ──
  const toggleRow = document.createElement('div');
  toggleRow.style.cssText = 'width:100%; margin-bottom:10px;';
  const label = document.createElement('label');
  label.id        = 'advanced-split-label';
  label.style.cssText = 'display:inline-flex; align-items:center; gap:9px; cursor:pointer; user-select:none; white-space:nowrap;';
  if (isCustom) label.classList.add('toggle-on');

  const hiddenCb = document.createElement('input');
  hiddenCb.type    = 'checkbox';
  hiddenCb.id      = 'advanced-split-toggle';
  hiddenCb.checked = isCustom;
  hiddenCb.style.cssText = 'position:absolute;opacity:0;width:0;height:0;pointer-events:none;';

  const track = document.createElement('span');
  track.className = 'split-toggle-track';
  track.style.cssText = 'flex-shrink:0;';
  const thumb = document.createElement('span');
  thumb.className = 'split-toggle-thumb';
  track.appendChild(thumb);

  // Apply initial visual state directly via JS (bypasses all CSS selector issues)
  function setToggleVisual(on) {
    track.style.background    = on ? 'var(--accent2)' : 'var(--border2)';
    track.style.borderColor   = on ? 'var(--accent2)' : 'var(--border2)';
    thumb.style.transform     = on ? 'translateX(18px)' : 'translateX(0)';
  }
  // Ensure thumb always has transition set
  thumb.style.cssText = 'position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.22);transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1);pointer-events:none;';
  track.style.cssText = 'flex-shrink:0;display:inline-block;width:40px;height:22px;border-radius:100px;border:1.5px solid;position:relative;transition:background 0.22s ease,border-color 0.22s ease;cursor:pointer;';
  setToggleVisual(isCustom);

  const txt = document.createElement('span');
  txt.className = 'split-toggle-text';
  txt.innerHTML = 'Custom amounts <span style="font-weight:400;color:var(--text3)">(optional)</span>';

  label.appendChild(hiddenCb);
  label.appendChild(track);
  label.appendChild(txt);
  toggleRow.appendChild(label);
  container.appendChild(toggleRow);

  // ── 2. Mode hint ──
  const hint = document.createElement('p');
  hint.id        = 'split-mode-hint';
  hint.className = 'split-mode-hint';
  hint.textContent = isCustom ? 'Enter exact amount each person owes' : 'Total will be split equally among selected';
  container.appendChild(hint);

  // ── 3. Chips wrapper — layout changes per mode ──
  const chipsWrap = document.createElement('div');
  chipsWrap.id = 'split-chips-wrap';
  container.appendChild(chipsWrap);

  // ── 4. Validation hint ──
  const validationHint = document.createElement('p');
  validationHint.id        = 'split-validation-hint';
  validationHint.className = 'split-validation-hint hidden';
  container.appendChild(validationHint);

  // ── rebuild: renders chips in correct mode layout ──
  function rebuildChips(useCustom) {
    chipsWrap.innerHTML = '';

    if (useCustom) {
      // Column layout: each row = chip + amount input
      chipsWrap.style.cssText = 'display:flex; flex-direction:column; gap:8px; width:100%;';
    } else {
      // Row wrap layout: chips flow like original
      chipsWrap.style.cssText = 'display:flex; flex-direction:row; flex-wrap:wrap; gap:8px; width:100%;';
    }

    hint.textContent = useCustom ? 'Enter exact amount each person owes' : 'Total will be split equally among selected';

    members.forEach(m => {
      const isSel = selected.includes(m);

      if (useCustom) {
        // ── Custom mode row ──
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; align-items:center; gap:8px; width:100%;';
        row.dataset.member = m;

        const savedAmt = customAmts && customAmts[m] != null ? customAmts[m] : '';

        const chip = document.createElement('label');
        chip.className = 'split-chip' + (isSel ? ' checked' : '');
        chip.style.cssText = 'flex:1; min-width:0; justify-content:flex-start;';
        chip.innerHTML = `<input type="checkbox" value="${escHtml(m)}" ${isSel ? 'checked' : ''} /><span class="split-chip-dot"></span>${escHtml(m)}`;

        const amtWrap = document.createElement('div');
        amtWrap.className = 'split-amount-input-wrap' + (isSel ? '' : ' hidden');
        amtWrap.innerHTML = `<span class="split-amt-prefix">₹</span><input type="number" class="split-amount-input" data-member="${escHtml(m)}" placeholder="0.00" min="0" step="0.01" value="${escHtml(String(savedAmt))}" inputmode="decimal" />`;

        const cb = chip.querySelector('input');
        cb.addEventListener('change', function () {
          chip.classList.toggle('checked', this.checked);
          amtWrap.classList.toggle('hidden', !this.checked);
          if (!this.checked) amtWrap.querySelector('input').value = '';
          validateCustomAmounts();
        });
        amtWrap.querySelector('input').addEventListener('input', validateCustomAmounts);

        row.appendChild(chip);
        row.appendChild(amtWrap);
        chipsWrap.appendChild(row);

      } else {
        // ── Equal mode: plain pill chip, no wrapper div needed ──
        const chip = document.createElement('label');
        chip.className = 'split-chip' + (isSel ? ' checked' : '');
        chip.innerHTML = `<input type="checkbox" value="${escHtml(m)}" ${isSel ? 'checked' : ''} /><span class="split-chip-dot"></span>${escHtml(m)}`;
        const cb = chip.querySelector('input');
        cb.addEventListener('change', function () {
          chip.classList.toggle('checked', this.checked);
        });
        chipsWrap.appendChild(chip);
      }
    });
  }

  rebuildChips(isCustom);

  // ── Wire toggle ──
  hiddenCb.addEventListener('change', function () {
    setToggleVisual(this.checked);
    label.classList.toggle('toggle-on', this.checked);
    const nowSelected = [...chipsWrap.querySelectorAll('input[type=checkbox]:checked')].map(i => i.value);
    selected   = nowSelected.length ? nowSelected : members;
    customAmts = null;
    rebuildChips(this.checked);
  });
}

function isAdvancedSplit() {
  const toggle = document.getElementById('advanced-split-toggle');
  return toggle && toggle.checked;
}

/**
 * Validate that custom amounts sum to the total expense amount.
 * Shows inline hint. Returns true if valid.
 */
function validateCustomAmounts() {
  const total      = parseFloat($('f-amount').value) || 0;
  const hint       = $('split-validation-hint');
  if (!isAdvancedSplit() || total === 0) { hint.classList.add('hidden'); return true; }

  const inputs = document.querySelectorAll(".split-amount-input");
  let enteredSum = 0;
  inputs.forEach(inp => {
    if (!inp.closest(".split-amount-input-wrap").classList.contains("hidden")) {
      enteredSum += parseFloat(inp.value) || 0;
    }
  });

  const diff = Math.abs(enteredSum - total);
  if (diff < 0.01) {
    hint.textContent = '✓ Amounts match total';
    hint.className   = 'split-validation-hint valid';
  } else if (enteredSum > total) {
    hint.textContent = `⚠ Amounts exceed total by ₹${(enteredSum - total).toFixed(2)}`;
    hint.className   = 'split-validation-hint invalid';
  } else {
    hint.textContent = `₹${enteredSum.toFixed(2)} entered of ₹${total.toFixed(2)} — ₹${(total - enteredSum).toFixed(2)} remaining`;
    hint.className   = 'split-validation-hint partial';
  }
  hint.classList.remove('hidden');
  return diff < 0.01;
}

/**
 * Get split data from the modal form.
 * Returns { splitWithStr, isCustom }
 */
function getSplitData() {
  if (isAdvancedSplit()) {
    const splits = {};
    // Each amount input has data-member; only collect ones whose wrap is visible (checked)
    document.querySelectorAll('.split-amount-input').forEach(inp => {
      const wrap = inp.closest('.split-amount-input-wrap');
      if (wrap && !wrap.classList.contains('hidden')) {
        const member = inp.dataset.member;
        if (member) splits[member] = parseFloat(inp.value) || 0;
      }
    });
    return { splitWithStr: JSON.stringify(splits), isCustom: true, splits };
  } else {
    const members = [...$('split-chips-wrap').querySelectorAll('input[type=checkbox]:checked')].map(i => i.value);
    return { splitWithStr: members.join(','), isCustom: false, members };
  }
}

// ─────────────────────────────────────────────────────────────
//  FORM SUBMIT
// ─────────────────────────────────────────────────────────────
async function handleFormSubmit(e) {
  e.preventDefault();
  const amount = parseFloat($('f-amount').value);
  const desc   = $('f-desc').value.trim();
  const date   = $('f-date').value;
  if (!amount || !desc || !date) { showToast('Fill in all fields', 'error'); return; }

  const { splitWithStr, isCustom, splits, members } = getSplitData();

  // Validate: at least one person selected
  if (isCustom) {
    if (Object.keys(splits).length === 0) { showToast('Select at least one person', 'error'); return; }
    // Validate amounts sum to total
    const sum  = Object.values(splits).reduce((s, v) => s + v, 0);
    const diff = Math.abs(sum - amount);
    if (diff > 0.01) {
      showToast(`Amounts must sum to ₹${amount.toFixed(2)} (currently ₹${sum.toFixed(2)})`, 'error');
      return;
    }
  } else {
    if (!members || members.length === 0) { showToast('Select at least one person', 'error'); return; }
  }

  const now = new Date().toISOString();
  if (editingId) {
    const orig = expenses.find(ex => ex.expenseId === editingId);
    await callSheet('edit', {
      expenseId:   editingId,
      groupId:     currentGroup.groupId,
      amount,
      description: desc,
      date,
      paidBy:      orig ? orig.paidBy : currentUser.username,
      splitWith:   splitWithStr,
      createdAt:   orig ? orig.createdAt : now,
      updatedAt:   now,
    });
  } else {
    const newExp = {
      expenseId:   generateId(),
      groupId:     currentGroup.groupId,
      amount,
      description: desc,
      date,
      paidBy:      currentUser.username,
      splitWith:   splitWithStr,
      createdAt:   now,
      updatedAt:   now,
    };
    closeExpenseModal();
    expenses.unshift(newExp);
    renderExpenses();
    renderDashboard();
    await callSheet('add', newExp);
  }
}

async function callSheet(action, data) {
  closeExpenseModal();

  // Optimistic local update first — UI responds instantly
  if (action === 'add')    { expenses.unshift(data); }
  else if (action === 'edit')   { const i = expenses.findIndex(e => e.expenseId === data.expenseId); if (i !== -1) expenses[i] = data; }
  else if (action === 'delete') { expenses = expenses.filter(e => e.expenseId !== data.expenseId); }
  CACHE.saveExpenses(expenses);
  renderExpenses();
  renderDashboard();

  if (!IS_CONFIGURED) {
    showToast(action === 'delete' ? 'Deleted!' : 'Saved!', 'success');
    return;
  }

  // Then sync to sheet in background
  showLoader();
  try {
    const res = await sheetGet(action, { data: encodeURIComponent(JSON.stringify(data)) });
    if (res && res.error) throw new Error(res.error);
    // Fetch canonical data from sheet and refresh cache
    await loadExpenses();
    showToast(action === 'delete' ? 'Deleted!' : 'Saved!', 'success');
  } catch (err) {
    console.error('[callSheet]', err);
    showToast('Saved locally. Sync failed: ' + err.message, 'error');
    hideLoader();
  }
}

// ─────────────────────────────────────────────────────────────
//  RENDER EXPENSES
// ─────────────────────────────────────────────────────────────

/** Human-readable label for the split column */
function splitLabel(exp) {
  const parsed = parseSplitWith(exp.splitWith, currentGroup.members);
  if (parsed.type === 'custom') {
    const entries = Object.entries(parsed.splits);
    if (entries.length === 0) return 'No one';
    // Show each person's amount
    return entries.map(([name, amt]) => `${name}: ₹${parseFloat(amt).toFixed(0)}`).join(' · ');
  }
  const mems = parsed.members;
  return mems.length === currentGroup.members.length ? 'Everyone (equal)' : mems.join(', ') + ' (equal)';
}

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
    const label = splitLabel(exp);
    const ci    = currentGroup.members.indexOf(exp.paidBy);
    const color = colors[ci >= 0 ? ci % colors.length : 0];

    const tr = document.createElement('tr');
    tr.style.animationDelay = (idx * 0.03) + 's';
    tr.innerHTML = `
      <td>${formatDate(exp.date)}</td>
      <td>${escHtml(exp.description)}</td>
      <td><span class="paid-badge" style="background:${color}22;color:${color}">${escHtml(exp.paidBy)}</span></td>
      <td class="split-cell">${escHtml(label)}</td>
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
      <div class="expense-card-split">Split: ${escHtml(label)}</div>
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
    btn.addEventListener('click', () => { const exp = expenses.find(e => e.expenseId === btn.dataset.id); if (exp) openEditModal(exp); });
  });
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const exp = expenses.find(e => e.expenseId === btn.dataset.id);
      if (exp && confirm(`Delete "${exp.description}"?`)) callSheet('delete', { expenseId: exp.expenseId, groupId: currentGroup.groupId });
    });
  });
}

// ─────────────────────────────────────────────────────────────
//  RENDER DASHBOARD  (FIX: uses calcOwedPerMember)
// ─────────────────────────────────────────────────────────────
function renderDashboard() {
  const members = currentGroup.members;
  const paid = {}, owed = {};
  members.forEach(m => { paid[m] = 0; owed[m] = 0; });

  expenses.forEach(exp => {
    const amount = parseFloat(exp.amount || 0);
    const payer  = (exp.paidBy || '').trim();
    if (payer in paid) paid[payer] += amount;

    // FIX: use per-member owed amounts (handles both equal & custom splits)
    const owedMap = calcOwedPerMember(exp, members);
    members.forEach(m => { owed[m] += owedMap[m] || 0; });
  });

  const tripTotal = Object.values(paid).reduce((s, v) => s + v, 0);
  $('trip-total').textContent  = '₹' + tripTotal.toFixed(2);
  $('equal-share').textContent = '₹' + (owed[currentUser.username] || 0).toFixed(2);

  const grid = $('member-cards-grid');
  grid.innerHTML = '';
  const colors = ['#e85d3a','#3a7bd5','#27ae60','#9b59b6','#f39c12','#16a085'];
  members.forEach((m, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.setProperty('--delay', (i * 0.05) + 's');
    card.style.borderColor = colors[i % colors.length] + '33';
    card.innerHTML = `<div class="card-label" style="color:${colors[i%colors.length]}">${escHtml(m)}</div><div class="card-value">₹${paid[m].toFixed(2)}</div><div class="card-sub">paid</div>`;
    grid.appendChild(card);
  });

  const net = {};
  members.forEach(m => net[m] = (paid[m] || 0) - (owed[m] || 0));
  settlements.forEach(s => {
    const amt  = parseFloat(s.amount || 0);
    const from = (s.fromUser || '').trim();
    const to   = (s.toUser   || '').trim();
    if (from in net) net[from] += amt;
    if (to   in net) net[to]   -= amt;
  });
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

function renderSettlements(list) {
  const container = $('settlements-container');
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = `<div class="settlement-row settled"><div class="settlement-info"><div class="settlement-icon">✓</div><div class="settlement-text">All settled up!</div></div></div>`;
    return;
  }
  list.forEach(s => {
    const iAmPayer = s.from === currentUser.username;
    const row = document.createElement('div');
    row.className = 'settlement-row owes';
    row.innerHTML = `
      <div class="settlement-info">
        <div class="settlement-icon">⚖</div>
        <div class="settlement-text">${escHtml(s.from)} owes ${escHtml(s.to)} ₹${s.amount.toFixed(2)}</div>
      </div>
      ${iAmPayer ? `<button class="settle-btn" data-from="${escHtml(s.from)}" data-to="${escHtml(s.to)}" data-amount="${s.amount.toFixed(2)}">Pay 💸</button>` : ''}`;
    const btn = row.querySelector('.settle-btn');
    if (btn) btn.addEventListener('click', () => openSettleModal({ from: s.from, to: s.to, amount: s.amount }));
    container.appendChild(row);
  });
}

// ─────────────────────────────────────────────────────────────
//  SETTLE MODAL
// ─────────────────────────────────────────────────────────────
async function openSettleModal(s) {
  pendingSettlement = s;
  $('settle-summary').innerHTML = `
    <div class="settle-desc">You pay <strong>${escHtml(s.to)}</strong></div>
    <div class="settle-amount">₹${s.amount.toFixed(2)}</div>`;
  $('upi-label').textContent                = s.to + "'s UPI ID";
  $('settle-upi').value                     = '';
  $('settle-upi-hint').textContent          = 'Looking up UPI...';
  $('upi-entry-group').style.display        = 'block';
  $('confirm-settle-pay').style.display     = '';
  $('settle-after').style.display           = 'none';
  $('upi-pay-link-container').style.display = 'none';
  $('upi-pay-link-container').innerHTML     = '';
  $('modal-settle').classList.remove('hidden');
  try {
    if (IS_CONFIGURED) {
      const res = await sheetGet('getUserUpi', { data: encodeURIComponent(JSON.stringify({ username: s.to })) });
      if (res.success && res.upiId) {
        $('settle-upi').value = res.upiId;
        $('settle-upi-hint').textContent = 'UPI auto-filled ✓ Verify before paying';
      } else {
        $('settle-upi-hint').textContent = s.to + ' has no UPI saved. Enter manually.';
      }
    }
  } catch (e) {
    $('settle-upi-hint').textContent = 'Could not fetch UPI. Enter manually.';
  }
}

// ─────────────────────────────────────────────────────────────
//  QR PAYMENT
// ─────────────────────────────────────────────────────────────
function showQRPayment() {
  if (!pendingSettlement) return;
  const upiId = $('settle-upi').value.trim();
  if (!upiId) { showToast('Enter UPI ID to pay', 'error'); return; }

  const amount = pendingSettlement.amount.toFixed(2);
  const to     = pendingSettlement.to;
  const from   = pendingSettlement.from;
  const note   = 'SplitVise: ' + from + ' to ' + to;

  const upiUrl = 'upi://pay?pa=' + encodeURIComponent(upiId)
    + '&pn=' + encodeURIComponent(to)
    + '&am=' + amount
    + '&cu=INR'
    + '&tn=' + encodeURIComponent(note);

  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data='
    + encodeURIComponent(upiUrl) + '&format=png&margin=10';

  $('upi-entry-group').style.display        = 'none';
  $('confirm-settle-pay').style.display     = 'none';
  $('upi-pay-link-container').style.display = 'block';

  $('upi-pay-link-container').innerHTML = `
    <div class="qr-payment-card">
      <p class="qr-title">Pay ₹${escHtml(amount)} to ${escHtml(to)}</p>
      <p class="qr-note">${escHtml(note)}</p>
      <div class="qr-box">
        <img src="${qrUrl}" alt="UPI QR Code" width="220" height="220"
             onerror="this.src='https://quickchart.io/qr?text=${encodeURIComponent(upiUrl)}&size=220';this.onerror=function(){this.parentElement.innerHTML='<p style=color:#e85d3a;font-size:13px;padding:20px>QR unavailable.<br>Use UPI ID below.</p>';}"/>
      </div>
      <p class="qr-scan-hint">📱 Scan with GPay, PhonePe, Paytm or BHIM<br>Amount is pre-filled in the app</p>
      <div class="qr-divider">
        <div class="qr-divider-line"></div>
        <span class="qr-divider-text">or pay by UPI ID</span>
        <div class="qr-divider-line"></div>
      </div>
      <div class="qr-upi-box">${escHtml(upiId)}</div>
      <button class="qr-copy-btn" id="qr-copy-upi-btn">📋 Copy UPI ID</button>
      <div class="qr-details">
        <div class="qr-detail-row"><span>Amount</span><span class="qr-detail-val">₹${escHtml(amount)}</span></div>
        <div class="qr-detail-row"><span>Pay To</span><span class="qr-detail-val">${escHtml(upiId)}</span></div>
        <div class="qr-detail-row"><span>Note</span><span class="qr-detail-val">${escHtml(note)}</span></div>
      </div>
      <p class="qr-paid-hint">After paying, tap below to record it:</p>
      <button class="qr-paid-btn" id="qr-paid-btn">✓ I Have Paid — Mark as Settled</button>
    </div>`;

  document.getElementById('qr-copy-upi-btn').addEventListener('click', () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(upiId)
        .then(() => showToast('UPI ID copied! Open GPay/PhonePe and pay', 'success'))
        .catch(() => fallbackCopy(upiId));
    } else {
      fallbackCopy(upiId);
    }
  });

  document.getElementById('qr-paid-btn').addEventListener('click', () => {
    $('settle-after').style.display           = 'block';
    $('upi-pay-link-container').style.display = 'none';
  });
}

function fallbackCopy(text) {
  const el = document.createElement('textarea');
  el.value = text;
  el.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
  document.body.appendChild(el);
  el.select();
  try { document.execCommand('copy'); showToast('UPI ID copied!', 'success'); }
  catch (e) { showToast('Copy failed. UPI: ' + text); }
  document.body.removeChild(el);
}

// ─────────────────────────────────────────────────────────────
//  SETTLEMENT — record payment, archive only when fully settled
//
//  Each "Pay 💸" records just that one payment.
//  Archiving happens only when net balances for ALL members = 0.
// ─────────────────────────────────────────────────────────────
async function doSettleClear() {
  if (!pendingSettlement) return;
  if (!confirm(
    `Mark ₹${pendingSettlement.amount.toFixed(2)} payment from ${pendingSettlement.from} to ${pendingSettlement.to} as done?`
  )) return;

  $('modal-settle').classList.add('hidden');
  showLoader();

  const record = {
    settlementId: 'stl_' + Date.now(),
    groupId:      currentGroup.groupId,
    fromUser:     pendingSettlement.from,
    toUser:       pendingSettlement.to,
    amount:       pendingSettlement.amount.toFixed(2),
    settledAt:    new Date().toISOString(),
  };

  try {
    if (IS_CONFIGURED) {
      // Step 1: record this individual payment
      const res1 = await sheetGet('recordSettlement', { data: encodeURIComponent(JSON.stringify(record)) });
      if (res1 && res1.error) throw new Error(res1.error);

      // Step 2: reload data so we have up-to-date settlements
      await loadExpenses();

      // Step 3: check if ALL balances are now zero
      if (isFullySettled()) {
        // Everyone is square — archive all expenses
        const res2 = await sheetGet('settle', { data: encodeURIComponent(JSON.stringify({ groupId: currentGroup.groupId })) });
        if (res2 && res2.error) throw new Error(res2.error);
        await loadExpenses();
        showToast('🎉 All settled! Expenses archived.', 'success');
      } else {
        showToast(`✓ Payment recorded. Remaining balances updated.`, 'success');
      }

    } else {
      // Local mode: record the settlement payment in cache
      const existing = CACHE.loadSettlements();
      existing.push(record);
      CACHE.saveSettlements(existing);

      // Recalculate with updated settlements
      settlements = existing;
      renderExpenses();
      renderDashboard();

      // Check if fully settled now
      if (isFullySettled()) {
        // Archive all expenses locally
        const archiveKey = 'SplitVise_archive_' + currentGroup.groupId;
        const archived   = JSON.parse(localStorage.getItem(archiveKey) || '[]');
        const settledAt  = new Date().toISOString();
        expenses.forEach(exp => archived.push({ ...exp, settledAt }));
        localStorage.setItem(archiveKey, JSON.stringify(archived));
        // Clear active caches
        CACHE.saveExpenses([]);
        CACHE.saveSettlements([]);
        expenses    = [];
        settlements = [];
        renderExpenses();
        renderDashboard();
        showToast('🎉 All settled! Expenses archived.', 'success');
      } else {
        showToast('✓ Payment recorded. Remaining balances updated.', 'success');
      }
    }

    pendingSettlement = null;

  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  } finally {
    hideLoader();
  }
}

/**
 * Returns true when every member's net balance (paid - owed + settlements) is ~0.
 * Uses the same logic as renderDashboard so it's always consistent.
 */
function isFullySettled() {
  const members = currentGroup.members;
  const paid = {}, owed = {};
  members.forEach(m => { paid[m] = 0; owed[m] = 0; });

  expenses.forEach(exp => {
    const amount = parseFloat(exp.amount || 0);
    const payer  = (exp.paidBy || '').trim();
    if (payer in paid) paid[payer] += amount;
    const owedMap = calcOwedPerMember(exp, members);
    members.forEach(m => { owed[m] += owedMap[m] || 0; });
  });

  const net = {};
  members.forEach(m => net[m] = (paid[m] || 0) - (owed[m] || 0));
  settlements.forEach(s => {
    const amt  = parseFloat(s.amount || 0);
    const from = (s.fromUser || '').trim();
    const to   = (s.toUser   || '').trim();
    if (from in net) net[from] += amt;
    if (to   in net) net[to]   -= amt;
  });

  // All settled if no one owes more than 1 paisa
  return Object.values(net).every(v => Math.abs(v) < 0.01);
}

// ─────────────────────────────────────────────────────────────
//  SHEET API
// ─────────────────────────────────────────────────────────────
async function sheetGet(action, params = {}) {
  let url = CONFIG.APPS_SCRIPT_URL + '?action=' + encodeURIComponent(action);
  Object.entries(params).forEach(([k, v]) => { url += '&' + k + '=' + v; });
  console.log('[sheetGet]', action);
  const res  = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  console.log('[sheetGet] response:', text.slice(0, 120));
  try { return JSON.parse(text); }
  catch (e) { throw new Error('Bad JSON: ' + text.slice(0, 120)); }
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function showScreen(id)   { $(id).classList.remove('hidden'); }
function hideAllScreens() { ['screen-auth','screen-groups','app'].forEach(id => { const el = $(id); if (el) el.classList.add('hidden'); }); }
function parseMemberStr(str) { if (Array.isArray(str)) return str; return String(str || '').split(',').map(s => s.trim()).filter(Boolean); }
function sanitizeRow(row) { const c = {}; for (const k in row) c[k.trim()] = typeof row[k] === 'string' ? row[k].trim() : row[k]; return c; }
function genInviteCode(name) { return name.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(); }
function generateId() { return 'exp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6); }
function today() { return new Date().toISOString().split('T')[0]; }
function formatDate(str) {
  if (!str) return '';
  let d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str.trim())) { const [y,m,day]=str.trim().split('-').map(Number); d=new Date(y,m-1,day); }
  else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str.trim())) { const p=str.trim().split('/').map(Number); d=p[0]>12?new Date(p[2],p[1]-1,p[0]):new Date(p[2],p[0]-1,p[1]); }
  else { d=new Date(str); }
  if (!d||isNaN(d.getTime())) return str;
  return d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'});
}
function applyTheme() { if (localStorage.getItem('SplitVise_theme')==='dark') document.body.classList.add('dark'); }
function escHtml(str) { const d=document.createElement('div'); d.appendChild(document.createTextNode(str||'')); return d.innerHTML; }
function simpleHash(str) { let h=0; for(let i=0;i<str.length;i++){h=((h<<5)-h)+str.charCodeAt(i);h|=0;} return String(Math.abs(h)); }
let loaderTimeout;
function showLoader() { loaderTimeout=setTimeout(()=>$('loader').classList.remove('hidden'),300); }
function hideLoader()  { clearTimeout(loaderTimeout); $('loader').classList.add('hidden'); }
let toastTimer;
function showToast(msg,type='') { const t=$('toast'); t.textContent=msg; t.className='toast '+type+' show'; clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),3500); }
