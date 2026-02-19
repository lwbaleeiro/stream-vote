// ===== State =====
let ws = null;
const polls = new Map();
const user = {
    id: localStorage.getItem("streamVote_userId"),
    username: localStorage.getItem("streamVote_username")
};

// ===== DOM Elements =====
const statusEl = document.getElementById("connectionStatus");
const pollsList = document.getElementById("pollsList");
const form = document.getElementById("createPollForm");
const optionsContainer = document.getElementById("optionsContainer");
const addOptionBtn = document.getElementById("addOptionBtn");
const refreshBtn = document.getElementById("refreshBtn");
const toastContainer = document.getElementById("toastContainer");

const authSection = document.getElementById("authSection");
const mainContent = document.getElementById("mainContent");
const authForm = document.getElementById("authForm");
const userProfile = document.getElementById("userProfile");
const usernameDisplay = document.getElementById("usernameDisplay");
const logoutBtn = document.getElementById("logoutBtn");
const registerBtn = document.getElementById("registerBtn");

// ===== Initialization =====
function init() {
    if (user.id) {
        showMainContent();
        connectWebSocket();
    } else {
        showAuthContent();
    }
}

function showMainContent() {
    authSection.classList.add("hidden");
    mainContent.classList.remove("hidden");
    userProfile.classList.remove("hidden");
    usernameDisplay.textContent = `Hi, ${user.username}`;
}

function showAuthContent() {
    authSection.classList.remove("hidden");
    mainContent.classList.add("hidden");
    userProfile.classList.add("hidden");
}

// ===== WebSocket Connection =====
function connectWebSocket() {
    if (ws) ws.close();

    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${protocol}//${location.host}?userId=${user.id}`);

    ws.addEventListener("open", () => {
        statusEl.classList.add("connected");
        statusEl.querySelector(".status-text").textContent = "Conectado";
        showToast("Conectado ao servidor!", "success");
        ws.send(JSON.stringify({ type: "GET_POLLS" }));
    });

    ws.addEventListener("close", () => {
        statusEl.classList.remove("connected");
        statusEl.querySelector(".status-text").textContent = "Desconectado";
        showToast("Conexão perdida. Tentando reconectar...", "info");
        setTimeout(init, 3000); // Tentar reconectar
    });

    ws.addEventListener("message", (event) => {
        const payload = JSON.parse(event.data);
        handleWsMessage(payload);
    });
}

function handleWsMessage(payload) {
    switch (payload.type) {
        case "POLL_CREATED":
            polls.set(payload.data.id, payload.data);
            renderPolls();
            showToast(`Enquete "${payload.data.title}" criada!`, "success");
            break;
        case "POLL_UPDATED":
            polls.set(payload.data.id, payload.data);
            renderPolls();
            break;
        case "POLLS_LIST":
            polls.clear();
            payload.data.forEach(p => polls.set(p.id, p));
            renderPolls();
            break;
        case "ERROR":
            showToast(payload.data.message, "error");
            break;
    }
}

// ===== Auth Handlers =====
authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Erro no login");

        user.id = data.userId;
        user.username = username;
        localStorage.setItem("streamVote_userId", user.id);
        localStorage.setItem("streamVote_username", user.username);
        
        showMainContent();
        connectWebSocket();
        showToast("Bem-vindo!", "success");
    } catch (err) {
        showToast(err.message, "error");
    }
});

registerBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
        showToast("Preencha usuário e senha.", "error");
        return;
    }

    try {
        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Erro no registro");

        showToast("Conta criada! Agora faça login.", "success");
    } catch (err) {
        showToast(err.message, "error");
    }
});

logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    location.reload();
});

// ===== Poll Logic =====
form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("pollTitle").value.trim();
    const optionInputs = document.querySelectorAll(".option-input");
    const options = Array.from(optionInputs).map(i => i.value.trim()).filter(v => v);

    if (options.length < 2) return showToast("Pelo menos 2 opções.", "error");

    ws.send(JSON.stringify({ type: "CREATE_POLL", data: { title, options } }));
    form.reset();
    optionsContainer.innerHTML = `
        <input type="text" class="option-input" placeholder="Opção 1" required>
        <input type="text" class="option-input" placeholder="Opção 2" required>
    `;
});

addOptionBtn.addEventListener("click", () => {
    const count = optionsContainer.querySelectorAll(".option-input").length + 1;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "option-input";
    input.placeholder = `Opção ${count}`;
    optionsContainer.appendChild(input);
    input.focus();
});

refreshBtn.addEventListener("click", () => {
    ws.send(JSON.stringify({ type: "GET_POLLS" }));
});

function vote(pollId, optionIndex) {
    ws.send(JSON.stringify({ type: "VOTE", data: { pollId, optionIndex } }));
}

function renderPolls() {
    if (polls.size === 0) {
        pollsList.innerHTML = '<p class="empty-state">Nenhuma enquete ativa. Crie uma acima!</p>';
        return;
    }

    pollsList.innerHTML = "";
    polls.forEach((poll) => {
        const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
        const optionsHtml = poll.options.map((opt) => {
            const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            return `
                <div class="poll-option" onclick="vote('${poll.id}', ${opt.index})">
                    <div class="option-bar" style="width: ${percentage}%"></div>
                    <span class="option-text">${escapeHtml(opt.text)}</span>
                    <span class="option-votes">${opt.votes} (${percentage}%)</span>
                </div>
            `;
        }).join("");

        const pollEl = document.createElement("div");
        pollEl.className = "poll-item";
        pollEl.innerHTML = `
            <h3>${escapeHtml(poll.title)}</h3>
            <div class="poll-options">${optionsHtml}</div>
            <div class="poll-meta">
                <span>Total: ${totalVotes} voto${totalVotes !== 1 ? "s" : ""}</span>
                <span>${new Date(poll.createdAt).toLocaleTimeString("pt-BR")}</span>
            </div>
        `;
        pollsList.appendChild(pollEl);
    });
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Start
init();
