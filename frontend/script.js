// frontend/script.js (Final Updated Code for Mobile-Friendly UI)

const appState = {
  currentPage: "login",
  selectedGroup: null,
  isAuthenticated: false,
  user: null,
  studyGroups: [],
  discoverableGroups: [],
  resources: [],
  chatHistories: {},
};

// Utility functions
function createElement(tag, className = "", content = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content) element.innerHTML = content;
  return element;
}

function clearContainer(container) {
  container.innerHTML = "";
}

// --- Functions for Create Group Modal ---
function handleCreateGroupSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('groupName').value;
  const subject = document.getElementById('groupSubject').value;
  const description = document.getElementById('groupDescription').value;
  if (!name || !subject || !description) {
    alert('Please fill out all fields.');
    return;
  }
  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to create a group.');
    return;
  }
  user.getIdToken().then(token => {
    fetch('http://localhost:5001/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name, subject, description }),
    })
    .then(res => res.ok ? res.json() : Promise.reject('Failed to create group.'))
    .then(newGroup => {
      console.log('Group created successfully:', newGroup);
      appState.studyGroups.push(newGroup);
      closeModal();
      renderApp();
    })
    .catch(error => {
      console.error('Error creating group:', error);
      alert('Could not create the group. Please try again.');
    });
  });
}

function createGroupModal() {
  const modalBackdrop = createElement('div', 'modal-backdrop');
  modalBackdrop.id = 'createGroupModal';
  modalBackdrop.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Create a New Study Group</h2>
        <button class="close-modal-btn" onclick="closeModal()">×</button>
      </div>
      <form id="createGroupForm">
        <div class="form-group"><label for="groupName" class="form-label">Group Name</label><input type="text" id="groupName" class="form-input" required></div>
        <div class="form-group"><label for="groupSubject" class="form-label">Subject</label><input type="text" id="groupSubject" class="form-input" required></div>
        <div class="form-group"><label for="groupDescription" class="form-label">Description</label><textarea id="groupDescription" class="form-input" rows="4" required></textarea></div>
        <button type="submit" class="btn btn-primary" style="width: 100%;">Create Group</button>
      </form>
    </div>
  `;
  document.body.appendChild(modalBackdrop);
  document.getElementById('createGroupForm').addEventListener('submit', handleCreateGroupSubmit);
}

function openModal() {
  if (document.getElementById('createGroupModal')) return;
  createGroupModal();
  setTimeout(() => { document.getElementById('createGroupModal').classList.add('active'); }, 10);
}

function closeModal() {
  const modal = document.getElementById('createGroupModal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => { modal.remove(); }, 300);
  }
}
// ---------------------------------------------

// --- Function to handle AI Chat submission ---
async function handleAiChatSubmit() {
    const input = document.getElementById('aiInput');
    const messagesContainer = document.getElementById('aiMessages');
    const prompt = input.value.trim();
    const groupId = appState.selectedGroup._id;
    if (!prompt) return;

    const userMessageHTML = `<strong>You:</strong> ${prompt}`;
    const userMessage = createElement("div", "message user");
    userMessage.innerHTML = userMessageHTML;
    messagesContainer.appendChild(userMessage);
    appState.chatHistories[groupId].push({ sender: 'user', content: userMessageHTML });
    
    input.value = "";
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    const thinkingMessage = createElement("div", "message other");
    thinkingMessage.innerHTML = `<strong>AI Assistant:</strong> Thinking...`;
    messagesContainer.appendChild(thinkingMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    const user = auth.currentUser;
    if (!user) {
        thinkingMessage.innerHTML = `<strong>AI Assistant:</strong> Error: You must be logged in.`;
        return;
    }
    try {
        const token = await user.getIdToken();
        const response = await fetch('http://localhost:5001/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ prompt }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to get response from AI.');
        }
        const data = await response.json();
        const formattedHtml = marked.parse(data.reply);
        const aiMessageHTML = `<strong>AI Assistant:</strong><div class="markdown-content">${formattedHtml}</div>`;
        thinkingMessage.innerHTML = aiMessageHTML;
        appState.chatHistories[groupId].push({ sender: 'ai', content: aiMessageHTML });

    } catch (error) {
        console.error("AI Chat Error:", error);
        const errorMessageHTML = `<strong>AI Assistant:</strong> Sorry, I encountered an error. ${error.message}`;
        thinkingMessage.innerHTML = errorMessageHTML;
        appState.chatHistories[groupId].push({ sender: 'ai', content: errorMessageHTML });
    } finally {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Authentication and Data Fetching functions
function handleLogout() {
  signOut();
}

async function fetchStudyGroups() {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const token = await user.getIdToken();
    const response = await fetch('http://localhost:5001/api/groups', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Could not fetch study groups.');
    appState.studyGroups = await response.json();
  } catch (error) {
    console.error("Error fetching study groups:", error);
    appState.studyGroups = [];
  }
}

async function fetchDiscoverGroups() {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const token = await user.getIdToken();
    const response = await fetch('http://localhost:5001/api/groups/discover', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Could not fetch discoverable groups.');
    appState.discoverableGroups = await response.json();
  } catch (error) {
    console.error("Error fetching discoverable groups:", error);
    appState.discoverableGroups = [];
  }
}

async function joinGroup(groupId) {
    const user = auth.currentUser;
    if (!user) { alert("You must be logged in to join a group."); return; }
    try {
        const token = await user.getIdToken();
        const response = await fetch(`http://localhost:5001/api/groups/${groupId}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to join group.');
        }
        alert("Group joined successfully!");
        navigateTo('dashboard');
    } catch (error) {
        console.error("Error joining group:", error);
        alert(`Could not join group: ${error.message}`);
    }
}

async function deleteGroup(groupId) {
    if (!confirm("Are you sure you want to permanently delete this group?")) { return; }
    const user = auth.currentUser;
    if (!user) { alert("You must be logged in to delete a group."); return; }
    try {
        const token = await user.getIdToken();
        const response = await fetch(`http://localhost:5001/api/groups/${groupId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete group.');
        }
        appState.studyGroups = appState.studyGroups.filter(group => group._id !== groupId);
        renderApp();
    } catch (error) {
        console.error("Error deleting group:", error);
        alert(`Could not delete group: ${error.message}`);
    }
}

// Navigation functions
function navigateTo(page) {
  appState.currentPage = page;
  renderApp();
}

function selectGroup(group) {
  appState.selectedGroup = group;
  appState.currentPage = "study-group";
  renderApp();
}

// --- NEW Sidebar control functions ---
function openSidebar() {
    document.getElementById('sidebar')?.classList.add('active');
    document.getElementById('overlay')?.classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('active');
    document.getElementById('overlay')?.classList.remove('active');
}
// ------------------------------------

// Component creation functions
function createLoginForm() {
  const container = createElement("div", "auth-container");
  const form = createElement("div", "form-container");
  form.innerHTML = `
    <div class="page-header" style="border: none; text-align: center;">
      <h1 class="page-title" style="color: var(--primary);">Study Hive</h1>
      <p class="page-subtitle">Sign in to get started</p>
    </div>
    <button type="button" id="googleSignInBtn" class="btn btn-primary" style="width: 100%; margin-bottom: 1rem;">
      <img src="https://img.icons8.com/color/16/000000/google-logo.png" style="margin-right: 0.5rem;"/>
      Sign In with Google
    </button>
  `;
  container.appendChild(form);
  form.querySelector("#googleSignInBtn").addEventListener("click", () => signInWithGoogle());
  return container;
}

// --- REPLACED: createSidebar with new responsive version ---
function createSidebar() {
  const sidebar = createElement("div", "sidebar");
  sidebar.id = 'sidebar';

  const userInitial = appState.user?.name ? appState.user.name.charAt(0).toUpperCase() : 'U';

  sidebar.innerHTML = `
    <div class="sidebar-logo">
        📚 Study Hive
    </div>
    
    <div class="sidebar-user-info">
        <div class="user-avatar">${userInitial}</div>
        <div class="user-name">${appState.user?.name || "User"}</div>
        <div class="user-email">${appState.user?.email || "user@example.com"}</div>
    </div>

    <nav class="sidebar-nav">
        <li><a href="#" data-page="dashboard">📊 Dashboard</a></li>
        <li><a href="#" data-page="groups">👥 Groups</a></li>
        <li><a href="#" data-page="resources">📁 Resources</a></li>
        <li style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border);">
            <a href="#" id="logoutBtn" style="color: var(--destructive);">🚪 Logout</a>
        </li>
    </nav>
  `;
  
  const activeLink = sidebar.querySelector(`[data-page="${appState.currentPage}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }

  sidebar.querySelectorAll("[data-page]").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      closeSidebar();
      // Use the href attribute to get the page name, safer than dataset on parent
      const page = e.currentTarget.getAttribute('data-page');
      navigateTo(page);
    });
  });

  sidebar.querySelector("#logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();
    closeSidebar();
    handleLogout();
  });

  return sidebar;
}
// -----------------------------------------------------------

function createDashboard() {
  const container = createElement("div");
  container.innerHTML = `
    <div class="page-header"><h1 class="page-title">Dashboard</h1><p class="page-subtitle">Welcome back, ${appState.user?.name || "Student"}!</p></div>
    <div class="cards-grid">
      <div class="card"><h3 style="color: var(--primary); margin-bottom: 0.5rem;">📊 Active Groups</h3><div style="font-size: 2rem; font-weight: 700;">${appState.studyGroups.length}</div><p style="color: var(--muted-foreground); margin-top: 0.5rem;">Study groups you're part of</p></div>
      <div class="card"><h3 style="color: var(--secondary); margin-bottom: 0.5rem;">📚 Resources</h3><div style="font-size: 2rem; font-weight: 700;">${appState.resources.length}</div><p style="color: var(--muted-foreground); margin-top: 0.5rem;">Available study materials</p></div>
      <div class="card"><h3 style="color: var(--accent); margin-bottom: 0.5rem;">⏰ Next Session</h3><div style="font-size: 1.25rem; font-weight: 600;">Coming Soon</div><p style="color: var(--muted-foreground); margin-top: 0.5rem;">Feature in development</p></div>
    </div>
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; margin-top: 2rem;">
        <h2 style="font-size: 1.5rem; font-weight: 600;">Your Study Groups</h2>
        <button class="btn btn-primary" id="createGroupBtn">+ Create New Group</button>
      </div>
      <div id="studyGroupsList"></div>
    </div>
  `;
  const groupsList = container.querySelector("#studyGroupsList");
  if (appState.studyGroups.length === 0) {
    groupsList.innerHTML = `<p>You haven't joined or created any study groups yet. Create one or discover new groups!</p>`;
  } else {
    appState.studyGroups.forEach(group => {
      const groupCard = createElement("div", "card");
      let deleteButtonHTML = '';
      if (appState.user && group.createdBy && group.createdBy._id === appState.user.mongoId) {
          deleteButtonHTML = `<button class="delete-group-btn" data-group-id="${group._id}">Delete</button>`;
      }
      groupCard.innerHTML = `
        ${deleteButtonHTML}
        <div class="group-card-content" style="padding-top: ${deleteButtonHTML ? '1.5rem' : '0'};">
          <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">${group.name}</h3>
          <p style="color: var(--muted-foreground); margin-bottom: 1rem;">${group.description}</p>
          <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: var(--muted-foreground);">
            <span>👥 ${group.members.length} members</span>
            <span>👤 Created by: ${group.createdBy.name}</span>
          </div>
        </div>
      `;
      groupCard.querySelector('.group-card-content').addEventListener("click", () => selectGroup(group));
      groupsList.appendChild(groupCard);
    });
  }
  container.querySelectorAll('.delete-group-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation(); 
        const groupId = e.target.dataset.groupId;
        deleteGroup(groupId);
    });
  });
  container.querySelector('#createGroupBtn').addEventListener('click', openModal);
  return container;
}

function createGroupsPage() {
  const container = createElement("div");
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Discover Groups</h1>
      <p class="page-subtitle">Find and join study groups that match your interests</p>
    </div>
    <div class="cards-grid" id="discoverGroupsList"><p>Loading groups...</p></div>
  `;
  fetchDiscoverGroups().then(() => {
    const groupsList = container.querySelector("#discoverGroupsList");
    clearContainer(groupsList);
    if (appState.discoverableGroups.length === 0) {
        groupsList.innerHTML = `<p>No new groups to discover right now. Why not create one?</p>`;
        return;
    }
    appState.discoverableGroups.forEach(group => {
      const groupCard = createElement("div", "card");
      groupCard.style.cursor = 'default'; 
      groupCard.innerHTML = `
        <div>
            <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">${group.name}</h3>
            <p style="color: var(--muted-foreground); margin-bottom: 1.5rem;">${group.description}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 0.875rem; color: var(--muted-foreground);"><span>👥 ${group.members.length} members</span></div>
                <button class="btn btn-secondary join-group-btn" data-group-id="${group._id}">Join Group</button>
            </div>
        </div>
      `;
      groupsList.appendChild(groupCard);
    });
    container.querySelectorAll('.join-group-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const groupId = e.target.dataset.groupId;
            joinGroup(groupId);
        });
    });
  });
  return container;
}

function createResourcesPage() {
  const container = createElement("div");
  container.innerHTML = `<div class="page-header"><h1 class="page-title">Study Resources</h1><p class="page-subtitle">Access shared materials</p></div><p>This feature is coming soon!</p>`;
  return container;
}

function createStudyGroupPage() {
  const container = createElement("div");
  const group = appState.selectedGroup;
  if (!group) {
    container.innerHTML = "<p>No group selected. Go back to the dashboard.</p>";
    return container;
  }
  container.innerHTML = `
    <div class="page-header">
      <button class="btn btn-outline" id="backBtn" style="margin-bottom: 1rem;">← Back to Dashboard</button>
      <h1 class="page-title">${group.name}</h1>
      <p class="page-subtitle">${group.description}</p>
    </div>
    <div class="tabs"><div class="tabs-list">
      <button class="active" data-tab="resources">📁 Resources</button>
      <button data-tab="chat">💬 Chat</button>
      <button data-tab="ai">🤖 Mitrr</button>
    </div></div>
    <div id="tabContent"></div>
  `;
  container.querySelector("#backBtn").addEventListener("click", () => navigateTo("dashboard"));
  const tabButtons = container.querySelectorAll("[data-tab]");
  tabButtons.forEach(button => {
    button.addEventListener("click", (e) => {
      tabButtons.forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      renderTabContent(e.target.dataset.tab, container.querySelector("#tabContent"));
    });
  });
  renderTabContent("resources", container.querySelector("#tabContent"));
  return container;
}

function renderTabContent(tab, container) {
  clearContainer(container);
  switch (tab) {
    case "resources":
      container.innerHTML = `<div style="margin-bottom: 2rem;"><button class="btn btn-primary">📤 Upload Resource</button></div><p>Resource feature is coming soon!</p>`;
      break;
    case "chat":
      container.innerHTML = `<div class="chat-container"><div class="chat-messages"><div class="message other"><strong>Group Chat:</strong> Coming soon!</div></div><div class="chat-input-container"><textarea class="chat-input" disabled></textarea><button class="btn btn-primary" disabled>Send</button></div></div>`;
      break;
    case "ai":
      const groupId = appState.selectedGroup._id;
      if (!appState.chatHistories[groupId]) {
        const welcomeMessageHTML = `<strong>Mitrr:</strong> Hello I am Mitrr! Ask me anything about ${appState.selectedGroup.subject}!`;
        appState.chatHistories[groupId] = [
            { sender: 'ai', content: welcomeMessageHTML }
        ];
      }
      container.innerHTML = `
        <div class="chat-container">
            <div class="chat-messages" id="aiMessages"></div>
            <div class="chat-input-container">
                <textarea class="chat-input" placeholder="Ask Mitrr..." id="aiInput"></textarea>
                <button class="btn btn-primary" id="aiSendBtn">Send</button>
            </div>
        </div>
      `;
      const messagesContainer = container.querySelector('#aiMessages');
      appState.chatHistories[groupId].forEach(message => {
          const messageEl = createElement("div", `message ${message.sender === 'user' ? 'user' : 'other'}`);
          messageEl.innerHTML = message.content;
          messagesContainer.appendChild(messageEl);
      });
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      document.getElementById('aiSendBtn').addEventListener('click', handleAiChatSubmit);
      document.getElementById('aiInput').addEventListener('keypress', function (e) {
          if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAiChatSubmit();
          }
      });
      break;
  }
}

// --- REPLACED: renderApp with new responsive version ---
function renderApp() {
  const app = document.getElementById("app");
  clearContainer(app);

  if (!appState.isAuthenticated) {
    app.appendChild(createLoginForm());
  } else {
    // Authenticated state
    const appContainer = createElement("div", "app-container");
    
    // Mobile Header
    const mobileHeader = createElement("header", "mobile-header");
    mobileHeader.innerHTML = `
        <button class="hamburger-menu" id="hamburgerMenu">☰</button>
        <div class="header-logo">Study Hive</div>
    `;
    appContainer.appendChild(mobileHeader);

    // Sidebar
    appContainer.appendChild(createSidebar());

    // Overlay
    const overlay = createElement("div", "overlay");
    overlay.id = 'overlay';
    appContainer.appendChild(overlay);

    // Main Content
    const mainContent = createElement("main", "main-content");
    switch (appState.currentPage) {
      case "dashboard": mainContent.appendChild(createDashboard()); break;
      case "groups": mainContent.appendChild(createGroupsPage()); break;
      case "resources": mainContent.appendChild(createResourcesPage()); break;
      case "study-group": mainContent.appendChild(createStudyGroupPage()); break;
      default: mainContent.appendChild(createDashboard()); break;
    }
    appContainer.appendChild(mainContent);

    app.appendChild(appContainer);

    // Add event listeners after elements are in the DOM
    document.getElementById('hamburgerMenu').addEventListener('click', openSidebar);
    document.getElementById('overlay').addEventListener('click', closeSidebar);
  }
}
// -----------------------------------------------------------

// Initialize and Listeners
document.addEventListener("DOMContentLoaded", () => {
  renderApp();
});