import React, { useState } from "react";
import { campusNotices } from "../data/campusData";
import { Bell, Calendar, ChevronDown, ChevronUp } from "lucide-react";

export default function Notices() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedNoticeId, setExpandedNoticeId] = useState(null);

  const categories = [
    { id: "all", label: "All Announcements" },
    { id: "exams", label: "Exams" },
    { id: "events", label: "Events" },
    { id: "workshops", label: "Workshops" },
    { id: "scholarships", label: "Scholarships" },
    { id: "general", label: "General Updates" }
  ];

  // Filtering logic
  const filteredNotices = campusNotices.filter((notice) => {
    if (activeCategory === "all") return true;
    return notice.category.toLowerCase() === activeCategory;
  });

  const toggleExpand = (id) => {
    if (expandedNoticeId === id) {
      setExpandedNoticeId(null);
    } else {
      setExpandedNoticeId(id);
    }
  };

  const getBadgeClass = (category) => {
    switch (category) {
      case "Exams": return "badge-exams";
      case "Events": return "badge-events";
      case "Workshops": return "badge-workshops";
      case "Scholarships": return "badge-scholarships";
      default: return "badge-general";
    }
  };

  return (
    <div className="page-body">
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Campus Notices & Announcements</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Stay updated with examination schedules, technical hackathons, coding workshops, and financial aid dates.
        </p>
      </div>

      {/* Notices Toggles & Filters */}
      <div className="notices-filter-panel">
        <div className="category-tabs" style={{ marginBottom: 0, paddingBottom: 0 }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-tab ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => {
                setActiveCategory(cat.id);
                setExpandedNoticeId(null); // Reset expands
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List */}
      <div className="notice-cards-list">
        {filteredNotices.map((notice) => {
          const isExpanded = expandedNoticeId === notice.id;
          return (
            <div key={notice.id} className="glass-panel notice-card">
              <div className="notice-card-header">
                <div>
                  <span className={`badge ${getBadgeClass(notice.category)}`} style={{ marginBottom: "8px" }}>
                    {notice.category}
                  </span>
                  <h3 className="notice-card-title">{notice.title}</h3>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  <Calendar size={14} />
                  <span>{notice.date}</span>
                </div>
              </div>

              <p className="notice-card-desc">{notice.shortDescription}</p>

              {/* Collapsible Details Panel */}
              {isExpanded && (
                <div className="notice-card-details">
                  {notice.detailedDescription}
                </div>
              )}

              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Issued by Academic Registrar Cell
                </span>
                
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: "6px 12px", fontSize: "0.75rem", gap: "4px" }}
                  onClick={() => toggleExpand(notice.id)}
                >
                  <span>{isExpanded ? "Collapse Details" : "View Details"}</span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>
          );
        })}

        {filteredNotices.length === 0 && (
          <div className="glass-panel" style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--border-color)" }}>
            <Bell size={36} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
            <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>No Announcements</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              There are no announcements in this category right now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
