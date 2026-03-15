/**
 * SplitVise — Production v3
 * ─────────────────────────────────────────────────────────────
 * APPS SCRIPT — paste into Apps Script, deploy as NEW VERSION
 * ─────────────────────────────────────────────────────────────
 *
 * SHEET TABS & HEADERS:
 * Users:       userId | username | passwordHash | upiId | createdAt
 * Groups:      groupId | groupName | inviteCode | members | createdAt
 * Expenses:    expenseId | groupId | amount | description | date | paidBy | splitWith | createdAt | updatedAt
 * Settlements: settlementId | groupId | fromUser | toUser | amount | settledAt
 * Archive:     expenseId | groupId | amount | description | date | paidBy | splitWith | createdAt | settledAt
 *
 * ─────────────────────────────────────────────────────────────
 * const USERS_SHEET='Users',GROUPS_SHEET='Groups',EXPENSES_SHEET='Expenses',SETTLEMENTS_SHEET='Settlements',ARCHIVE_SHEET='Archive';
 * function getSheet(n){return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(n);}
 * function simpleHash(s){let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return String(Math.abs(h));}
 * function respond(d){return ContentService.createTextOutput(JSON.stringify(d)).setMimeType(ContentService.MimeType.JSON);}
 * function doGet(e){
 *   const action=(e&&e.parameter&&e.parameter.action)?e.parameter.action:'ping';
 *   const groupId=e&&e.parameter?e.parameter.groupId:null;
 *   if(action==='ping')return respond({ok:true});
 *   if(action==='register'){
 *     const d=JSON.parse(decodeURIComponent(e.parameter.data));
 *     const sheet=getSheet(USERS_SHEET);const rows=sheet.getDataRange().getValues();
 *     for(let i=1;i<rows.length;i++){if(String(rows[i][1]).trim().toLowerCase()===d.username.trim().toLowerCase())return respond({success:false,error:'Username already taken'});}
 *     const userId='usr_'+Date.now();
 *     sheet.appendRow([userId,d.username.trim(),simpleHash(d.password),d.upiId||'',new Date().toISOString()]);
 *     return respond({success:true,userId,username:d.username.trim(),upiId:d.upiId||''});
 *   }
 *   if(action==='login'){
 *     const d=JSON.parse(decodeURIComponent(e.parameter.data));
 *     const sheet=getSheet(USERS_SHEET);const rows=sheet.getDataRange().getValues();
 *     for(let i=1;i<rows.length;i++){
 *       if(String(rows[i][1]).trim().toLowerCase()===d.username.trim().toLowerCase()&&String(rows[i][2]).trim()===simpleHash(d.password))
 *         return respond({success:true,userId:String(rows[i][0]).trim(),username:String(rows[i][1]).trim(),upiId:String(rows[i][3]).trim()});
 *     }
 *     return respond({success:false,error:'Invalid username or password'});
 *   }
 *   if(action==='updateUpi'){
 *     const d=JSON.parse(decodeURIComponent(e.parameter.data));
 *     const sheet=getSheet(USERS_SHEET);const rows=sheet.getDataRange().getValues();
 *     for(let i=1;i<rows.length;i++){if(String(rows[i][0]).trim()===d.userId){sheet.getRange(i+1,4).setValue(d.upiId);return respond({success:true});}}
 *     return respond({success:false,error:'User not found'});
 *   }
 *   if(action==='getUserUpi'){
 *     const d=JSON.parse(decodeURIComponent(e.parameter.data));
 *     const sheet=getSheet(USERS_SHEET);const rows=sheet.getDataRange().getValues();
 *     for(let i=1;i<rows.length;i++){if(String(rows[i][1]).trim().toLowerCase()===d.username.trim().toLowerCase())return respond({success:true,upiId:String(rows[i][3]).trim()});}
 *     return respond({success:false,upiId:''});
 *   }
 *   if(action==='read'){
 *     const sheet=getSheet(EXPENSES_SHEET);const data=sheet.getDataRange().getValues();
 *     if(data.length<=1)return respond([]);
 *     const headers=data[0];
 *     const rows=data.slice(1).filter(r=>String(r[0]).trim()!==''&&(!groupId||String(r[1]).trim()===groupId))
 *       .map(row=>{const obj={};headers.forEach((h,i)=>{obj[String(h).trim()]=String(row[i]).trim();});return obj;});
 *     return respond(rows);
 *   }
 *   if(action==='readGroups'){
 *     const sheet=getSheet(GROUPS_SHEET);const data=sheet.getDataRange().getValues();
 *     if(data.length<=1)return respond([]);
 *     const headers=data[0];
 *     const rows=data.slice(1).filter(r=>String(r[0]).trim()!=='')
 *       .map(row=>{const obj={};headers.forEach((h,i)=>{obj[String(h).trim()]=String(row[i]).trim();});return obj;});
 *     return respond(rows);
 *   }
 *   if(action==='readSettlements'){
 *     const sheet=getSheet(SETTLEMENTS_SHEET);const data=sheet.getDataRange().getValues();
 *     if(data.length<=1)return respond([]);
 *     const headers=data[0];
 *     const rows=data.slice(1).filter(r=>String(r[0]).trim()!==''&&(!groupId||String(r[1]).trim()===groupId))
 *       .map(row=>{const obj={};headers.forEach((h,i)=>{obj[String(h).trim()]=String(row[i]).trim();});return obj;});
 *     return respond(rows);
 *   }
 *   if(action==='add'){const d=JSON.parse(decodeURIComponent(e.parameter.data));getSheet(EXPENSES_SHEET).appendRow([d.expenseId,d.groupId,d.amount,d.description,d.date,d.paidBy,d.splitWith,d.createdAt,d.updatedAt]);return respond({success:true});}
 *   if(action==='edit'){
 *     const d=JSON.parse(decodeURIComponent(e.parameter.data));const sheet=getSheet(EXPENSES_SHEET);const rows=sheet.getDataRange().getValues();
 *     for(let i=1;i<rows.length;i++){if(String(rows[i][0]).trim()===String(d.expenseId).trim()){sheet.getRange(i+1,1,1,9).setValues([[d.expenseId,d.groupId,d.amount,d.description,d.date,d.paidBy,d.splitWith,rows[i][7],d.updatedAt]]);break;}}
 *     return respond({success:true});
 *   }
 *   if(action==='delete'){
 *     const d=JSON.parse(decodeURIComponent(e.parameter.data));const sheet=getSheet(EXPENSES_SHEET);const rows=sheet.getDataRange().getValues();
 *     for(let i=1;i<rows.length;i++){if(String(rows[i][0]).trim()===String(d.expenseId).trim()){sheet.deleteRow(i+1);break;}}
 *     return respond({success:true});
 *   }
 *   if(action==='createGroup'){const d=JSON.parse(decodeURIComponent(e.parameter.data));getSheet(GROUPS_SHEET).appendRow([d.groupId,d.groupName,d.inviteCode,d.members,d.createdAt]);return respond({success:true});}
 *   if(action==='joinGroup'){
 *     const d=JSON.parse(decodeURIComponent(e.parameter.data));const sheet=getSheet(GROUPS_SHEET);const rows=sheet.getDataRange().getValues();
 *     for(let i=1;i<rows.length;i++){
 *       if(String(rows[i][2]).trim().toUpperCase()===String(d.inviteCode).trim().toUpperCase()){
 *         const existing=String(rows[i][3]).trim();const members=existing?existing.split(',').map(s=>s.trim()):[];
 *         if(!members.includes(d.memberName)){members.push(d.memberName);sheet.getRange(i+1,4).setValue(members.join(','));}
 *         return respond({success:true,groupId:String(rows[i][0]).trim(),groupName:String(rows[i][1]).trim(),members:members.join(',')});
 *       }
 *     }
 *     return respond({success:false,error:'Invalid invite code'});
 *   }
 *   if(action==='recordSettlement'){const d=JSON.parse(decodeURIComponent(e.parameter.data));getSheet(SETTLEMENTS_SHEET).appendRow([d.settlementId,d.groupId,d.fromUser,d.toUser,d.amount,d.settledAt]);return respond({success:true});}
 *   if(action==='settle'){
 *     const d=JSON.parse(decodeURIComponent(e.parameter.data));
 *     const expSheet=getSheet(EXPENSES_SHEET);const arcSheet=getSheet(ARCHIVE_SHEET);const settledAt=new Date().toISOString();
 *     const rows=expSheet.getDataRange().getValues();const toDelete=[];
 *     for(let i=1;i<rows.length;i++){if(String(rows[i][1]).trim()===String(d.groupId).trim()){arcSheet.appendRow([rows[i][0],rows[i][1],rows[i][2],rows[i][3],rows[i][4],rows[i][5],rows[i][6],rows[i][7],settledAt]);toDelete.push(i+1);}}
 *     for(let i=toDelete.length-1;i>=0;i--)expSheet.deleteRow(toDelete[i]);
 *     const sSheet=getSheet(SETTLEMENTS_SHEET);const sRows=sSheet.getDataRange().getValues();const sDel=[];
 *     for(let i=1;i<sRows.length;i++){if(String(sRows[i][1]).trim()===String(d.groupId).trim())sDel.push(i+1);}
 *     for(let i=sDel.length-1;i>=0;i--)sSheet.deleteRow(sDel[i]);
 *     return respond({success:true});
 *   }
 *   return respond({error:'Unknown action: '+action});
 * }
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
//  BIND ALL EVENTS — once at DOMContentLoaded
// ─────────────────────────────────────────────────────────────
function bindAllEvents() {
  // Setup
  $('skip-setup').addEventListener('click', () => { $('setup-guide').classList.add('hidden'); bootApp(); });

  // Auth
  $('show-register').addEventListener('click', () => switchAuthTab('register'));
  $('show-login').addEventListener('click',    () => switchAuthTab('login'));
  $('btn-register').addEventListener('click',  doRegister);
  $('btn-login').addEventListener('click',     doLogin);
  $('auth-reg-name').addEventListener('keydown',  e => { if (e.key === 'Enter') doRegister(); });
  $('auth-reg-pass').addEventListener('keydown',  e => { if (e.key === 'Enter') doRegister(); });
  $('auth-login-name').addEventListener('keydown',e => { if (e.key === 'Enter') doLogin(); });
  $('auth-login-pass').addEventListener('keydown',e => { if (e.key === 'Enter') doLogin(); });

  // Hub settings
  $('hub-settings-btn').addEventListener('click', e => { e.stopPropagation(); $('hub-settings').classList.toggle('hidden'); });
  $('hub-settings-close').addEventListener('click', () => $('hub-settings').classList.add('hidden'));
  $('hub-settings').addEventListener('click', e => e.stopPropagation());
  $('hub-save-upi').addEventListener('click', doSaveUpi);
  $('hub-reset').addEventListener('click', () => { if (confirm('Logout and clear local data?')) { localStorage.clear(); location.reload(); } });
  document.addEventListener('click', () => $('hub-settings').classList.add('hidden'));

  // Hub groups
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

  // App header
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

  // Expense modal
  $('fab').addEventListener('click', openAddModal);
  $('refresh-btn').addEventListener('click', loadExpenses);
  $('modal-close').addEventListener('click', closeExpenseModal);
  $('cancel-btn').addEventListener('click', closeExpenseModal);
  $('modal-overlay').addEventListener('click', e => { if (e.target === $('modal-overlay')) closeExpenseModal(); });
  $('expense-form').addEventListener('submit', handleFormSubmit);

  // Settle modal
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
  console.log('[SplitVise] showGroupsHub');
  hideAllScreens();
  showScreen('screen-groups');
  $('hub-username').textContent      = currentUser.username;
  $('hub-settings-name').textContent = currentUser.username;
  $('hub-upi').value                 = currentUser.upiId || '';
  await loadGroups();
}

async function loadGroups() {
  const stored = localStorage.getItem('SplitVise_groups');
  allGroups = stored ? JSON.parse(stored) : [];
  if (IS_CONFIGURED) {
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
        localStorage.setItem('SplitVise_groups', JSON.stringify(allGroups));
      }
    } catch (e) { console.warn('[loadGroups]', e); }
  }
  renderGroupsList();
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
    localStorage.setItem('SplitVise_groups', JSON.stringify(allGroups));
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
      localStorage.setItem('SplitVise_groups', JSON.stringify(allGroups));
      renderGroupsList();
      showToast('Joined "' + res.groupName + '"!', 'success');
    } else {
      const found = allGroups.find(g => g.inviteCode === code);
      if (!found) throw new Error('Code not found locally');
      if (!found.members.includes(currentUser.username)) found.members.push(currentUser.username);
      localStorage.setItem('SplitVise_groups', JSON.stringify(allGroups));
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
  showLoader();
  try {
    if (!IS_CONFIGURED) {
      expenses    = JSON.parse(localStorage.getItem('SplitVise_expenses_'    + currentGroup.groupId) || '[]');
      settlements = JSON.parse(localStorage.getItem('SplitVise_settlements_' + currentGroup.groupId) || '[]');
    } else {
      const [expData, settleData] = await Promise.all([
        sheetGet('read',            { groupId: encodeURIComponent(currentGroup.groupId) }),
        sheetGet('readSettlements', { groupId: encodeURIComponent(currentGroup.groupId) }),
      ]);
      if (!Array.isArray(expData)) throw new Error('Bad response for expenses');
      expenses    = expData.map(sanitizeRow).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      settlements = Array.isArray(settleData) ? settleData.map(sanitizeRow) : [];
    }
    renderExpenses();
    renderDashboard();
  } catch (err) {
    console.error('[loadExpenses]', err);
    showToast('Load error: ' + err.message, 'error');
  } finally {
    hideLoader();
  }
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
    const isSel = selected.includes(m);
    const chip  = document.createElement('label');
    chip.className = 'split-chip' + (isSel ? ' checked' : '');
    chip.innerHTML = `<input type="checkbox" value="${escHtml(m)}" ${isSel ? 'checked' : ''} /><span class="split-chip-dot"></span>${escHtml(m)}`;
    chip.querySelector('input').addEventListener('change', function () { chip.classList.toggle('checked', this.checked); });
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
  const amount    = parseFloat($('f-amount').value);
  const desc      = $('f-desc').value.trim();
  const date      = $('f-date').value;
  const splitWith = getSelectedSplitMembers();
  if (!amount || !desc || !date) { showToast('Fill in all fields', 'error'); return; }
  if (!splitWith.length)         { showToast('Select at least one person', 'error'); return; }
  const now = new Date().toISOString();
  if (editingId) {
    const orig = expenses.find(ex => ex.expenseId === editingId);
    await callSheet('edit', { expenseId: editingId, groupId: currentGroup.groupId, amount, description: desc, date, paidBy: orig ? orig.paidBy : currentUser.username, splitWith: splitWith.join(','), createdAt: orig ? orig.createdAt : now, updatedAt: now });
  } else {
    const newExp = { expenseId: generateId(), groupId: currentGroup.groupId, amount, description: desc, date, paidBy: currentUser.username, splitWith: splitWith.join(','), createdAt: now, updatedAt: now };
    closeExpenseModal();
    expenses.unshift(newExp);
    renderExpenses();
    renderDashboard();
    await callSheet('add', newExp);
  }
}

async function callSheet(action, data) {
  closeExpenseModal();
  showLoader();
  if (!IS_CONFIGURED) {
    if (action === 'add')    expenses.unshift(data);
    else if (action === 'edit')   { const i = expenses.findIndex(e => e.expenseId === data.expenseId); if (i !== -1) expenses[i] = data; }
    else if (action === 'delete') expenses = expenses.filter(e => e.expenseId !== data.expenseId);
    localStorage.setItem('SplitVise_expenses_' + currentGroup.groupId, JSON.stringify(expenses));
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
  // Net balance after applying recorded settlements
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
  // Auto-fetch payee UPI
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
//  QR PAYMENT — shown when user clicks "Show QR & Pay"
// ─────────────────────────────────────────────────────────────
function showQRPayment() {
  if (!pendingSettlement) return;
  const upiId = $('settle-upi').value.trim();
  if (!upiId) { showToast('Enter UPI ID to pay', 'error'); return; }

  const amount = pendingSettlement.amount.toFixed(2);
  const to     = pendingSettlement.to;
  const from   = pendingSettlement.from;
  const note   = 'SplitVise: ' + from + ' to ' + to;

  // UPI payment URL encoded into QR
  const upiUrl = 'upi://pay?pa=' + encodeURIComponent(upiId)
    + '&pn=' + encodeURIComponent(to)
    + '&am=' + amount
    + '&cu=INR'
    + '&tn=' + encodeURIComponent(note);

  // QR via qrserver.com API — reliable free service
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data='
    + encodeURIComponent(upiUrl) + '&format=png&margin=10';

  // Hide entry form, show QR card
  $('upi-entry-group').style.display        = 'none';
  $('confirm-settle-pay').style.display     = 'none';
  $('upi-pay-link-container').style.display = 'block';

  $('upi-pay-link-container').innerHTML = `
    <div class="qr-payment-card">

      <p class="qr-title">Pay ₹${escHtml(amount)} to ${escHtml(to)}</p>
      <p class="qr-note">${escHtml(note)}</p>

      <div class="qr-box">
        <img src="${qrUrl}"
             alt="UPI QR Code"
             width="220" height="220"
             onerror="this.src='https://quickchart.io/qr?text=${encodeURIComponent(upiUrl)}&size=220';this.onerror=function(){this.parentElement.innerHTML='<p style=color:#e85d3a;font-size:13px;padding:20px>QR unavailable.<br>Use UPI ID below.</p>';}" />
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
        <div class="qr-detail-row">
          <span>Amount</span>
          <span class="qr-detail-val">₹${escHtml(amount)}</span>
        </div>
        <div class="qr-detail-row">
          <span>Pay To</span>
          <span class="qr-detail-val">${escHtml(upiId)}</span>
        </div>
        <div class="qr-detail-row">
          <span>Note</span>
          <span class="qr-detail-val">${escHtml(note)}</span>
        </div>
      </div>

      <p class="qr-paid-hint">After paying, tap below to record it:</p>
      <button class="qr-paid-btn" id="qr-paid-btn">✓ I Have Paid — Mark as Settled</button>

    </div>`;

  // Copy UPI ID button
  document.getElementById('qr-copy-upi-btn').addEventListener('click', () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(upiId)
        .then(() => showToast('UPI ID copied! Open GPay/PhonePe and pay', 'success'))
        .catch(() => fallbackCopy(upiId));
    } else {
      fallbackCopy(upiId);
    }
  });

  // Mark as settled button
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
//  RECORD SETTLEMENT
// ─────────────────────────────────────────────────────────────
async function doSettleClear() {
  if (!pendingSettlement) return;
  if (!confirm(`Mark ₹${pendingSettlement.amount.toFixed(2)} from ${pendingSettlement.from} to ${pendingSettlement.to} as settled?`)) return;
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
      const res = await sheetGet('recordSettlement', { data: encodeURIComponent(JSON.stringify(record)) });
      if (res && res.error) throw new Error(res.error);
    } else {
      const key = 'SplitVise_settlements_' + currentGroup.groupId;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(record);
      localStorage.setItem(key, JSON.stringify(existing));
    }
    await loadExpenses();
    showToast('✓ ' + pendingSettlement.from + ' → ' + pendingSettlement.to + ' settled!', 'success');
    pendingSettlement = null;
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
