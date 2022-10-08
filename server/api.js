// Copyright (C) 2022 Radioactive64

const { subtle } = require('crypto').webcrypto;
const keys = subtle.generateKey({
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256"
}, false, ['encrypt', 'decrypt']);

module.exports = function GaruderAPIServer(server) {
    const io = new (require('socket.io')).Server(server, {
        path: '/guarder-api/',
        pingTimeout: 10000,
        upgradeTimeout: 300000
    });

    const recentConnections = [];
    const recentConnectionKicks = [];
    io.on('connection', function(socket) {
        socket.handshake.headers['x-forwarded-for'] = socket.handshake.headers['x-forwarded-for'] ?? '127.0.0.1';
        recentConnections[socket.handshake.headers['x-forwarded-for']] = (recentConnections[socket.handshake.headers['x-forwarded-for']] ?? 0)+1;
        if (recentConnections[socket.handshake.headers['x-forwarded-for']] > 3) {
            if (!recentConnectionKicks[socket.handshake.headers['x-forwarded-for']]) log('IP ' + socket.handshake.headers['x-forwarded-for'] + ' was kicked for connection spam.');
            recentConnectionKicks[socket.handshake.headers['x-forwarded-for']] = true;
            socket.emit('disconnected');
            socket.removeAllListeners();
            socket.onevent = function(packet) {};
            socket.disconnect();
            return;
        }
        socket.once('requestPublicKey', async function() {
            socket.emit('publicKey', await subtle.exportKey('jwk', (await keys).publicKey));
        });
    });
    setInterval(function() {
        for (let i in recentConnections) {
            recentConnections[i] = Math.max(recentConnections[i]-1, 0);
        }
        for (let i in recentConnectionKicks) {
            delete recentConnectionKicks[i];
        }
    }, 1000);
};