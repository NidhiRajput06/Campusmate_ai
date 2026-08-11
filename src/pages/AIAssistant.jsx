import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, HelpCircle } from "lucide-react";
import { aiAssistantBrain, campusLocations, busRoutesData } from "../data/campusData";

export default function AIAssistant({ setCurrentPage, setDestinationLocationId }) {
  const [messages, setMessages] = useState([
    {
      id: "greet",
      sender: "assistant",
      text: aiAssistantBrain.greetings[Math.floor(Math.random() * aiAssistantBrain.greetings.length)],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const suggestedQuestions = [
    "Where is the library?",
    "Where is the AI Lab?",
    "Where is the examination cell?",
    "What are library timings?",
    "Where is the canteen?",
    "Where is the administration office?"
  ];

  // Helper to extract location ID based on matching query keywords
  const getMatchedLocationId = (query) => {
    const cleanQuery = query.toLowerCase();
    for (const loc of campusLocations) {
      if (
        cleanQuery.includes(loc.name.toLowerCase()) || 
        cleanQuery.includes(loc.officialName.toLowerCase()) ||
        (loc.id && cleanQuery.includes(loc.id.replace('_', ' '))) ||
        (loc.aliases && loc.aliases.some(a => cleanQuery.includes(a.toLowerCase())))
      ) {
        return loc.id;
      }
    }
    return null;
  };

  const handleSendMessage = (text) => {
    if (!text.trim()) return;

    // 1. Add user message
    const userMessage = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking and reply (1s delay for professional feel)
    setTimeout(() => {
      const responseText = generateAIResponse(text);
      const matchedLocId = getMatchedLocationId(text) || getMatchedLocationId(responseText);
      
      const assistantReply = {
        id: `msg-${Date.now()}-ai`,
        sender: "assistant",
        text: responseText,
        locationId: matchedLocId,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages((prev) => [...prev, assistantReply]);
      setIsTyping(false);
    }, 1000);
  };

  // Local rule-based AI match engine referencing the official verified database
  const generateAIResponse = (query) => {
    const cleanQuery = query.toLowerCase();
    
    // 1. Check if query is asking about a specific bus route number timing or stops
    const routeMatch = cleanQuery.match(/route\s*([0-9a-zA-Z-]+)/);
    if (routeMatch) {
      const routeNum = routeMatch[1].toUpperCase();
      const matchedShiftRoutes = busRoutesData.filter(
        (r) => r.routeNumber.toUpperCase() === routeNum
      );
      if (matchedShiftRoutes.length > 0) {
        let resp = `Verified Timing Details for **Route ${routeNum}** (based on LNCT Route 2025):\n\n`;
        matchedShiftRoutes.forEach((route) => {
          const firstStop = route.stops[0];
          const lastStop = route.stops[route.stops.length - 1];
          resp += `🚌 **${route.shift}**:\n`;
          resp += `  • **Total Stops**: ${route.stops.length}\n`;
          resp += `  • **First Departure**: ${firstStop.time} (from ${firstStop.name})\n`;
          resp += `  • **Destination**: LNCT Campus (approx. ${lastStop.time})\n`;
          resp += `  • **Demo Live status**: On Route (Simulated position near ${firstStop.name})\n`;
          resp += `  • **Stops Timeline**:\n`;
          route.stops.forEach((s, idx) => {
            resp += `    ${idx + 1}. ${s.name} (${s.time || "N/A"})\n`;
          });
          resp += `\n`;
        });
        return resp;
      }
    }

    // 2. Check if query is asking about which bus/route goes from a specific stoppage name
    if (cleanQuery.includes("bus") || cleanQuery.includes("route") || cleanQuery.includes("go from") || cleanQuery.includes("start from")) {
      const foundStops = [];
      busRoutesData.forEach((route) => {
        route.stops.forEach((stop) => {
          if (cleanQuery.includes(stop.name.toLowerCase()) && stop.name.length > 3) {
            foundStops.push({ route, stop });
          }
        });
      });
      if (foundStops.length > 0) {
        const uniqueMatches = [];
        const seenKeys = new Set();
        foundStops.forEach(f => {
          const key = `${f.route.routeNumber}-${f.route.shift}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueMatches.push(f);
          }
        });
        
        let resp = `Verified Stoppage Information: The following routes pass through **${uniqueMatches[0].stop.name}**:\n`;
        uniqueMatches.forEach(m => {
          resp += `• **Route ${m.route.routeNumber}** (${m.route.shift}) - scheduled pickup at **${m.stop.time}**\n`;
        });
        return resp;
      }
    }

    // 3. Check if query matches any verified campus locations, building names or hostel names
    for (const loc of campusLocations) {
      const isMatch = cleanQuery.includes(loc.name.toLowerCase()) || 
                      cleanQuery.includes(loc.building.toLowerCase()) || 
                      (loc.id && cleanQuery.includes(loc.id.replace('_', ' ')));
      if (isMatch) {
        return `Verified Campus Location:\n📍 **${loc.name}**\n🏢 **Building**: ${loc.building} (${loc.floor})\nℹ️ **Description**: ${loc.description}\n🕒 **Opening Hours**: ${loc.openingHours}\n💼 **Facilities**: ${loc.facilities.join(", ")}`;
      }
    }

    // 4. Default knowledge base fallback
    for (const entry of aiAssistantBrain.knowledgeBase) {
      const hasMatch = entry.keywords.some((keyword) => cleanQuery.includes(keyword));
      if (hasMatch) {
        return entry.response;
      }
    }

    // 5. Unverified fallback instead of hallucinating
    if (cleanQuery.includes("where") || cleanQuery.includes("bus") || cleanQuery.includes("time") || cleanQuery.includes("block") || cleanQuery.includes("hostel")) {
      return "I don't have verified information for that yet. Please refer to the official LNCT website or the Campus Map directory.";
    }

    return aiAssistantBrain.defaultResponse;
  };

  /* 
    FUTURE BACKEND INTEGRATION NOTE:
    To connect this chatbot to a real-world API (e.g., Gemini API, OpenAI, or a Node/Express backend),
    replace the setTimeout/generateAIResponse section above with a fetch request.
    
    Example API implementation code:
    
    const handleSendMessage = async (text) => {
      // Add User Message code remains the same...
      setIsTyping(true);
      
      try {
        const response = await fetch("https://api.youruniversity.edu/campus-bot", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer YOUR_JWT_TOKEN"
          },
          body: JSON.stringify({ message: text })
        });
        const data = await response.json();
        
        setMessages((prev) => [...prev, {
          id: `msg-${Date.now()}-ai`,
          sender: "assistant",
          text: data.reply || data.text,
          time: new Date().toLocaleTimeString()
        }]);
      } catch (error) {
        setMessages((prev) => [...prev, {
          id: `msg-${Date.now()}-err`,
          sender: "assistant",
          text: "I'm sorry, I am experiencing connection issues. Please try again.",
          time: new Date().toLocaleTimeString()
        }]);
      } finally {
        setIsTyping(false);
      }
    };
  */

  return (
    <div className="page-body">
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>CampusMate AI 🤖</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Your smart AI guide. Ask questions about timings, offices, events, and navigation checkpoints.
        </p>
      </div>

      <div className="chat-page-layout">
        {/* Left Suggestions Sidepanel */}
        <div className="glass-panel chat-suggestions-sidebar">
          <div className="chat-suggested-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <HelpCircle size={16} className="text-gradient" />
            <span>Suggested Questions</span>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                className="suggestion-pill"
                onClick={() => handleSendMessage(q)}
                disabled={isTyping}
              >
                {q}
              </button>
            ))}
          </div>

          <div 
            style={{ 
              marginTop: "auto", 
              padding: "16px", 
              borderRadius: "10px", 
              background: "linear-gradient(135deg, rgba(99,102,241,0.02) 0%, rgba(168,85,247,0.02) 100%)",
              border: "1px solid var(--border-color)",
              fontSize: "0.8rem",
              lineHeight: "1.4",
              color: "var(--text-secondary)"
            }}
          >
            🚀 <strong>API Ready Architecture:</strong> This chatbot is configured with standard state flows, allowing quick transition to Gemini, ChatGPT, or custom vector search endpoints.
          </div>
        </div>

        {/* Right Chat Window View */}
        <div className="chat-viewport-panel">
          {/* Messages Stream */}
          <div className="chat-messages-container">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`chat-message-bubble ${msg.sender}`}
                style={{ position: "relative" }}
              >
                {/* Bubble Sender details */}
                <div 
                  style={{ 
                    fontSize: "0.7rem", 
                    opacity: 0.7, 
                    marginBottom: "4px", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "4px",
                    fontWeight: 700
                  }}
                >
                  {msg.sender === "assistant" ? <Bot size={12} /> : <User size={12} />}
                  <span>{msg.sender === "assistant" ? "CampusMate AI" : "You"}</span>
                </div>
                
                <div>{msg.text}</div>
                
                {msg.locationId && (
                  <button
                    className="btn btn-primary"
                    style={{
                      marginTop: "8px",
                      padding: "6px 12px",
                      fontSize: "0.7rem",
                      borderRadius: "8px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      border: "none",
                      cursor: "pointer"
                    }}
                    onClick={() => {
                      if (setDestinationLocationId && setCurrentPage) {
                        setDestinationLocationId(msg.locationId);
                        setCurrentPage("map");
                      }
                    }}
                  >
                    📍 Show on Map
                  </button>
                )}

                <div 
                  style={{ 
                    fontSize: "0.6rem", 
                    opacity: 0.5, 
                    textAlign: "right", 
                    marginTop: "6px" 
                  }}
                >
                  {msg.time}
                </div>
              </div>
            ))}

            {/* Typing Loader bubble */}
            {isTyping && (
              <div className="chat-message-bubble assistant">
                <div style={{ fontSize: "0.7rem", opacity: 0.7, marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px", fontWeight: 700 }}>
                  <Bot size={12} />
                  <span>CampusMate AI</span>
                </div>
                <div className="chat-typing-loader">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Form Message input bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }} 
            className="chat-input-container"
          >
            <input 
              type="text" 
              className="chat-input-field" 
              placeholder="Ask anything about the campus (e.g. library, medical room)..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
            />
            
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ borderRadius: "12px", width: "48px", height: "48px", padding: 0 }}
              disabled={!inputValue.trim() || isTyping}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
