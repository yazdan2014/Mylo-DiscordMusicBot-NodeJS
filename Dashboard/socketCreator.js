const WebSocketClient = require('websocket').client;
const socketCmdHandler = require("./handlers/cmdhandler")
module.exports = {
    socketCreator: function(queue){
        const socket = new WebSocketClient();

        socket.on('connectFailed', (error)=> {
            console.log('Connect Error: ' + error.toString());
            setTimeout(() => {
                this.socketCreator(queue)
              }, "3500")
            
        });

        socket.on('connect', (connection)=>{
            console.log('WebSocket Client Connected');

            connection.on('error', function(error) {
                console.log("Connection Error: " + error.toString());
            });
            connection.on('close', ()=>{
                console.log('echo-protocol Connection Closed')
                setTimeout(() => {
                    this.socketCreator(queue)
                  }, "3500")
            });
            
            connection.on('message', function(message) {
                console.log(queue)
                if (message.type === 'utf8') {
                    var jsonMessage = JSON.parse(message.utf8Data);

                    if(jsonMessage.type == "command"){
                        socketCmdHandler(queue , jsonMessage)
                    }
                    
                }
            });
        });

        

        socket.connect('ws://127.0.0.1:8000/ws/bot/sldkfjsdf/');
    }
}