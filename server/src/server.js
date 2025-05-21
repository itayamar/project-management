import express from "express";
import router from "./router.js";
import { setupWebSocketServer } from "./websocket.js";
import { createServer } from "http";

class Server {
  constructor() {
    const app = express();
    app.use(express.json());
    app.use(router);

    // Create HTTP server
    this.server = createServer(app);
    
    // Setup WebSocket server
    this.wss = setupWebSocketServer(this.server);

    this.app = app;
  }

  broadcast(msg) {
    const message = {
      ...msg,
      payload: {
        ...msg.payload,
        timestamp: new Date().toISOString()
      }
    };
    
    if (this.wss) {
      this.wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify(message));
        }
      });
    }
  }

  start() {
    return new Promise((resolve) => {
      this.server.listen(3000, () => {
        resolve(this.server);
        console.log("server started", `http://localhost:3000`);
      });
    });
  }
}

export const server = new Server();
