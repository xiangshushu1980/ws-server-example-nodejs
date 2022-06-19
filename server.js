import WebSocket, { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import { debuglog } from 'util';
const clients = new Map(); // has to be a Map instead of {} due to non-string keys
const client2userid = new Map();
const wss = new WebSocketServer({ port: 8080 }); // initiate a new server that listens on port 8080

// set up event handlers and do other things upon a client connecting to the server
wss.on('connection', (ws) => {
    // create an id to track the client
    const id = randomUUID();
    clients.set(ws, id);    
    console.log(`new connection assigned id: ${id}`);

    // send a message to all connected clients upon receiving a message from one of the connected clients
    ws.on('message', (data) => {
        console.log(`received: ${data}`);
        // serverBroadcast(`Client ${clients.get(ws)} ${data}`);
        // todo: 解析客户端来的消息,并群发.
        // 1. 设置id
        // 3. 位置
        // 4. 方向/速度
        // data 我们统一转发,不解析.
        var message = data.toString();
        var infoArray = message.split(",");
        if(infoArray.length==0)
        {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            });
            return;
        }

        // 如果我们成功转成数组了.
        var type = infoArray[0];
        switch (type) {
            case "1":
                var userid = infoArray[1]
                if(userid != null)
                {
                    client2userid.set( ws,userid );                
                }    
                else
                    console.log("can not find user id in message"+message);
                break;
            
            default:
                break;
        }

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });

    // stop tracking the client upon that client closing the connection
    ws.on('close', () => {
        console.log(`connection (id = ${clients.get(ws)}) closed`);
        clients.delete(ws);
        // 维护这个列表.        
        var userid = client2userid.get(ws);
        if(userid)
        {
            client2userid.delete(ws);
            var message = "2,"+userid;
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                        client.send(message);                                              
                }        
            });
        }        
    });

    // send the id back to the newly connected client
    ws.send(`You have been assigned id ${id}`);
});

// send a message to all the connected clients about how many of them there are every 15 seconds
setInterval(() => {    
    console.log(`Number of connected clients: ${clients.size}`);
    serverBroadcast(`Number of connected clients: ${clients.size}`);
}, 5000);

// function for sending a message to every connected client
function serverBroadcast(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}



console.log('The server is running and waiting for connections');