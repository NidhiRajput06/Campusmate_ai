import React, { useState } from "react";
import { User, Bell, Eye, Languages, Accessibility, Check } from "lucide-react";

export default function Settings({
  studentInfo,
  setStudentInfo,
  theme,
  setTheme
}) {
  const [activeTab, setActiveTab] = useState("profile");
  
  // Local state for profile inputs
  const [nameInput, setNameInput] = useState(studentInfo.name);
  const [emailInput, setEmailInput] = useState(studentInfo.email);
  const [rollNumber, setRollNumber] = useState("CS-2024-897");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local state for checkbox switches
  const [notifs, setNotifs] = useState({
    exams: true,
    events: true,
    workshops: false,
    scholarships: true,
    assistantVoice: false
  });

  const [accessibility, setAccessibility] = useState({
    highContrast: false,
    largeText: false,
    screenReader: false
  });

  const [lang, setLang] = useState("english");

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Eye },
    { id: "language", label: "Language", icon: Languages },
    { id: "accessibility", label: "Accessibility", icon: Accessibility }
  ];

  const handleProfileSave = (e) => {
    e.preventDefault();
    setStudentInfo({
      name: nameInput,
      email: emailInput
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleNotifToggle = (key) => {
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAccessToggle = (key) => {
    const updated = !accessibility[key];
    setAccessibility((prev) => ({ ...prev, [key]: updated }));

    // Apply basic accessibility shifts to the body tag
    if (key === "largeText") {
      document.documentElement.style.fontSize = updated ? "18px" : "16px";
    }
    if (key === "highContrast") {
      document.documentElement.classList.toggle("high-contrast", updated);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  };

  return (
    <div className="page-body">
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Account & System Settings</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Manage your personal profile, push notifications, dark mode, and accessibility preferences.
        </p>
      </div>

      <div className="settings-grid">
        {/* Left tabs selector */}
        <div className="glass-panel settings-tabs-sidebar" style={{ padding: "16px" }}>
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`settings-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <TabIcon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Panels */}
        <div className="glass-panel settings-panel">
          
          {/* PROFILE SETTINGS */}
          {activeTab === "profile" && (
            <div>
              <div className="settings-section-header">
                <h3 className="settings-section-title">Student Profile</h3>
                <p className="settings-section-desc">Manage the details displayed on your digital card.</p>
              </div>

              {saveSuccess && (
                <div 
                  style={{ 
                    padding: "12px", 
                    background: "rgba(16, 185, 129, 0.08)", 
                    border: "1px solid rgba(16, 185, 129, 0.2)", 
                    borderRadius: "8px", 
                    color: "var(--success-color)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <Check size={16} />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleProfileSave}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Student ID Roll Number</label>
                  <input 
                    type="text" 
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    disabled
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                    ID numbers are managed by the administration office registry.
                  </span>
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: "10px" }}>
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {/* NOTIFICATION SETTINGS */}
          {activeTab === "notifications" && (
            <div>
              <div className="settings-section-header">
                <h3 className="settings-section-title">Notice Feed Alerts</h3>
                <p className="settings-section-desc">Select which category announcements trigger push events.</p>
              </div>

              <div>
                <div className="setting-row">
                  <div className="setting-row-left">
                    <div className="setting-label">Exam Circular Alerts</div>
                    <div className="setting-desc">Get notified when new timetables and exam rules publish.</div>
                  </div>
                  <label className="switch-control">
                    <input 
                      type="checkbox" 
                      checked={notifs.exams}
                      onChange={() => handleNotifToggle("exams")}
                    />
                    <span className="switch-slider" />
                  </label>
                </div>

                <div className="setting-row">
                  <div className="setting-row-left">
                    <div className="setting-label">Hackathon & Cultural Events</div>
                    <div className="setting-desc">Get invites and guidelines for campus events.</div>
                  </div>
                  <label className="switch-control">
                    <input 
                      type="checkbox" 
                      checked={notifs.events}
                      onChange={() => handleNotifToggle("events")}
                    />
                    <span className="switch-slider" />
                  </label>
                </div>

                <div className="setting-row">
                  <div className="setting-row-left">
                    <div className="setting-label">Academic Workshops</div>
                    <div className="setting-desc">Seat slots bookings alerts for laboratory workshops.</div>
                  </div>
                  <label className="switch-control">
                    <input 
                      type="checkbox" 
                      checked={notifs.workshops}
                      onChange={() => handleNotifToggle("workshops")}
                    />
                    <span className="switch-slider" />
                  </label>
                </div>

                <div className="setting-row">
                  <div className="setting-row-left">
                    <div className="setting-label">Financial Aid circulars</div>
                    <div className="setting-desc">Scholarships submission reminders and form deadlines.</div>
                  </div>
                  <label className="switch-control">
                    <input 
                      type="checkbox" 
                      checked={notifs.scholarships}
                      onChange={() => handleNotifToggle("scholarships")}
                    />
                    <span className="switch-slider" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE SETTINGS */}
          {activeTab === "appearance" && (
            <div>
              <div className="settings-section-header">
                <h3 className="settings-section-title">Theme Layout</h3>
                <p className="settings-section-desc">Toggle between high-contrast dark style and clean bright gradients.</p>
              </div>

              <div className="setting-row">
                <div className="setting-row-left">
                  <div className="setting-label">Dark Theme Mode</div>
                  <div className="setting-desc">Reduces screen glow. Excellent for low light computer labs.</div>
                </div>
                <label className="switch-control">
                  <input 
                    type="checkbox" 
                    checked={theme === "dark"}
                    onChange={toggleTheme}
                  />
                  <span className="switch-slider" />
                </label>
              </div>
            </div>
          )}

          {/* LANGUAGE SETTINGS */}
          {activeTab === "language" && (
            <div>
              <div className="settings-section-header">
                <h3 className="settings-section-title">System Language</h3>
                <p className="settings-section-desc">Select preferred translations for the navigation assistant.</p>
              </div>

              <div className="form-group" style={{ maxWidth: "300px", marginTop: "16px" }}>
                <select value={lang} onChange={(e) => setLang(e.target.value)}>
                  <option value="english">English (US)</option>
                  <option value="spanish">Español (ES)</option>
                  <option value="french">Français (FR)</option>
                  <option value="hindi">हिन्दी (IN)</option>
                </select>
              </div>
            </div>
          )}

          {/* ACCESSIBILITY */}
          {activeTab === "accessibility" && (
            <div>
              <div className="settings-section-header">
                <h3 className="settings-section-title">Visual Aids</h3>
                <p className="settings-section-desc">Configure screen reader text scales and layout contrasts.</p>
              </div>

              <div>
                <div className="setting-row">
                  <div className="setting-row-left">
                    <div className="setting-label">Enlarge Font Text</div>
                    <div className="setting-desc">Scale the global base text to 18px size for legibility.</div>
                  </div>
                  <label className="switch-control">
                    <input 
                      type="checkbox" 
                      checked={accessibility.largeText}
                      onChange={() => handleAccessToggle("largeText")}
                    />
                    <span className="switch-slider" />
                  </label>
                </div>

                <div className="setting-row">
                  <div className="setting-row-left">
                    <div className="setting-label">Contrast Enhancement</div>
                    <div className="setting-desc">Darkens slate borders and enhances text readability colors.</div>
                  </div>
                  <label className="switch-control">
                    <input 
                      type="checkbox" 
                      checked={accessibility.highContrast}
                      onChange={() => handleAccessToggle("highContrast")}
                    />
                    <span className="switch-slider" />
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
