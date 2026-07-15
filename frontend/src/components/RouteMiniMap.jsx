import React, { useEffect } from 'react';
import { MapContainer, Marker, Popup, GeoJSON, useMap, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 1. IMPORT THE MAPTILER VECTOR LAYER EXTENSION
import { MaptilerLayer } from "@maptiler/leaflet-maptilersdk";

// Fix for default Leaflet marker icon paths in React build configurations
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapBoundsUpdater({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [bounds, map]);
  return null;
}

// 2. CHOOSE A CUSTOM REACT WRAPPER FOR LEAFLET INGESTION
function MapTilerTileIntegration({ apiKey }) {
  const map = useMap();
  useEffect(() => {
    // Instantiates high-res vector maps underneath your polyline overlays
    const mtLayer = new MaptilerLayer({
      apiKey: apiKey,
      style: "streets-v2", // Options: "streets-v2", "dataviz", "darkmatter", "satellite"
    });
    mtLayer.addTo(map);
    return () => mtLayer.remove();
  }, [map, apiKey]);

  return null;
}

export default function RouteMiniMap({ routingGeometry }) {
  if (!routingGeometry || !routingGeometry.origin_coords) {
    return (
      <div style={{ height: '250px', background: '#eae4de', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8c7e7c', border: '1px solid #e8e3dd' }}>
        🗺️ Waiting for route generation pipeline...
      </div>
    );
  }

  const { origin_coords, destination_coords, geojson_features } = routingGeometry;
  const originLatLng = [origin_coords.lat, origin_coords.lng];
  const destLatLng = [destination_coords.lat, destination_coords.lng];
  const routeBounds = [originLatLng, destLatLng];

  // Get your free API key at https://cloud.maptiler.com/
  // The user can enter a real one later; for now using the requested placeholder.
  const MAPTILER_API_KEY = "kV2tbmT5NmZQ9Cwe8kDS";

  return (
    <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e8e3dd', marginTop: '15px', position: 'relative', zIndex: 1 }}>
      <MapContainer
        center={originLatLng}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        {/* ── 🚀 SWAPPED: INJECT THE HIGH-DETAIL MAPTILER VECTOR BASE BASEMAP ── */}
        <MapTilerTileIntegration apiKey={MAPTILER_API_KEY} />

        {/* ── LIVE PRECIPITATION RADAR OVERLAY ── */}
        <TileLayer
          url="https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=0800e03067a52b18f8c3407139d189b4"
          opacity={0.7}
          zIndex={10}
        />

        {/* Origin Hub Pin */}
        <Marker position={originLatLng}>
          <Popup><strong>Origin:</strong> Operational Hub Starting Point</Popup>
        </Marker>

        {/* Destination Target Pin */}
        <Marker position={destLatLng}>
          <Popup><strong>Destination:</strong> Scheduled Delivery Point</Popup>
        </Marker>

        {/* Render the Route Path Polyline dynamically via GeoJSON data layer */}
        {geojson_features && (
          <GeoJSON
            key={JSON.stringify(geojson_features)}
            data={geojson_features}
            style={{ color: '#c2410c', weight: 5, opacity: 0.8 }} // Changed line color to a nice crisp orange/brown
          />
        )}

        <MapBoundsUpdater bounds={routeBounds} />
      </MapContainer>
    </div>
  );
}
