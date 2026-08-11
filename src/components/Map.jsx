import React, { useState, useEffect } from "react";
import { campusLocations, campusEdges, campusPhotos } from "../data/campusData";
import campusMapImage from "../assets/lnct_campus_map.jpg";
import { Clock, Navigation, X, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2 } from "lucide-react";

export default function Map({ 
  startLocationId, 
  destinationLocationId, 
  activeRoute, 
  onSelectDestination,
  onViewDetails,
  // Optional Bus tracking props
  buses = [],
  activeBus = null,
  busProgress = 0
}) {
  const [selectedPin, setSelectedPin] = useState(null);
  const [hoveredBldg, setHoveredBldg] = useState(null);

  // Map Mode: "3d" (Interactive Campus Map) or "original" (Original LNCT Map)
  const [mapMode, setMapMode] = useState("3d");

  // Category Layer Filter state
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Zoom & Pan states
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync selectedPin when destinationLocationId changes from outside
  useEffect(() => {
    if (destinationLocationId) {
      const loc = campusLocations.find((l) => l.id === destinationLocationId);
      if (loc) {
        setSelectedPin(loc);
        
        // Auto-pan to center on selected pin to guide the user
        const targetX = 400 - loc.coordinates.x;
        const targetY = 400 - loc.coordinates.y;
        setPosition({ x: targetX, y: targetY });
        setScale(1.3);
      }
    } else {
      setSelectedPin(null);
    }
  }, [destinationLocationId]);

  // Width & height matching the square aspect ratio of our coordinates
  const width = 800;
  const height = 800;

  // Mouse Drag handlers for panning
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Panning for mobile support
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setScale((s) => Math.min(s + 0.25, 4));
  };

  const handleZoomOut = () => {
    setScale((s) => Math.max(s - 0.25, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Check if a location is part of the active route
  const isNodeInRoute = (nodeId) => {
    if (!activeRoute || !activeRoute.path) return false;
    return activeRoute.path.some((loc) => loc.id === nodeId);
  };

  // Build route polyline string if route exists
  const routePoints = activeRoute && activeRoute.path
    ? activeRoute.path.map((loc) => `${loc.coordinates.x},${loc.coordinates.y}`).join(" ")
    : "";

  // Category Layer Filters list
  const categories = [
    "All",
    "Academic",
    "Hostels",
    "Food",
    "Sports",
    "Bank/ATM",
    "Shops",
    "Residential",
    "Administration",
    "Transport",
    "Other Facilities"
  ];

  // Filter campus locations based on category layer
  const filteredLocations = campusLocations.filter((loc) => {
    if (selectedCategory === "All") return true;
    return loc.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Predefined campus internal shuttle drop points path coordinates
  const campusInternalPath = [
    { x: 480, y: 730 }, // Main Gate
    { x: 485, y: 725 }, // Security
    { x: 590, y: 730 }, // Bus Stand / Parking
    { x: 425, y: 670 }, // Lakshmi Narayan Block
    { x: 350, y: 575 }, // Babbage Block
    { x: 450, y: 570 }, // LNCT New Building
    { x: 720, y: 510 }  // Main Block / Drop Terminal
  ];

  // Interpolate simulated bus position based on progress
  const getInterpolatedBusCoords = () => {
    const startIndex = Math.floor(busProgress);
    const endIndex = Math.ceil(busProgress);
    if (startIndex >= campusInternalPath.length - 1) {
      return campusInternalPath[campusInternalPath.length - 1];
    }
    const startPt = campusInternalPath[startIndex];
    const endPt = campusInternalPath[endIndex];
    const segmentProgress = busProgress - startIndex;
    return {
      x: startPt.x + (endPt.x - startPt.x) * segmentProgress,
      y: startPt.y + (endPt.y - startPt.y) * segmentProgress
    };
  };

  // Category Icons Map for clean visual markers
  const getCategoryIcon = (category) => {
    switch (category) {
      case "Academic": return "🏫";
      case "Hostels": return "🏠";
      case "Food": return "🍴";
      case "Sports": return "🏀";
      case "Bank/ATM": return "🏦";
      case "Shops": return "🛍️";
      case "Residential": return "🏡";
      case "Administration": return "🏢";
      case "Transport": return "🚌";
      case "Other Facilities": return "📍";
      default: return "📍";
    }
  };

  // Conditional label helper to keep map uncluttered
  const shouldShowLabel = (loc) => {
    if (loc.id === destinationLocationId || loc.id === startLocationId || selectedPin?.id === loc.id) return true;
    
    // Top major landmarks visible at normal zoom
    const majorIds = ["main_gate", "admin_office", "academic_a", "central_library", "main_block", "tripuri_hostel", "bus_stand", "hanuman_temple"];
    if (scale <= 1.25) {
      return majorIds.includes(loc.id);
    }
    
    // Show all labels when zoomed in
    return scale > 1.25;
  };

  // 3D Isometric building box renderer
  const render3DBuilding = (loc) => {
    const { x, y } = loc.coordinates;
    let w = 45;
    let h = 32;
    let dh = 24; // Height extrusion for 3D

    // Specific dimensions based on building types to represent blueprints accurately
    if (loc.id === "admin_office") { w = 75; h = 55; dh = 35; }
    else if (loc.id === "main_block") { w = 85; h = 60; dh = 40; }
    else if (loc.id === "academic_a") { w = 65; h = 45; dh = 28; }
    else if (loc.id.includes("new_building")) { w = 55; h = 42; dh = 30; }
    else if (loc.id.includes("hostel")) { w = 50; h = 38; dh = 32; }
    else if (loc.id.includes("auditorium")) { w = 65; h = 45; dh = 32; }
    else if (loc.id === "central_library") { w = 60; h = 45; dh = 32; }
    else if (loc.id.includes("ground") || loc.id.includes("court")) { return null; } // Flat elements
    else if (loc.id.includes("gate")) { w = 26; h = 18; dh = 14; }
    else { w = 35; h = 26; dh = 18; }

    const x1 = x - w / 2;
    const x2 = x + w / 2;
    const y1 = y - h / 2;
    const y2 = y + h / 2;

    const rx1 = x1;
    const rx2 = x2;
    const ry1 = y1 - dh;
    const ry2 = y2 - dh;

    // Visual muting logic when navigating (Part 10 & 11)
    const isNavigating = startLocationId && destinationLocationId;
    const isStartOrDest = loc.id === startLocationId || loc.id === destinationLocationId;
    const buildingOpacity = isNavigating && !isStartOrDest ? 0.15 : 1;

    // Check if Hanuman Temple for peaked pagoda roof
    if (loc.id === "hanuman_temple") {
      const apexX = x;
      const apexY = y - dh - 15;
      
      const frontLeft = `${x1},${y2} ${x},${y2} ${apexX},${apexY}`;
      const frontRight = `${x},${y2} ${x2},${y2} ${apexX},${apexY}`;
      const backLeft = `${x1},${y1} ${x1},${y2} ${apexX},${apexY}`;
      const backRight = `${x2},${y1} ${x2},${y2} ${apexX},${apexY}`;

      return (
        <g 
          key={`3d-bldg-${loc.id}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPin(loc);
          }}
          onMouseEnter={() => setHoveredBldg(loc.id)}
          onMouseLeave={() => setHoveredBldg(null)}
          style={{ cursor: "pointer", transition: "opacity 0.3s ease" }}
          opacity={buildingOpacity}
        >
          {/* Pagoda segments */}
          <polygon points={backLeft} fill="#d97706" opacity="0.6" />
          <polygon points={backRight} fill="#d97706" opacity="0.7" />
          <polygon points={frontLeft} fill="#f59e0b" stroke="white" strokeWidth="0.5" />
          <polygon points={frontRight} fill="#fbbf24" stroke="white" strokeWidth="0.5" />
          {/* Pagoda peak flag */}
          <line x1={apexX} y1={apexY} x2={apexX} y2={apexY - 10} stroke="#ef4444" strokeWidth="1.5" />
          <polygon points={`${apexX},${apexY - 10} ${apexX + 6},${apexY - 8} ${apexX},${apexY - 6}`} fill="#ef4444" />
        </g>
      );
    }

    // Check if auditorium for a curved dome structure
    if (loc.id.includes("auditorium")) {
      const roofPoints = `${rx1},${ry1} ${rx1 + w/4},${ry1 - 8} ${rx2 - w/4},${ry1 - 8} ${rx2},${ry1} ${rx2},${ry2} ${rx2 - w/4},${ry2 - 8} ${rx1 + w/4},${ry2 - 8} ${rx1},${ry2}`;
      const frontPoints = `${x1},${y2} ${x2},${y2} ${rx2},${ry2} ${rx1},${ry2}`;
      const sidePoints = `${x2},${y1} ${x2},${y2} ${rx2},${ry2} ${rx2},${ry1}`;

      return (
        <g 
          key={`3d-bldg-${loc.id}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPin(loc);
          }}
          onMouseEnter={() => setHoveredBldg(loc.id)}
          onMouseLeave={() => setHoveredBldg(null)}
          style={{ cursor: "pointer", transition: "opacity 0.3s ease" }}
          opacity={buildingOpacity}
        >
          <polygon points={frontPoints} fill="rgba(6, 182, 212, 0.3)" stroke="rgba(255,255,255,0.1)" />
          <polygon points={sidePoints} fill="rgba(6, 182, 212, 0.5)" stroke="rgba(255,255,255,0.1)" />
          <polygon points={roofPoints} fill="#0ea5e9" stroke="rgba(255,255,255,0.25)" />
        </g>
      );
    }

    // Standard rectangular block faces
    const roofPoints = `${rx1},${ry1} ${rx2},${ry1} ${rx2},${ry2} ${rx1},${ry2}`;
    const frontPoints = `${x1},${y2} ${x2},${y2} ${rx2},${ry2} ${rx1},${ry2}`;
    const sidePoints = `${x2},${y1} ${x2},${y2} ${rx2},${ry2} ${rx2},${ry1}`;

    // Color code building categories for visual layering
    let roofColor = "var(--primary-color)";
    let frontColor = "rgba(99, 102, 241, 0.25)";
    let sideColor = "rgba(99, 102, 241, 0.45)";

    if (loc.category === "Hostels") {
      roofColor = "var(--accent-color)";
      frontColor = "rgba(168, 85, 247, 0.25)";
      sideColor = "rgba(168, 85, 247, 0.45)";
    } else if (loc.category === "Residential") {
      roofColor = "#d97706";
      frontColor = "rgba(217, 119, 6, 0.25)";
      sideColor = "rgba(217, 119, 6, 0.45)";
    } else if (loc.category === "Food") {
      roofColor = "#ef4444";
      frontColor = "rgba(239, 68, 68, 0.25)";
      sideColor = "rgba(239, 68, 68, 0.45)";
    } else if (loc.category === "Administration") {
      roofColor = "#06b6d4";
      frontColor = "rgba(6, 182, 212, 0.25)";
      sideColor = "rgba(6, 182, 212, 0.45)";
    }

    const isHovered = hoveredBldg === loc.id;
    const isSelected = selectedPin?.id === loc.id;

    if (isHovered || isSelected) {
      roofColor = "#ec4899";
      frontColor = "rgba(236, 72, 153, 0.4)";
      sideColor = "rgba(236, 72, 153, 0.6)";
    }

    return (
      <g 
        key={`3d-bldg-${loc.id}`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedPin(loc);
        }}
        onMouseEnter={() => setHoveredBldg(loc.id)}
        onMouseLeave={() => setHoveredBldg(null)}
        style={{ cursor: "pointer", transition: "opacity 0.3s ease" }}
        className="map-3d-bldg-group"
        opacity={buildingOpacity}
      >
        {/* Front shadow face */}
        <polygon points={frontPoints} fill={frontColor} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        {/* Side face */}
        <polygon points={sidePoints} fill={sideColor} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        {/* Roof face */}
        <polygon points={roofPoints} fill={roofColor} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
      </g>
    );
  };

  // Find photo mapped to selected pin if available
  const activeLocPhoto = selectedPin 
    ? campusPhotos.find(p => p.locationId === selectedPin.id) 
    : null;

  return (
    <div 
      className={`map-container-relative ${isFullscreen ? "fullscreen-active" : ""}`}
      style={isFullscreen ? {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 2000,
        background: "var(--bg-primary)",
        padding: "16px",
        display: "flex",
        flexDirection: "column"
      } : {
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "500px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Category Layer Filter Tab Bar */}
      <div 
        style={{ 
          display: "flex", 
          gap: "8px", 
          overflowX: "auto", 
          padding: "10px 16px", 
          background: "var(--bg-primary)", 
          borderBottom: "1px solid var(--border-color)",
          whiteSpace: "nowrap",
          zIndex: 10
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-tab ${selectedCategory === cat ? "active" : ""}`}
            style={{ 
              padding: "4px 12px", 
              fontSize: "0.7rem", 
              borderRadius: "20px",
              border: selectedCategory === cat ? "1px solid var(--primary-color)" : "1px solid var(--border-color)",
              background: selectedCategory === cat ? "var(--primary-color)" : "transparent",
              color: selectedCategory === cat ? "white" : "var(--text-secondary)",
              cursor: "pointer"
            }}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Floating Mode Toggle & Controls */}
      <div 
        style={{ 
          position: "absolute", 
          top: "60px", 
          left: "16px", 
          zIndex: 100, 
          display: "flex", 
          gap: "8px" 
        }}
      >
        <button 
          className={`btn ${mapMode === "3d" ? "btn-primary" : "btn-secondary"}`}
          style={{ padding: "6px 12px", fontSize: "0.75rem", borderRadius: "8px", border: "none" }}
          onClick={() => setMapMode("3d")}
        >
          Interactive Campus Map
        </button>
        <button 
          className={`btn ${mapMode === "original" ? "btn-primary" : "btn-secondary"}`}
          style={{ padding: "6px 12px", fontSize: "0.75rem", borderRadius: "8px", border: "none" }}
          onClick={() => setMapMode("original")}
        >
          Original LNCT Map
        </button>
      </div>

      {/* Static Compass Rose (Part 5) */}
      <div 
        style={{ 
          position: "absolute", 
          top: "60px", 
          right: "68px", 
          zIndex: 100, 
          background: "rgba(15, 23, 42, 0.8)", 
          border: "1px solid var(--border-color)", 
          borderRadius: "50%", 
          width: "36px", 
          height: "36px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          color: "white",
          fontSize: "0.75rem",
          fontWeight: "bold",
          flexDirection: "column"
        }}
        title="Map North Orientation"
      >
        <span style={{ fontSize: "0.75rem", color: "var(--accent-color)", lineHeight: 1 }}>N</span>
        <span style={{ fontSize: "0.6rem", marginTop: "-3px", lineHeight: 1 }}>↑</span>
      </div>

      {/* Floating Controls (Zoom/Reset/Fullscreen) */}
      <div 
        style={{ 
          position: "absolute", 
          top: "60px", 
          right: "16px", 
          zIndex: 100, 
          display: "flex", 
          flexDirection: "column", 
          gap: "8px" 
        }}
      >
        <button 
          className="nav-icon-btn glass-panel" 
          style={{ width: "36px", height: "36px", border: "none", color: "var(--text-primary)" }}
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button 
          className="nav-icon-btn glass-panel" 
          style={{ width: "36px", height: "36px", border: "none", color: "var(--text-primary)" }}
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button 
          className="nav-icon-btn glass-panel" 
          style={{ width: "36px", height: "36px", border: "none", color: "var(--text-primary)" }}
          onClick={handleReset}
          title="Reset View"
        >
          <RotateCcw size={16} />
        </button>
        <button 
          className="nav-icon-btn glass-panel" 
          style={{ width: "36px", height: "36px", border: "none", color: "var(--text-primary)" }}
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Map Drag Viewport Wrapper */}
      <div
        style={{
          flex: 1,
          width: "100%",
          minHeight: "450px",
          overflow: "hidden",
          cursor: isDragging ? "grabbing" : "grab",
          background: "#0f172a",
          position: "relative"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="svg-map-canvas"
          style={{ 
            width: "100%", 
            height: "100%",
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.15s ease-out"
          }}
        >
          {/* Base Layer: High-quality Original LNCT Campus Map Image */}
          <image 
            href={campusMapImage} 
            x="0" 
            y="0" 
            width="800" 
            height="800" 
          />

          {/* Interactive Mode Overlays (Sleek dark HUD backdrop + 3D projections) */}
          {mapMode === "3d" && (
            <g id="HUD-overlays">
              {/* Semi-transparent Dark Grayscale Backdrop */}
              <rect 
                width="800" 
                height="800" 
                fill="rgba(15, 23, 42, 0.45)" 
                style={{ pointerEvents: "none" }} 
              />

              {/* Flat Sports Grounds / Courts Highlights */}
              {campusLocations.map((loc) => {
                const { x, y } = loc.coordinates;
                if (loc.category === "Sports") {
                  const isCourt = loc.officialName.includes("Court");
                  return (
                    <rect
                      key={`flat-${loc.id}`}
                      x={x - 24}
                      y={y - 16}
                      width="48"
                      height="32"
                      rx="3"
                      fill={isCourt ? "#b45309" : "#14532d"}
                      opacity="0.45"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPin(loc);
                      }}
                      onMouseEnter={() => setHoveredBldg(loc.id)}
                      onMouseLeave={() => setHoveredBldg(null)}
                      style={{ cursor: "pointer" }}
                    />
                  );
                }
                return null;
              })}

              {/* Road Circulation Overlay Paths */}
              <g id="roads" opacity="0.6">
                {campusEdges.map((edge, idx) => {
                  const fromLoc = campusLocations.find((l) => l.id === edge.from);
                  const toLoc = campusLocations.find((l) => l.id === edge.to);
                  if (!fromLoc || !toLoc) return null;
                  return (
                    <line
                      key={`edge-${idx}`}
                      x1={fromLoc.coordinates.x}
                      y1={fromLoc.coordinates.y}
                      x2={toLoc.coordinates.x}
                      y2={toLoc.coordinates.y}
                      stroke="rgba(99, 102, 241, 0.4)"
                      strokeWidth="5.5"
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>

              {/* 3D Extruded Building Vector Blocks */}
              <g id="3d-blocks">
                {campusLocations.map((loc) => render3DBuilding(loc))}
              </g>
            </g>
          )}

          {/* Active Walking Route Path Layer */}
          {activeRoute && activeRoute.path && activeRoute.path.length > 0 && (
            <g id="active-route">
              <polyline 
                points={routePoints} 
                className="map-path-glow" 
                strokeWidth="7"
              />
              <polyline 
                points={routePoints} 
                className="map-path-route" 
                strokeWidth="3.5"
              />
            </g>
          )}

          {/* Active Bus Shuttle Path & Animated Marker */}
          {activeBus && (
            <g id="shuttle-route" opacity="0.85">
              <polyline
                points={campusInternalPath.map(p => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="var(--primary-color)"
                strokeWidth="4.5"
                strokeDasharray="6 4"
              />
              {campusInternalPath.map((pt, idx) => (
                <circle key={`shuttle-stop-${idx}`} cx={pt.x} cy={pt.y} r="5" fill="white" stroke="var(--primary-color)" strokeWidth="1.5" />
              ))}
            </g>
          )}

          {/* Location Interactive Pins Overlay */}
          <g id="pins">
            {filteredLocations.map((loc) => {
              const isStart = loc.id === startLocationId;
              const isDest = loc.id === destinationLocationId;
              const isInRoute = isNodeInRoute(loc.id);
              
              const isNavigating = startLocationId && destinationLocationId;
              // If navigating, only render start and destination pins to prevent map clutter (Part 10 & 11)
              if (isNavigating && !isStart && !isDest) {
                return null;
              }
              
              // Shift pin marker higher in 3D mode so it sits nicely on the roof of extruded blocks
              let yOffset = 0;
              if (mapMode === "3d") {
                if (loc.id === "admin_office") yOffset = 35;
                else if (loc.id === "main_block") yOffset = 40;
                else if (loc.id === "academic_a") yOffset = 28;
                else if (loc.id.includes("new_building")) yOffset = 30;
                else if (loc.id.includes("hostel")) yOffset = 32;
                else if (loc.id.includes("auditorium")) yOffset = 32;
                else if (loc.id === "central_library") yOffset = 32;
                else if (loc.id.includes("ground") || loc.id.includes("court")) yOffset = 0;
                else yOffset = 18;
              }

              const showLabel = shouldShowLabel(loc);

              return (
                <g 
                  key={loc.id} 
                  className="map-marker-pin"
                  transform={`translate(${loc.coordinates.x}, ${loc.coordinates.y - yOffset})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPin(loc);
                  }}
                  onMouseEnter={() => setHoveredBldg(loc.id)}
                  onMouseLeave={() => setHoveredBldg(null)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Pulsing indicator ring */}
                  {(isStart || isDest || isInRoute) && (
                    <circle
                      r="16"
                      className={`map-marker-pulse ${isDest ? "dest" : ""}`}
                    />
                  )}
                  
                  {/* Pin Dot */}
                  <circle
                    r={isStart || isDest ? "7.5" : "5.5"}
                    fill={isStart ? "var(--success-color)" : isDest ? "#ef4444" : "rgba(99, 102, 241, 0.85)"}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  
                  {/* Labeled text banner (Part 8 labels) */}
                  {showLabel && (
                    <g transform="translate(0, -18)">
                      <rect
                        x="-55"
                        y="-12"
                        width="110"
                        height="20"
                        rx="6"
                        fill="rgba(15, 23, 42, 0.9)"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1"
                      />
                      <text
                        textAnchor="middle"
                        fill="white"
                        fontSize="8px"
                        fontWeight="bold"
                        y="1"
                      >
                        {getCategoryIcon(loc.category)} {loc.officialName.replace("Block", "").slice(0, 16)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Render active bus shuttle markers directly on the map (if buses list prop is present) */}
          {buses.length > 0 && activeBus && (
            <g transform={`translate(${getInterpolatedBusCoords().x}, ${getInterpolatedBusCoords().y})`}>
              <circle r="18" fill="none" stroke="var(--primary-color)" strokeWidth="1.5" className="map-marker-pulse" />
              <circle r="10" fill="var(--primary-color)" stroke="white" strokeWidth="2" />
              <text x="0" y="3" fontSize="9px" textAnchor="middle">🚌</text>
            </g>
          )}
        </svg>

        {/* Floating card details popup overlay */}
        {selectedPin && (
          <div 
            className="map-popup-overlay"
            style={{ 
              position: "absolute", 
              bottom: "16px", 
              left: "16px", 
              zIndex: 150, 
              width: "calc(100% - 32px)", 
              maxWidth: "340px" 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-card popup-card" style={{ padding: "16px", background: "var(--bg-primary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <h4 className="popup-title" style={{ fontSize: "0.95rem", fontWeight: 800 }}>
                  {getCategoryIcon(selectedPin.category)} {selectedPin.officialName}
                </h4>
                <button 
                  className="nav-icon-btn" 
                  style={{ width: "24px", height: "24px", border: "none", background: "none" }}
                  onClick={() => setSelectedPin(null)}
                >
                  <X size={14} />
                </button>
              </div>
              
              <div className="popup-meta" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                <span>🏢 {selectedPin.building}</span>
                <span style={{ margin: "0 6px" }}>•</span>
                <span>{selectedPin.floor}</span>
              </div>

              {/* Render verified photo directly in the popup if connected */}
              {activeLocPhoto && (
                <div style={{ width: "100%", height: "110px", borderRadius: "8px", overflow: "hidden", marginBottom: "10px", border: "1px solid var(--border-color)" }}>
                  <img 
                    src={activeLocPhoto.image} 
                    alt={selectedPin.officialName} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  />
                </div>
              )}

              <p className="popup-desc" style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.4", marginBottom: "12px" }}>
                {selectedPin.description}
              </p>
              
              <div className="popup-meta" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                <Clock size={12} />
                <span>Timings: {selectedPin.openingHours}</span>
              </div>

              <div className="popup-footer" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: "1 1 calc(50% - 4px)", padding: "6px 8px", fontSize: "0.7rem", display: "inline-flex", justifyContent: "center", gap: "4px" }}
                  onClick={() => onViewDetails && onViewDetails(selectedPin)}
                >
                  <span>📷 View Photo</span>
                </button>
                
                <a
                  href="https://tour.lnct.ac.in/LNCT/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ flex: "1 1 calc(50% - 4px)", padding: "6px 8px", fontSize: "0.7rem", textDecoration: "none", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "4px" }}
                >
                  <span>🌐 Explore 360°</span>
                </a>

                <button 
                  className="btn btn-primary" 
                  style={{ width: "100%", padding: "8px 10px", fontSize: "0.75rem", display: "inline-flex", justifyContent: "center", gap: "4px", marginTop: "4px" }}
                  onClick={() => {
                    if (onSelectDestination) {
                      onSelectDestination(selectedPin.id);
                    }
                    setSelectedPin(null);
                  }}
                >
                  <Navigation size={12} />
                  <span>Navigate Here</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
