import React, { useState } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import lnctLogo from "../assets/lnct_logo.jpg";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    // Seeded demo credentials verification (Part 19 & 20)
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail !== "campusmate.demo" && cleanEmail !== "campusmate.demo@lnct.ac.in") {
      setError("Invalid username/email. Use the demo account: campusmate.demo");
      return;
    }

    if (password !== "demoPass_LNCT2025!") {
      setError("Incorrect password. Use the demo password: demoPass_LNCT2025!");
      return;
    }

    setError("");
    onLogin({ name: "Demo Student", email: "campusmate.demo@lnct.ac.in" });
  };

  return (
    <div className="login-container animate-fade-in">
      {/* CSS Animations injector */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes bgMotion {
          0% { background-position: 50% 50%; }
          50% { background-position: 55% 45%; }
          100% { background-position: 50% 50%; }
        }
        .animate-fade-in {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .animate-scale {
          animation: scaleIn 0.6s ease-out forwards;
        }
        .input-focus-effect:focus {
          border-color: var(--primary-color) !important;
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.15) !important;
          transform: translateY(-1px);
        }
        .btn-hover-effect:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);
        }
        .input-focus-effect {
          transition: all 0.25s ease-in-out;
        }
        .btn-hover-effect {
          transition: all 0.25s ease-in-out;
        }
        @media (max-width: 1023px) {
          .login-container {
            display: flex !important;
            flex-direction: column !important;
            height: auto !important;
            min-height: 100vh !important;
            width: 100% !important;
            max-width: 100vw !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            margin: 0 !important;
          }
          .login-form-side {
            width: 100% !important;
            max-width: 100% !important;
            padding: 32px 24px !important;
            order: 2 !important;
          }
          .login-illustration-side {
            display: flex !important;
            width: 100% !important;
            height: 240px !important;
            min-height: 240px !important;
            order: 1 !important;
            padding: 24px !important;
            justify-content: flex-end !important;
            align-items: flex-start !important;
            background-position: center 30% !important;
            background-size: cover !important;
          }
          .login-illustration-side h2 {
            font-size: 1.45rem !important;
          }
          .login-illustration-side p {
            font-size: 0.85rem !important;
            margin-bottom: 0px !important;
          }
          .login-illustration-side .glass-panel {
            display: none !important;
          }
        }
      `}</style>

      {/* Form side */}
      <div className="login-form-side animate-scale">
        {/* LNCT Logo Header (Part 1 & 3) */}
        <div className="login-logo" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
          <img src={lnctLogo} alt="LNCT Logo" style={{ width: "38px", height: "38px", objectFit: "contain", borderRadius: "4px" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="logo-text text-gradient" style={{ fontSize: "1.35rem", fontWeight: 800, lineHeight: 1 }}>CampusMate</span>
            <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginTop: "3px" }}>LNCT University</span>
          </div>
        </div>

        <div>
          <h2 className="login-title" style={{ fontWeight: 800 }}>Welcome Back 👋</h2>
          <p className="login-subtitle">Access smart navigation and assistant services.</p>
        </div>

        {error && (
          <div 
            style={{ 
              padding: "12px", 
              background: "rgba(239, 68, 68, 0.08)", 
              border: "1px solid rgba(239, 68, 68, 0.2)", 
              borderRadius: "8px", 
              color: "var(--danger-color)",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "20px"
            }}
          >
            ⚠️ {error}
          </div>
        )}



        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="text" 
              placeholder="e.g. student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-focus-effect"
            />
          </div>

          <div className="form-group" style={{ position: "relative" }}>
            <label className="form-label">Password</label>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-focus-effect"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-password-link">Forgot Password?</a>
          </div>

          <button type="submit" className="btn btn-primary login-btn btn-hover-effect">
            Sign In
          </button>
        </form>

        <p className="register-text">
          Don't have an account? <a href="#" className="register-link">Register here</a>
        </p>
      </div>

      {/* Beautiful Side Panel containing the actual LNCT campus photograph (Part 4) */}
      <div 
        className="login-illustration-side"
        style={{
          background: `linear-gradient(180deg, rgba(15, 23, 42, 0.3) 0%, rgba(15, 23, 42, 0.85) 100%), url("/src/assets/lnct_monsoon_campus.jpg")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          animation: "bgMotion 25s ease-in-out infinite",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "48px",
          color: "white"
        }}
      >
        <div style={{ maxWidth: "440px", zIndex: 5 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", padding: "4px 12px", borderRadius: "20px", marginBottom: "16px" }}>
            <Sparkles size={12} style={{ color: "var(--accent-color)" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: "bold", trackingLetter: "0.5px" }}>Official Campus Navigation</span>
          </div>

          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, lineHeight: "1.25", fontFamily: "'Outfit', sans-serif", marginBottom: "8px", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            Smart Campus Navigation
          </h2>
          <p style={{ fontSize: "1.05rem", opacity: 0.9, lineHeight: "1.4", fontFamily: "'Outfit', sans-serif", marginBottom: "24px" }}>
            Navigate smarter. Travel easier. Explore LNCT.
          </p>

          {/* Translucent overlay card */}
          <div 
            className="glass-panel" 
            style={{ 
              padding: "16px 20px", 
              background: "rgba(255,255,255,0.08)", 
              border: "1px solid rgba(255,255,255,0.15)", 
              backdropFilter: "blur(12px)", 
              borderRadius: "12px",
              fontSize: "0.85rem",
              lineHeight: "1.5",
              color: "rgba(255,255,255,0.9)"
            }}
          >
            Your intelligent companion for campus navigation, bus tracking and student support.
          </div>
        </div>
      </div>
    </div>
  );
}
