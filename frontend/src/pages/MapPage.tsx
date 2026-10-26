import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Filter,
  Layers,
  Calendar,
  Flame,
  ArrowRight,
  ShieldAlert,
  Sliders,
  X,
  Compass,
} from 'lucide-react';
import { api } from '../services/api';
import { Incident } from '../types';

// Custom Map Marker Icons using Leaflet divIcon
const createCustomMarker = (severity: string) => {
  const color =
    severity === 'Critical'
      ? '#ef4444'
      : severity === 'High'
      ? '#f59e0b'
      : severity === 'Medium'
      ? '#06b6d4'
      : '#10b981';

  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid #0b0f17;
        box-shadow: 0 0 10px ${color};
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

export const MapPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [radiusKm, setRadiusKm] = useState<number>(20);
  const [showRadius, setShowRadius] = useState<boolean>(true);
  const [showHeatDensity, setShowHeatDensity] = useState<boolean>(false);
  const [centerCoord, setCenterCoord] = useState<[number, number]>([28.6139, 77.2090]); // Connaught Place / Central Delhi
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMapData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMapIncidents({
        lat: centerCoord[0],
        lng: centerCoord[1],
        radiusKm: radiusKm,
        category: categoryFilter,
      });
      setIncidents(data.incidents || []);
      setLocations(data.locations || []);
    } catch (err) {
      console.error('Failed to load map incidents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [categoryFilter, radiusKm, centerCoord]);

  return (
    <div className="relative h-[calc(100vh-7rem)] w-full rounded-xl overflow-hidden border border-graphite-800 shadow-2xl flex">
      {/* Floating Filter Drawer on the Left */}
      <div className="absolute top-4 left-4 z-[1000] w-80 rounded-xl border border-graphite-700 bg-graphite-900/95 p-4 backdrop-blur shadow-2xl space-y-4 max-h-[90%] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-graphite-800">
          <div className="flex items-center space-x-2">
            <Compass className="h-4 w-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider">
              Geospatial Intelligence
            </h2>
          </div>
          <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-800/40">
            {incidents.length} Mapped
          </span>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">Incident Category</label>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full rounded-lg border border-graphite-700 bg-graphite-950 py-1.5 px-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="">All Incident Classifications</option>
            <option value="Cyber Attack">Cyber Attack</option>
            <option value="Financial Fraud">Financial Fraud</option>
            <option value="Armed Robbery">Armed Robbery</option>
            <option value="Cargo Theft">Cargo Theft</option>
            <option value="Counterfeiting">Counterfeiting</option>
            <option value="Vehicle Evasion">Vehicle Evasion</option>
          </select>
        </div>

        {/* Radius Analysis Slider */}
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-300 font-medium">Search Radius (Haversine)</span>
            <span className="font-mono text-cyan-400 font-bold">{radiusKm} km</span>
          </div>
          <input
            type="range"
            min="2"
            max="40"
            step="2"
            value={radiusKm}
            onChange={e => setRadiusKm(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>2 km</span>
            <span>20 km</span>
            <span>40 km</span>
          </div>
        </div>

        {/* Map Layers Toggles */}
        <div className="space-y-2 pt-2 border-t border-graphite-800 text-xs">
          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showRadius}
              onChange={e => setShowRadius(e.target.checked)}
              className="rounded border-graphite-700 bg-graphite-950 text-cyan-500 focus:ring-0"
            />
            <span>Render Geofence Perimeter</span>
          </label>
          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showHeatDensity}
              onChange={e => setShowHeatDensity(e.target.checked)}
              className="rounded border-graphite-700 bg-graphite-950 text-cyan-500 focus:ring-0"
            />
            <span>Highlight Incident Density Corridors</span>
          </label>
        </div>

        {/* Legend */}
        <div className="pt-2 border-t border-graphite-800 text-[10px] space-y-1 font-mono">
          <p className="text-slate-500 uppercase tracking-wider font-semibold">Severity Legend:</p>
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1 text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>Critical</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>High</span>
            </span>
            <span className="flex items-center space-x-1 text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>Medium</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Leaflet Map Container */}
      <div className="flex-1 h-full w-full relative z-0">
        <MapContainer
          center={centerCoord}
          zoom={12}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          {/* OpenStreetMap Dark Styled Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Search Radius Circle */}
          {showRadius && (
            <Circle
              center={centerCoord}
              radius={radiusKm * 1000}
              pathOptions={{
                color: '#06b6d4',
                fillColor: '#06b6d4',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '4, 4',
              }}
            />
          )}

          {/* Incident Markers */}
          {incidents.map(inc => {
            if (!inc.location?.latitude || !inc.location?.longitude) return null;
            return (
              <Marker
                key={inc.id}
                position={[inc.location.latitude, inc.location.longitude]}
                icon={createCustomMarker(inc.severity)}
                eventHandlers={{
                  click: () => setSelectedIncident(inc),
                }}
              >
                <Popup>
                  <div className="text-xs p-1 space-y-1">
                    <p className="font-mono font-bold text-cyan-400">{inc.incidentNumber}</p>
                    <p className="font-semibold text-slate-100">{inc.title}</p>
                    <p className="text-[10px] text-slate-400">{inc.location.locationName}</p>
                    <button
                      onClick={() => setSelectedIncident(inc)}
                      className="mt-2 text-[10px] text-cyan-300 font-bold block"
                    >
                      View Forensic Details →
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Detail Inspector Drawer on the Right (when a marker is clicked) */}
      {selectedIncident && (
        <div className="absolute top-4 right-4 z-[1000] w-96 rounded-xl border border-graphite-700 bg-graphite-900/95 p-5 backdrop-blur shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-graphite-800">
            <div>
              <span className="font-mono text-xs font-bold text-red-400">{selectedIncident.incidentNumber}</span>
              <h3 className="text-sm font-bold text-slate-100 mt-0.5">{selectedIncident.title}</h3>
            </div>
            <button
              onClick={() => setSelectedIncident(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] font-mono font-semibold uppercase text-slate-500 block mb-0.5">
                Classification & Severity
              </span>
              <div className="flex items-center space-x-2">
                <span className="rounded bg-graphite-800 text-cyan-300 px-2 py-0.5 font-mono text-[11px] border border-graphite-700">
                  {selectedIncident.category}
                </span>
                <span className="rounded bg-red-950 text-red-300 px-2 py-0.5 font-mono text-[11px] border border-red-800/40">
                  {selectedIncident.severity}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono font-semibold uppercase text-slate-500 block mb-0.5">
                Location Details & Provenance
              </span>
              <p className="text-slate-200 font-medium">{selectedIncident.location?.locationName}</p>
              <p className="text-[11px] text-slate-400">{selectedIncident.location?.formattedAddress}</p>
              <p className="text-[10px] font-mono text-cyan-400 mt-1">
                Coordinates: {selectedIncident.location?.latitude.toFixed(4)}, {selectedIncident.location?.longitude.toFixed(4)}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono font-semibold uppercase text-slate-500 block mb-0.5">
                Occurred Timestamp
              </span>
              <p className="text-slate-300 font-mono">
                {new Date(selectedIncident.occurredAt).toLocaleString()}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono font-semibold uppercase text-slate-500 block mb-0.5">
                Official Modus Operandi & Blotter Excerpt
              </span>
              <p className="text-slate-300 bg-graphite-950 p-2.5 rounded border border-graphite-800 leading-relaxed">
                {selectedIncident.description}
              </p>
            </div>

            {selectedIncident.case && (
              <div className="pt-2 border-t border-graphite-800">
                <span className="text-[10px] font-mono font-semibold uppercase text-slate-500 block mb-1">
                  Bound Investigation Docket
                </span>
                <button
                  onClick={() => navigate(`/cases/${selectedIncident.case!.id}`)}
                  className="w-full flex items-center justify-between p-2 rounded bg-graphite-950 border border-graphite-800 hover:border-cyan-500/40 text-left transition-all"
                >
                  <div>
                    <span className="font-mono text-cyan-300 font-bold block">
                      {selectedIncident.case.caseNumber}
                    </span>
                    <span className="text-[11px] text-slate-300 truncate block">
                      {selectedIncident.case.title}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-cyan-400 flex-shrink-0 ml-2" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
