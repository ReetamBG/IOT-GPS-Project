import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
// @ts-ignore - Ignoring missing TypeScript definitions for the gps library
import GPS from "gps";

export function createWebSocketServer(server: Server) {
  // 1. Initialize the WebSocket Server attached to the main Express HTTP server
  const wss = new WebSocketServer({ server });

  // 2. Initialize the GPS Parser
  const gps = new GPS();

  // 3. Configure the Hardware Serial Interface
  let port: SerialPort;
  try {
    port = new SerialPort({
      path: "/dev/serial0",
      baudRate: 9600,
    });
    console.log("✅ Successfully connected to hardware serial port: /dev/serial0");
  } catch (err) {
    console.error("❌ CRITICAL ERROR: Could not open serial port. Is it wired correctly?", err);
    return wss; // Return early to prevent server crash
  }

  // 4. Create a Stream Pipe
  const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

  // --- WEBSOCKET CLIENT MANAGEMENT ---
  wss.on("connection", (ws, req) => {
    const clientIP = req.socket.remoteAddress;
    console.log(`📡 New WebSocket client connected from: ${clientIP}`);
    console.log(`👥 Total active clients: ${wss.clients.size}`);

    // Send an immediate "connected" confirmation payload
    ws.send(JSON.stringify({ type: "SYSTEM", message: "Connected to GPS Node" }));

    ws.on("close", (code, reason) => {
      console.log(`🔌 Client disconnected. Code: ${code}. Active clients: ${wss.clients.size}`);
    });

    ws.on("error", (error) => {
      console.error(`❌ WebSocket Client Error: ${error}`);
    });
  });

  // --- HARDWARE DATA INGESTION ---
  // Listen for raw NMEA sentences from the NEO-6M
  parser.on("data", (line: string) => {
    try {
      gps.update(line); // Feed raw text to the parsing engine
    } catch (error) {
      // Silently ignore corrupted NMEA lines to prevent log spam
    }
  });

  // --- PARSED DATA BROADCASTING ---
  // Listen for successful decodes from the GPS library
  gps.on("data", (data: any) => {
    // We only care about sentences that contain 3D location data (GGA or RMC)
    if (data.type === "GGA" || data.type === "RMC") {
      
      // Ensure the module has a valid satellite fix and valid coordinates
      if (gps.state.lat && gps.state.lon) {
        
        // Construct the exact JSON payload expected by your React frontend
        const payload = {
          lat: gps.state.lat,
          lng: gps.state.lon,
          alt: gps.state.alt || 0,        // Altitude (optional bonus data)
          sats: gps.state.satsActive?.length || 0, // Satellite count
          time: new Date().toISOString()  // Accurate timestamp
        };

        // Broadcast to all connected clients
        broadcastToClients(wss, payload);
      }
    }
  });

  // --- HARDWARE ERROR HANDLING ---
  port.on("error", (err) => {
    console.error("❌ Hardware Serial Error:", err.message);
  });

  return wss;
}

/**
 * Helper function to iterate through all connected WebSocket clients
 * and push the JSON payload only to those whose connection is fully OPEN.
 */
function broadcastToClients(wss: WebSocketServer, data: object) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(data));
      } catch (error) {
        console.error("❌ Error broadcasting to a client:", error);
      }
    }
  });
}



// import { WebSocketServer } from "ws";
// import { Server } from "http";

// export function createWebSocketServer(server: Server) {
//   const wss = new WebSocketServer({ server });

//   wss.on("connection", (ws, req) => {
//     const clientIP = req.socket.remoteAddress;
//     console.log(`New client connected: ${clientIP}`);

//     ws.on("close", (code, reason) => {
//       console.log(
//         `Client disconnected - code: ${code}, reason: ${reason.toString()}`,
//       );
//     });

//     ws.on("error", (error) => {
//       console.error(`WebSocket error: ${error}`);
//     });
//   });

//   // send gps data to all connected clients
//   // freq should be controlled by gps module, not here
//   // for now using setInterval to simulate gps data sending every 2 seconds
//   // in prod move this piece of code to gps module and call it whenever new gps data is available
//   // dont keep this in server initialization code 
//   function sendGPSData({ lat, lng }: { lat: number; lng: number }) {
//     wss.clients.forEach((client) => {
//       if (client.readyState === WebSocket.OPEN) {
//         try {
//           // read and send data
//           console.log(`Sending GPS data to ${wss.clients.size} clients: lat=${lat}, lng=${lng}`);
//           client.send(JSON.stringify({ lat, lng }));
//         } catch (error) {
//           console.error(`Error sending GPS data: ${error}`);
//         }
//       }
//     });
//   }

//   let lat = 12.9629
//   let lng = 77.5775
//   setInterval(() => {
//     sendGPSData({ lat, lng }); // TODO: replace with real gps data
//     lat += 0.0001
//     lng += 0.0001
//   }, 2000);

//   return wss;
// }
