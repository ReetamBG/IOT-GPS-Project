import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGPSWebsocket } from "@/hooks/useGPSWebsocket";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

function RecenterMap({ position }: { position: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position);
  }, [position, map]);
  return null;
}

// override default marker icon 
// leaflet icon was causing some problem in prod build, so using custom icon with same images
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: markerIcon2x,
//   iconUrl: markerIcon,
//   shadowUrl: markerShadow,
// });

// 1. Forcefully delete the cached internal getter (THE MISSING LINE)
delete (L.Icon.Default.prototype as any)._getIconUrl;

// 2. Re-apply the Vite-hashed images
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const HomePage = () => {
  // connect to web socket server
  const { position, connected } = useGPSWebsocket();
  const [lat, lng] = position as [number, number];

  // using custom icon for marker
  // leaflet icon was causing some problem in prod build

  return (
    <div className="h-screen flex flex-col bg-muted/40 p-6 gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-3xl font-semibold tracking-tight">
          GPS Tracking Dashboard
        </h1>

        <Badge variant={connected ? "default" : "destructive"}>
          {connected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 grid-cols-2 shrink-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latitude</CardTitle>
          </CardHeader>
          <CardContent className="text-xl md:text-2xl font-semibold">
            {lat.toFixed(6)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Longitude</CardTitle>
          </CardHeader>
          <CardContent className="text-xl md:text-2xl font-semibold">
            {lng.toFixed(6)}
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="shrink-0">
          <CardTitle>Live Location</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div className="h-full w-full">
            <MapContainer
              center={position}
              zoom={15}
              scrollWheelZoom
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <Marker position={position}>
                <Popup>Tracked Device</Popup>
              </Marker>
              <RecenterMap position={position} />
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
