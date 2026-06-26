const form = document.getElementById('commentForm'),
      [nameIn, msgIn] = [document.getElementById('nameInput'), document.getElementById('commentInput')],
      commentsDisplay = document.getElementById('commentsDisplay'),
      submitBtn = document.getElementById('submitBtn'),
      cancelBtn = document.getElementById('cancelBtn'),
      nameCounter = document.getElementById('nameCounter'),
      charCounter = document.getElementById('charCounter');

const MAX_NAME = 100, MAX_CHARS = 2000;
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

const setupCounter = (inputEl, counterEl, maxLimit) => {
  const updateCount = () => { counterEl.textContent = `${inputEl.value.length} / ${maxLimit}`; };
  inputEl.addEventListener('input', updateCount);
  inputEl.addEventListener('focus', () => { counterEl.style.opacity = '1'; });
  inputEl.addEventListener('blur', () => { counterEl.style.opacity = '0'; });
  return updateCount; 
};

const syncNameCount = setupCounter(nameIn, nameCounter, MAX_NAME);
const syncMsgCount = setupCounter(msgIn, charCounter, MAX_CHARS);

const syncAllCounters = () => { syncNameCount(); syncMsgCount(); };

function createCommentHTML(id, name, message, hasRights, status = 'none', sourcePage = '') {
  const suffix = status === 'saving' ? ' (Saving...)' : status === 'deleting' ? ' (Deleting...)' : '';
  const sourceContext = sourcePage ? `From "${sourcePage}," ` : '';
  const escapedAuthorText = escapeHTML(`${sourceContext}${name} said...`);
  
  return `
    <div class="comment-card" id="comment-node-${id}" data-id="${id}" style="transition: opacity 0.2s ease;">
      <div class="comment-body">
        <div class="comment-author" data-raw-name="${escapeHTML(name)}">${escapedAuthorText}${suffix}</div>
        <p class="comment-text" style="overflow-wrap: break-word;">${escapeHTML(message)}</p>
      </div>
      ${hasRights && status === 'none' ? `
        <div class="btn-group">
          <button class="btns edt-btn">Edit</button>
          <button class="btns dlt-btn">Delete</button>
        </div>` : ''}
    </div>`;
}

// Global Interception via Event Delegation
commentsDisplay.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  
  const card = btn.closest('.comment-card');
  if (!card) return;

  const { id } = card.dataset;
  if (btn.classList.contains('edt-btn')) handleStartEditing(id, card);
  if (btn.classList.contains('dlt-btn')) handleDeleteComment(id, card);
});

// 1. Submit or Edit Comment Handler
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = nameIn.value.trim() || 'Anonymous', message = msgIn.value, { isEditing, id: editId, token: editToken } = editState;
  const id = isEditing ? editId : crypto.randomUUID();
  const token = isEditing ? editToken : crypto.randomUUID();

  if (!isEditing && commentsDisplay.firstElementChild?.tagName === 'P') commentsDisplay.textContent = '';

  const currentPage = document.title.split('-').pop().trim();
  const existingCard = document.getElementById(`comment-node-${id}`);
  const preservedPage = isEditing ? existingCard?.querySelector('.comment-author').textContent.match(/From\s+"([^"]+),"/)?.[1] : currentPage;
  
  isEditing ? replaceNode(id, createCommentHTML(id, name, message, false, 'saving', preservedPage)) 
            : commentsDisplay.insertAdjacentHTML('afterbegin', createCommentHTML(id, name, message, false, 'saving', preservedPage));

  try {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, token, name, message, sourcePage: preservedPage })
    });
    if (!res.ok) throw 0;

    const ownership = getOwnership();
    ownership[id] = token;
    try { localStorage.setItem('blob_comments', JSON.stringify(ownership)); } catch {}

    replaceNode(id, createCommentHTML(id, name, message, true, 'none', preservedPage));
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
      ? comments.map(c => createCommentHTML(c.id, c.name, c.message, ownership[c.id] !== undefined, 'none', c.sourcePage)).join('')
      : '<p>No comments yet. Be the first!</p>';
  } catch {
    commentsDisplay.innerHTML = '<p>Could not load comments.</p>';
  }
}

// 3. Core Action Controllers
const handleStartEditing = (id, card) => {
  const token = getOwnership()[id];
  if (!token) return alert("You do not have permission to edit this comment.");

  editState = { isEditing: true, id, token };
  nameIn.value = card.querySelector('.comment-author').getAttribute('data-raw-name');
  msgIn.value = card.querySelector('.comment-text').textContent;
  
  syncAllCounters();
  submitBtn.textContent = "Update Feedback";
  cancelBtn.style.display = "inline-block";
};

const cancelEditing = () => {
  form.reset();
  editState = { isEditing: false, id: null, token: null };
  syncAllCounters();
  submitBtn.textContent = "Post Comment";
  cancelBtn.style.display = "none";
};
cancelBtn.addEventListener('click', cancelEditing);

const handleDeleteComment = async (id, card) => {
  const ownership = getOwnership(), token = ownership[id];
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
