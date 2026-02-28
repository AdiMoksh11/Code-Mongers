
"use client";

import "leaflet/dist/leaflet.css";
import React from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { FeatureCollection } from "geojson";
import indiaStates from "./india.json";

const typedIndiaStates = indiaStates as FeatureCollection;

const regionData: Record<string, number> = {
  Maharashtra: 70,
  Karnataka: 55,
  Delhi: 65,
  "Tamil Nadu": 40,
  "West Bengal": 50,
};

const getColor = (gap: number) => {
  if (gap > 60) return "#2563eb";
  if (gap > 40) return "#3b82f6";
  return "#93c5fd";
};

const style = (feature: any) => {
  const stateName = feature.properties.st_nm || feature.properties.NAME_1;
  const gap = regionData[stateName] || 20;
  return {
    fillColor: getColor(gap),
    weight: 1,
    color: "#fff",
    fillOpacity: 0.8,
  };
};

const SkillGapIndiaMapClient = () => {
  return (
    <MapContainer
      center={[22.9734, 78.6569]}
      zoom={4}
      scrollWheelZoom={false}
      style={{ height: "360px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <GeoJSON
        data={typedIndiaStates}
        style={style}
        onEachFeature={(feature, layer) => {
          const stateName = feature.properties.st_nm || feature.properties.NAME_1;
          const gap = regionData[stateName] || 20;
          layer.bindTooltip(`${stateName}: ${gap}% skill gap`);
        }}
      />
    </MapContainer>
  );
};

export default SkillGapIndiaMapClient;
