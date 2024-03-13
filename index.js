const express = require("express");
const http = require("http");
const mineflayer = require('mineflayer')
const pvp = require('mineflayer-pvp').plugin
const { pathfinder, Movements, goals} = require('mineflayer-pathfinder')
const armorManager = require('mineflayer-armor-manager')
const AutoAuth = require('mineflayer-auto-auth');
const app = express();

app.use(express.json());

// Página HTML para exibir informações do bot
app.get("/", (req, res) => {
  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bot Status</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <h1>Status do Bot</h1>
      <div id="botInfo"></div>
      <script>
        function updateBotInfo() {
          fetch('/botInfo')
            .then(response => response.json())
            .then(data => {
              const botInfoElement = document.getElementById('botInfo');
              botInfoElement.innerHTML = \`<p>Nome do Bot: \${data.username}</p>
                                          <p>Tempo Online: \${data.onlineTime}</p>
                                          <p>Vida: \${data.health}/20</p>
                                          <p>Fome: \${data.food}/20</p>
                                          <p>Cordenadas: X: \${data.position.x.toFixed(0)}, Y: \${data.position.y.toFixed(0)}, Z: \${data.position.z.toFixed(0)}</p>\`;
            });
        }
        setInterval(updateBotInfo, 1000); // Atualizar a cada segundo
        updateBotInfo(); // Atualizar imediatamente ao carregar a página
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

// Rota para fornecer informações do bot em formato JSON
app.get("/botInfo", (req, res) => {
  if (currentBot) {
    const botInfo = {
      username: currentBot.username,
      onlineTime: calculateOnlineTime(currentBot.startTime),
      health: Math.round(currentBot.health), // Arredonda para o número inteiro mais próximo
      food: currentBot.food,
      position: currentBot.entity.position
    };
    res.json(botInfo);
  } else {
    res.json({ username: "Nenhum bot está online", onlineTime: "", health: 0, food: 0, position: { x: 0, y: 0, z: 0 } });
  }
});

app.listen(process.env.PORT, () => {
  console.log("Servidor Express iniciado");
});

setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.repl.co/`);
}, 224000);

let currentBot = null;

function createBot() {
  if (currentBot) {
    currentBot.quit();
  }

  const randomUsername = 'Z' + Math.floor(Math.random() * 10000);
  
  currentBot = mineflayer.createBot({
    host: 'seriedb.aternos.me',
    version: false,
    username: randomUsername,
    port: 31773,
    gamemode: 3, // Modo de jogo espectador
    plugins: [AutoAuth],
    AutoAuth: 'bot112022'
  });

  currentBot.loadPlugin(pvp);
  currentBot.loadPlugin(armorManager);
  currentBot.loadPlugin(pathfinder);

  currentBot.startTime = new Date(); // Definindo a propriedade startTime

  currentBot.on('kicked', (reason, loggedIn) => {
    if (loggedIn) {
      setTimeout(() => {
        createBot();
      }, 5000);
    }
  });

  currentBot.on('chat', (username, message) => {
    if (message === 'vem') {
      const player = currentBot.players[username];
      if (!player || !player.entity) {
        currentBot.chat("Não posso encontrar você, " + username + "!");
        return;
      }
      const { x, y, z } = player.entity.position;
      const mcData = require('minecraft-data')(currentBot.version);
      const movements = new Movements(currentBot, mcData);
      currentBot.pathfinder.setMovements(movements);

      currentBot.chat(`Estou indo, ${username}!`);
      
      currentBot.pathfinder.setGoal(new goals.GoalNear(x, y, z, 1)); // Mover-se para uma posição próxima do jogador
    }
  });

  currentBot.on('kicked', console.log);
  currentBot.on('error', console.log);
}

function calculateOnlineTime(startTime) {
  if (!startTime) return "";

  const now = new Date();
  const diff = now - startTime;
  const seconds = Math.floor(diff / 1000);
  const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const remainingSeconds = String(seconds % 60).padStart(2, '0');

  const formattedTime = `${hours}:${minutes}:${remainingSeconds}`;
  return formattedTime;
}

createBot();
