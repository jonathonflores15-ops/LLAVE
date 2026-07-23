import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const money = (n) => "$" + Number(n).toLocaleString("en-US");
const PR_CENTER = [18.22, -66.4];

function pin(color) {
  return L.divIcon({
    className: "llv-pin",
    html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>`,
    iconSize: [22, 22], iconAnchor: [11, 22], popupAnchor: [0, -20],
  });
}

function Fit({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) map.setView(points[0], 14);
    else map.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
  }, [JSON.stringify(points), map]);
  return null;
}

// Reports the map's visible bounds whenever the user pans or zooms.
function BoundsWatcher({ onChange }) {
  const map = useMapEvents({
    moveend: () => onChange(map.getBounds()),
    zoomend: () => onChange(map.getBounds()),
    load: () => onChange(map.getBounds()),
  });
  return null;
}

export default function PropertiesMap({ listings = [], onOpen, height = 440, interactivePopup = true, showCount = true, lang = "es" }) {
  const withCoords = listings.filter((l) => l.lat && l.lng);
  const pts = withCoords.map((l) => [l.lat, l.lng]);
  const [bounds, setBounds] = useState(null);

  const inView = bounds ? withCoords.filter((l) => bounds.contains([l.lat, l.lng])) : withCoords;
  const viewLabel = lang === "es" ? "Ver informe" : "View report";
  const areaLabel = lang === "es" ? "propiedades en esta área" : "properties in this area";

  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid #C7DAD3" }}>
      <MapContainer center={pts[0] || PR_CENTER} zoom={pts.length ? 11 : 9} style={{ height, width: "100%" }} scrollWheelZoom={false}>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Fit points={pts} />
        <BoundsWatcher onChange={setBounds} />
        {inView.map((l) => {
          const isAuction = l.kind === "auction";
          return (
            <Marker key={l.id || l.catastro} position={[l.lat, l.lng]} icon={pin(isAuction ? "#E2674B" : "#0C4A4E")}>
              <Popup>
                <div style={{ minWidth: 150 }}>
                  <div style={{ fontWeight: 700, color: "#14322F" }}>{l.muni} · {l.sector}</div>
                  <div style={{ color: "#12666E", fontWeight: 600, fontSize: 13 }}>{l.type}</div>
                  <div style={{ fontFamily: "ui-monospace,monospace", fontWeight: 700, marginTop: 2 }}>{money(isAuction ? l.bid : l.price)}</div>
                  {l.zip && <div style={{ color: "#6FA093", fontSize: 12, marginTop: 2 }}>ZIP {l.zip}</div>}
                  {interactivePopup && onOpen && (
                    <button onClick={() => onOpen(l.catastro)} style={{ marginTop: 6, background: "#0C4A4E", color: "#fff", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>{viewLabel}</button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {showCount && (
        <div style={{ position: "absolute", top: 12, left: 12, zIndex: 1000, background: "rgba(12,74,78,.92)", color: "#fff", borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 700, boxShadow: "0 2px 10px rgba(0,0,0,.25)" }}>
          {inView.length} {areaLabel}
        </div>
      )}
    </div>
  );
}
