import React, { useState, useRef, useEffect } from "react";
import { Search, Bell, ChevronDown, User, Settings, LogOut, Menu } from "lucide-react";
import lnctLogo from "../assets/lnct_logo.jpg";
import { campusNotices } from "../data/campusData";

export default function Navbar({ 
  setCurrentPage, 
  setSearchQuery, 
  setSidebarOpen, 
  onLogout,
  studentInfo 
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchQuery(searchInput);
      setCurrentPage("find");
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(false);
    setCurrentPage("notices");
  };

  return (
    <nav className="navbar">
      {/* Mobile Toggle Button */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button 
          className="nav-icon-btn mobile-menu-btn" 
          style={{ display: "none" }}
          onClick={() => setSidebarOpen(prev => !prev)}
        >
          <Menu size={20} />
        </button>
        
        {/* Short logo for mobile header */}
        <div className="mobile-logo-wrap" style={{ display: "none", alignItems: "center", gap: "8px" }}>
          <img src={lnctLogo} alt="LNCT Logo" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
          <span className="logo-text text-gradient" style={{ fontSize: "1rem", fontWeight: 800 }}>CampusMate</span>
        </div>
      </div>

      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="nav-left">
        <div className="nav-search-container">
          <Search size={18} className="nav-search-icon" />
          <input 
            type="text" 
            className="nav-search-input" 
            placeholder="Search campus, library, offices..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </form>

      {/* Utilities & Profile */}
      <div className="nav-right">
        {/* Notifications Icon & Panel */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button 
            className="nav-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={18} />
            <span className="badge-dot" />
          </button>
          
          {showNotifications && (
            <div className="notif-panel glass-panel">
              <div className="panel-title">Campus Notifications</div>
              <ul className="notif-list">
                {campusNotices.slice(0, 3).map((notice) => (
                  <li 
                    key={notice.id} 
                    className="notif-item unread"
                    onClick={() => handleNotificationClick()}
                  >
                    <div className="notif-icon-wrap">
                      <Bell size={12} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text-primary)" }}>{notice.title}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>{notice.date} • {notice.category}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div 
                className="notif-footer"
                onClick={() => {
                  setShowNotifications(false);
                  setCurrentPage("notices");
                }}
              >
                View All Notifications
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <div 
            className="profile-trigger"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="profile-avatar">
              {studentInfo.name.charAt(0)}
            </div>
            <span className="profile-name">{studentInfo.name}</span>
            <ChevronDown size={14} style={{ color: "var(--text-secondary)", marginRight: "4px" }} />
          </div>

          {showProfileMenu && (
            <ul className="dropdown-menu">
              <li className="dropdown-item" onClick={() => { setShowProfileMenu(false); setCurrentPage("settings"); }}>
                <User size={16} />
                <span>My Profile</span>
              </li>
              <li className="dropdown-item" onClick={() => { setShowProfileMenu(false); setCurrentPage("settings"); }}>
                <Settings size={16} />
                <span>Account Settings</span>
              </li>
              <li 
                className="dropdown-item" 
                onClick={onLogout}
                style={{ borderTop: "1px solid var(--border-color)", color: "var(--danger-color)" }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* Inline styles for responsive header buttons in standard CSS (since it isn't Tailwind) */}
      <style>{`
        @media (max-width: 1023px) {
          .mobile-menu-btn {
            display: flex !important;
          }
          .mobile-logo-wrap {
            display: flex !important;
          }
          .navbar {
            padding: 0 16px;
          }
          .nav-left {
            display: none !important; /* Hide search bar on small screens, dashboard search bar remains available */
          }
        }
      `}</style>
    </nav>
  );
}
