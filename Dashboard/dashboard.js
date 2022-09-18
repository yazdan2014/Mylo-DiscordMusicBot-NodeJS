// const WebSocketClient = require("websocket").client
// const client = new WebSocketClient()

// client.on('connectFailed', function(error) {
//     console.log('Connect Error: ' + error.toString());
// });

// client.on('connect', function(connection) {
//     console.log('WebSocket Client Connected');
//     connection.on('error', function(error) {
//         console.log("Connection Error: " + error.toString());
//     });
//     connection.on('close', function() {
//         console.log('echo-protocol Connection Closed');
//     });
//     connection.on('message', function(message) {
//         console.log(message)
//     });
// });

// client.connect('ws://127.0.0.1:8000/ws/bot/sldkfjsdf', 'echo-protocol');
const WebSocket = require('ws');

const chatSocket = new WebSocket('ws://127.0.0.1:8000/ws/bot/sldkfjsdf');
chatSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    document.querySelector('#chat-log').value += (data.message + '\n');
};