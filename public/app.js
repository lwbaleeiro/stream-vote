// ===== State =====
let ws = null;
const polls = new Map();
const inactivePolls = new Map();
const user = {
    id: localStorage.getItem("streamVote_userId"),
    username: localStorage.getItem("streamVote_username")
};

// ===== DOM =====
const statusEl          = document.getElementById("connectionStatus");
const pollsList         = document.getElementById("pollsList");
const inactivePollsList = document.getElementById("inactivePollsList");
const form              = document.getElementById("createPollForm");
const optionsContainer  = document.getElementById("optionsContainer");
const addOptionBtn      = document.getElementById("addOptionBtn");
const refreshBtn        = document.getElementById("refreshBtn");
const toastContainer    = document.getElementById("toastContainer");
const authSection       = document.getElementById("authSection");
const mainContent       = document.getElementById("mainContent");
const authForm          = document.getElementById("authForm");
const userProfile       = document.getElementById("userProfile");
const guestProfile      = document.getElementById("guestProfile");
const usernameDisplay   = document.getElementById("usernameDisplay");
const logoutBtn         = document.getElementById("logoutBtn");
const registerBtn       = document.getElementById("registerBtn");
const showAuthBtn       = document.getElementById("showAuthBtn");
const closeAuthBtn      = document.getElementById("closeAuthBtn");
const rankingSidebar    = document.getElementById("rankingSidebar");
const rankingList       = document.getElementById("rankingList");
const createPollSection = document.getElementById("createPollSection");
const showCreatePollBtn = document.getElementById("showCreatePollBtn");
const closeCreateBtn    = document.getElementById("closeCreateBtn");

// ===== Init =====
function init() {
    connectWebSocket();
    if (user.id) {
        showMainContent();
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
    mainContent.classList.remove("hidden");
    rankingSidebar.classList.remove("hidden");
    userProfile.classList.add("hidden");
    guestProfile.classList.remove("hidden");
}

// ===== WebSocket =====
function connectWebSocket() {
    if (ws) {
        ws.intentionalClose = true;
        ws.close();
    }

    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const url = new URL(`${protocol}//${location.host}`);
    if (user.id) {
        url.searchParams.set("userId", user.id);
    }
    
    const socket = new WebSocket(url.toString());
    ws = socket;

    socket.addEventListener("open", () => {
        statusEl.classList.add("connected");
        statusEl.querySelector(".status-text").textContent = "Connected";
        showToast("Connected to server!", "success");
        socket.send(JSON.stringify({ type: "GET_POLLS" }));
        socket.send(JSON.stringify({ type: "GET_INACTIVE_POLLS" }));
        socket.send(JSON.stringify({ type: "GET_RANKING" }));
    });

    socket.addEventListener("close", () => {
        statusEl.classList.remove("connected");
        statusEl.querySelector(".status-text").textContent = "Disconnected";
        
        // Only reconnect if it wasn't us closing it!
        if (!socket.intentionalClose) {
            showToast("Connection lost. Reconnecting...", "info");
            setTimeout(connectWebSocket, 3000);
        }
    });

    socket.addEventListener("message", (e) => handleWsMessage(JSON.parse(e.data)));
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

// ===== UI handlers =====
showAuthBtn.addEventListener("click", () => {
    if (user.id) { showToast("You are already logged in!", "info"); return; }
    authSection.classList.add("active");
});
closeAuthBtn.addEventListener("click", () => authSection.classList.remove("active"));

showCreatePollBtn.addEventListener("click", () => {
    if (!user.id) {
        showToast("Please login to create a poll.", "info");
        authSection.classList.add("active");
        return;
    }
    createPollSection.classList.toggle("active");
});
closeCreateBtn.addEventListener("click", () => createPollSection.classList.remove("active"));

// ===== Auth =====
authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    try {
        const res  = await fetch("/api/login", {
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
    } catch (err) { showToast(err.message, "error"); }
});

registerBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    if (!username || !password) { showToast("Please fill in username and password.", "error"); return; }
    try {
        const res  = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration error");
        showToast("Account created! Now please login.", "success");
    } catch (err) { showToast(err.message, "error"); }
});

logoutBtn.addEventListener("click", () => { localStorage.clear(); location.reload(); });

// ===== Poll form =====
form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title        = document.getElementById("pollTitle").value.trim();
    const endDateInput = document.getElementById("pollEndDate").value;
    const rows         = optionsContainer.querySelectorAll(".option-row");
    const options      = [];
    let correctOptionIndex = null;

    rows.forEach(row => {
        const text = row.querySelector(".option-input").value.trim();
        if (text) {
            options.push(text);
            if (row.querySelector('input[name="correctOption"]').checked)
                correctOptionIndex = options.length - 1;
        }
    });

    if (options.length < 2)          return showToast("At least 2 options.", "error");
    if (correctOptionIndex === null)  return showToast("Select the correct option.", "error");
    if (endDateInput && new Date(endDateInput) <= new Date())
        return showToast("End date must be in the future.", "error");

    ws.send(JSON.stringify({
        type: "CREATE_POLL",
        data: { title, options, correctOptionIndex,
                endDate: endDateInput ? new Date(endDateInput).toISOString() : null }
    }));
    form.reset();
    resetOptions();
});

function resetOptions() {
    optionsContainer.innerHTML = `
        <div class="option-row">
            <input type="text" class="option-input" placeholder="Option 1" required>
            <label class="correct-option-label">
                <input type="radio" name="correctOption" value="0"><span>Correct</span>
            </label>
        </div>
        <div class="option-row">
            <input type="text" class="option-input" placeholder="Option 2" required>
            <label class="correct-option-label">
                <input type="radio" name="correctOption" value="1"><span>Correct</span>
            </label>
        </div>`;
}

addOptionBtn.addEventListener("click", () => {
    const count = optionsContainer.querySelectorAll(".option-row").length;
    const row   = document.createElement("div");
    row.className = "option-row";
    row.innerHTML = `
        <input type="text" class="option-input" placeholder="Option ${count + 1}">
        <label class="correct-option-label">
            <input type="radio" name="correctOption" value="${count}"><span>Correct</span>
        </label>`;
    optionsContainer.appendChild(row);
    row.querySelector(".option-input").focus();
});

refreshBtn.addEventListener("click", () => ws.send(JSON.stringify({ type: "GET_POLLS" })));

function vote(pollId, optionIndex) {
    if (!user.id) {
        showToast("Please login to vote.", "info");
        authSection.classList.add("active");
        return;
    }
    const poll = polls.get(pollId);
    if (!poll) return;
    if (!poll.isActive || (poll.endDate && new Date(poll.endDate) <= new Date())) {
        showToast("This poll is already closed.", "error");
        return;
    }
    ws.send(JSON.stringify({ type: "VOTE", data: { pollId, optionIndex } }));
}

// ===================================================================
// CAROUSEL
// ===================================================================
//
// THE ONLY CORRECT WAY to size cards inside overflow-x:auto:
//   Use container.clientWidth (visible area) and set card widths in px.
//
// Percentage widths inside overflow-x:auto resolve against the *total
// scrollable width*, not the visible area — so they always break.
//
// ResizeObserver fires after the browser has completed layout reflow,
// so clientWidth is always up-to-date (fixes the sidebar-collapse bug).
// ===================================================================

const GAP = 16; // px — must match gap:16px in .carousel-container CSS

function columns(containerWidth) {
    if (containerWidth >= 900) return 3;
    if (containerWidth >= 500) return 2;
    return 1;
}

function sizeCards(container) {
    const w    = container.clientWidth;
    const cols = columns(w);
    // Subtract total gap space between visible columns, then divide
    const cardW = Math.floor((w - GAP * (cols - 1)) / cols);
    container.querySelectorAll(".poll-item").forEach(card => {
        card.style.width    = cardW + "px";
        card.style.minWidth = cardW + "px";
        card.style.maxWidth = cardW + "px";
    });
    return { cols, cardW };
}

function initCarousel(containerId, dotsId, prevId, nextId) {
    const container     = document.getElementById(containerId);
    const dotsContainer = document.getElementById(dotsId);
    const prevBtn       = document.getElementById(prevId);
    const nextBtn       = document.getElementById(nextId);
    if (!container || !dotsContainer) return;

    const cards = container.querySelectorAll(".poll-item");
    if (cards.length === 0) {
        if (prevBtn) prevBtn.style.display = "none";
        if (nextBtn) nextBtn.style.display = "none";
        dotsContainer.innerHTML = "";
        return;
    }

    // --- helpers ---
    const pageWidth = () => {
        const { cols, cardW } = sizeCards(container);
        return cols * cardW + (cols - 1) * GAP;
    };

    const pageCount = () => {
        const cols = columns(container.clientWidth);
        return Math.ceil(cards.length / cols);
    };

    const buildDots = () => {
        const pages = pageCount();
        dotsContainer.innerHTML = "";
        if (pages <= 1) return;
        for (let i = 0; i < pages; i++) {
            const d = document.createElement("div");
            d.className = "dot" + (i === 0 ? " active" : "");
            d.addEventListener("click", () => {
                container.scrollTo({ left: i * pageWidth(), behavior: "smooth" });
            });
            dotsContainer.appendChild(d);
        }
    };

    const updateUI = () => {
        const sl       = container.scrollLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;
        const canScroll = maxScroll > 8;

        // dots
        const pw = pageWidth();
        const activePage = pw > 0 ? Math.round(sl / pw) : 0;
        dotsContainer.querySelectorAll(".dot").forEach((d, i) =>
            d.classList.toggle("active", i === activePage));

        // arrows: only on ≥600px screens and when content actually overflows
        const showArrows = window.innerWidth >= 600 && canScroll;
        if (prevBtn) {
            prevBtn.style.display = showArrows ? "flex" : "none";
            prevBtn.disabled = sl < 8;
        }
        if (nextBtn) {
            nextBtn.style.display = showArrows ? "flex" : "none";
            nextBtn.disabled = sl >= maxScroll - 8;
        }
    };

    // arrows
    if (prevBtn) prevBtn.onclick = () =>
        container.scrollBy({ left: -pageWidth(), behavior: "smooth" });
    if (nextBtn) nextBtn.onclick = () =>
        container.scrollBy({ left:  pageWidth(), behavior: "smooth" });

    container.addEventListener("scroll", updateUI, { passive: true });

    // ResizeObserver — fires after reflow, so clientWidth is correct
    // even when the sidebar collapses and the main column widens.
    const ro = new ResizeObserver(() => {
        sizeCards(container);
        buildDots();
        updateUI();
    });
    ro.observe(container);
}

// ===== Render =====
function renderPolls() {
    if (polls.size === 0) {
        pollsList.innerHTML = '<p class="empty-state">No active polls. Create one above!</p>';
    } else {
        pollsList.innerHTML = "";
        Array.from(polls.values())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .forEach(p => pollsList.appendChild(createPollElement(p)));
    }

    if (inactivePollsList) {
        if (inactivePolls.size === 0) {
            inactivePollsList.innerHTML = '<p class="empty-state">No finished polls yet.</p>';
        } else {
            inactivePollsList.innerHTML = "";
            Array.from(inactivePolls.values())
                .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))
                .forEach(p => inactivePollsList.appendChild(createPollElement(p)));
        }
    }

    initCarousel("pollsList",         "dotsActive",   "prevActive",   "nextActive");
    initCarousel("inactivePollsList",  "dotsInactive", "prevInactive", "nextInactive");
}

function createPollElement(poll) {
    const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
    const isExpired  = poll.endDate && new Date(poll.endDate) <= new Date();
    const isInactive = !poll.isActive || isExpired;

    const optionsHtml = poll.options.map(opt => {
        const pct          = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
        const correctClass = isInactive && opt.isCorrect ? "is-correct" : "";
        const correctBadge = isInactive && opt.isCorrect ? '<span class="correct-badge">✓</span>' : "";
        const disabledClass = isInactive ? "disabled" : "";
        const clickAttr     = !isInactive ? `onclick="vote('${poll.id}', ${opt.index})"` : "";
        return `
            <div class="poll-option ${correctClass} ${disabledClass}" ${clickAttr}>
                <div class="option-bar" style="width:${pct}%"></div>
                <span class="option-text">${escapeHtml(opt.text)}${correctBadge}</span>
                <span class="option-votes">${opt.votes} (${pct}%)</span>
            </div>`;
    }).join("");

    const el = document.createElement("div");
    el.className = `poll-item${isInactive ? " poll-expired" : ""}`;

    const endStr     = poll.endDate ? new Date(poll.endDate).toLocaleString("en-US") : "No deadline";
    const statusText = isInactive ? '<span class="status-expired">Closed</span>' : "";
    const winners    = isInactive && poll.winnersCount !== undefined
        ? `<span class="winners-count">🏆 ${poll.winnersCount} winners</span>` : "";
    const icons      = ["📊","🗳️","📈","🔥","✨"];
    const icon       = icons[poll.id.charCodeAt(0) % icons.length];

    el.innerHTML = `
        <div class="poll-card-header">
            <span style="font-size:2.8rem;z-index:1;position:relative">${icon}</span>
        </div>
        <div class="poll-card-content">
            <h3>${escapeHtml(poll.title)} ${statusText}</h3>
            <div class="poll-options">${optionsHtml}</div>
            <div class="poll-meta">
                <div class="poll-stats">
                    <div><strong>Total:</strong> ${totalVotes} votes</div>
                    <div style="opacity:.7"><strong>End:</strong> ${endStr}</div>
                </div>
                ${winners}
            </div>
        </div>`;
    return el;
}

function renderRanking(users) {
    if (!users || users.length === 0) {
        rankingList.innerHTML = '<p class="empty-state">No one has scored yet.</p>';
        return;
    }
    rankingList.innerHTML = users.map((u, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
        return `
            <div class="ranking-item">
                <span class="rank-number">${i + 1}</span>
                <span class="rank-username">${medal} ${escapeHtml(u.username)}</span>
                <span class="rank-score">${u.score} pts</span>
            </div>`;
    }).join("");
}

function escapeHtml(text) {
    const d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
}

function showToast(message, type = "info") {
    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.textContent = message;
    toastContainer.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

init();