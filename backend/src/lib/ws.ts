import { WebSocketServer } from "ws";
import { Server } from "http";

export function createWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    const clientIP = req.socket.remoteAddress;
    console.log(`New client connected: ${clientIP}`);

    ws.on("close", (code, reason) => {
      console.log(
        `Client disconnected - code: ${code}, reason: ${reason.toString()}`,
      );
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error: ${error}`);
    });
  });

  // send gps data to all connected clients
  // freq should be controlled by gps module, not here
  // for now using setInterval to simulate gps data sending every 2 seconds
  // in prod move this piece of code to gps module and call it whenever new gps data is available
  // dont keep this in server initialization code 
  function sendGPSData({ lat, lng }: { lat: number; lng: number }) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          // read and send data
          console.log(`Sending GPS data to ${wss.clients.size} clients: lat=${lat}, lng=${lng}`);
          client.send(JSON.stringify({ lat, lng }));
        } catch (error) {
          console.error(`Error sending GPS data: ${error}`);
        }
      }
    });
  }

  let lat = 12.9629
  let lng = 77.5775
  setInterval(() => {
    sendGPSData({ lat, lng }); // TODO: replace with real gps data
    lat += 0.0001
    lng += 0.0001
  }, 2000);

  return wss;
}
