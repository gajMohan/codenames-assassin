if (typeof pubnubPublishKey === "undefined" || typeof pubnubsubscribeKey === "undefined") {
    alert("Missing PubNub keys. Copy keys.example.js to keys.js and add your publish/subscribe keys.");
}

const SESSION_KEY = "assassin-session";
const ONBOARDED_KEY = "assassin-onboarded";

let pubnub = null;
let room = "";
let playerName = "";
let playerId = "";
let players = [];
let hostId = null;
// Ids of the players dealt into the current round, or null when no round has started
let roundPlayers = null;
// The current round's message, kept so a refresh (or a reconnecting player) can get back in
let lastRound = null;

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// sessionStorage survives a refresh but not closing the tab, which is what we want for rejoining
function saveSession() {
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ room, playerName, playerId, hostId, roundPlayers, lastRound }));
    } catch (e) {}
}

function loadSession() {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY));
    } catch (e) {
        return null;
    }
}

function clearSession() {
    try {
        sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {}
}

function createRoom() {
    var random = Math.floor(Math.random() * 100000);
    room = `${getRandomElement(cities)}-${getRandomElement(objects)}-${random}`;
    playerName = document.getElementById("player-name").value || `${getRandomElement(adjectives)} ${getRandomElement(animals)}`;
    enterGame({ isCreator: true });
}

function joinRoom() {
    room = document.getElementById("join-room").value.trim();
    playerName = document.getElementById("join-player-name").value || `${getRandomElement(adjectives)} ${getRandomElement(animals)}`;
    if (!room) {
        alert("Enter a room name to join");
        return;
    }
    enterGame({ isCreator: false });
}

function enterGame({ isCreator, saved }) {
    // A fresh connection per room, so leaving and rejoining doesn't stack listeners.
    // After a refresh we reuse the saved id so the room still recognises us.
    pubnub = new PubNub({
        publishKey: pubnubPublishKey,
        subscribeKey: pubnubsubscribeKey,
        uuid: saved ? saved.playerId : PubNub.generateUUID()
    });
    playerId = pubnub.getUUID();
    hostId = saved ? saved.hostId : (isCreator ? playerId : null);
    roundPlayers = saved ? saved.roundPlayers : null;
    lastRound = saved ? saved.lastRound : null;
    players = [];
    saveSession();

    document.getElementById("setup-container").classList.add("hidden");
    document.getElementById("game-container").classList.remove("hidden");
    document.getElementById("room-display").innerText = room;
    document.getElementById("player-name-display").innerText = `Playing as ${playerName}`;

    addPlayer(playerName, playerId);
    if (lastRound && lastRound.players.includes(playerId)) {
        showRound(lastRound);
    } else if (isWaiting(playerId)) {
        showWaitingForNextRound();
    }

    let connection = pubnub;
    pubnub.addListener({
        status: function(event) {
            // Only announce ourselves once the subscription is live, otherwise the message can be missed
            if (event.category === "PNConnectedCategory") {
                pubnub.publish({
                    channel: room,
                    message: { type: "join", playerName, playerId }
                });
            }
        },
        message: function(event) {
            // Ignore stragglers from a room we've already left
            if (connection === pubnub) {
                handleMessage(event.message);
                if (pubnub) {
                    saveSession();
                }
            }
        }
    });

    pubnub.subscribe({ channels: [room] });
}

function handleMessage(message) {
    if (message.type === "round") {
        // Catch-up rounds are resent for one player only
        if (message.for && message.for !== playerId) {
            return;
        }
        lastRound = { roundId: message.roundId, assassin: message.assassin, number: message.number, players: message.players };
        roundPlayers = message.players;
        if (roundPlayers.includes(playerId)) {
            showRound(lastRound);
        } else {
            showWaitingForNextRound();
        }
        updatePlayersList();
    } else if (message.type === "join") {
        addPlayer(message.playerName, message.playerId);
        if (message.playerId === playerId) {
            return;
        }
        // Let the newcomer know who is already in the room. Only the host shares the round state.
        let isHost = hostId === playerId;
        pubnub.publish({
            channel: room,
            message: {
                type: "present",
                playerName,
                playerId,
                isHost,
                roundPlayers: isHost ? roundPlayers : null
            }
        });
        // Someone dealt into this round has refreshed or reconnected, so send them their round again
        if (isHost && lastRound && lastRound.players.includes(message.playerId)) {
            pubnub.publish({
                channel: room,
                message: { type: "round", ...lastRound, for: message.playerId }
            });
        }
    } else if (message.type === "present") {
        addPlayer(message.playerName, message.playerId);
        if (message.isHost) {
            hostId = message.playerId;
            if (message.roundPlayers && !message.roundPlayers.includes(playerId)) {
                roundPlayers = message.roundPlayers;
                showWaitingForNextRound();
            }
            updatePlayersList();
        }
    } else if (message.type === "leave") {
        if (message.playerId === playerId) {
            // The host removed us
            exitRoom();
            alert("The host removed you from the room.");
            return;
        }
        players = players.filter(player => player.id !== message.playerId);
        if (hostId === message.playerId) {
            hostId = message.newHostId;
        }
        updatePlayersList();
    }
}

function addPlayer(name, id) {
    if (players.some(player => player.id === id)) {
        return;
    }
    players.push({ 'name': name, 'id': id });
    updatePlayersList();
}

function isWaiting(id) {
    return roundPlayers !== null && !roundPlayers.includes(id);
}

function startRound() {
    if (hostId !== playerId) {
        return;
    }
    if (players.length < 3) {
        alert("At least 3 players are needed to start the round.");
        return;
    }
    let assassin = getRandomElement(players).id;
    let number = Math.floor(Math.random() * 25) + 1;
    let roundId = PubNub.generateUUID();

    pubnub.publish({
        channel: room,
        message: { type: "round", roundId, assassin, number, players: players.map(player => player.id) }
    });
}

function removePlayer(id) {
    let player = players.find(player => player.id === id);
    if (hostId !== playerId || !player) {
        return;
    }
    if (!confirm(`Remove ${player.name} from the room?`)) {
        return;
    }
    pubnub.publish({ channel: room, message: { type: "leave", playerId: id, newHostId: null } });
}

function leaveRoom() {
    let newHostId = null;
    if (hostId === playerId) {
        // Hand the room to someone already playing, if possible
        let others = players.filter(player => player.id !== playerId);
        let next = others.find(player => !isWaiting(player.id)) || others[0];
        newHostId = next ? next.id : null;
    }
    pubnub.publish({ channel: room, message: { type: "leave", playerId, newHostId } });
    exitRoom();
}

function exitRoom() {
    let leavingPubnub = pubnub;
    // Give the leave message a moment to go out before disconnecting
    setTimeout(() => {
        leavingPubnub.unsubscribeAll();
        leavingPubnub.stop();
    }, 1000);

    pubnub = null;
    room = "";
    players = [];
    hostId = null;
    roundPlayers = null;
    lastRound = null;
    clearSession();
    resetBoard();
    document.getElementById("players-list").innerHTML = "";
    document.getElementById("copy-status").textContent = "";
    document.getElementById("game-container").classList.add("hidden");
    document.getElementById("setup-container").classList.remove("hidden");
}

function resetBoard() {
    let roleBanner = document.getElementById("role-banner");
    roleBanner.className = "text-center text-muted-foreground";
    roleBanner.textContent = "The board appears here when a round starts.";
    document.getElementById("grid-container").innerHTML = "";
    document.getElementById("grid-container").classList.add("hidden");
    document.getElementById("board").classList.remove("order-first", "lg:order-none");
}

function showWaitingForNextRound() {
    resetBoard();
    let roleBanner = document.getElementById("role-banner");
    roleBanner.className = "rounded-lg bg-amber-500/15 px-4 py-2 text-center font-display text-lg font-semibold text-amber-300";
    roleBanner.textContent = "A round is in progress. You'll be dealt in when the host starts the next one.";
}

function updatePlayersList() {
    let playersList = document.getElementById("players-list");
    let isHost = hostId === playerId;
    playersList.innerHTML = "";
    players.forEach(player => {
        let li = document.createElement("li");
        li.className = "flex min-h-12 items-center gap-3 rounded-lg bg-muted py-2 pl-3 pr-1";
        let avatar = document.createElement("span");
        avatar.className = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-semibold uppercase";
        avatar.setAttribute("aria-hidden", "true");
        avatar.textContent = player.name.trim().charAt(0) || "?";
        let name = document.createElement("span");
        name.className = "min-w-0 truncate";
        name.textContent = player.name;
        li.append(avatar, name);

        let tags = [];
        if (player.id === hostId) {
            tags.push("host");
        }
        if (isWaiting(player.id)) {
            tags.push("waiting");
        }
        if (player.id === playerId) {
            tags.push("you");
        }
        let tag = document.createElement("span");
        tag.className = "ml-auto shrink-0 pr-2 text-xs text-muted-foreground";
        tag.textContent = tags.join(" · ");
        li.appendChild(tag);

        // The host can clear out players who closed their tab without leaving
        if (isHost && player.id !== playerId) {
            let remove = document.createElement("button");
            remove.type = "button";
            remove.className = "inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400";
            remove.setAttribute("aria-label", `Remove ${player.name}`);
            remove.innerHTML = '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
            remove.addEventListener("click", () => removePlayer(player.id));
            li.appendChild(remove);
        }
        playersList.appendChild(li);
    });
    document.getElementById("player-count").innerText = players.length;

    let waitingText = document.getElementById("waiting-text");
    if (players.length < 3) {
        waitingText.textContent = "Waiting for players (3 needed)";
    } else if (!isHost) {
        waitingText.textContent = roundPlayers === null ? "Waiting for the host to start" : "The host starts the next round";
    }
    let canStart = isHost && players.length >= 3;
    document.getElementById("waiting-message").classList.toggle("hidden", canStart);
    document.getElementById("start-round").classList.toggle("hidden", !canStart);
    if (canStart) {
        document.getElementById("start-round").innerText = roundPlayers === null ? "Start round" : "Start new round";
    }
}

function showRound(round) {
    let isAssassin = round.assassin === playerId;
    let roleBanner = document.getElementById("role-banner");
    let gridContainer = document.getElementById("grid-container");
    // On phones the board sits under the player list, so bring it to the top once a round starts
    document.getElementById("board").classList.add("order-first", "lg:order-none");
    if (isAssassin) {
        roleBanner.className = "rounded-lg bg-red-500/15 px-4 py-2 text-center font-display text-lg font-semibold text-red-300";
        roleBanner.textContent = "You are the Assassin. Blend in.";
    } else {
        roleBanner.className = "rounded-lg bg-green-500/15 px-4 py-2 text-center font-display text-lg font-semibold text-green-300";
        roleBanner.textContent = "You are an agent. The highlighted card is the secret word.";
    }
    gridContainer.classList.remove("hidden");
    generateGrid(gridContainer, isAssassin, round.number);
}

// Draws the 7×7 board: agent cards in the corners and the 5×5 word grid in the middle.
// `words` labels the cards, for the table illustration in How to Play.
function generateGrid(gridContainer, isAssassin, number, { animate = true, words = null } = {}) {
    gridContainer.innerHTML = "";
    let wordIndex = 0;
    for (let i = 0; i < 49; i++) {
        let cell = document.createElement("div");
        cell.className = "aspect-[3/2] rounded-[12%]";
        if (animate) {
            cell.classList.add("fade-in");
            cell.style.animationDelay = `${i * 8}ms`;
        }
        if ([0,6,42,48].includes(i)) {
            cell.classList.add("bg-cover", "bg-center", "shadow-md");
            if(i === 0){
                cell.style.backgroundImage = "url('./assets/r1.jpg')";
            }else if(i === 6){
                cell.style.backgroundImage = "url('./assets/r2.jpg')";
            }else if(i === 42){
                cell.style.backgroundImage = "url('./assets/b1.jpg')";
            }else{
                cell.style.backgroundImage = "url('./assets/b2.jpg')";
            }
        } else if (i >= 8 && i <= 40 && (i % 7 !== 0 && i % 7 !== 6)) {
            wordIndex++;
            if(isAssassin){
                cell.classList.add("bg-cover", "bg-center", "shadow-md");
                cell.style.backgroundImage = "url('./assets/assassin.jpg')";
            }else if(wordIndex === number){
                // Marked with an icon as well as colour so it isn't colour-only
                cell.classList.add("flex", "items-center", "justify-center", "bg-secret", "shadow-lg", "ring-2", "ring-white");
                cell.setAttribute("role", "img");
                cell.setAttribute("aria-label", `Secret word: card ${number}`);
                cell.innerHTML = '<svg class="h-1/2 w-1/2 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/></svg>';
            }else{
                cell.classList.add("bg-word", "shadow-sm");
            }
            if (words) {
                cell.classList.add("flex", "items-center", "justify-center", "overflow-hidden", "text-[0.5rem]", "font-semibold", "uppercase", "tracking-tight", "text-slate-800", "sm:text-[0.6rem]");
                cell.textContent = words[wordIndex - 1];
            }
        }
        gridContainer.appendChild(cell);
    }
}

function copyRoomName() {
    let status = document.getElementById("copy-status");
    navigator.clipboard.writeText(room).then(() => {
        status.textContent = "Copied! Share it with your friends.";
    }).catch(() => {
        status.textContent = "Couldn't copy. Select the name above instead.";
    });
    setTimeout(() => { status.textContent = ""; }, 2500);
}

// How to Play: a short step-through walkthrough
let helpModal = document.getElementById("help-modal");
let helpSteps = [...helpModal.querySelectorAll("[data-step]")];
let helpStep = 0;
let lastFocused = null;

const TABLE_WORDS = [
    "piano", "moon", "spy", "ghost", "lemon",
    "bridge", "crown", "tokyo", "bat", "laser",
    "nurse", "pirate", "jet", "seal", "march",
    "glove", "eagle", "opera", "ice", "wall",
    "honey", "comet", "train", "rose", "atlas"
];

function drawHelpIllustrations() {
    generateGrid(document.getElementById("help-table"), false, 0, { animate: false, words: TABLE_WORDS });
    generateGrid(document.getElementById("help-agent-phone"), false, 14, { animate: false });
    generateGrid(document.getElementById("help-assassin-phone"), true, 0, { animate: false });
}

function showHelpStep(step) {
    helpStep = step;
    helpSteps.forEach((el, index) => el.classList.toggle("hidden", index !== step));
    document.querySelectorAll("[data-step-dot]").forEach((dot, index) => {
        dot.classList.toggle("bg-accent", index === step);
        dot.classList.toggle("w-6", index === step);
        dot.classList.toggle("bg-slate-600", index !== step);
    });
    document.getElementById("help-progress").textContent = `Step ${step + 1} of ${helpSteps.length}`;
    document.getElementById("help-back").classList.toggle("invisible", step === 0);
    let isLast = step === helpSteps.length - 1;
    document.getElementById("help-next").textContent = isLast ? "Let's play" : "Next";
    document.getElementById("help-skip").classList.toggle("invisible", isLast);
}

function openHelp() {
    lastFocused = document.activeElement;
    showHelpStep(0);
    helpModal.classList.remove("hidden");
    document.getElementById("help-next").focus();
}

function closeHelp() {
    helpModal.classList.add("hidden");
    try {
        localStorage.setItem(ONBOARDED_KEY, "1");
    } catch (e) {}
    if (lastFocused) {
        lastFocused.focus();
    }
}

document.getElementById("help-button").addEventListener("click", openHelp);
document.getElementById("close-help").addEventListener("click", closeHelp);
document.getElementById("help-skip").addEventListener("click", closeHelp);
document.getElementById("help-back").addEventListener("click", () => showHelpStep(Math.max(0, helpStep - 1)));
document.getElementById("help-next").addEventListener("click", () => {
    if (helpStep === helpSteps.length - 1) {
        closeHelp();
    } else {
        showHelpStep(helpStep + 1);
    }
});
helpModal.addEventListener("click", (event) => {
    if (event.target === helpModal) {
        closeHelp();
    }
});
document.addEventListener("keydown", (event) => {
    if (helpModal.classList.contains("hidden")) {
        return;
    }
    if (event.key === "Escape") {
        closeHelp();
    } else if (event.key === "ArrowRight" && helpStep < helpSteps.length - 1) {
        showHelpStep(helpStep + 1);
    } else if (event.key === "ArrowLeft" && helpStep > 0) {
        showHelpStep(helpStep - 1);
    }
});

window.onload = () => {
    drawHelpIllustrations();
    let saved = loadSession();
    if (saved && saved.room) {
        // We were in a room before a refresh, so go straight back in
        room = saved.room;
        playerName = saved.playerName;
        enterGame({ isCreator: false, saved });
        return;
    }
    let onboarded = false;
    try {
        onboarded = localStorage.getItem(ONBOARDED_KEY) === "1";
    } catch (e) {}
    if (!onboarded) {
        openHelp();
    }
};
