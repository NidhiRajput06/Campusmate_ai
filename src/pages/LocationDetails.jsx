import React from "react";
import { campusLocations, campusEdges } from "../data/campusData";
import { MapPin, Clock, Phone, ArrowLeft, Bot, Navigation } from "lucide-react";

export default function LocationDetails({
  selectedLocationId,
  setSelectedLocation,
  setCurrentPage,
  setStartLocationId,
  setDestinationLocationId
}) {
  
  // Default to library if none selected (fallback prevention)
  const activeId = selectedLocationId || "library";
  const location = campusLocations.find((loc) => loc.id === activeId);

  if (!location) {
    return (
      <div className="page-body" style={{ textAlign: "center", padding: "40px" }}>
        <h3>Location not found.</h3>
        <button className="btn btn-primary" onClick={() => setCurrentPage("find")}>
          Back to Directory
        </button>
      </div>
    );
  }

  // Get category theme
  const getCategoryEmoji = (category) => {
    switch (category) {
      case "academic": return "🏫";
      case "labs": return "🧪";
      case "library": return "📚";
      case "food": return "🍔";
      case "administration": return "🏢";
      case "medical": return "🏥";
      case "security": return "🛡️";
      case "sports": return "⚽";
      default: return "📍";
    }
  };

  // Find nearby locations dynamically based on the edge graph!
  const getNearbyLocations = () => {
    const neighboringIds = campusEdges
      .filter((edge) => edge.from === activeId || edge.to === activeId)
      .map((edge) => (edge.from === activeId ? edge.to : edge.from));
      
    // Remove duplicates and limit to 4 nearby spots
    const uniqueIds = [...new Set(neighboringIds)].slice(0, 4);
    
    return campusLocations.filter((loc) => uniqueIds.includes(loc.id));
  };

  const nearbyLocations = getNearbyLocations();

  const handleNavigate = () => {
    setStartLocationId("main_gate");
    setDestinationLocationId(activeId);
    setCurrentPage("map");
  };

  const handleAskAssistant = () => {
    setCurrentPage("assistant");
  };

  return (
    <div className="page-body">
      {/* Back button */}
      <button 
        className="btn btn-secondary" 
        style={{ padding: "8px 16px", fontSize: "0.85rem", gap: "6px", marginBottom: "20px" }}
        onClick={() => setCurrentPage("find")}
      >
        <ArrowLeft size={16} />
        <span>Back to Directory</span>
      </button>

      <div className="details-page-layout">
        
        {/* Main Details Panel */}
        <div className="glass-panel details-main-panel">
          
          <div className="details-title-row">
            <div>
              <span style={{ fontSize: "2rem", marginRight: "8px" }}>
                {getCategoryEmoji(location.category)}
              </span>
              <h1 style={{ display: "inline-block", fontSize: "1.8rem", fontWeight: 800 }}>
                {location.name}
              </h1>
              <div style={{ marginTop: "6px" }}>
                <span className="badge badge-workshops" style={{ textTransform: "capitalize" }}>
                  {location.category.replace("_", " ")}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                className="btn btn-secondary"
                style={{ padding: "10px 16px", gap: "6px" }}
                onClick={handleAskAssistant}
              >
                <Bot size={16} />
                <span>Ask AI</span>
              </button>
              
              <button 
                className="btn btn-primary"
                style={{ padding: "10px 20px", gap: "6px" }}
                onClick={handleNavigate}
              >
                <Navigation size={16} />
                <span>Navigate Here</span>
              </button>
            </div>
          </div>

          <div className="details-quick-meta">
            <div className="meta-pill">
              <MapPin size={16} className="text-gradient" />
              <span>{location.building} • {location.floor}</span>
            </div>
            <div className="meta-pill">
              <Clock size={16} style={{ color: "var(--secondary-color)" }} />
              <span>Timings: {location.openingHours}</span>
            </div>
          </div>

          {/* About Section */}
          <div className="details-section">
            <h3 className="details-section-title">About this Location</h3>
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              {location.description}
            </p>
          </div>

          {/* Facilities */}
          <div className="details-section">
            <h3 className="details-section-title">Key Facilities</h3>
            <div className="facility-pills-list">
              {location.facilities.map((fac, idx) => (
                <span key={idx} className="facility-pill">
                  {fac}
                </span>
              ))}
            </div>
          </div>

          {/* Contact Details */}
          <div className="details-section" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
            <h3 className="details-section-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Phone size={16} style={{ color: "var(--accent-color)" }} />
              <span>Contact & Helpdesk</span>
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              Email/Extension: <span style={{ color: "var(--text-primary)" }}>{location.contact}</span>
            </p>
          </div>
        </div>

        {/* Right Panel: Nearby spots */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 className="section-title" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <MapPin size={18} className="text-gradient" />
              <span>Nearby Locations</span>
            </h3>
            
            <div className="nearby-locations-grid" style={{ gridTemplateColumns: "1fr" }}>
              {nearbyLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="glass-card nearby-card"
                  onClick={() => setSelectedLocation(loc.id)}
                >
                  <div className="nearby-card-icon">
                    <span style={{ fontSize: "1.1rem" }}>{getCategoryEmoji(loc.category)}</span>
                  </div>
                  <div>
                    <h4 className="nearby-card-title">{loc.name}</h4>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {loc.building} • {loc.floor}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Help Banner card */}
          <div 
            className="glass-panel" 
            style={{ 
              padding: "20px", 
              background: "linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(168,85,247,0.04) 100%)",
              border: "1px solid var(--border-color)"
            }}
          >
            <h4 style={{ fontWeight: 800, fontSize: "0.95rem", marginBottom: "6px" }}>Need Navigation Assistance?</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.4", marginBottom: "14px" }}>
              Click the "Navigate Here" button above to view walking paths, connected blocks, and directions from the main gate.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
