import React from "react";
import { campusLocations } from "../data/campusData";
import { Navigation, Clock, RefreshCw, Milestone, MapPin } from "lucide-react";

export default function RoutePanel({
  startLocationId,
  destinationLocationId,
  onSelectStart,
  onSelectDestination,
  activeRoute,
  onClearRoute,
  onFindRoute
}) {
  return (
    <div className="glass-card map-control-panel">
      <div>
        <h3 className="section-title" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <Navigation size={18} className="text-gradient" />
          <span>Route Planner</span>
        </h3>

        {/* Start Point Dropdown */}
        <div className="form-group">
          <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <MapPin size={12} style={{ color: "var(--accent-color)" }} />
            <span>Starting Point</span>
          </label>
          <select
            value={startLocationId || ""}
            onChange={(e) => onSelectStart(e.target.value || null)}
          >
            <option value="">-- Choose Starting Point --</option>
            {campusLocations.map((loc) => (
              <option key={`start-${loc.id}`} value={loc.id}>
                {loc.name} ({loc.building})
              </option>
            ))}
          </select>
        </div>

        {/* Destination Dropdown */}
        <div className="form-group" style={{ marginTop: "12px" }}>
          <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <MapPin size={12} style={{ color: "var(--secondary-color)" }} />
            <span>Destination</span>
          </label>
          <select
            value={destinationLocationId || ""}
            onChange={(e) => onSelectDestination(e.target.value || null)}
          >
            <option value="">-- Choose Destination --</option>
            {campusLocations.map((loc) => (
              <option key={`dest-${loc.id}`} value={loc.id}>
                {loc.name} ({loc.building})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, padding: "10px", fontSize: "0.85rem", gap: "6px" }}
            onClick={onClearRoute}
          >
            <RefreshCw size={14} />
            <span>Reset</span>
          </button>
          
          <button
            className="btn btn-primary"
            style={{ flex: 2, padding: "10px", fontSize: "0.85rem", gap: "6px" }}
            onClick={onFindRoute}
            disabled={!startLocationId || !destinationLocationId}
          >
            <Navigation size={14} />
            <span>Find Route</span>
          </button>
        </div>
      </div>

      {/* Path Display Summary */}
      {activeRoute && activeRoute.path && (
        <div className="route-summary-box">
          <div className="route-summary-title">
            <Milestone size={16} />
            <span>Directions Guide</span>
          </div>

          <div className="route-summary-node-list">
            {activeRoute.path.map((loc, idx) => (
              <div key={`node-${idx}`} className="route-node-item">
                {loc.name}
              </div>
            ))}
          </div>

          <div className="route-meta-details">
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Clock size={14} style={{ color: "var(--secondary-color)" }} />
              <span>Est. Walk: {activeRoute.estimatedMinutes} min</span>
            </div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              {activeRoute.path.length} Waypoints
            </span>
          </div>
        </div>
      )}

      {/* Instructions Tip */}
      {!activeRoute && (
        <div 
          style={{ 
            marginTop: "auto", 
            padding: "12px", 
            borderRadius: "8px", 
            background: "rgba(99, 102, 241, 0.03)", 
            border: "1px dashed var(--border-color)",
            fontSize: "0.8rem",
            color: "var(--text-secondary)",
            lineHeight: "1.4"
          }}
        >
          💡 <strong>Tip:</strong> You can also click directly on any pin on the map and choose <strong>"Navigate Here"</strong> to set your destination!
        </div>
      )}
    </div>
  );
}
