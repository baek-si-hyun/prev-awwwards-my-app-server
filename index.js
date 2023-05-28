import express from "express";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import cors from "cors";

const app = express();
app.use(cors());

const httpServer = http.createServer(app);
httpServer.listen(3003, () => {
  console.log("3003");
});

const wsServer = new WebSocketServer({ noServer: true });
wsServer.on("connection", (socket) => {
  console.log("WebSocket client connected");
  socket.addEventListener("message", (coinList) => {
    const startSocket = () => {
      const upbitSocket = new WebSocket("wss://api.upbit.com/websocket/v1");
      upbitSocket.setMaxListeners(10);
      upbitSocket.addEventListener("open", () => {
        const subscribeMsg = [
          { ticket: "UNIQUE_TICKET" },
          { type: "ticker", codes: JSON.parse(coinList.data) },
        ];
        upbitSocket.send(JSON.stringify(subscribeMsg));
      });
      upbitSocket.addEventListener("message", (event) => {
        const tickerdata = JSON.parse(event.data);
        socket.send(
          JSON.stringify({
            topic: "ticker-data",
            messages: [tickerdata],
          })
        );
      });
      upbitSocket.addEventListener("close", () => {
        console.log("WebSocket Client Closed");
        startSocket();
      });
      upbitSocket.addEventListener("error", (error) => {
        console.log(`WebSocket Client Error: ${error}`);
        startSocket();
      });
    };
    startSocket();
  });
});

httpServer.on("upgrade", (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (socket) => {
    wsServer.emit("connection", socket, request);
  });
});
