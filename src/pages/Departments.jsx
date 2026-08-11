import React, { useState } from "react";
import { campusDepartments } from "../data/campusData";
import { academicSchoolsData } from "../data/academicData";
import * as Icons from "lucide-react";
import { 
  UserCheck, 
  Users, 
  Mail, 
  MapPin, 
  GraduationCap, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Building2 
} from "lucide-react";

export default function Departments({ 
  setCurrentPage, 
  setSearchQuery 
}) {
  const [activeTab, setActiveTab] = useState("academics"); // "academics" or "directory"
  const [searchQueryLocal, setSearchQueryLocal] = useState("");
  const [expandedSchoolId, setExpandedSchoolId] = useState(null);

  // Dynamic icon renderer helper
  const renderIcon = (iconName, size = 20) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent size={size} /> : <Building2 size={size} />;
  };

  const handleViewLocation = (buildingName) => {
    setSearchQuery(buildingName);
    setCurrentPage("find");
  };

  const toggleSchoolExpand = (schoolId) => {
    setExpandedSchoolId(prev => prev === schoolId ? null : schoolId);
  };

  // Filters for Academic Schools & Programs (Part 5 & 7)
  const filteredSchools = academicSchoolsData.filter(school => {
    const query = searchQueryLocal.toLowerCase().trim();
    if (!query) return true;
    const matchSchoolName = school.schoolName.toLowerCase().includes(query);
    const matchCourses = school.courses.some(course => course.toLowerCase().includes(query));
    return matchSchoolName || matchCourses;
  });

  // Filters for Office Directory
  const filteredDepts = campusDepartments.filter(dept => {
    const query = searchQueryLocal.toLowerCase().trim();
    if (!query) return true;
    return dept.name.toLowerCase().includes(query) || 
           dept.description.toLowerCase().includes(query) ||
           dept.building.toLowerCase().includes(query);
  });

  return (
    <div className="page-body">
      {/* Page Header */}
      <div style={{ marginBottom: "24px", background: "linear-gradient(135deg, rgba(124, 58, 237, 0.04) 0%, rgba(234, 88, 12, 0.04) 100%)", padding: "20px 24px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
        <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
          <span>🎓</span>
          <span>Academics & Departments</span>
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "4px" }}>
          Explore LNCT University courses, departments, academic schools, and office contact information.
        </p>
      </div>

      {/* Tabs Switcher (Part 4) */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
        <button
          className={`btn ${activeTab === "academics" ? "btn-primary" : "btn-secondary"}`}
          style={{ padding: "8px 16px", fontSize: "0.85rem", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px" }}
          onClick={() => {
            setActiveTab("academics");
            setSearchQueryLocal("");
          }}
        >
          <GraduationCap size={16} />
          <span>Academic Programs</span>
        </button>
        <button
          className={`btn ${activeTab === "directory" ? "btn-primary" : "btn-secondary"}`}
          style={{ padding: "8px 16px", fontSize: "0.85rem", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px" }}
          onClick={() => {
            setActiveTab("directory");
            setSearchQueryLocal("");
          }}
        >
          <Building2 size={16} />
          <span>Office Directory</span>
        </button>
      </div>

      {/* Search Input (Part 5) */}
      <div style={{ position: "relative", marginBottom: "24px", width: "100%" }}>
        <Search 
          size={18} 
          style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} 
        />
        <input
          type="text"
          placeholder={activeTab === "academics" ? "Search Academic schools, departments or courses (e.g. BCA, MBA, Law)..." : "Search admin offices or department buildings..."}
          value={searchQueryLocal}
          onChange={(e) => setSearchQueryLocal(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px 12px 42px",
            borderRadius: "10px",
            border: "1.5px solid var(--border-color)",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            fontSize: "0.9rem",
            fontWeight: 500,
            outline: "none",
            height: "44px"
          }}
        />
      </div>

      {/* Tab content rendering */}
      {activeTab === "academics" ? (
        /* Academic Programs Tab */
        filteredSchools.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
            <p>No academic schools or courses matched your search query.</p>
          </div>
        ) : (
          <div className="depts-grid">
            {filteredSchools.map((school) => {
              const isExpanded = expandedSchoolId === school.id || searchQueryLocal !== "";
              
              return (
                <div 
                  key={school.id} 
                  className="glass-card" 
                  style={{ 
                    padding: "20px", 
                    display: "flex", 
                    flexDirection: "column", 
                    justifyContent: "space-between",
                    gap: "14px",
                    border: isExpanded ? "1.5px solid var(--primary-color)" : "1px solid var(--border-color)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                      <div className="dept-icon-box" style={{ flexShrink: 0 }}>
                        <GraduationCap size={20} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, color: "var(--text-primary)", lineHeight: 1.2 }}>
                          {school.schoolName}
                        </h3>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
                          LNCT University Academic Division
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: "16px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "8px", textTransform: "uppercase" }}>
                          Available Courses
                        </label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {school.courses.map((course, cIdx) => {
                            // Highlight course if it matches search query
                            const isMatch = searchQueryLocal !== "" && course.toLowerCase().includes(searchQueryLocal.toLowerCase().trim());
                            return (
                              <span 
                                key={cIdx} 
                                style={{ 
                                  fontSize: "0.75rem", 
                                  padding: "4px 10px", 
                                  borderRadius: "6px", 
                                  background: isMatch ? "rgba(234, 88, 12, 0.15)" : "var(--bg-primary)",
                                  color: isMatch ? "var(--primary-color)" : "var(--text-primary)",
                                  border: isMatch ? "1px solid var(--primary-color)" : "1px solid var(--border-color)",
                                  fontWeight: isMatch ? "bold" : "normal"
                                }}
                              >
                                {course}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                    <button
                      className="btn btn-secondary"
                      style={{ 
                        width: "100%", 
                        padding: "10px", 
                        fontSize: "0.8rem", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        gap: "6px",
                        height: "44px" // mobile touch friendly height
                      }}
                      onClick={() => toggleSchoolExpand(school.id)}
                    >
                      <span>{isExpanded ? "Hide Courses" : "View Courses"}</span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Office Directory Tab */
        filteredDepts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
            <p>No office or department matched your search query.</p>
          </div>
        ) : (
          <div className="depts-grid">
            {filteredDepts.map((dept) => (
              <div key={dept.id} className="glass-card dept-card">
                <div>
                  <div className="dept-icon-box">
                    {renderIcon(dept.icon, 22)}
                  </div>
                  
                  <h3 className="dept-name">{dept.name}</h3>
                  
                  <div className="dept-location">
                    <MapPin size={12} />
                    <span>{dept.building} • {dept.floor}</span>
                  </div>
                  
                  <p className="dept-desc">{dept.description}</p>
                </div>

                <div>
                  <div className="dept-meta-info">
                    <div className="dept-meta-item">
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", marginBottom: "4px" }}>
                        <UserCheck size={12} />
                        HOD
                      </span>
                      <strong>{dept.head}</strong>
                    </div>
                    
                    <div className="dept-meta-item" style={{ textAlign: "right" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", marginBottom: "4px", justifyContent: "flex-end" }}>
                        <Users size={12} />
                        Faculty
                      </span>
                      <strong>{dept.facultyCount} Members</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
                    <Mail size={12} style={{ color: "var(--text-muted)" }} />
                    <span>{dept.email}</span>
                  </div>

                  <button 
                    className="btn btn-secondary" 
                    style={{ width: "100%", padding: "10px", fontSize: "0.8rem", height: "44px" }}
                    onClick={() => handleViewLocation(dept.building)}
                  >
                    Locate Building Block
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
