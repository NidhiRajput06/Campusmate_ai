import React, { useState, useEffect } from "react";
import { Search, Bot, HelpCircle } from "lucide-react";
import { campusLocations } from "../data/campusData";
import LocationCard from "../components/LocationCard";

export default function FindLocation({
  searchQuery,
  setSearchQuery,
  setCurrentPage,
  setSelectedLocation,
  setDestinationLocationId,
  setStartLocationId
}) {
  const [localSearch, setLocalSearch] = useState(searchQuery || "");
  const [activeCategory, setActiveCategory] = useState("all");

  // Keep local search sync'd if global search query changes
  useEffect(() => {
    setLocalSearch(searchQuery || "");
  }, [searchQuery]);

  const categories = [
    { id: "all", label: "All Locations" },
    { id: "academic", label: "Academic" },
    { id: "labs", label: "Labs" },
    { id: "library", label: "Library" },
    { id: "food", label: "Food & Canteen" },
    { id: "administration", label: "Administration" },
    { id: "student_services", label: "Student Services" },
    { id: "emergency", label: "Emergency & Medical" },
    { id: "sports", label: "Sports" }
  ];

  // Filtering logic
  const filteredLocations = campusLocations.filter((loc) => {
    // 1. Search Query Filter
    const matchesSearch = 
      loc.name.toLowerCase().includes(localSearch.toLowerCase()) ||
      loc.building.toLowerCase().includes(localSearch.toLowerCase()) ||
      loc.description.toLowerCase().includes(localSearch.toLowerCase()) ||
      loc.facilities.some(f => f.toLowerCase().includes(localSearch.toLowerCase())) ||
      loc.category.toLowerCase().includes(localSearch.toLowerCase());

    // 2. Category Tab Filter
    if (activeCategory === "all") return matchesSearch;
    
    let matchesCategory = false;
    if (activeCategory === "academic") matchesCategory = loc.category === "academic";
    if (activeCategory === "labs") matchesCategory = loc.category === "labs";
    if (activeCategory === "library") matchesCategory = loc.category === "library";
    if (activeCategory === "food") matchesCategory = loc.category === "food";
    if (activeCategory === "administration") matchesCategory = loc.category === "administration";
    
    if (activeCategory === "student_services") {
      matchesCategory = ["student_services", "parking", "security"].includes(loc.category);
    }
    if (activeCategory === "emergency") {
      matchesCategory = ["medical", "security"].includes(loc.category);
    }
    if (activeCategory === "sports") {
      matchesCategory = loc.category === "sports";
    }

    return matchesSearch && matchesCategory;
  });

  const handleNavigate = (locId) => {
    // Set destination node on MapPage, default start to Main Gate
    setStartLocationId("main_gate");
    setDestinationLocationId(locId);
    setCurrentPage("map");
  };

  const handleViewDetails = (loc) => {
    setSelectedLocation(loc.id);
    setCurrentPage("location-details");
  };

  return (
    <div className="page-body">
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Find Anything on Campus</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Browse departments, computer laboratories, student offices, and recreational zones.
        </p>
      </div>

      {/* Main Search Bar */}
      <div className="glass-panel" style={{ padding: "20px", marginBottom: "24px" }}>
        <div className="nav-search-container">
          <Search size={20} className="nav-search-icon" style={{ left: "16px" }} />
          <input 
            type="text" 
            className="nav-search-input" 
            placeholder="Type name, building, facility (e.g. GPU, EV charging, transcripts)..."
            style={{ paddingLeft: "48px", borderRadius: "12px", height: "48px" }}
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              setSearchQuery(e.target.value);
            }}
          />
        </div>
      </div>

      {/* Categories Horizontal Tabs */}
      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-tab ${activeCategory === cat.id ? "active" : ""}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results Count Info */}
      <div style={{ marginBottom: "16px", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
        Showing {filteredLocations.length} locations
      </div>

      {/* Locations Cards Grid */}
      {filteredLocations.length > 0 ? (
        <div className="location-cards-grid">
          {filteredLocations.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              onNavigate={handleNavigate}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      ) : (
        /* Empty State with AI Chat Redirection */
        <div 
          className="glass-panel" 
          style={{ 
            padding: "40px 20px", 
            textAlign: "center", 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center",
            gap: "16px",
            border: "1px dashed var(--border-color)"
          }}
        >
          <HelpCircle size={48} style={{ color: "var(--text-muted)" }} />
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>No Locations Found</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px", maxWidth: "420px" }}>
              We couldn't find any locations matching "{localSearch}". Try checking your spelling or filter categories.
            </p>
          </div>
          
          <button 
            className="btn btn-primary"
            style={{ gap: "8px", marginTop: "8px" }}
            onClick={() => setCurrentPage("assistant")}
          >
            <Bot size={16} />
            <span>Ask CampusMate AI Assistant</span>
          </button>
        </div>
      )}
    </div>
  );
}
