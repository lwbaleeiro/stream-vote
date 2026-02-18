// ===== WebSocket Connection =====
const ws = new WebSocket(`ws://${location.host}`);

const statusEl = document.getElementById("connectionStatus");
const pollsList = document.getElementById("pollsList");
const form = document.getElementById("createPollForm");
const optionsContainer = document.getElementById("optionsContainer");
const addOptionBtn = document.getElementById("addOptionBtn");
const refreshBtn = document.getElementById("refreshBtn");
const toastContainer = document.getElementById("toastContainer");

// Local state
const polls = new Map();

// ===== WebSocket Events =====
ws.addEventListener("open", () => {
    statusEl.classList.add("connected");
    statusEl.querySelector(".status-text").textContent = "Conectado";
    showToast("Conectado ao servidor!", "success");

    ws.send(JSON.stringify({ type: "GET_POLLS" }));
});

ws.addEventListener("close", () => {
    statusEl.classList.remove("connected");
    statusEl.querySelector(".status-text").textContent = "Desconectado";
    showToast("Conexão perdida", "error");
});

ws.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);

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
            payload.data.forEach(poll => polls.set(poll.id, poll));
            renderPolls();
            break;

        case "ERROR":
            showToast(payload.data.message, "error");
            break;
    }
});

// ===== Create Poll =====
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("pollTitle").value.trim();
    const optionInputs = document.querySelectorAll(".option-input");
    const options = Array.from(optionInputs)
        .map(input => input.value.trim())
        .filter(val => val !== "");

    if (!title || options.length < 2) {
        showToast("Preencha o título e pelo menos 2 opções.", "error");
        return;
    }

    ws.send(JSON.stringify({
        type: "CREATE_POLL",
        data: { title, options }
    }));

    // Reset form
    form.reset();
    optionsContainer.innerHTML = `
        <input type="text" class="option-input" placeholder="Opção 1" required>
        <input type="text" class="option-input" placeholder="Opção 2" required>
    `;
});

// ===== Add Option Input =====
addOptionBtn.addEventListener("click", () => {
    const count = optionsContainer.querySelectorAll(".option-input").length + 1;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "option-input";
    input.placeholder = `Opção ${count}`;
    optionsContainer.appendChild(input);
    input.focus();
});

// ===== Refresh =====
refreshBtn.addEventListener("click", () => {
    ws.send(JSON.stringify({ type: "GET_POLLS" }));
});

// ===== Vote =====
function vote(pollId, optionIndex) {
    ws.send(JSON.stringify({
        type: "VOTE",
        data: { pollId, optionIndex }
    }));
}

// ===== Render =====
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

// ===== Helpers =====
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
