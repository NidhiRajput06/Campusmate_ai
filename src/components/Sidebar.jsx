import React from "react";
import lnctLogo from "../assets/lnct_logo.jpg";
import { 
  LayoutDashboard, 
  Map, 
  Search, 
  Bot, 
  BellRing, 
  AlertTriangle, 
  Settings, 
  LogOut,
  X,
  Bus,
  GraduationCap
} from "lucide-react";

export default function Sidebar({ currentPage, setCurrentPage, isOpen, setIsOpen, onLogout }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "map", label: "Campus Map", icon: Map },
    { id: "find", label: "Find Location", icon: Search },
    { id: "assistant", label: "AI Assistant", icon: Bot },
    { id: "departments", label: "Academics", icon: GraduationCap },
    { id: "bus", label: "Bus Tracking", icon: Bus },
    { id: "notices", label: "Campus Notices", icon: BellRing },
    { id: "emergency", label: "Emergency", icon: AlertTriangle },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-logo" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 20px" }}>
          <img src={lnctLogo} alt="LNCT Logo" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "4px" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="logo-text text-gradient" style={{ fontSize: "1.05rem", fontWeight: 800, lineHeight: 1 }}>CampusMate</span>
            <span style={{ fontSize: "0.55rem", color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", marginTop: "3px" }}>LNCT University</span>
          </div>
          <button 
            className="nav-icon-btn" 
            style={{ 
              display: "flex", 
              border: "none", 
              background: "none", 
              marginLeft: "auto",
              cursor: "pointer"
            }}
            onClick={() => setIsOpen(false)}
          >
            <X size={20} className="close-sidebar-btn" style={{ display: "none" }} />
          </button>
        </div>

        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || 
              (item.id === "find" && currentPage === "location-details");
            return (
              <li key={item.id}>
                <a 
                  className={`sidebar-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setIsOpen(false); // Close on mobile
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-footer">
          <a 
            className="sidebar-item" 
            onClick={onLogout}
            style={{ color: "var(--danger-color)", gap: "12px", border: "1px solid var(--border-color)", borderRadius: "10px" }}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </a>
        </div>
      </div>
    </>
  );
}
