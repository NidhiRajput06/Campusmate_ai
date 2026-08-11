import React from "react";
import { MapPin, Clock, ArrowRight, Eye } from "lucide-react";

export default function LocationCard({ location, onNavigate, onViewDetails }) {
  // Simple map category to emojis/colors
  const getCategoryTheme = (category) => {
    switch (category) {
      case "academic":
        return { emoji: "🏫", color: "var(--primary-color)" };
      case "labs":
        return { emoji: "🧪", color: "var(--secondary-color)" };
      case "library":
        return { emoji: "📚", color: "var(--accent-color)" };
      case "food":
        return { emoji: "🍔", color: "#f59e0b" };
      case "administration":
        return { emoji: "🏢", color: "#10b981" };
      case "medical":
        return { emoji: "🏥", color: "#ef4444" };
      case "security":
        return { emoji: "🛡️", color: "#64748b" };
      case "sports":
        return { emoji: "⚽", color: "#84cc16" };
      default:
        return { emoji: "📍", color: "var(--primary-color)" };
    }
  };

  const theme = getCategoryTheme(location.category);

  return (
    <div className="glass-card location-card">
      <div>
        <div className="location-header">
          <div className="location-icon-container" style={{ background: `${theme.color}15`, color: theme.color }}>
            <span style={{ fontSize: "1.2rem" }}>{theme.emoji}</span>
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>{location.name}</h3>
            <span className="badge" style={{ background: `${theme.color}12`, color: theme.color, marginTop: "4px" }}>
              {location.category.toUpperCase().replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="location-details-meta">
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <MapPin size={12} />
            {location.building} • {location.floor}
          </span>
        </div>

        <p className="location-desc">{location.description}</p>
      </div>

      <div>
        <div className="location-hours">
          <Clock size={14} style={{ color: "var(--text-muted)" }} />
          <span>{location.openingHours}</span>
        </div>

        <div className="location-footer">
          <button 
            className="btn btn-secondary" 
            style={{ flex: 1, padding: "8px 12px", fontSize: "0.8rem", gap: "4px" }}
            onClick={() => onViewDetails(location)}
          >
            <Eye size={14} />
            <span>Details</span>
          </button>
          
          <button 
            className="btn btn-primary" 
            style={{ flex: 1.2, padding: "8px 12px", fontSize: "0.8rem", gap: "4px" }}
            onClick={() => onNavigate(location.id)}
          >
            <span>Navigate</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
