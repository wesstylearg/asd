const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Permite conexión desde GitHub Pages
});

let gameState = {
    players: {},
    ball: { x: 640, y: 300, vx: 0, vy: 0 }
};

io.on('connection', (socket) => {
    console.log('Jugador conectado:', socket.id);

    // Asignar equipo según orden de llegada
    const team = Object.keys(gameState.players).length === 0 ? 'local' : 'visitor';
    gameState.players[socket.id] = { 
        x: team === 'local' ? 300 : 1000, 
        y: 300, 
        team: team,
        rot: 0
    };

    socket.emit('init', { id: socket.id, team: team });

    socket.on('pInput', (data) => {
        if (gameState.players[socket.id]) {
            gameState.players[socket.id].x = data.x;
            gameState.players[socket.id].y = data.y;
            gameState.players[socket.id].rot = data.rot;
            // Solo actualizamos la pelota si el jugador tiene la "autoridad" (está cerca de ella)
            if (data.ballUpdate) {
                gameState.ball = data.ballUpdate;
            }
        }
    });

    socket.on('disconnect', () => {
        delete gameState.players[socket.id];
        io.emit('update', gameState);
    });
});

// Enviar actualizaciones constantes (60fps)
setInterval(() => {
    io.emit('update', gameState);
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));