import React from "react";
import { AlertOctagon, Phone, MapPin, ShieldAlert, HeartPulse, Flame, ShieldCheck } from "lucide-react";

export default function Emergency({
  setCurrentPage,
  setStartLocationId,
  setDestinationLocationId
}) {
  
  const emergencyContacts = [
    {
      id: "med_room",
      name: "Medical Room (First Aid)",
      icon: HeartPulse,
      phone: "+1 (555) 911-3001",
      ext: "999",
      location: "Admin Block, Ground Floor (Rear)",
      desc: "Contact for sports injuries, allergic reactions, sudden illnesses, or ambulance services on campus.",
      buttonLabel: "Navigate to Medical Room"
    },
    {
      id: "security_office",
      name: "Campus Security HQ",
      icon: ShieldCheck,
      phone: "+1 (555) 911-3002",
      ext: "102",
      location: "Gate Block, Ground Floor",
      desc: "Reporting suspicious activities, thefts, missing items, access control holds, and night escorts.",
      buttonLabel: "Navigate to Security Office"
    },
    {
      id: "main_gate",
      name: "Main Gate Security Post",
      icon: ShieldAlert,
      phone: "+1 (555) 911-3003",
      ext: "101",
      location: "Entrance Guard Desk",
      desc: "For vehicle parking clearances, visitor pass validations, and gate locks controls.",
      buttonLabel: "Navigate to Main Gate"
    },
    {
      id: "admin_office",
      name: "Fire Safety Wardens Office",
      icon: Flame,
      phone: "+1 (555) 911-3004",
      ext: "205",
      location: "Admin Block, 1st Floor",
      desc: "Contact for fire alarms issues, extinguisher refills, gas leak reports, and evacuation assemblies.",
      buttonLabel: "Navigate to Admin Block"
    }
  ];

  const handleNavigate = (locId) => {
    setStartLocationId("main_gate");
    setDestinationLocationId(locId);
    setCurrentPage("map");
  };

  return (
    <div className="page-body">
      {/* Red Warning Banner */}
      <div className="emergency-banner">
        <AlertOctagon size={24} style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ fontSize: "1rem" }}>Emergency Help Center</strong>
          <div style={{ fontSize: "0.85rem", marginTop: "2px", fontWeight: 500, opacity: 0.9 }}>
            Use this section to quickly locate critical campus facilities, medical support, and safety hubs.
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Important Safety Contacts</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Direct lines and physical locations for emergency departments, available 24/7.
        </p>
      </div>

      {/* Emergency Grid */}
      <div className="emergency-cards-grid">
        {emergencyContacts.map((contact) => {
          const Icon = contact.icon;
          return (
            <div key={contact.id} className="glass-panel emergency-card">
              <div className="emergency-icon-box">
                <Icon size={24} />
              </div>
              <h3 className="emergency-title">{contact.name}</h3>
              
              <div className="emergency-phone">
                <Phone size={18} />
                <span>Ext: {contact.ext}</span>
              </div>
              
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                Direct: {contact.phone}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 700, marginBottom: "12px" }}>
                <MapPin size={12} style={{ color: "var(--danger-color)" }} />
                <span>{contact.location}</span>
              </div>

              <p className="emergency-desc" style={{ marginBottom: "20px" }}>{contact.desc}</p>

              <button 
                className="btn btn-danger" 
                style={{ width: "100%", padding: "10px", fontSize: "0.8rem" }}
                onClick={() => handleNavigate(contact.id)}
              >
                {contact.buttonLabel}
              </button>
            </div>
          );
        })}
      </div>

      {/* Evacuation Assembly Points Notice */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "24px", 
          borderLeft: "4px solid var(--warning-color)",
          boxShadow: "0 4px 15px rgba(245, 158, 11, 0.05)" 
        }}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
          ⚠️ Evacuation Assembly Points Info
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
          In the event of a campus-wide fire alarm or evacuation order, please leave all belongings in building zones and proceed calmly to the nearest open assembly area. 
          The main university evacuation points are the <strong>Sports Complex & Ground (Zone East)</strong> and the <strong>Visitor & Student Parking (Zone South)</strong>. 
          Do not use lifts; follow exit signs.
        </p>
        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          <button 
            className="btn btn-secondary" 
            style={{ padding: "8px 14px", fontSize: "0.8rem" }}
            onClick={() => handleNavigate("sports_ground")}
          >
            Locate Sports Ground Assembly
          </button>
          
          <button 
            className="btn btn-secondary" 
            style={{ padding: "8px 14px", fontSize: "0.8rem" }}
            onClick={() => handleNavigate("parking")}
          >
            Locate Parking Lot Assembly
          </button>
        </div>
      </div>
    </div>
  );
}
