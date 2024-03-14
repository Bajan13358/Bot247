let currentBot = null;

const express = require("express");
const http = require("http");
const mineflayer = require('mineflayer')
const pvp = require('mineflayer-pvp').plugin
const armorManager = require('mineflayer-armor-manager')
const AutoAuth = require('mineflayer-auto-auth');
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Status do Bot</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          background-color: #f0f0f0;
          padding: 20px;
        }
        h1 {
          color: #333;
        }
        .menu {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 20px;
          background-color: #fff;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        #botInfo {
          margin-bottom: 20px;
        }
        footer {
          margin-top: 50px;
          font-size: 12px;
          color: #888;
        }
        .social-links {
          margin-top: 10px;
        }
        .social-links a {
          margin: 0 5px;
        }
      </style>
    </head>
    <body>
      <h1>Status do Bot</h1>
      <div id="botInfo"></div>
      <div class="menu">
        <div id="health">Vida: </div><br>
        <div id="hunger">Fome: </div><br>
        <div id="position">Posição: </div>
      </div>
      <footer>
        © 2024 DuduSync - Criado por DuduSync
        <div class="social-links">
          <a href="https://4br.me/TelegramDuduSync" target="_blank">Telegram</a>
          <a href="https://4br.me/WhatsDuduSync" target="_blank">WhatsApp</a>
          <a href="https://4br.me/InstagramDuduSync" target="_blank">Instagram</a>
        </div>
      </footer>
      <script>
        function updateBotInfo() {
          fetch('/botInfo')
            .then(response => response.json())
            .then(data => {
              const botInfoElement = document.getElementById('botInfo');
              botInfoElement.innerHTML = \`<p>Nome do Bot: \${data.username}</p>
                                          <p>Tempo Online: \${data.onlineTime}</p>\`;

              const healthElement = document.getElementById('health');
              healthElement.textContent = \`Vida: \${data.health}/20\`;

              const hungerElement = document.getElementById('hunger');
              hungerElement.textContent = \`Fome: \${data.hunger}/20\`;

              const positionElement = document.getElementById('position');
              positionElement.textContent = \`Posição: \${data.position ? Math.round(data.position.x) + ', ' + Math.round(data.position.y) + ', ' + Math.round(data.position.z) : 'Desconhecida'}\`;
            });
        }
        setInterval(updateBotInfo, 1000);
        updateBotInfo(); 

        function clearConsole() {
          console.clear();
        }
        setInterval(clearConsole, 1000);
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

app.get("/botInfo", (req, res) => {
  if (currentBot) {
    const botInfo = {
      username: currentBot.username,
      onlineTime: calculateOnlineTime(currentBot.startTime),
      hunger: Math.floor(currentBot.food),
      health: Math.floor(currentBot.health),
      position: currentBot.entity ? currentBot.entity.position : null
    };
    res.json(botInfo);
  } else {
    res.json({ username: "Nenhum bot está online", onlineTime: "", hunger: 0, health: 0, position: null });
  }
});

app.listen(process.env.PORT, () => {
  console.log("Servidor Express iniciado");
});

setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.repl.co/`);
}, 224000);

function createBot() {
  if (currentBot) {
    currentBot.quit();
  }

  const randomUsername = 'Z' + Math.floor(Math.random() * 10000);

  currentBot = mineflayer.createBot({
    host: 'seriedb.aternos.me', // Endereço do servidor Minecraft
    version: false, // Não mexer
    username: randomUsername, // Não mexer
    port: 31773, // Porta do servidor Minecraft
    plugins: [AutoAuth], // Não mexer
    AutoAuth: 'bot112022' // Não mexer
  });

  currentBot.loadPlugin(pvp);
  currentBot.loadPlugin(armorManager);

  currentBot.startTime = new Date();

  currentBot.on('login', () => {
    console.log("Bot: " + currentBot.username + " entrou no servidor.");
  });

  currentBot.on('kicked', (reason, loggedIn) => {
    if (loggedIn) {
      console.log("O bot foi expulso do servidor.");
      setTimeout(() => {
        console.log("Gerando outro bot...");
        createBot();
      }, 1000);
    }
  });

  currentBot.on('error', console.error);
}

function calculateOnlineTime(startTime) {
  if (!startTime) return "";
  const now = new Date();
  const diff = now - startTime;
  const seconds = Math.floor(diff / 1000);
  const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const remainingSeconds = String(seconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${remainingSeconds}`;
}

createBot();
