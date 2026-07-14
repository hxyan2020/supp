"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { Idea } from "@/data/mock-ideas";

function createPinIcon() {
  return L.divIcon({
    className: "supp-avatar-marker",
    html: `<div class="pin" style="background:#e31b23;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:18px;height:18px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
  });
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

export function IdeaMapSnippet({
  idea,
  locale,
}: {
  idea: Idea;
  locale: string;
}) {
  const center = useMemo<[number, number]>(
    () => [idea.lat, idea.lng],
    [idea.lat, idea.lng],
  );
  const useChinaTiles = locale === "zh";

  return (
    <MapContainer
      center={center}
      zoom={15}
      className="h-full w-full rounded-xl"
      zoomControl={false}
      attributionControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
    >
      {useChinaTiles ? (
        <TileLayer
          url="https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
          subdomains={["1", "2", "3", "4"]}
        />
      ) : (
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      )}
      <Recenter lat={idea.lat} lng={idea.lng} />
      <Marker position={center} icon={createPinIcon()} />
    </MapContainer>
  );
}
