import React from 'react';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLng, LatLngBounds, Icon } from 'leaflet';

// This imports the marker icons as URLs so Vite can find them.
import iconUrl from 'leaflet/dist/images/marker-icon.png?url';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png?url';

const DefaultIcon = new Icon({
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
    iconAnchor: [12, 41],
    shadowAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;


interface MissionTrackMapProps {
  track: { lat: number, lon: number }[];
  planWaypoints?: { lat: number, lon: number }[];
  mapStyle: string; // Add mapStyle prop
}

const mapStyleProviders: { [key: string]: { url: string; attribution: string } } = {
  Default: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  Streets: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  Satellite: {
    url: "https://services.arcgisonline.com/ArcGis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  Topographic: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  }
};

const MissionTrackMap: React.FC<MissionTrackMapProps> = ({ track, planWaypoints, mapStyle }) => {
  const { url, attribution } = mapStyleProviders[mapStyle] || mapStyleProviders['Default'];
  
  // Convert the track to an array of LatLng objects
  const positions: LatLng[] = track.map(p => new LatLng(p.lat, p.lon));
  
  // Convert plan waypoints (if they exist)
  const waypoints: LatLng[] = planWaypoints 
    ? planWaypoints.map(p => new LatLng(p.lat, p.lon))
    : [];

  // Create bounds to auto-zoom the map
  const bounds = new LatLngBounds(positions.length > 0 ? positions : [new LatLng(14.5995, 120.9842)]); // Default to Manila if no track

  return (
    <MapContainer
      bounds={bounds}
      scrollWheelZoom={true}
      className="w-full h-full"
    >
      <TileLayer
        url={url}
        attribution={attribution}
      />
      
      {/* Draw the mission plan waypoints (if they exist) */}
      {waypoints.map((pos, idx) => (
        <Marker key={`wp-${idx}`} position={pos} icon={DefaultIcon} />
      ))}

      {/* Draw the live GPS track of the drone */}
      {positions.length > 0 && (
        <>
          <Polyline pathOptions={{ color: '#F97316', weight: 3 }} positions={positions} />
          {/* Add a marker for the drone's current position */}
          <Marker position={positions[positions.length - 1]} icon={DefaultIcon} />
        </>
      )}
    </MapContainer>
  );
};

export default MissionTrackMap;