import React, { useEffect, useCallback, useState } from "react";
import Map from "../components/Map";
import RoutePanel from "../components/RoutePanel";
import { findRoute } from "../utils/pathfinding";
import { campusLocations, campusPhotos } from "../data/campusData";
import { Compass, ExternalLink, Image, MapPin, Maximize2, X, Edit2, Trash2 } from "lucide-react";

export default function MapPage({
  startLocationId,
  setStartLocationId,
  destinationLocationId,
  setDestinationLocationId,
  activeRoute,
  setActiveRoute,
  setCurrentPage,
  setSelectedLocation
}) {
  const [activeSubTab, setActiveSubTab] = useState("map");
  const [mapSearchValue, setMapSearchValue] = useState("");

  // Filter matching locations for the map page search bar
  const searchResults = campusLocations.filter((loc) =>
    loc.name.toLowerCase().includes(mapSearchValue.toLowerCase())
  );

  // State to hold editable gallery items
  const [galleryList, setGalleryList] = useState(campusPhotos);
  const [gallerySearchText, setGallerySearchText] = useState("");

  const handleDeletePhoto = (id) => {
    setGalleryList(prev => prev.filter(item => item.id !== id));
  };

  const filteredGallery = galleryList.filter(item => {
    const q = gallerySearchText.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.buildingName && item.buildingName.toLowerCase().includes(q)) ||
      (item.hostelName && item.hostelName.toLowerCase().includes(q)) ||
      (item.source && item.source.toLowerCase().includes(q))
    );
  });

  // Fullscreen Modal Image zoom state
  const [zoomImage, setZoomImage] = useState(null);
  const [zoomTitle, setZoomTitle] = useState("");

  const handleCalculateRoute = useCallback(() => {
    if (startLocationId && destinationLocationId) {
      const route = findRoute(startLocationId, destinationLocationId);
      setActiveRoute(route);
    }
  }, [startLocationId, destinationLocationId, setActiveRoute]);

  // Auto-find route if both start and destination are already selected
  useEffect(() => {
    if (startLocationId && destinationLocationId) {
      handleCalculateRoute();
    } else {
      setActiveRoute(null);
    }
  }, [startLocationId, destinationLocationId, handleCalculateRoute, setActiveRoute]);

  const handleClearRoute = () => {
    setStartLocationId(null);
    setDestinationLocationId(null);
    setActiveRoute(null);
  };

  const handleViewDetails = (location) => {
    setSelectedLocation(location.id);
    setCurrentPage("location-details");
  };

  const handleViewOnMap = (locId) => {
    setStartLocationId("main_gate"); // Set default starting point
    setDestinationLocationId(locId);
    setActiveSubTab("map"); // Switch focus to Map subtab
  };

  // Handlers for real-time card editing
  const handleTitleChange = (id, newTitle) => {
    setGalleryList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newTitle } : item))
    );
  };

  const handleLocationChange = (id, newLocId) => {
    setGalleryList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, locationId: newLocId } : item))
    );
  };

  const handleDescriptionChange = (id, newDesc) => {
    setGalleryList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, description: newDesc } : item))
    );
  };

  return (
    <div className="page-body">
      {/* Title Header */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Campus Explorer</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Navigate the LNCT campus, explore building photo logs, or take the official virtual 360° tour.
        </p>
      </div>

      {/* Sub tabs Navigation Bar */}
      <div className="category-tabs" style={{ marginBottom: "24px" }}>
        <button 
          className={`category-tab ${activeSubTab === "map" ? "active" : ""}`}
          onClick={() => setActiveSubTab("map")}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Compass size={14} />
          <span>Interactive Map</span>
        </button>
        <button 
          className={`category-tab ${activeSubTab === "photos" ? "active" : ""}`}
          onClick={() => setActiveSubTab("photos")}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Image size={14} />
          <span>Explore Gallery</span>
        </button>
        <button 
          className={`category-tab ${activeSubTab === "tour" ? "active" : ""}`}
          onClick={() => setActiveSubTab("tour")}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <ExternalLink size={14} />
          <span>360° Virtual Tour</span>
        </button>
      </div>

      {/* RENDER ACTIVE SUBTAB VIEW */}
      {activeSubTab === "map" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
          {/* Map Toolbar (Search + 360 Button) */}
          <div 
            style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              gap: "16px", 
              flexWrap: "wrap",
              position: "relative"
            }}
          >
            {/* Search Input */}
            <div style={{ position: "relative", flex: 1, minWidth: "280px" }}>
              <input 
                type="text" 
                placeholder="Search campus location..." 
                value={mapSearchValue} 
                onChange={(e) => setMapSearchValue(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "10px 16px 10px 40px", 
                  borderRadius: "10px", 
                  fontSize: "0.85rem",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)"
                }}
              />
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}>
                🔍
              </span>
              {mapSearchValue && (
                <button 
                  onClick={() => setMapSearchValue("")} 
                  style={{ 
                    position: "absolute", 
                    right: "12px", 
                    top: "50%", 
                    transform: "translateY(-50%)", 
                    border: "none", 
                    background: "none", 
                    color: "var(--text-secondary)",
                    cursor: "pointer"
                  }}
                >
                  <X size={14} />
                </button>
              )}

              {/* Floating Dropdown Search Results */}
              {mapSearchValue && searchResults.length > 0 && (
                <div 
                  className="glass-panel" 
                  style={{ 
                    position: "absolute", 
                    top: "44px", 
                    left: 0, 
                    width: "100%", 
                    maxHeight: "260px", 
                    overflowY: "auto", 
                    zIndex: 1000, 
                    padding: "8px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                    background: "var(--bg-primary)",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)"
                  }}
                >
                  {searchResults.map((loc) => (
                    <div 
                      key={loc.id} 
                      style={{ 
                        padding: "10px 12px", 
                        borderRadius: "8px", 
                        cursor: "pointer", 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        marginBottom: "4px" 
                      }}
                      className="search-result-item-hover"
                      onClick={() => {
                        setDestinationLocationId(loc.id);
                        setMapSearchValue("");
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>📍 {loc.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          Building: {loc.building} • Floor: {loc.floor} • Campus: LNCT Bhopal
                        </div>
                      </div>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: "4px 8px", fontSize: "0.7rem", borderRadius: "6px" }}
                      >
                        View on Map
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Explore 360 Button */}
            <a 
              href="https://tour.lnct.ac.in/LNCT/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary"
              style={{ 
                display: "inline-flex", 
                alignItems: "center",
                padding: "10px 20px", 
                gap: "8px", 
                textDecoration: "none", 
                fontSize: "0.85rem",
                borderRadius: "10px" 
              }}
            >
              <span>🌐 Explore Campus in 360°</span>
            </a>
          </div>

          <div className="map-page-layout">
            {/* Left Side Route Planner */}
            <RoutePanel
              startLocationId={startLocationId}
              destinationLocationId={destinationLocationId}
              onSelectStart={setStartLocationId}
              onSelectDestination={setDestinationLocationId}
              activeRoute={activeRoute}
              onClearRoute={handleClearRoute}
              onFindRoute={handleCalculateRoute}
            />

            {/* Right Side Interactive Map */}
            <div className="glass-panel map-viewport-panel" style={{ padding: "12px", background: "var(--bg-secondary)" }}>
              <Map
                startLocationId={startLocationId}
                destinationLocationId={destinationLocationId}
                activeRoute={activeRoute}
                onSelectDestination={setDestinationLocationId}
                onViewDetails={handleViewDetails}
              />
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "photos" && (
        <div>
          <div style={{ marginBottom: "20px" }}>
            <h3 className="section-title">Explore Campus Gallery</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
              Double-check photos, rename titles/descriptions, or link them to map landmarks in real-time.
            </p>
          </div>

          {/* Search bar for gallery (Part 25) */}
          <div style={{ marginBottom: "24px", maxWidth: "480px" }}>
            <input 
              type="text" 
              placeholder="🔍 Search Campus (e.g. Library, Hostel, Block)..." 
              value={gallerySearchText} 
              onChange={(e) => setGallerySearchText(e.target.value)}
              style={{ 
                width: "100%", 
                padding: "10px 14px", 
                borderRadius: "8px", 
                fontSize: "0.85rem", 
                background: "var(--bg-secondary)", 
                border: "1.5px solid var(--border-color)", 
                color: "var(--text-primary)" 
              }}
            />
          </div>

          <div className="location-cards-grid">
            {filteredGallery.map((item) => (
              <div key={item.id} className="glass-card" style={{ overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Responsive Image with custom crop */}
                <div style={{ height: "200px", overflow: "hidden", background: "var(--bg-primary)", position: "relative" }}>
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <button
                    className="nav-icon-btn"
                    style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(15,21,36,0.65)", color: "white", border: "none", backdropFilter: "blur(4px)" }}
                    onClick={() => { setZoomImage(item.image); setZoomTitle(item.name); }}
                    title="View Full Image"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>

                <div style={{ padding: "20px", display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between", gap: "14px" }}>
                  
                  {/* Editable card body */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    
                    {/* Editable Title input */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                        <Edit2 size={10} /> Label Title
                      </span>
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={(e) => handleTitleChange(item.id, e.target.value)}
                        style={{ padding: "6px 10px", fontSize: "0.85rem", borderRadius: "6px" }}
                      />
                    </div>

                    {/* Editable Description textarea */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Description</span>
                      <textarea 
                        rows="2"
                        value={item.description} 
                        onChange={(e) => handleDescriptionChange(item.id, e.target.value)}
                        style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px", resize: "none" }}
                      />
                    </div>

                    {/* Editable Location Pin Mapper Dropdown */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={10} /> Link To Map Pin
                      </span>
                      <select 
                        value={item.locationId} 
                        onChange={(e) => handleLocationChange(item.id, e.target.value)}
                        style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px" }}
                      >
                        {campusLocations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} ({loc.building})
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Actions buttons */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1, minWidth: "70px", padding: "8px 10px", fontSize: "0.75rem", gap: "4px" }}
                      onClick={() => { setZoomImage(item.image); setZoomTitle(item.name); }}
                    >
                      <Maximize2 size={12} />
                      <span>View</span>
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ flex: 1, minWidth: "110px", padding: "8px 10px", fontSize: "0.75rem", gap: "4px" }}
                      onClick={() => handleViewOnMap(item.locationId)}
                    >
                      <Compass size={12} />
                      <span>View on Map</span>
                    </button>
                    <button 
                      className="btn" 
                      style={{ 
                        flex: "none", 
                        padding: "8px 10px", 
                        fontSize: "0.75rem", 
                        gap: "4px", 
                        background: "rgba(239, 68, 68, 0.08)", 
                        color: "var(--danger-color)", 
                        border: "1px solid rgba(239, 68, 68, 0.15)" 
                      }}
                      onClick={() => handleDeletePhoto(item.id)}
                      title="Delete Photo"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "tour" && (
        <div className="glass-panel" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Explore LNCT Campus in 360°</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
              Take an immersive virtual tour of the LNCT campus. Explore research cells, campus buildings, and playgrounds in full 360° panoramic view.
            </p>
          </div>

          <div>
            <a 
              href="https://tour.lnct.ac.in/LNCT/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary"
              style={{ display: "inline-flex", padding: "12px 24px", gap: "8px", textDecoration: "none" }}
            >
              <Compass size={18} />
              <span>Start 360° Tour</span>
            </a>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              💡 <strong>IFrame Browser Notice:</strong> Below is a preview of the official LNCT 360° virtual tour. If the tour does not load due to browser frame policies, click the button above to launch it in a new tab.
            </div>

            <div 
              style={{ 
                width: "100%", 
                height: "550px", 
                borderRadius: "12px", 
                overflow: "hidden", 
                border: "1px solid var(--border-color)",
                background: "var(--bg-primary)",
                position: "relative"
              }}
            >
              <iframe 
                src="https://tour.lnct.ac.in/LNCT/" 
                title="LNCT 360 Virtual Tour" 
                width="100%" 
                height="100%" 
                style={{ border: "none" }}
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE MODAL PREVIEW OVERLAY */}
      {zoomImage && (
        <div 
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: "rgba(11,15,25,0.9)", 
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            zIndex: 1100, 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center",
            padding: "24px"
          }}
          onClick={() => { setZoomImage(null); setZoomTitle(""); }}
        >
          {/* Header Title inside overlay */}
          <div 
            style={{ 
              width: "100%", 
              maxWidth: "1000px", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "16px",
              color: "white" 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white" }}>{zoomTitle}</h4>
            <button 
              className="nav-icon-btn" 
              style={{ border: "none", color: "white", background: "rgba(255,255,255,0.1)" }}
              onClick={() => { setZoomImage(null); setZoomTitle(""); }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Container representing high-res crop frame */}
          <div 
            style={{ 
              maxWidth: "1000px", 
              width: "100%", 
              maxHeight: "80vh", 
              borderRadius: "16px", 
              overflow: "hidden", 
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
              border: "1px solid rgba(255,255,255,0.15)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={zoomImage} 
              alt={zoomTitle} 
              style={{ width: "100%", height: "auto", maxHeight: "80vh", objectFit: "contain", display: "block" }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
