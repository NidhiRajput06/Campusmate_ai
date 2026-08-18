import React, { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "./utils/supabaseClient";
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
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

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
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
    setSearchQuery("");
    setStartLocationId(null);
    setDestinationLocationId(null);
    setActiveRoute(null);
  };

  // 1. Render setup prompt if database credentials are not configured (Part 15)
  if (!isSupabaseConfigured) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#F8FAFC", padding: "24px", fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ background: "white", padding: "40px 32px", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", maxWidth: "500px", width: "100%", border: "1px solid #E2E8F0", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>⚙️</div>
          <h2 style={{ color: "#1E293B", fontSize: "1.5rem", fontWeight: 800, marginBottom: "12px" }}>Database Setup Required</h2>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "28px" }}>
            CampusMate AI authentication is ready! To run the application, please configure your Supabase credentials in a <strong>.env</strong> file in your project directory.
          </p>
          
          <div style={{ background: "#F1F5F9", padding: "16px", borderRadius: "8px", textAlign: "left", fontSize: "0.85rem", color: "#334155", fontFamily: "monospace", marginBottom: "28px", border: "1px solid #E2E8F0" }}>
            <span style={{ color: "#64748B" }}># Create .env file in project root:</span><br/>
            VITE_SUPABASE_URL=https://your-project.supabase.co<br/>
            VITE_SUPABASE_ANON_KEY=your-api-anon-key
          </div>

          <p style={{ color: "#94A3B8", fontSize: "0.85rem", lineHeight: "1.4" }}>
            Refer to the <strong>supabase_setup.sql</strong> file in your project folder to set up the database tables in your Supabase project.
          </p>
        </div>
      </div>
    );
  }

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
