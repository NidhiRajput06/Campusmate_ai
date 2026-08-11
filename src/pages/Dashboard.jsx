import React, { useState } from "react";
import { Search, Map, MapPin, Bot, BookOpen, FlaskConical, Building2, ChevronRight, Calendar, Bell, Bus } from "lucide-react";
import { campusNotices } from "../data/campusData";

export default function Dashboard({ 
  studentInfo, 
  setCurrentPage, 
  setSearchQuery, 
  setSelectedLocation
}) {
  const [searchValue, setSearchValue] = useState("");

  const quickActions = [
    { title: "Campus Map", icon: Map, emoji: "🗺️", desc: "Interactive pathfinding", action: () => setCurrentPage("map") },
    { title: "Find Location", icon: MapPin, emoji: "📍", desc: "Search campus directory", action: () => setCurrentPage("find") },
    { title: "AI Assistant", icon: Bot, emoji: "🤖", desc: "Ask queries about campus", action: () => setCurrentPage("assistant") },
    { title: "Central Library", icon: BookOpen, emoji: "📚", desc: "Timings & resources", action: () => handleDirectLocation("library") },
    { title: "AI & Robotics Lab", icon: FlaskConical, emoji: "🧪", desc: "Check facilities & details", action: () => handleDirectLocation("ai_lab") },
    { title: "Departments", icon: Building2, emoji: "🏢", desc: "Faculty & offices info", action: () => setCurrentPage("departments") }
  ];

  const recentLocations = [
    { id: "library", name: "Central Library", bld: "Library Block", floor: "Ground Floor", emoji: "📚" },
    { id: "ai_lab", name: "AI & Robotics Lab", bld: "Academic Block B", floor: "2nd Floor", emoji: "🧪" },
    { id: "admin_office", name: "Administration Office", bld: "Admin Block", floor: "Ground Floor", emoji: "🏢" },
    { id: "auditorium", name: "Main Auditorium", bld: "Auditorium Block", floor: "Ground Floor", emoji: "🎭" }
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setSearchQuery(searchValue);
      setCurrentPage("find");
    }
  };

  const handleDirectLocation = (locId) => {
    setSelectedLocation(locId);
    setCurrentPage("location-details");
  };

  return (
    <div className="page-body">
      {/* Hero Header Section */}
      <div className="hero-banner">
        <div className="hero-banner-content">
          <span className="badge" style={{ background: "rgba(255,255,255,0.15)", color: "white", marginBottom: "12px" }}>
            ⭐ CampusMate AI
          </span>
          <h1 className="hero-title" style={{ fontSize: "1.9rem", fontWeight: 800 }}>Smart Campus Navigation & Student Assistant</h1>
          <p className="hero-subtitle">
            Your intelligent companion for campus navigation, bus tracking and student support.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary" style={{ background: "white", color: "var(--primary-color)", boxShadow: "0 4px 10px rgba(0,0,0,0.15)" }} onClick={() => setCurrentPage("map")}>
              Explore Campus Map
            </button>
            <button className="btn btn-secondary" style={{ background: "rgba(255,255,255,0.15)", color: "white", borderColor: "rgba(255,255,255,0.2)" }} onClick={() => setCurrentPage("assistant")}>
              Ask CampusMate AI
            </button>
          </div>
        </div>

        {/* Vector Background overlay with floating location pin, moving bus, and route line animations (Part 5) */}
        <svg viewBox="0 0 300 200" className="hero-overlay-svg" style={{ width: "260px", height: "180px", opacity: 0.8 }}>
          {/* Route path line */}
          <path id="route-track" d="M 20,130 Q 150,20 280,130" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3.5" strokeDasharray="6 6" />
          
          {/* Animated traveling bus along path */}
          <text fontSize="22" x="-10" y="10">
            🚌
            <animateMotion dur="7s" repeatCount="indefinite" path="M 20,130 Q 150,20 280,130" />
          </text>

          {/* Floating Location Pin at the curve apex */}
          <g transform="translate(150, 60)">
            <text fontSize="26" textAnchor="middle" x="0" y="0">
              📍
              <animateTransform attributeName="transform" type="translate" values="0,0; 0,-12; 0,0" dur="2s" repeatCount="indefinite" />
            </text>
          </g>
        </svg>
      </div>

      {/* Main Panel grid */}
      <div className="dashboard-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Greeting & Search Box */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "4px" }}>
              Good Morning, {studentInfo.name || "Student"} 👋
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>
              Where do you want to go today?
            </p>

            <form onSubmit={handleSearchSubmit} className="search-bar-large">
              <Search size={22} className="search-bar-large-icon" />
              <input 
                type="text" 
                className="search-bar-large-input" 
                placeholder="Search campus, departments, labs, offices..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </form>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <h3 className="section-title" style={{ marginBottom: "16px" }}>Quick Access Services</h3>
            <div className="quick-actions-grid">
              {quickActions.map((action, idx) => (
                <div key={idx} className="glass-card quick-card" onClick={action.action}>
                  <div className="quick-card-icon" style={{ background: "rgba(99, 102, 241, 0.05)" }}>
                    {action.emoji}
                  </div>
                  <div className="quick-card-title">{action.title}</div>
                  <div className="quick-card-desc">{action.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Locations */}
          <div>
            <div className="section-header">
              <h3 className="section-title">Recent Locations</h3>
              <span className="section-link" onClick={() => setCurrentPage("find")}>View All</span>
            </div>
            
            <div className="recent-locations-list">
              {recentLocations.map((loc) => (
                <div 
                  key={loc.id} 
                  className="glass-card" 
                  style={{ 
                    padding: "16px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between",
                    cursor: "pointer"
                  }}
                  onClick={() => handleDirectLocation(loc.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div 
                      style={{ 
                        width: "36px", 
                        height: "36px", 
                        borderRadius: "8px", 
                        background: "rgba(99,102,241,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.1rem"
                      }}
                    >
                      {loc.emoji}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{loc.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {loc.bld} • {loc.floor}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Sidebar Widgets column */}
        <div className="dashboard-side-panel">
          <div className="glass-panel side-card">
            <div className="section-header" style={{ marginBottom: "16px" }}>
              <h3 className="section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Bell size={18} className="text-gradient" />
                <span>Campus Updates</span>
              </h3>
              <span className="section-link" onClick={() => setCurrentPage("notices")}>More</span>
            </div>

            <div className="notice-list-mini">
              {campusNotices.slice(0, 4).map((notice) => {
                let badgeClass = "badge-general";
                if (notice.category === "Exams") badgeClass = "badge-exams";
                if (notice.category === "Events") badgeClass = "badge-events";
                if (notice.category === "Workshops") badgeClass = "badge-workshops";
                if (notice.category === "Scholarships") badgeClass = "badge-scholarships";

                return (
                  <div 
                    key={notice.id} 
                    className="notice-item-mini"
                    onClick={() => setCurrentPage("notices")}
                  >
                    <h4 className="notice-title-mini">{notice.title}</h4>
                    <div className="notice-meta-mini">
                      <span className={`badge ${badgeClass}`} style={{ padding: "2px 8px", fontSize: "0.65rem" }}>
                        {notice.category}
                      </span>
                      <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                        <Calendar size={10} />
                        {notice.date}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Find My Bus Widget */}
          <div className="glass-panel side-card" style={{ marginBottom: "20px" }}>
            <div className="section-header" style={{ marginBottom: "12px" }}>
              <h3 className="section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Bus size={18} className="text-gradient" />
                <span>Find My Bus</span>
              </h3>
            </div>
            <div style={{ background: "var(--bg-primary)", padding: "12px", borderRadius: "10px", border: "1px solid var(--border-color)", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--primary-color)" }}>Bus LNCT-01</span>
                <span className="badge badge-events" style={{ fontSize: "0.65rem", padding: "2px 8px" }}>On Route</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                <strong>Route:</strong> Vidisha → LNCT Campus
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <strong>Next Stop:</strong> Salamtpur (ETA: 15m)
              </div>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ width: "100%", padding: "8px 12px", fontSize: "0.8rem", gap: "6px" }}
              onClick={() => setCurrentPage("bus")}
            >
              Track Bus
            </button>
          </div>

          {/* Quick Help Box */}
          <div 
            className="glass-panel" 
            style={{ 
              padding: "20px", 
              background: "linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)",
              border: "1px solid var(--border-color)"
            }}
          >
            <h4 style={{ fontWeight: 800, fontSize: "0.95rem", marginBottom: "6px" }}>Need Emergency Assistance?</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.4", marginBottom: "14px" }}>
              Get instant maps for exits, medical rooms, and campus police numbers.
            </p>
            <button 
              className="btn btn-danger" 
              style={{ width: "100%", padding: "8px 12px", fontSize: "0.8rem" }}
              onClick={() => setCurrentPage("emergency")}
            >
              Emergency Center
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
