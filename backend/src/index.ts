import dotenv from "dotenv";
dotenv.config();
import express, { type Request, type Response } from "express";
import cors from "cors";
import { login } from "./controllers/auth.controller.js";
import { createWebSocketServer } from "./lib/ws.js";
import { createServer } from "http";



const PORT = process.env.PORT || 8000;
if (!process.env.FRONTEND_URL) throw new Error("FRONTEND_URL not set in .env");

const app = express();
const server = createServer(app)
const wss = createWebSocketServer(server);

app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
  }),
);
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.post("/login", login);

server.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});
