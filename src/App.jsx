import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MapPage from "./pages/MapPage";
import FindLocation from "./pages/FindLocation";
import AIAssistant from "./pages/AIAssistant";
import LocationDetails from "./pages/LocationDetails";
import Departments from "./pages/Departments";
import Notices from "./pages/Notices";
import Emergency from "./pages/Emergency";
import Settings from "./pages/Settings";
import BusTracking from "./pages/BusTracking";

export default function App() {
  // Session Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [studentInfo, setStudentInfo] = useState({ name: "Student", email: "student@university.edu" });

  // Routing State
  const [currentPage, setCurrentPage] = useState("dashboard"); // default page
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global Page Communication States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("library");
  const [startLocationId, setStartLocationId] = useState(null);
  const [destinationLocationId, setDestinationLocationId] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [theme, setTheme] = useState("light");

  const handleLogin = (info) => {
    setStudentInfo(info);
    setIsAuthenticated(true);
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSearchQuery("");
    setStartLocationId(null);
    setDestinationLocationId(null);
    setActiveRoute(null);
  };

  // Login check fallback
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Active page renderer
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard
            studentInfo={studentInfo}
            setCurrentPage={setCurrentPage}
            setSearchQuery={setSearchQuery}
            setSelectedLocation={setSelectedLocationId}
            onSelectDestination={setDestinationLocationId}
          />
        );
      case "map":
        return (
          <MapPage
            startLocationId={startLocationId}
            setStartLocationId={setStartLocationId}
            destinationLocationId={destinationLocationId}
            setDestinationLocationId={setDestinationLocationId}
            activeRoute={activeRoute}
            setActiveRoute={setActiveRoute}
            setCurrentPage={setCurrentPage}
            setSelectedLocation={setSelectedLocationId}
          />
        );
      case "find":
        return (
          <FindLocation
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setCurrentPage={setCurrentPage}
            setSelectedLocation={setSelectedLocationId}
            setStartLocationId={setStartLocationId}
            setDestinationLocationId={setDestinationLocationId}
          />
        );
      case "assistant":
        return (
          <AIAssistant 
            setCurrentPage={setCurrentPage} 
            setDestinationLocationId={setDestinationLocationId} 
          />
        );
      case "location-details":
        return (
          <LocationDetails
            selectedLocationId={selectedLocationId}
            setSelectedLocation={setSelectedLocationId}
            setCurrentPage={setCurrentPage}
            setStartLocationId={setStartLocationId}
            setDestinationLocationId={setDestinationLocationId}
          />
        );
      case "departments":
        return (
          <Departments
            setCurrentPage={setCurrentPage}
            setSearchQuery={setSearchQuery}
          />
        );
      case "notices":
        return <Notices />;
      case "emergency":
        return (
          <Emergency
            setCurrentPage={setCurrentPage}
            setStartLocationId={setStartLocationId}
            setDestinationLocationId={setDestinationLocationId}
          />
        );
      case "settings":
        return (
          <Settings
            studentInfo={studentInfo}
            setStudentInfo={setStudentInfo}
            theme={theme}
            setTheme={setTheme}
          />
        );
      case "bus":
        return (
          <BusTracking
            setCurrentPage={setCurrentPage}
            setStartLocationId={setStartLocationId}
            setDestinationLocationId={setDestinationLocationId}
            setActiveRoute={setActiveRoute}
          />
        );
      default:
        return (
          <Dashboard
            studentInfo={studentInfo}
            setCurrentPage={setCurrentPage}
            setSearchQuery={setSearchQuery}
            setSelectedLocation={setSelectedLocationId}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar overlay backdrop on mobile (Part 13) */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogout={handleLogout}
      />

      <div className="main-content">
        {/* Global Navbar Header */}
        <Navbar
          studentInfo={studentInfo}
          setCurrentPage={setCurrentPage}
          setSearchQuery={setSearchQuery}
          setSidebarOpen={setSidebarOpen}
          onLogout={handleLogout}
        />

        {/* Dynamic Main Body Content */}
        {renderPage()}
      </div>
    </div>
  );
}
