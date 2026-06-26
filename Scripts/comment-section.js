const form = document.getElementById('commentForm'),
      [nameIn, msgIn] = [document.getElementById('nameInput'), document.getElementById('commentInput')],
      commentsDisplay = document.getElementById('commentsDisplay'),
      submitBtn = document.getElementById('submitBtn'),
      cancelBtn = document.getElementById('cancelBtn'),
      nameCounter = document.getElementById('nameCounter'), // Name counter element
      charCounter = document.getElementById('charCounter');  // Comment counter element

const MAX_NAME = 100;   // Maximum character limit for the name
const MAX_CHARS = 2000; // Maximum character limit for the comment
const htmlEscapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHTML = str => (str || '').replace(/[&<>"']/g, m => htmlEscapes[m]);

let editState = { isEditing: false, id: null, token: null };

const getOwnership = () => {
  try { return JSON.parse(localStorage.getItem('blob_comments') || '{}'); } catch { return {}; }
};

const replaceNode = (id, html) => {
  const target = document.getElementById(`comment-node-${id}`);
  if (!target) return;
  const temp = document.createElement('template');
  temp.innerHTML = html;
  target.replaceWith(temp.content.firstElementChild);
};

// --- Cleaned up Real-time Counter Visibility Logic ---
const setupCounter = (inputEl, counterEl, maxLimit) => {
  const updateCount = () => {
    // No more red text color checks or submitBtn disabling needed!
    counterEl.textContent = `${inputEl.value.length} / ${maxLimit}`;
  };

  inputEl.addEventListener('input', updateCount);
  inputEl.addEventListener('focus', () => { counterEl.style.opacity = '1'; });
  inputEl.addEventListener('blur', () => { counterEl.style.opacity = '0'; });

  return updateCount; 
};

const syncNameCount = setupCounter(nameIn, nameCounter, MAX_NAME);
const syncMsgCount = setupCounter(msgIn, charCounter, MAX_CHARS);

function createCommentHTML(id, name, message, hasRights, status = 'none') {
  const suffix = status === 'saving' ? ' (Saving...)' : status === 'deleting' ? ' (Deleting...)' : '';
  const escapedName = escapeHTML(name);
  return `
    <div class="comment-card" id="comment-node-${id}" data-id="${id}" style="transition: opacity 0.2s ease;">
      <div class="comment-body">
        <div class="comment-author" data-raw-name="${escapedName}">${escapedName}${suffix}</div>
        <p class="comment-text" style="overflow-wrap: break-word;">${escapeHTML(message)}</p>
      </div>
      ${hasRights && status === 'none' ? `
        <div class="btn-group">
          <button class="btns edt-btn" onclick="startEditing('${id}', this)">Edit</button>
          <button class="btns dlt-btn" onclick="deleteComment('${id}', this)">Delete</button>
        </div>` : ''}
    </div>`;
}

// 1. Submit or Edit Comment Handler
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = nameIn.value.trim() || 'Anonymous', message = msgIn.value, { isEditing } = editState;
  const id = isEditing ? editState.id : crypto.randomUUID();
  const token = isEditing ? editState.token : crypto.randomUUID();

  if (!isEditing && commentsDisplay.firstElementChild?.tagName === 'P') {
    commentsDisplay.textContent = '';
  }
  
  const savingHTML = createCommentHTML(id, name, message, false, 'saving');
  isEditing ? replaceNode(id, savingHTML) : commentsDisplay.insertAdjacentHTML('afterbegin', savingHTML);

  try {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, token, name, message })
    });
    if (!res.ok) throw 0;

    const ownership = getOwnership();
    ownership[id] = token;
    try { localStorage.setItem('blob_comments', JSON.stringify(ownership)); } catch {}

    replaceNode(id, createCommentHTML(id, name, message, true, 'none'));
    cancelEditing();
  } catch {
    alert('Failed to save comment.');
    loadComments();
  }
});

// 2. Fetch and Display Comments
async function loadComments() {
  try {
    const res = await fetch('/api/comments');
    const comments = await res.json(), ownership = getOwnership();
    
    commentsDisplay.innerHTML = comments?.length 
      ? comments.map(c => createCommentHTML(c.id, c.name, c.message, ownership[c.id] !== undefined, 'none')).join('')
      : '<p>No comments yet. Be the first!</p>';
  } catch {
    commentsDisplay.innerHTML = '<p>Could not load comments.</p>';
  }
}

// 3. Action Hooks
window.startEditing = (id, btn) => {
  const card = btn.closest('.comment-card'), token = getOwnership()[id];
  if (!token) return alert("You do not have permission to edit this comment.");

  editState = { isEditing: true, id, token };
  nameIn.value = card.querySelector('.comment-author').getAttribute('data-raw-name') || card.querySelector('.comment-author').textContent;
  msgIn.value = card.querySelector('.comment-text').textContent;
  
  // Explicitly recalculate counter string numbers when inserting existing edit data
  syncNameCount();
  syncMsgCount();
  
  submitBtn.textContent = "Update Feedback";
  cancelBtn.style.display = "inline-block";
};

window.cancelEditing = () => {
  form.reset();
  editState = { isEditing: false, id: null, token: null };
  
  // Re-sync counters down to zero cleanly
  syncNameCount();
  syncMsgCount();
  
  submitBtn.textContent = "Post Comment";
  cancelBtn.style.display = "none";
};

window.deleteComment = async (id, btn) => {
  const card = btn.closest('.comment-card'), ownership = getOwnership(), token = ownership[id];
  if (!token) return alert("You do not have permission to delete this comment.");

  const oldHTML = card.outerHTML;
  card.style.opacity = '0';
  setTimeout(() => card.remove(), 200);

  try {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, token, action: 'delete' })
    });
    if (!res.ok) throw 0;
    
    delete ownership[id];
    try { localStorage.setItem('blob_comments', JSON.stringify(ownership)); } catch {}
    if (!commentsDisplay.children.length) commentsDisplay.innerHTML = '<p>No comments yet. Be the first!</p>';
  } catch { 
    alert('Failed to delete comment. Restoring original element.'); 
    commentsDisplay.insertAdjacentHTML('beforeend', oldHTML);
    const restored = document.getElementById(`comment-node-${id}`);
    if (restored) { restored.style.opacity = '0'; setTimeout(() => restored.style.opacity = '1', 50); }
  }
};

loadComments();
