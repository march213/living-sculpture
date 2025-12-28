import osc from "osc";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Types for our OSC messages
interface OSCRelayData {
  address: string;
  value: number;
}

const udpPort = new osc.UDPPort({
  localAddress: "0.0.0.0",
  localPort: 10000,
  metadata: true,
});

udpPort.open();

udpPort.on("message", (oscMsg: any) => {
  const data: OSCRelayData = {
    address: oscMsg.address,
    value: oscMsg.args[0].value,
  };

  io.emit("td-data", data);
});

io.on("connection", (socket) => {
  console.log(`[Socket] Browser connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log("[Socket] Browser disconnected");
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Relay Server running at http://localhost:${PORT}`);
  console.log(`📡 Listening for TD OSC on UDP Port 10000`);
});
