"use client";

import { useEffect, useMemo } from "react";
import { resolveAvatar } from "@/lib/avatar";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { localizedIdea, type Idea } from "@/data/mock-ideas";

function createAvatarIcon(src: string) {
  return L.divIcon({
    className: "supp-avatar-marker",
    html: `<div class="pin"><img src="${src}" alt="" /></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function FlyToSelected({ selected }: { selected: Idea | null }) {
  const map = useMap();

  useEffect(() => {
    // Only move when an idea is selected. Closing the snippet must keep
    // the current center/zoom (do not fitBounds / zoom out).
    if (!selected) return;
    map.flyTo([selected.lat, selected.lng], 14, { duration: 0.8 });
  }, [selected, map]);

  return null;
}

export function IdeaMap({
  ideas,
  selected,
  onSelect,
  locale,
}: {
  ideas: Idea[];
  selected: Idea | null;
  onSelect: (idea: Idea) => void;
  locale: string;
}) {
  const center = useMemo<[number, number]>(
    () => [selected?.lat ?? ideas[0]?.lat ?? 22.28, selected?.lng ?? ideas[0]?.lng ?? 114.16],
    [ideas, selected],
  );

  const useChinaTiles = locale === "zh";

  return (
    <MapContainer
      center={center}
      zoom={12}
      className="h-full w-full"
      zoomControl={false}
      attributionControl={false}
    >
      {useChinaTiles ? (
        <TileLayer
          url="https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
          subdomains={["1", "2", "3", "4"]}
        />
      ) : (
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      )}

      <FlyToSelected selected={selected} />

      {ideas.map((idea) => (
        <Marker
          key={idea.id}
          position={[idea.lat, idea.lng]}
          icon={createAvatarIcon(resolveAvatar(idea.organizerAvatar))}
          eventHandlers={{
            click: () => onSelect(idea),
          }}
          title={localizedIdea(idea, locale).title}
        />
      ))}
    </MapContainer>
  );
}
