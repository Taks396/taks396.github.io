const form = document.getElementById('commentForm');
const [nameIn, msgIn] = [document.getElementById('nameInput'), document.getElementById('commentInput')];
const commentsDisplay = document.getElementById('commentsDisplay');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');

const getOwnership = () => JSON.parse(localStorage.getItem('blob_comments') || '{}');
const saveOwnership = (data) => localStorage.setItem('blob_comments', JSON.stringify(data));
const escapeHTML = (str) => !str ? '' : str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

let editState = { isEditing: false, id: null, token: null };

function createCommentHTML(id, name, message, hasRights, status = 'none') {
const safeName = escapeHTML(name);
const safeMessage = escapeHTML(message);

let suffix = '';
if (status === 'saving') suffix = ' (Saving...)';
if (status === 'deleting') suffix = ' (Deleting...)';

return `
    <div class="comment-card" ${status === 'saving' ? `id="temp-${id}"` : `data-id="${id}"`}>
    <div class="comment-body">
        <div class="comment-author">${safeName}${suffix}</div>
        <p class="comment-text" style="overflow-wrap: break-word;">${safeMessage}</p>
    </div>
    ${hasRights && status === 'none' ? `
        <div class="btn-group">
        <button class="btns edt-btn" onclick="startEditing('${id}', this)">Edit</button>
        <button class="btns dlt-btn" onclick="deleteComment('${id}', this)">Delete</button>
        </div>
    ` : ''}
    </div>
`;
}

// 1. Submit or Edit Comment Handler
form.addEventListener('submit', async (e) => {
e.preventDefault();

const name = nameIn.value.trim() || 'Anonymous';
const message = msgIn.value;
const { isEditing } = editState;
let { id, token } = editState;

if (!isEditing) {
    id = crypto.randomUUID();
    token = crypto.randomUUID();
}

const instantHTML = createCommentHTML(id, name, message, false, 'saving');
        
if (!isEditing && commentsDisplay.innerHTML.includes('No comments yet')) {
    commentsDisplay.innerHTML = '';
}

if (isEditing) {
    document.querySelector(`[data-id="${id}"]`)?.replaceWith(Object.assign(document.createElement('div'), {innerHTML: instantHTML}).firstElementChild);
} else {
    commentsDisplay.insertAdjacentHTML('afterbegin', instantHTML);
}

try {
    const res = await fetch('/api/post-comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, token, name, message })
    });
    if (!res.ok) throw new Error();
} catch {
    alert('Failed to save comment.');
    return loadComments(); 
}

if (!isEditing) {
    const ownership = getOwnership();
    ownership[id] = token;
    saveOwnership(ownership);
}

document.getElementById(`temp-${id}`)?.replaceWith(Object.assign(document.createElement('div'), {innerHTML: createCommentHTML(id, name, message, true, 'none')}).firstElementChild);
cancelEditing(); 
});

// 2. Fetch and Display Comments
async function loadComments() {
try {
    const res = await fetch('/api/get-comments');
    const comments = await res.json();
    const ownership = getOwnership();
    
    if (!comments?.length) {
    commentsDisplay.innerHTML = '<p>No comments yet. Be the first!</p>';
    return;
    }

    commentsDisplay.innerHTML = comments.map(c => createCommentHTML(c.id, c.name, c.message, ownership[c.id] !== undefined, 'none')).join('');
} catch {
    commentsDisplay.innerHTML = '<p>Could not load comments.</p>';
}
}

// 3. Action Hooks
window.startEditing = (id, btn) => {
const card = btn.closest('.comment-card');
editState = { isEditing: true, id, token: getOwnership()[id] };

nameIn.value = card.querySelector('.comment-author').innerText;
msgIn.value = card.querySelector('.comment-text').innerText;
submitBtn.innerText = "Update Feedback";
cancelBtn.style.display = "inline-block";
};

window.cancelEditing = () => {
form.reset();
editState = { isEditing: false, id: null, token: null };
submitBtn.innerText = "Post Comment";
cancelBtn.style.display = "none";
};

window.deleteComment = async (id, btn) => {
const card = btn.closest('.comment-card');
const name = card.querySelector('.comment-author').innerText;
const message = card.querySelector('.comment-text').innerText;
const ownership = getOwnership();

// Optimistic Deletion UI: Instantly switch card to "Deleting..." state and strip buttons
card.replaceWith(Object.assign(document.createElement('div'), {
    innerHTML: createCommentHTML(id, name, message, false, 'deleting')
}).firstElementChild);

try {
    const res = await fetch('/api/delete-comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, token: ownership[id] })
    });

    if (!res.ok) throw new Error();
    
    delete ownership[id];
    saveOwnership(ownership);
    loadComments(); // Re-fetch or re-render clean state from database
} catch { 
    alert('Failed to delete.'); 
    loadComments(); // Rollback to original state if network fails
}
};

loadComments();