import React, { useState, useEffect } from "react";
import { supabase } from "./utils/supabaseClient";
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
  const [loading, setLoading] = useState(true);

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

  // Track Supabase Session Lifecycle (Part 4)
  useEffect(() => {
    // 1. Fetch current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // 2. Listen to active auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = async (session) => {
    if (session) {
      // Retrieve student profile from public.students table (Part 5)
      const { data: profile } = await supabase
        .from("students")
        .select("full_name, email")
        .eq("auth_user_id", session.user.id)
        .single();

      if (profile) {
        setStudentInfo({ name: profile.full_name, email: profile.email });
      } else {
        setStudentInfo({ 
          name: session.user.user_metadata?.full_name || "Student", 
          email: session.user.email 
        });
      }
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      setStudentInfo({ name: "Student", email: "student@university.edu" });
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setSearchQuery("");
    setStartLocationId(null);
    setDestinationLocationId(null);
    setActiveRoute(null);
  };

  // Prevent flicker during session check
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg-primary)" }}>
        <div style={{ border: "4px solid var(--border-color)", borderTop: "4px solid var(--primary-color)", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Login check fallback
  if (!isAuthenticated) {
    return <Login />;
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
