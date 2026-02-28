// ===== State =====
let ws = null;
const polls = new Map();
const inactivePolls = new Map();
const user = {
    id: localStorage.getItem("streamVote_userId"),
    username: localStorage.getItem("streamVote_username")
};

// ===== DOM Elements =====
const statusEl = document.getElementById("connectionStatus");
const pollsList = document.getElementById("pollsList");
const inactivePollsList = document.getElementById("inactivePollsList");
const form = document.getElementById("createPollForm");
const optionsContainer = document.getElementById("optionsContainer");
const addOptionBtn = document.getElementById("addOptionBtn");
const refreshBtn = document.getElementById("refreshBtn");
const toastContainer = document.getElementById("toastContainer");

const authSection = document.getElementById("authSection");
const mainContent = document.getElementById("mainContent");
const authForm = document.getElementById("authForm");
const userProfile = document.getElementById("userProfile");
const guestProfile = document.getElementById("guestProfile");
const usernameDisplay = document.getElementById("usernameDisplay");
const logoutBtn = document.getElementById("logoutBtn");
const registerBtn = document.getElementById("registerBtn");
const showAuthBtn = document.getElementById("showAuthBtn");
const closeAuthBtn = document.getElementById("closeAuthBtn");

const rankingSidebar = document.getElementById("rankingSidebar");
const rankingList = document.getElementById("rankingList");

const createPollSection = document.getElementById("createPollSection");
const showCreatePollBtn = document.getElementById("showCreatePollBtn");
const closeCreateBtn = document.getElementById("closeCreateBtn");

// ===== Initialization =====
function init() {
    if (user.id) {
        showMainContent();
        connectWebSocket();
    } else {
        showGuestContent();
    }
}

function showMainContent() {
    authSection.classList.add("hidden-toggle");
    authSection.classList.remove("active");
    mainContent.classList.remove("hidden");
    rankingSidebar.classList.remove("hidden");
    userProfile.classList.remove("hidden");
    guestProfile.classList.add("hidden");
    usernameDisplay.textContent = `Hi, ${user.username}`;
}

function showGuestContent() {
    mainContent.classList.remove("hidden"); // Allow visitors to see polls
    rankingSidebar.classList.remove("hidden");
    userProfile.classList.add("hidden");
    guestProfile.classList.remove("hidden");
}

// ===== WebSocket Connection =====
function connectWebSocket() {
    if (ws) ws.close();

    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${protocol}//${location.host}?userId=${user.id}`);

    ws.addEventListener("open", () => {
        statusEl.classList.add("connected");
        statusEl.querySelector(".status-text").textContent = "Connected";
        showToast("Connected to server!", "success");
        ws.send(JSON.stringify({ type: "GET_POLLS" }));
        ws.send(JSON.stringify({ type: "GET_INACTIVE_POLLS" }));
        ws.send(JSON.stringify({ type: "GET_RANKING" }));
    });

    ws.addEventListener("close", () => {
        statusEl.classList.remove("connected");
        statusEl.querySelector(".status-text").textContent = "Disconnected";
        showToast("Connection lost. Trying to reconnect...", "info");
        setTimeout(init, 3000); // Try to reconnect
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
            showToast(`Poll "${payload.data.title}" created!`, "success");
            break;
        case "POLL_UPDATED":
            if (payload.data.isActive) {
                polls.set(payload.data.id, payload.data);
                inactivePolls.delete(payload.data.id);
            } else {
                inactivePolls.set(payload.data.id, payload.data);
                polls.delete(payload.data.id);
            }
            renderPolls();
            break;
        case "POLLS_LIST":
            polls.clear();
            payload.data.forEach(p => polls.set(p.id, p));
            renderPolls();
            break;
        case "INACTIVE_POLLS_LIST":
            inactivePolls.clear();
            payload.data.forEach(p => inactivePolls.set(p.id, p));
            renderPolls();
            break;
        case "RANKING_LIST":
        case "RANKING_UPDATED":
            renderRanking(payload.data);
            break;
        case "ERROR":
            showToast(payload.data.message, "error");
            break;
    }
}

// ===== UI Handlers =====
showAuthBtn.addEventListener("click", () => {
    if (user.id) {
        showToast("You are already logged in!", "info");
        return;
    }
    authSection.classList.add("active");
});

closeAuthBtn.addEventListener("click", () => {
    authSection.classList.remove("active");
});

showCreatePollBtn.addEventListener("click", () => {
    if (!user.id) {
        showToast("Please login to create a poll.", "info");
        authSection.classList.add("active");
        return;
    }
    createPollSection.classList.toggle("active");
});

closeCreateBtn.addEventListener("click", () => {
    createPollSection.classList.remove("active");
});

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
        if (!res.ok) throw new Error(data.message || "Login error");

        user.id = data.userId;
        user.username = username;
        localStorage.setItem("streamVote_userId", user.id);
        localStorage.setItem("streamVote_username", user.username);
        
        showMainContent();
        connectWebSocket();
        showToast("Welcome!", "success");
    } catch (err) {
        showToast(err.message, "error");
    }
});

registerBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
        showToast("Please fill in username and password.", "error");
        return;
    }

    try {
        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration error");

        showToast("Account created! Now please login.", "success");
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
    const endDateInput = document.getElementById("pollEndDate").value;
    const optionRows = optionsContainer.querySelectorAll(".option-row");
    
    const options = [];
    let correctOptionIndex = null;

    optionRows.forEach((row, index) => {
        const text = row.querySelector(".option-input").value.trim();
        if (text) {
            options.push(text);
            const isCorrect = row.querySelector('input[name="correctOption"]').checked;
            if (isCorrect) correctOptionIndex = options.length - 1;
        }
    });

    if (options.length < 2) return showToast("At least 2 options.", "error");

    if (correctOptionIndex === null) return showToast("Select the correct item for the poll.", "error");

    if (endDateInput) {
        const endDate = new Date(endDateInput);
        if (endDate <= new Date()) {
            return showToast("The end date must be in the future.", "error");
        }
    }

    const pollData = { 
        title, 
        options,
        endDate: endDateInput ? new Date(endDateInput).toISOString() : null,
        correctOptionIndex
    };

    ws.send(JSON.stringify({ type: "CREATE_POLL", data: pollData }));
    form.reset();
    resetOptions();
});

function resetOptions() {
    optionsContainer.innerHTML = `
        <div class="option-row">
            <input type="text" class="option-input" placeholder="Option 1" required>
            <label class="correct-option-label">
                <input type="radio" name="correctOption" value="0">
                <span>Correct</span>
            </label>
        </div>
        <div class="option-row">
            <input type="text" class="option-input" placeholder="Option 2" required>
            <label class="correct-option-label">
                <input type="radio" name="correctOption" value="1">
                <span>Correct</span>
            </label>
        </div>
    `;
}

addOptionBtn.addEventListener("click", () => {
    const count = optionsContainer.querySelectorAll(".option-row").length;
    const row = document.createElement("div");
    row.className = "option-row";
    row.innerHTML = `
        <input type="text" class="option-input" placeholder="Option ${count + 1}">
        <label class="correct-option-label">
            <input type="radio" name="correctOption" value="${count}">
            <span>Correct</span>
        </label>
    `;
    optionsContainer.appendChild(row);
    row.querySelector(".option-input").focus();
});

refreshBtn.addEventListener("click", () => {
    ws.send(JSON.stringify({ type: "GET_POLLS" }));
});

function vote(pollId, optionIndex) {
    const poll = polls.get(pollId);
    if (!poll) return;

    const isExpired = poll.endDate && new Date(poll.endDate) <= new Date();
    if (!poll.isActive || isExpired) {
        showToast("This poll is already closed.", "error");
        return;
    }

    ws.send(JSON.stringify({ type: "VOTE", data: { pollId, optionIndex } }));
}

// ===== Carousel Logic =====
function initCarousel(containerId, dotsId, prevId, nextId) {
    const container = document.getElementById(containerId);
    const dotsContainer = document.getElementById(dotsId);
    const prevBtn = document.getElementById(prevId);
    const nextBtn = document.getElementById(nextId);

    if (!container || !dotsContainer) return;

    const cards = container.querySelectorAll(".poll-item");
    
    // Update dots
    dotsContainer.innerHTML = "";
    cards.forEach((_, index) => {
        const dot = document.createElement("div");
        dot.className = `dot ${index === 0 ? "active" : ""}`;
        dot.onclick = () => {
            container.scrollTo({
                left: index * (320 + 24), // card width + gap
                behavior: "smooth"
            });
        };
        dotsContainer.appendChild(dot);
    });

    const updateActiveDot = () => {
        const scrollLeft = container.scrollLeft;
        const cardWidth = 320 + 24;
        const activeIndex = Math.round(scrollLeft / cardWidth);
        
        const dots = dotsContainer.querySelectorAll(".dot");
        dots.forEach((dot, i) => {
            dot.classList.toggle("active", i === activeIndex);
        });
    };

    container.onscroll = updateActiveDot;

    if (prevBtn) {
        prevBtn.onclick = () => {
            container.scrollBy({ left: -(320 + 24), behavior: "smooth" });
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            container.scrollBy({ left: 320 + 24, behavior: "smooth" });
        };
    }
}

function renderPolls() {
    // Render Active Polls
    if (polls.size === 0) {
        pollsList.innerHTML = '<p class="empty-state">No active polls. Create one above!</p>';
    } else {
        pollsList.innerHTML = "";
        Array.from(polls.values())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .forEach(poll => pollsList.appendChild(createPollElement(poll)));
    }

    // Render Inactive Polls
    if (!inactivePollsList) return; 
    
    if (inactivePolls.size === 0) {
        inactivePollsList.innerHTML = '<p class="empty-state">No finished polls yet.</p>';
    } else {
        inactivePollsList.innerHTML = "";
        Array.from(inactivePolls.values())
            .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))
            .forEach(poll => inactivePollsList.appendChild(createPollElement(poll)));
    }

    // Initialize/Update Carousels
    initCarousel("pollsList", "dotsActive", "prevActive", "nextActive");
    initCarousel("inactivePollsList", "dotsInactive", "prevInactive", "nextInactive");
}

function createPollElement(poll) {
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    const isExpired = poll.endDate && new Date(poll.endDate) <= new Date();
    const isInactive = !poll.isActive || isExpired;

    const optionsHtml = poll.options.map((opt) => {
        const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
        const isCorrectClass = (isInactive && opt.isCorrect) ? "is-correct" : "";
        const correctBadge = (isInactive && opt.isCorrect) ? ' <span class="correct-badge">✓</span>' : "";
        const disabledClass = isInactive ? "disabled" : "";
        
        return `
            <div class="poll-option ${isCorrectClass} ${disabledClass}" ${!isInactive ? `onclick="vote('${poll.id}', ${opt.index})"` : ""}>
                <div class="option-bar" style="width: ${percentage}%"></div>
                <span class="option-text">${escapeHtml(opt.text)}${correctBadge}</span>
                <span class="option-votes">${opt.votes} (${percentage}%)</span>
            </div>
        `;
    }).join("");

    const pollEl = document.createElement("div");
    const pollStatusClass = isInactive ? "poll-expired" : "";
    pollEl.className = `poll-item ${pollStatusClass}`;
    
    const endDateTime = poll.endDate ? new Date(poll.endDate).toLocaleString("en-US") : "No deadline";
    const statusText = isInactive ? ' <span class="status-expired">(Closed)</span>' : "";
    
    const winnersHtml = (isInactive && poll.winnersCount !== undefined) ? 
        `<span class="winners-count">🏆 ${poll.winnersCount} winners</span>` : "";

    // Decorative icon based on title or random
    const icons = ["📊", "🗳️", "📈", "🔥", "✨"];
    const randomIcon = icons[poll.id.charCodeAt(0) % icons.length];

    pollEl.innerHTML = `
        <div class="poll-card-header">
            <span style="font-size: 3rem; z-index: 1;">${randomIcon}</span>
        </div>
        <div class="poll-card-content">
            <h3>${escapeHtml(poll.title)}${statusText}</h3>
            <div class="poll-options">${optionsHtml}</div>
            <div class="poll-meta">
                <div class="poll-stats">
                    <div style="margin-bottom: 4px;"><strong>Total:</strong> ${totalVotes} votes</div>
                    <div style="font-size: 0.7rem; opacity: 0.7;"><strong>End:</strong> ${endDateTime}</div>
                </div>
                ${winnersHtml}
            </div>
        </div>
    `;
    return pollEl;
}

function renderRanking(users) {
    if (!users || users.length === 0) {
        rankingList.innerHTML = '<p class="empty-state">No one has scored yet.</p>';
        return;
    }

    rankingList.innerHTML = users.map((u, index) => {
        const medal = index === 0 ? "🥇 " : index === 1 ? "🥈 " : index === 2 ? "🥉 " : "";
        return `
            <div class="ranking-item">
                <span class="rank-number">${index + 1}</span>
                <span class="rank-username">${medal}${escapeHtml(u.username)}</span>
                <span class="rank-score">${u.score} pts</span>
            </div>
        `;
    }).join("");
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
