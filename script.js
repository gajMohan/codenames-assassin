let pubnub = new PubNub({
    publishKey: pubnubPublishKey,
    subscribeKey: pubnubsubscribeKey,
    uuid: PubNub.generateUUID()
});

let room = "";
let playerName = "";
let playerId = "";
let players = [];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function createRoom() {
    var random = Math.floor(Math.random() * 100000);
    room = `${getRandomElement(cities)}-${getRandomElement(objects)}-${random}`;
    playerName = document.getElementById("player-name").value || `${getRandomElement(adjectives)} ${getRandomElement(animals)}`;
    enterGame();
}

function joinRoom() {
    room = document.getElementById("join-room").value;
    playerName = document.getElementById("join-player-name").value || `${getRandomElement(adjectives)} ${getRandomElement(animals)}`;
    var microtime = (Date.now() % 1000) / 1000;
    playerId = `${playerName.replace(/\s+/g, '-').toLowerCase()}-${microtime}`;
    if (!room) {
        alert("Enter a room name to join");
        return;
    }
    enterGame();
}

function enterGame() {
    document.getElementById("setup-container").classList.add("hidden");
    document.getElementById("game-container").classList.remove("hidden");
    document.getElementById("room-display").innerText = `Room: ${room}`;
    document.getElementById("player-name-display").innerText = `You are: ${playerName}`;
    
    pubnub.subscribe({ channels: [room] });
    pubnub.publish({
        channel: room,
        message: { type: "join", playerName, playerId }
    });

    updatePlayersList();
    
    pubnub.addListener({
        message: function(event) {
            if (event.message.type === "round") {
                document.getElementById("grid-container").classList.remove("hidden");
                generateGrid(event.message.assassin === playerId, event.message.number);
                document.getElementById("start-round").innerText = "Start a New Round";
            } else if (event.message.type === "join") {
                players.push({'name' : event.message.playerName, 'id' : event.message.playerId});
                updatePlayersList();
            }
        }
    });
}

function startRound() {
    if (players.length < 3) {
        alert("At least 3 players are needed to start the round.");
        return;
    }
    let assassin = getRandomElement(players).id;
    let number = Math.floor(Math.random() * 25) + 1;
    
    pubnub.publish({
        channel: room,
        message: { type: "round", assassin, number }
    });
}

function updatePlayersList() {
    let playersList = document.getElementById("players-list");
    playersList.innerHTML = "";
    players.forEach(player => {
        let li = document.createElement("li");
        li.textContent = player.name;
        playersList.appendChild(li);
    });
    document.getElementById("player-count").innerText = players.length;
    
    if (players.length >= 3) {
        document.getElementById("waiting-message").classList.add("hidden");
        document.getElementById("start-round").classList.remove("hidden");
    } else {
        document.getElementById("waiting-message").classList.remove("hidden");
        document.getElementById("start-round").classList.add("hidden");
    }
}

function generateGrid(isAssassin, number) {
    let gridContainer = document.getElementById("grid-container");
    gridContainer.innerHTML = "";
    for (let i = 0; i < 49; i++) {
        let cell = document.createElement("div");
        cell.classList.add("w-12", "h-8", "border-2", "border-transparent");
        if ([0,6,42,48].includes(i)) {
            
            cell.style.backgroundSize = "cover";
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
            if(isAssassin){
                cell.style.backgroundSize = "cover";
                cell.style.backgroundImage = "url('./assets/assassin.jpg')";
            }else{
                if(i - 8 + 1 === number){
                    cell.style.backgroundColor = "green";
                }else{
                    cell.style.backgroundColor = "#f5f5dc";
                }
            }
            
        } else {
            cell.style.backgroundColor = "transparent";
            cell.classList.remove("border");

        }
        gridContainer.appendChild(cell);
    }
}

document.getElementById("help-button").addEventListener("click", () => {
    document.getElementById("help-modal").classList.remove("hidden");
});
document.getElementById("close-help").addEventListener("click", () => {
    document.getElementById("help-modal").classList.add("hidden");
});

window.onload = () => {
    document.getElementById("help-modal").classList.remove("hidden");
};