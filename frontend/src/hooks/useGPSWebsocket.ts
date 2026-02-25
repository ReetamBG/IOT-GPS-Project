import type { LatLngExpression } from "leaflet";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export function useGPSWebsocket() {
  const ws = useRef<WebSocket | null>(null);
  const shouldReconnect = useRef(true);
  const [connected, setConnected] = useState(false);
  const [position, setPosition] = useState<LatLngExpression>([
    12.9716, 77.5946,
  ]); // need proper initial position, maybe center of the map?

  useEffect(() => {
    function resolveWebSocketUrl(baseUrl: string) {
      if (baseUrl.startsWith("ws://") || baseUrl.startsWith("wss://"))
        return baseUrl;
      if (baseUrl.startsWith("http://"))
        return `ws://${baseUrl.slice("http://".length)}`;
      if (baseUrl.startsWith("https://"))
        return `wss://${baseUrl.slice("https://".length)}`;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const normalizedPath = baseUrl.startsWith("/") ? baseUrl : `/${baseUrl}`;
      return `${protocol}//${window.location.host}${normalizedPath}`;
    }

    function connect() {
      // ws.current = new WebSocket(import.meta.env.VITE_BACKEND_URL!);
      const websocketUrl = resolveWebSocketUrl(
        import.meta.env.VITE_BACKEND_URL!,
      );
      ws.current = new WebSocket(websocketUrl);

      if (!ws.current) throw new Error("Failed to create WebSocket connection");
      const socket = ws.current;

      socket.onopen = () => {
        console.log("WebSocket connection established");
        setConnected(true);
      };

      socket.onclose = () => {
        setConnected(false);
        if (shouldReconnect.current) {
          setTimeout(() => connect(), 3000); // retry after delay
        }
      };

      socket.onerror = () => {
        setConnected(false);
        toast.error("Disconnected. Retrying...");
        socket.close();
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (
          typeof message.lat === "number" &&
          typeof message.lng === "number"
        ) {
          setPosition([message.lat, message.lng]);
        }
      };
    }

    connect();

    return () => {
      if (ws.current) {
        // avoid reconnecting after component unmounts
        shouldReconnect.current = false;
        ws.current.close();
        console.log("WebSocket connection closed");
      }
    };
  }, []);
  return { connected, position };
}
