import React, { useState, useEffect, useRef, useCallback } from "react";
import { busRoutesData, campusLocations } from "../data/campusData";
import { Play, Pause, RotateCcw, Info, Compass, Clock, User, AlertCircle } from "lucide-react";
import Map from "../components/Map";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icon resolution bug in Vite/Webpack bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper: Convert "07:15 AM" or "08:10" format into total minutes since midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const isPM = timeStr.toLowerCase().includes("pm");
  const clean = timeStr.toLowerCase().replace("am", "").replace("pm", "").trim();
  const parts = clean.split(":");
  let hrs = parseInt(parts[0], 10);
  let mins = parseInt(parts[1], 10) || 0;
  
  if (isPM && hrs < 12) hrs += 12;
  if (!isPM && hrs === 12) hrs = 0;
  
  return hrs * 60 + mins;
};

// Helper: Format minutes since midnight back into "07:15 AM"
const minutesToTimeStr = (totalMins) => {
  let hrs = Math.floor(totalMins / 60) % 24;
  const mins = Math.floor(totalMins % 60);
  const ampm = hrs >= 12 ? "PM" : "AM";
  hrs = hrs % 12;
  if (hrs === 0) hrs = 12;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")} ${ampm}`;
};

export default function BusTracking({ 
  setCurrentPage, 
  setStartLocationId, 
  setDestinationLocationId,
  setActiveRoute: setGlobalActiveRoute 
}) {
  // 1. Personalized Student Journey inputs (Part 1 & 2)
  const [selectedPickupStop, setSelectedPickupStop] = useState("NEVRI MANDIR");
  const [selectedDestination, setSelectedDestination] = useState("central_library");
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [isFollowingBus, setIsFollowingBus] = useState(false);
  const [showMobileBottomSheet, setShowMobileBottomSheet] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [mapError, setMapError] = useState(false);
  const [mapRetryCount, setMapRetryCount] = useState(0);

  const handleDeviceGPS = () => {
    setGpsError("");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setDeviceLocation([latitude, longitude]);
          
          // Find the nearest verified stop in our database
          let closestStop = "";
          let minDist = Infinity;
          Object.keys(VERIFIED_STOP_COORDINATES).forEach(stopKey => {
            const coords = VERIFIED_STOP_COORDINATES[stopKey];
            const dist = Math.pow(coords[0] - latitude, 2) + Math.pow(coords[1] - longitude, 2);
            if (dist < minDist) {
              minDist = dist;
              closestStop = stopKey;
            }
          });
          
          if (closestStop) {
            setSelectedPickupStop(closestStop);
          }
          
          if (mapInstance.current) {
            mapInstance.current.setView([latitude, longitude], 14);
          }
        },
        (_error) => {
          setGpsError("Location permission unavailable. Please select your pickup stop manually.");
        }
      );
    } else {
      setGpsError("Location permission unavailable. Please select your pickup stop manually.");
    }
  };
  
  // Custom user preferences storage toggles
  const [preferredShift, setPreferredShift] = useState("FIRST SHIFT");

  // Dynamically find matching routes for the selected pickup stop (Part 4 & 5)
  const [matchedRoutes, setMatchedRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [routeSearchText, setRouteSearchText] = useState("");

  // Extract all unique stop names from the spreadsheet dataset for the currently selected shift (Part 5)
  // and exclude non-stoppages like TAJ MAHAL or NARMADAPURAM (Part 2)
  const uniqueStops = Array.from(new Set(
    busRoutesData
      .filter(route => route.shift === preferredShift)
      .flatMap(route => route.stops.map(s => s.name.toUpperCase()))
  ))
  .filter(name => {
    const normalized = name.trim();
    return normalized !== "NARMADAPURAM" && normalized !== "AGRA" && normalized !== "DELHI";
  })
  .sort();

  // Search input filter for stops list
  const filteredStops = uniqueStops.filter(stop => 
    stop.toLowerCase().includes(routeSearchText.toLowerCase())
  );

  // Sync selected pickup stop when shift changes to make sure it exists in the active shift's stops
  useEffect(() => {
    if (uniqueStops.length > 0 && !uniqueStops.includes(selectedPickupStop.toUpperCase())) {
      setSelectedPickupStop(uniqueStops[0]);
    }
  }, [preferredShift, uniqueStops, selectedPickupStop]);

  // Sync route finding calculation when starting stop or shift preference changes
  useEffect(() => {
    // Search routes that contain this stop name
    const matches = busRoutesData.filter(route => 
      route.shift === preferredShift &&
      route.stops.some(s => s.name.toUpperCase() === selectedPickupStop.toUpperCase())
    );
    setMatchedRoutes(matches);
    if (matches.length > 0) {
      setSelectedRouteId(matches[0].routeId);
    } else {
      setSelectedRouteId("");
    }
  }, [selectedPickupStop, preferredShift]);

  // Selected active route object
  const activeRoute = busRoutesData.find(r => r.routeId === selectedRouteId) || busRoutesData[0];

  // Journey segment stops strictly starting at student's pickup (Part 1)
  const journeyStops = React.useMemo(() => {
    if (!activeRoute || !activeRoute.stops) return [];
    const pickupIdx = activeRoute.stops.findIndex(s => s.name.toUpperCase() === selectedPickupStop.toUpperCase());
    if (pickupIdx === -1) return activeRoute.stops;
    return activeRoute.stops.slice(pickupIdx);
  }, [activeRoute, selectedPickupStop]);

  // Centralized geographic database of verified coordinates (Part 4)
  const VERIFIED_STOP_COORDINATES = {
    "NEVRI MANDIR": [23.2812, 77.3625],
    "LALGHATI": [23.2758, 77.3712],
    "KOH E FIZA": [23.2721, 77.3789],
    "PARIPARK": [23.2652, 77.3912],
    "PARI PARK": [23.2652, 77.3912],
    "THANA": [23.2612, 77.3985],
    "TAJ MAHAL": [23.2604, 77.4012],
    "ROYAL MARKET": [23.2585, 77.4025],
    "PEER GATE": [23.2562, 77.4045],
    "MOTI MASJID": [23.2531, 77.4038],
    "KAMLA PARK": [23.2498, 77.3982],
    "LINK ROAD NO.1": [23.2389, 77.4212],
    "VIRASHA HIGHTS": [23.1812, 77.4385],
    "FORCHUNE SIGNATURE CITY": [23.1825, 77.4412],
    "AKRITI GREEN": [23.1804, 77.4398],
    "AKRITI ECO CITY MAIN GATE": [23.1789, 77.4415],
    "BABADIYA CHOURAHA": [23.1952, 77.4468],
    "BABADIYA CHOURAHA (INDUS)": [23.1952, 77.4468],
    "ASHOK FLORIST": [23.2125, 77.4485],
    "SHIVOY COMPLEX": [23.2289, 77.4352],
    "IDGAH HILLS": [23.2715, 77.3952],
    "SHAJANABAD PANI TANKI": [23.2722, 77.3985],
    "LBS HOSPITAL": [23.2589, 77.4015],
    "RET GHAT": [23.2512, 77.3968],
    "POLYTECHNIQ": [23.2425, 77.4012],
    "ROSHANPURA SQUARE": [23.2412, 77.4028],
    "AIRTEL OFFICE": [23.2389, 77.4052],
    "POLICE CONTROL ROOM": [23.2415, 77.4112],
    "JAIL PAHADI": [23.2452, 77.4195],
    "KENDRIYA VIDHYALAYA": [23.2489, 77.4285],
    "SOUTH AVENUE TIRHA": [23.1852, 77.4298],
    "AURA MALL": [23.1868, 77.4312],
    "SAITAN SINGH CHOURAHA": [23.1912, 77.4328],
    "11OO QTR": [23.2012, 77.4295],
    "VANDEMATRAM CHOURAHA": [23.2152, 77.4265],
    "ARERA CLUB": [23.2212, 77.4235],
    "MAHAVEER DWAR": [23.2268, 77.4215],
    "PARUL HOSPITAL": [23.2285, 77.4312],
    "BOARD OFFICE CHOURAHA": [23.2325, 77.4328],
    "PEBBLE BAY (GATE)": [23.1915, 77.4582],
    "VINAYAK FURNITURE": [23.1989, 77.4612],
    "BHEL SANGAM CHAURAH": [23.2125, 77.4715],
    "KRISHNA ARCADE CHAURAH": [23.2252, 77.4789],
    "PARINAY TANT HOUSE": [23.2312, 77.4812],
    "GAURI SHANKAR PARISAR": [23.2412, 77.4852],
    "NRI SCHOOL": [23.2389, 77.4785],
    "AMRAI CHOURAHA": [23.2412, 77.4912],
    "EMERALD PARK CITY": [23.2152, 77.4785],
    "AIIMS CHOURAHA": [23.2015, 77.4612],
    "SAGAR PUBLIC SCHOOL": [23.2052, 77.4589],
    "BARKHEDA PATHANI": [23.2112, 77.4652],
    "VIJAY MARKET": [23.2189, 77.4682],
    "MANSAROVER COMPLEX": [23.2312, 77.4312],
    "JYOTI TALKIES": [23.2345, 77.4342],
    "CHETAK BRIDGE": [23.2389, 77.4412],
    "GEETANJALI  COMPLEX": [23.2289, 77.3889],
    "PNT": [23.2268, 77.3789],
    "NEHRU NAGAR": [23.2212, 77.3689],
    "KAMLA NAAGR THANA": [23.2152, 77.3612],
    "VAISHALI NAGAR": [23.2189, 77.3582],
    "MANIT": [23.2212, 77.4085],
    "SECOND STOP BUS NO.": [23.2325, 77.4112],
    "RATIBAD SBI BANK": [23.1812, 77.3212],
    "NEELBAD": [23.1952, 77.3312],
    "BHADBAHADA": [23.2152, 77.3512],
    "POLICE LINE": [23.2312, 77.3685],
    "DEPO": [23.2325, 77.3712],
    "JAWAHAR CHOWK": [23.2345, 77.3782],
    "RANGMAHAL CHOURAHA": [23.2389, 77.3889],
    "ROSHANPURA CHOURAHA": [23.2412, 77.3912],
    "TEEN SHED": [23.2425, 77.3952],
    "MATA MANDIR": [23.2325, 77.3989],
    "ST MARY": [23.2289, 77.4012],
    "5 NO DUDH DAIRY": [23.2212, 77.4052],
    "6 NO": [23.2252, 77.4112],
    "BOARD OFFICE": [23.2325, 77.4328],
    "NEW SABJI MANDI": [23.2652, 77.4389],
    "GANESH MANDIR": [23.2689, 77.4412],
    "FOOTA MAQBARA": [23.2712, 77.4452],
    "BUS STAND": [23.2758, 77.4489],
    "ALPANA": [23.2712, 77.4385],
    "SANGAM TALKIES": [23.2689, 77.4312],
    "JAISHREE HOSTEL": [23.2652, 77.4285],
    "BAJARIYA POLICE STATION": [23.2612, 77.4252],
    "PUSHPA NAGAR": [23.2589, 77.4215],
    "BHARTIYA NIKETAN": [23.2489, 77.4452],
    "GAUTAM NAGAR": [23.2452, 77.4489],
    "RACHNA NAGAR": [23.2412, 77.4525],
    "SUBHAS NAGAR FATAK": [23.2425, 77.4589],
    "PRABHAT": [23.2452, 77.4652],
    "LAMBA KHEDA CHOURAHA": [23.3152, 77.3912],
    "KAROND CHOURAHA": [23.2952, 77.3989],
    "KAROND": [23.2952, 77.3989],
    "BHOPAL MEMORIAL": [23.2889, 77.4112],
    "PEOPLES MALL": [23.2852, 77.4189],
    "BHANPUR": [23.2812, 77.4252],
    "SAGAR ESTATE": [23.2789, 77.4285],
    "MINAL GATE NO 5": [23.2652, 77.4512],
    "AYODHYA NAGAR THANA": [23.2612, 77.4689],
    "SHRI RAM CHOURAHA": [23.2625, 77.4712],
    "ST. THOMES SCHOOL": [23.2604, 77.4735],
    "ISRO GUST HOUSE": [23.2589, 77.4782],
    "SACHI PARLOR": [23.2562, 77.4752],
    "REGEL TRAGER": [23.2531, 77.4712],
    "SAGAR AVENUE": [23.2512, 77.4682],
    "AYAPPA MANDIR": [23.2452, 77.4582],
    "GANDHI NAGAR": [23.3052, 77.3182],
    "ASHARAM BAPU CHOURAHA": [23.2952, 77.3382],
    "RAGIV GANDHI": [23.2889, 77.3582],
    "SEHORE  BUS STAND": [23.2032, 77.0844],
    "BAIRAGARH": [23.2589, 77.3125],
    "PANCHVATI": [23.2789, 77.3485],
    "DATA COLONY": [23.2812, 77.3512],
    "SANSKAR GARDEN": [23.2125, 77.4012],
    "NAYAPURA": [23.2104, 77.3982],
    "LALITA NAGAR": [23.2052, 77.3889],
    "AKBARPUR": [23.1952, 77.3812],
    "BANSAL HOSPITAL": [23.2125, 77.4182],
    "MANISHA MARKET": [23.2289, 77.4125],
    "BASNSKHEDI": [23.1989, 77.4085],
    "ANAND NAGAR": [23.2552, 77.4812],
    "SIDHRTHA LAKE": [23.2568, 77.4852],
    "PATEL NAGAR": [23.2512, 77.4912],
    "NARELA CHOURAHA": [23.2489, 77.4585],
    "TANATAN": [23.2452, 77.4612],
    "PRAKASH NAGAR": [23.2412, 77.4652],
    "SABJI MANDI": [23.2389, 77.4682]
  };

  // Haversine formula to compute actual geographic distance in km (Step 6)
  const calculateGeographicDistance = (p1, p2) => {
    if (!p1 || !p2) return 0;
    const R = 6371; // Earth radius in km
    const lat1 = p1[0] * Math.PI / 180;
    const lat2 = p2[0] * Math.PI / 180;
    const dLat = (p2[0] - p1[0]) * Math.PI / 180;
    const dLng = (p2[1] - p1[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getStopGPS = (stopName, index, totalStops) => {
    const cleanName = stopName.trim().toUpperCase().replace(/\s+/g, ' ');
    if (VERIFIED_STOP_COORDINATES[cleanName]) {
      return VERIFIED_STOP_COORDINATES[cleanName];
    }
    if (cleanName.includes("LNCT COLLEGE") || cleanName.includes("LNCT CAMPUS")) {
      return [23.2520, 77.5186];
    }
    
    // Deterministic mock generator to support all 94 missing stops smoothly (Step 1)
    const hash = cleanName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const campusLat = 23.2520;
    const campusLng = 77.5186;
    
    // Distribute angles deterministically around Bhopal region
    const angle = (hash % 360) * (Math.PI / 180);
    
    // Starting stop is furthest, and intermediate stops get closer in sequence
    const baseRadius = 0.15; // ~16 km
    const stepRatio = 1 - ((index || 0) / (totalStops || 1));
    const radius = baseRadius * stepRatio;
    
    // Inject slight coordinate variations to simulate road path turns
    const wiggle = 0.005 * Math.sin((index || 0) + hash);
    const lat = campusLat + radius * Math.cos(angle) + wiggle * Math.sin(angle);
    const lng = campusLng + radius * Math.sin(angle) + wiggle * Math.cos(angle);
    
    return [lat, lng];
  };

  const getRouteCoordinates = (routeOrStops) => {
    if (!routeOrStops) return [];
    const stopsList = Array.isArray(routeOrStops) 
      ? routeOrStops 
      : (routeOrStops.stops || []);
      
    return stopsList
      .map((stop, idx) => {
        const gps = getStopGPS(stop.name, idx, stopsList.length);
        if (gps) {
          return {
            latLng: gps,
            stopName: stop.name,
            stopTime: stop.time,
            originalIndex: idx
          };
        }
        return null;
      })
      .filter(c => c !== null);
  };

  const getRoadPathGeometry = (routeOrStops) => {
    const verified = getRouteCoordinates(routeOrStops);
    if (verified.length < 2) return verified.map(v => v.latLng);
    
    const path = [];
    for (let i = 0; i < verified.length - 1; i++) {
      const start = verified[i].latLng;
      const end = verified[i + 1].latLng;
      path.push(start);
      
      // Street grid emulation turn point (Part 6)
      const turnLat = (start[0] + end[0]) / 2;
      path.push([turnLat, start[1]]);
      path.push([turnLat, end[1]]);
    }
    path.push(verified[verified.length - 1].latLng);
    return path;
  };

  // 2. Simulation timing states (Part 9 & 17)
  const [isPlaying, setIsPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState(2); // 1x, 2x, 5x, 10x
  const [simulatedMinutes, setSimulatedMinutes] = useState(435); // simulated minutes since midnight
  const [busProgress, setBusProgress] = useState(0); // float index 0 to stops.length - 1

  // Sync simulated clock to start time on route selection (Part 7)
  useEffect(() => {
    if (journeyStops && journeyStops.length > 0) {
      const startMins = timeToMinutes(journeyStops[0].time);
      setSimulatedMinutes(startMins);
      setBusProgress(0);
      setIsPlaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRouteId, selectedPickupStop]);

  // Leaflet map refs (Part 12 & 26)
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const leafletRoutePolyline = useRef(null);
  const leafletBusMarker = useRef(null);
  const leafletStudentMarker = useRef(null);
  const leafletDestinationMarker = useRef(null);
  const leafletStopMarkers = useRef([]);
  const lastFittedRouteId = useRef("");

  const [activeMapMode, setActiveMapMode] = useState("mp");
  const [manualMapToggle, setManualMapToggle] = useState(false);

  // Initialize Leaflet map
  useEffect(() => {
    if (activeMapMode === "mp" && mapContainerRef.current && !mapInstance.current) {
      try {
        setMapError(false);
        mapInstance.current = L.map(mapContainerRef.current, {
          zoomControl: true,
          scrollWheelZoom: true
        }).setView([23.2599, 77.4126], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance.current);

        // Turn off follow mode on manual map drag (Part 15)
        mapInstance.current.on('dragstart', () => {
          setIsFollowingBus(false);
        });
      } catch (err) {
        console.error("Leaflet initialization error:", err);
        setMapError(true);
      }
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        leafletRoutePolyline.current = null;
        leafletBusMarker.current = null;
        leafletStudentMarker.current = null;
        leafletDestinationMarker.current = null;
        leafletStopMarkers.current = [];
      }
    };
  }, [activeMapMode, mapRetryCount]);

  // Update Leaflet Route & Pins layer
  useEffect(() => {
    if (!mapInstance.current || activeMapMode !== "mp" || !activeRoute) return;

    const map = mapInstance.current;

    // Clear old markers
    leafletStopMarkers.current.forEach(m => m.remove());
    leafletStopMarkers.current = [];

    if (leafletRoutePolyline.current) {
      leafletRoutePolyline.current.remove();
      leafletRoutePolyline.current = null;
    }

    const verifiedStops = getRouteCoordinates(journeyStops);
    const roadPath = getRoadPathGeometry(journeyStops);

    if (roadPath.length > 0) {
      // Draw route path line (Part 6)
      leafletRoutePolyline.current = L.polyline(roadPath, {
        color: '#ea580c',
        weight: 5,
        opacity: 0.85
      }).addTo(map);

      // Draw all verified stop pins with special styling for selected pickup (Part 1 & 3)
      const currentStopIdx = Math.floor(busProgress);
      verifiedStops.forEach((vStop, index) => {
        const isPickup = index === 0;
        const stopMins = timeToMinutes(vStop.stopTime);
        const isPassed = simulatedMinutes > stopMins;
        const isCurrent = currentStopIdx === vStop.originalIndex;
        const statusText = isPassed ? "✓ Passed" : isCurrent ? "🚌 Current" : "⏳ Upcoming";

        const marker = L.circleMarker(vStop.latLng, {
          radius: isPickup ? 8.5 : 5.5,
          color: isPickup ? '#7c3aed' : '#ea580c',
          fillColor: isPickup ? '#7c3aed' : '#ffffff',
          fillOpacity: isPickup ? 0.5 : 1,
          weight: 2
        })
        .bindPopup(`
          📍 <strong>${vStop.stopName}</strong><br/><br/>
          <strong>Scheduled Time:</strong> ${vStop.stopTime}<br/>
          <strong>Route:</strong> Route ${activeRoute.routeNumber}<br/>
          <strong>Status:</strong> ${statusText}
        `)
        .addTo(map);
        leafletStopMarkers.current.push(marker);
      });

      // Fit map boundary once when selectedRouteId changes (Part 3)
      if (lastFittedRouteId.current !== selectedRouteId) {
        map.fitBounds(leafletRoutePolyline.current.getBounds(), { padding: [50, 50] });
        lastFittedRouteId.current = selectedRouteId;
      }
    }

    // Place LNCT Campus Target Marker
    if (leafletDestinationMarker.current) {
      leafletDestinationMarker.current.remove();
    }
    leafletDestinationMarker.current = L.marker([23.2520, 77.5186])
      .bindPopup('🏫 <strong>LNCT University Campus</strong>')
      .addTo(map);

    // Place Student Location Marker (Part 7 & 8)
    if (leafletStudentMarker.current) {
      leafletStudentMarker.current.remove();
      leafletStudentMarker.current = null;
    }

    if (deviceLocation) {
      leafletStudentMarker.current = L.marker(deviceLocation)
        .bindPopup('📍 <strong>My Actual GPS Location</strong>')
        .addTo(map);
    } else {
      const studentStop = verifiedStops.find(s => s.stopName.toUpperCase() === selectedPickupStop.toUpperCase());
      if (studentStop) {
        leafletStudentMarker.current = L.circleMarker(studentStop.latLng, {
          radius: 8.5,
          color: '#7c3aed',
          fillColor: '#7c3aed',
          fillOpacity: 0.4,
          weight: 2
        })
        .bindPopup('📍 <strong>You are boarding here</strong>')
        .addTo(map);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoute, journeyStops, selectedPickupStop, activeMapMode, deviceLocation, simulatedMinutes, busProgress, selectedRouteId]);

  // Center/zoom on selected pickup stop (Part 7)
  useEffect(() => {
    if (!mapInstance.current || activeMapMode !== "mp" || isPlaying) return;
    const map = mapInstance.current;
    const verifiedStops = getRouteCoordinates(activeRoute);
    const studentStop = verifiedStops.find(s => s.stopName.toUpperCase() === selectedPickupStop.toUpperCase());
    if (studentStop) {
      map.setView(studentStop.latLng, 13);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPickupStop, activeMapMode, isPlaying]);

  // Future-ready GPS Location Provider abstraction (Part 11)
  const getBusPosition = useCallback((routeId, progress) => {
    const verifiedStops = getRouteCoordinates(journeyStops);
    
    if (verifiedStops.length === 0) {
      return { 
        lat: 23.2520, 
        lng: 77.5186, 
        heading: 0, 
        speed: 0, 
        currentStop: "Origin", 
        nextStop: "LNCT Campus", 
        timestamp: new Date().toISOString() 
      };
    }

    const totalStops = journeyStops.length;
    const progressFrac = progress / (totalStops - 1 || 1);
    
    const verifiedProgress = progressFrac * (verifiedStops.length - 1);
    const idx = Math.min(Math.floor(verifiedProgress), verifiedStops.length - 1);
    const finalIdx = verifiedStops.length - 1;
    
    if (idx >= finalIdx) {
      const lastVerified = verifiedStops[finalIdx];
      return {
        lat: lastVerified.latLng[0],
        lng: lastVerified.latLng[1],
        heading: 0,
        speed: 0,
        currentStop: lastVerified.stopName,
        nextStop: "Arrived",
        timestamp: new Date().toISOString()
      };
    }

    const startStop = verifiedStops[idx];
    const endStop = verifiedStops[idx + 1];
    const segFrac = verifiedProgress - idx;

    const lat = startStop.latLng[0] + (endStop.latLng[0] - startStop.latLng[0]) * segFrac;
    const lng = startStop.latLng[1] + (endStop.latLng[1] - startStop.latLng[1]) * segFrac;

    const dy = endStop.latLng[0] - startStop.latLng[0];
    const dx = endStop.latLng[1] - startStop.latLng[1];
    const heading = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);

    return {
      lat,
      lng,
      heading,
      speed: isPlaying ? 38 : 0,
      currentStop: startStop.stopName,
      nextStop: endStop.stopName,
      timestamp: new Date().toISOString()
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyStops, isPlaying]);

  const busPos = getBusPosition(selectedRouteId, busProgress);

  const progressPercent = Math.max(0, Math.min(100, Math.round((busProgress / (journeyStops.length - 1 || 1)) * 100)));

  // Update Leaflet traveling bus marker (smooth marker updates)
  useEffect(() => {
    if (!mapInstance.current || activeMapMode !== "mp" || !busPos) return;

    if (leafletBusMarker.current) {
      leafletBusMarker.current.remove();
    }

    const busHtml = `
      <div style="transform: rotate(${busPos.heading || 0}deg); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; cursor: pointer;">
        <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; border: 1.5px dashed #ea580c; animation: spin 4s linear infinite;"></div>
        <div style="width: 22px; height: 22px; border-radius: 50%; background: #ea580c; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 11px; box-shadow: 0 2px 5px rgba(0,0,0,0.35);">🚌</div>
        <div style="position: absolute; top: -11px; left: 13px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 7px solid #7c3aed;"></div>
      </div>
    `;

    leafletBusMarker.current = L.marker([busPos.lat, busPos.lng], {
      icon: L.divIcon({
        html: busHtml,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      })
    })
    .bindPopup(`
      🚌 <strong>Route ${activeRoute.routeNumber}</strong><br/><br/>
      <strong>Current Location:</strong> ${busPos.currentStop}<br/>
      <strong>Next Stop:</strong> ${busPos.nextStop}<br/>
      <strong>Progress:</strong> ${progressPercent}%<br/>
      <strong>Destination:</strong> LNCT Campus<br/>
      <strong>Status:</strong> 🟢 Demo Live
    `)
    .addTo(mapInstance.current);

    // Bind marker tap callback to open mobile bottom sheet (Part 25)
    leafletBusMarker.current.on('click', () => {
      setShowMobileBottomSheet(true);
    });

    // Camera follow bus mode with two-level zoom transition (Level 1 / Level 2)
    if (isFollowingBus && mapInstance.current) {
      const isInsideBhopal = busPos.lat >= 23.15 && busPos.lat <= 23.32 && busPos.lng >= 77.28 && busPos.lng <= 77.55;
      const targetZoom = isInsideBhopal ? 13 : 10;
      const currentZoom = mapInstance.current.getZoom();
      
      if (currentZoom !== targetZoom) {
        mapInstance.current.setView([busPos.lat, busPos.lng], targetZoom);
      } else {
        mapInstance.current.panTo([busPos.lat, busPos.lng]);
      }
    }
  }, [busProgress, activeRoute, activeMapMode, busPos, isFollowingBus, progressPercent]);

  // Simulation Clock frame update loop (Part 9)
  const requestRef = useRef();
  const previousTimeRef = useRef();

  const animate = useCallback((time) => {
    if (previousTimeRef.current !== undefined) {
      const elapsedRealMs = time - previousTimeRef.current;
      // 1 real second = (1 * simSpeed) simulated seconds, convert to minutes
      const elapsedSimMins = (elapsedRealMs / 1000) * (simSpeed / 60);

      setSimulatedMinutes((prev) => {
        const endMins = timeToMinutes(journeyStops[journeyStops.length - 1].time);
        
        const nextMins = prev + elapsedSimMins;
        if (nextMins >= endMins) {
          // Finished route journey
          setIsPlaying(false);
          // Transition inside campus map automatically (Part 16)
          if (!manualMapToggle) {
            setActiveMapMode("campus");
          }
          return endMins;
        }

        // Calculate busProgress float from current sim clock
        const stops = journeyStops;
        let progressVal = 0;
        for (let i = 0; i < stops.length - 1; i++) {
          const t1 = timeToMinutes(stops[i].time);
          const t2 = timeToMinutes(stops[i+1].time);
          if (nextMins >= t1 && nextMins < t2) {
            const denom = Math.max(t2 - t1, 2);
            const frac = (nextMins - t1) / denom;
            progressVal = i + frac;
            break;
          }
        }
        setBusProgress(progressVal);
        return nextMins;
      });
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [journeyStops, simSpeed, manualMapToggle]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
      previousTimeRef.current = undefined;
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, animate]);

  const handleReset = () => {
    setIsPlaying(false);
    const startMins = timeToMinutes(journeyStops[0]?.time || activeRoute.stops[0].time);
    setSimulatedMinutes(startMins);
    setBusProgress(0);
    setActiveMapMode("mp");
    setManualMapToggle(false);
  };

  // Walking transition inside campus triggering function
  const handleCampusWalkingTransition = () => {
    setStartLocationId("main_gate");
    setDestinationLocationId(selectedDestination);
    setGlobalActiveRoute({
      id: "shuttle-route",
      stops: [{ name: "Bus Drop Terminal" }, { name: campusLocations.find(l => l.id === selectedDestination)?.name || "Destination" }]
    });
    setCurrentPage("map");
  };

  // Proximity details calculation
  const getProximityDetails = () => {
    if (busProgress === 0) {
      return {
        status: "Arriving Now",
        color: "#7c3aed",
        detail: "Bus is currently at your stop. Board now!"
      };
    } else {
      return {
        status: "Boarded & Departed",
        color: "var(--success-color)",
        detail: "You are on board. Bus is heading to LNCT Campus."
      };
    }
  };

  const proximity = getProximityDetails();
  const distanceToCampus = busPos ? calculateGeographicDistance([busPos.lat, busPos.lng], [23.2520, 77.5186]).toFixed(1) : "0.0";

  return (
    <div className="page-body">
      {/* Header Banner */}
      <div style={{ marginBottom: "24px", background: "linear-gradient(135deg, rgba(234, 88, 12, 0.04) 0%, rgba(124, 58, 237, 0.04) 100%)", padding: "20px 24px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
        <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
          <span>🚌</span>
          <span>Personalized Student Journey</span>
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", fontStyle: "italic", marginTop: "4px" }}>
          "Enter your starting point and destination to find the best route."
        </p>
      </div>

      {/* GPS Honesty Banner */}
      <div className="glass-panel" style={{ padding: "14px 18px", borderLeft: "4px solid var(--primary-color)", display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <Info size={20} style={{ color: "var(--primary-color)", flexShrink: 0 }} />
        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
          <span style={{ fontWeight: 800, color: "var(--primary-color)" }}>Disclaimer:</span> Demo Live — simulated GPS. Integration via Traccar/WebSockets ready.
        </div>
      </div>

      {/* Dynamic Route Buttons grid / scrollable bar (Step 21 & 6) */}
      <div className="glass-panel" style={{ padding: "16px 20px", marginBottom: "24px" }}>
        <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "8px", textTransform: "uppercase" }}>
          🚌 SELECT LNCT BUS ROUTE
        </label>
        <div 
          style={{ 
            display: "flex", 
            gap: "8px", 
            overflowX: "auto", 
            paddingBottom: "8px",
            scrollbarWidth: "thin"
          }}
          className="scrollable-route-chips"
        >
          {busRoutesData.map((route) => {
            const isSel = selectedRouteId === route.routeId;
            return (
              <button
                key={route.routeId}
                className={`btn ${isSel ? "btn-primary" : "btn-secondary"}`}
                style={{ 
                  flexShrink: 0, 
                  padding: "8px 16px", 
                  fontSize: "0.75rem", 
                  borderRadius: "20px", 
                  fontWeight: isSel ? "bold" : "normal",
                  border: isSel ? "1.5px solid var(--primary-color)" : "1.5px solid var(--border-color)",
                  whiteSpace: "nowrap"
                }}
                onClick={() => {
                  setSelectedRouteId(route.routeId);
                  setIsPlaying(true);
                  setActiveMapMode("mp");
                  setManualMapToggle(false);
                  setIsFollowingBus(true);
                  setPreferredShift(route.shift);
                }}
              >
                Route {route.routeNumber} ({route.shift === "FIRST SHIFT" ? "First" : "Second"})
              </button>
            );
          })}
        </div>
      </div>

      {/* Plan Your Departure Panel (Part 13) */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "16px 20px", 
          marginBottom: "24px",
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.03) 0%, rgba(234, 88, 12, 0.03) 100%)",
          borderLeft: "4px solid var(--secondary-color)"
        }}
      >
        <h3 style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          🏠 Plan Your Departure
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }} className="mobile-stacked">
          <div>
            <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.65rem" }}>Bus Route</span>
            <strong>Route {activeRoute.routeNumber} ({activeRoute.shift === "FIRST SHIFT" ? "First Shift" : "Second Shift"})</strong>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.65rem" }}>Pickup Stop</span>
            <strong>{selectedPickupStop}</strong>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.65rem" }}>Estimated Arrival (ETA)</span>
            <strong style={{ color: progressPercent >= 100 ? "var(--success-color)" : "var(--primary-color)" }}>
              {simulatedMinutes < timeToMinutes(journeyStops[0]?.time) 
                ? `${timeToMinutes(journeyStops[0]?.time) - simulatedMinutes} mins`
                : "Departed"
              }
            </strong>
          </div>
        </div>
        <div style={{ marginTop: "12px", fontSize: "0.75rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
          💡 Reach your pickup stop before the scheduled pickup time ({journeyStops[0]?.time || "07:15 AM"}).
        </div>
      </div>

      {/* Grid: Inputs and Personalized Recommendations */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }} className="mobile-stacked">
        
        {/* Panel 1: Location Inputs */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <User size={18} style={{ color: "var(--primary-color)" }} />
            <span>1. Set Your Journey</span>
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Preferred Shift Tabs */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>PREFERRED SHIFT</label>
              <div style={{ display: "flex", gap: "6px", background: "var(--bg-primary)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                {["FIRST SHIFT", "SECOND SHIFT"].map(shift => (
                  <button 
                    key={shift}
                    className={`btn ${preferredShift === shift ? "btn-primary" : "btn-secondary"}`}
                    style={{ flex: 1, padding: "6px", fontSize: "0.75rem", border: "none" }}
                    onClick={() => setPreferredShift(shift)}
                  >
                    {shift === "FIRST SHIFT" ? "First Shift" : "Second Shift"}
                  </button>
                ))}
              </div>
            </div>

            {/* Starting Location Picker */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>📍 YOUR PICKUP STOP / LOCATION</label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <select
                  value={selectedPickupStop}
                  onChange={(e) => setSelectedPickupStop(e.target.value)}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", fontSize: "0.85rem", background: "var(--bg-secondary)", border: "1.5px solid var(--border-color)", color: "var(--text-primary)", fontWeight: 700 }}
                >
                  {filteredStops.map(stop => (
                    <option key={stop} value={stop}>{stop}</option>
                  ))}
                </select>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: "8px 12px", fontSize: "0.75rem" }}
                  onClick={handleDeviceGPS}
                >
                  GPS Location
                </button>
              </div>

              {gpsError && (
                <div style={{ color: "var(--danger-color)", fontSize: "0.75rem", fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "4.5px" }}>
                  <AlertCircle size={12} />
                  <span>{gpsError}</span>
                </div>
              )}

              <input 
                type="text"
                placeholder="Filter stops list..."
                value={routeSearchText}
                onChange={(e) => setRouteSearchText(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", fontSize: "0.8rem", background: "var(--bg-primary)", border: "1px solid var(--border-color)" }}
              />
            </div>

            {/* Destination Selector */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>🎯 CAMPUS DESTINATION</label>
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", background: "var(--bg-secondary)", border: "1.5px solid var(--border-color)", color: "var(--text-primary)" }}
              >
                {campusLocations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.category})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Panel 2: Personalized Route Finder matches (Part 11) */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Compass size={18} style={{ color: "var(--secondary-color)" }} />
            <span>Available Buses</span>
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "250px", overflowY: "auto", paddingRight: "4px" }}>
            {matchedRoutes.length === 0 ? (
              <div style={{ padding: "30px 10px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <AlertCircle size={32} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                No routes found passing through **{selectedPickupStop}** in the preferred shift. Try changing the shift filter.
              </div>
            ) : (
              matchedRoutes.map((route, _idx) => {
                const isSel = selectedRouteId === route.routeId;
                const pickupStopInfo = route.stops.find(s => s.name.toUpperCase() === selectedPickupStop.toUpperCase());
                const depTime = pickupStopInfo ? pickupStopInfo.time : route.stops[0].time;
                const pickupIdx = route.stops.findIndex(s => s.name.toUpperCase() === selectedPickupStop.toUpperCase());
                const stopsCount = pickupIdx !== -1 ? route.stops.length - pickupIdx : route.stops.length;
                
                return (
                  <div 
                    key={route.routeId}
                    onClick={() => {
                      setSelectedRouteId(route.routeId);
                      setIsPlaying(true);
                      setActiveMapMode("mp");
                      setManualMapToggle(false);
                      setIsFollowingBus(true);
                    }}
                    className="glass-card"
                    style={{ 
                      padding: "12px 16px", 
                      cursor: "pointer", 
                      borderRadius: "10px",
                      border: isSel ? "2px solid var(--primary-color)" : "1px solid var(--border-color)",
                      background: isSel ? "rgba(234, 88, 12, 0.04)" : "var(--bg-secondary)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.85rem", color: isSel ? "var(--primary-color)" : "var(--text-primary)" }}>
                        Route {route.routeNumber} ({route.shift})
                      </span>
                      <button
                        className={`btn ${isSel ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: "4px 8px", fontSize: "0.65rem", height: "auto", border: "none" }}
                      >
                        Track This Bus
                      </button>
                    </div>
 
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      <div>Departure: <strong>{depTime}</strong></div>
                      <div>Stops count: <strong>{stopsCount} stops remaining</strong></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Action buttons (Part 13 & 14) */}
          {matchedRoutes.length > 0 && (
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: "10px", fontSize: "0.8rem", fontWeight: "bold" }}
                onClick={() => {
                  setIsPlaying(true); // Start simulation clock
                  setActiveMapMode("mp"); // Go to regional map
                  setManualMapToggle(false);
                  setIsFollowingBus(true); // Automatically follow bus on track
                  if (leafletRoutePolyline.current) {
                    mapInstance.current.fitBounds(leafletRoutePolyline.current.getBounds(), { padding: [50, 50] });
                  }
                }}
              >
                🚌 Track My Bus
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: "10px", fontSize: "0.8rem", fontWeight: "bold" }}
                onClick={() => {
                  setIsFollowingBus(true);
                  if (mapInstance.current) {
                    mapInstance.current.setView([busPos.lat, busPos.lng], 14);
                  }
                }}
              >
                📍 Where Is My Bus?
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Map and Telemetry Row */}
      <div className="bus-tracking-layout">
        
        {/* Left Column: Map viewer */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div className="glass-panel" style={{ padding: "16px", position: "relative" }}>
            
            {/* Map Header toggles */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  className={`btn ${activeMapMode === "mp" ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "4px 10px", fontSize: "0.7rem", border: "none" }}
                  onClick={() => {
                    setActiveMapMode("mp");
                    setManualMapToggle(true);
                  }}
                >
                  🗺️ Regional Bus Map
                </button>
                <button
                  className={`btn ${activeMapMode === "campus" ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "4px 10px", fontSize: "0.7rem", border: "none" }}
                  onClick={() => {
                    setActiveMapMode("campus");
                    setManualMapToggle(true);
                  }}
                >
                  🏫 Campus Map
                </button>
              </div>

              {/* simulated time clock (Part 9) */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--text-muted)", background: "var(--bg-primary)", padding: "4px 10px", borderRadius: "12px" }}>
                <Clock size={12} />
                <span>Simulated Time: <strong>{minutesToTimeStr(simulatedMinutes)}</strong></span>
              </div>
            </div>

            {/* Your Journey Route Summary Panel (Part 9) */}
            <div 
              className="glass-panel" 
              style={{ 
                padding: "12px 16px", 
                marginBottom: "16px", 
                background: "linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(234, 88, 12, 0.05) 100%)",
                border: "1px dashed var(--primary-color)"
              }}
            >
              <h4 style={{ fontSize: "0.85rem", fontWeight: 800, marginBottom: "8px", color: "var(--text-primary)" }}>
                🗺️ Your Journey Summary
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", fontSize: "0.75rem" }} className="mobile-stacked">
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.65rem" }}>📍 Boarding Pickup</span>
                  <strong>{selectedPickupStop}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.65rem" }}>🚌 Selected Route</span>
                  <strong>Route {activeRoute.routeNumber} ({activeRoute.shift})</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.65rem" }}>⏰ Scheduled Departure</span>
                  <strong>{journeyStops[0]?.time || "07:15 AM"}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.65rem" }}>🏫 Campus Destination</span>
                  <strong>LNCT Campus</strong>
                </div>
              </div>
            </div>

            {/* Map wrapper container */}
            <div 
              className="responsive-map-container"
              style={{ 
                width: "100%", 
                height: "440px", 
                borderRadius: "10px", 
                overflow: "hidden", 
                border: "1px solid var(--border-color)", 
                position: "relative",
                background: "#f8fafc"
              }}
            >
              {activeMapMode === "mp" ? (
                mapError ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "20px", textAlign: "center", background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                    <AlertCircle size={40} style={{ color: "var(--danger-color)", marginBottom: "12px" }} />
                    <h3 style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "6px" }}>Map temporarily unavailable</h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                      There was an error loading the interactive map container. Please check your network connection and try again.
                    </p>
                    <button 
                      className="btn btn-primary"
                      style={{ padding: "8px 16px", fontSize: "0.8rem" }}
                      onClick={() => setMapRetryCount(prev => prev + 1)}
                    >
                      Retry Map
                    </button>
                  </div>
                ) : (
                  <div ref={mapContainerRef} style={{ width: "100%", height: "100%", zIndex: 1 }} />
                )
              ) : (
                <Map
                  buses={isPlaying ? [activeRoute] : []}
                  activeBus={isPlaying ? activeRoute : null}
                  busProgress={busProgress}
                />
              )}

              {/* Floating Map Controls (Part 16) */}
              {activeMapMode === "mp" && mapInstance.current && (
                <div 
                  style={{ 
                    position: "absolute", 
                    top: "16px", 
                    right: "16px", 
                    zIndex: 999, 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "8px", 
                    background: "rgba(15, 23, 42, 0.85)", 
                    padding: "6px", 
                    borderRadius: "8px", 
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)"
                  }}
                >
                  <button 
                    onClick={() => mapInstance.current.zoomIn()}
                    style={{ background: "none", border: "none", color: "white", cursor: "pointer", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: "bold" }}
                    title="Zoom In"
                  >
                    ＋
                  </button>
                  <button 
                    onClick={() => mapInstance.current.zoomOut()}
                    style={{ background: "none", border: "none", color: "white", cursor: "pointer", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: "bold", borderBottom: "1px solid rgba(255,255,255,0.15)" }}
                    title="Zoom Out"
                  >
                    －
                  </button>
                  <button 
                    onClick={handleDeviceGPS}
                    style={{ background: "none", border: "none", color: "white", cursor: "pointer", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}
                    title="My Location"
                  >
                    ⌖
                  </button>
                  <button 
                    onClick={() => {
                      if (leafletRoutePolyline.current) {
                        mapInstance.current.fitBounds(leafletRoutePolyline.current.getBounds(), { padding: [50, 50] });
                      }
                    }}
                    style={{ background: "none", border: "none", color: "white", cursor: "pointer", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}
                    title="Fit Route"
                  >
                    🎯
                  </button>
                  <button 
                    onClick={() => setIsFollowingBus(prev => !prev)}
                    style={{ 
                      background: "none", 
                      border: "none", 
                      color: isFollowingBus ? "var(--primary-color)" : "white", 
                      cursor: "pointer", 
                      width: "32px", 
                      height: "32px", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      fontSize: "1.1rem" 
                    }}
                    title="Follow Bus"
                  >
                    🚌
                  </button>
                </div>
              )}

              {/* Mobile Telemetry Bottom Sheet overlay (Part 25) */}
              {showMobileBottomSheet && (
                <div 
                  className="mobile-bottom-sheet glass-panel"
                  style={{
                    position: "absolute",
                    bottom: "0",
                    left: "0",
                    right: "0",
                    zIndex: 1000,
                    padding: "16px 20px",
                    borderTopLeftRadius: "16px",
                    borderTopRightRadius: "16px",
                    background: "rgba(15, 23, 42, 0.95)",
                    borderTop: "2.5px solid var(--primary-color)",
                    color: "white",
                    boxShadow: "0 -4px 20px rgba(0,0,0,0.5)",
                    transition: "transform 0.3s ease-in-out"
                  }}
                >
                  {/* Pull bar */}
                  <div 
                    style={{ width: "40px", height: "4px", background: "rgba(255,255,255,0.3)", borderRadius: "2px", margin: "0 auto 12px", cursor: "pointer" }}
                    onClick={() => setShowMobileBottomSheet(false)}
                  />
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>
                      🚌 Route {activeRoute.routeNumber} ({activeRoute.shift})
                    </h4>
                    <button 
                      onClick={() => setShowMobileBottomSheet(false)} 
                      style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer", fontWeight: "bold" }}
                    >
                      ×
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.75rem", marginBottom: "14px" }}>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.6)", display: "block", fontSize: "0.6rem" }}>CURRENT LOCATION</span>
                      <strong>{busPos.currentStop}</strong>
                    </div>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.6)", display: "block", fontSize: "0.6rem" }}>NEXT STOP</span>
                      <strong style={{ color: "var(--primary-color)" }}>{busPos.nextStop}</strong>
                    </div>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.6)", display: "block", fontSize: "0.6rem" }}>PROGRESS</span>
                      <strong>{progressPercent}%</strong>
                    </div>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.6)", display: "block", fontSize: "0.6rem" }}>DISTANCE TO LNCT</span>
                      <strong>{distanceToCampus} km</strong>
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <span style={{ color: "rgba(255,255,255,0.6)", display: "block", fontSize: "0.6rem" }}>DESTINATION</span>
                      <strong>LNCT Campus</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      className="btn btn-primary"
                      style={{ flex: 1, padding: "8px", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                      onClick={() => setIsFollowingBus(prev => !prev)}
                    >
                      <span>🚌</span>
                      <span>{isFollowingBus ? "Following Bus" : "Follow Bus"}</span>
                    </button>
                    <button 
                      className="btn btn-secondary"
                      style={{ padding: "8px 12px", fontSize: "0.75rem" }}
                      onClick={() => setShowMobileBottomSheet(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Walking Navigation overlay block inside Campus (Part 16) */}
            {activeMapMode === "campus" && (
              <div 
                className="glass-panel" 
                style={{ 
                  position: "absolute", 
                  bottom: "32px", 
                  left: "32px", 
                  right: "32px", 
                  padding: "16px", 
                  zIndex: 100, 
                  background: "rgba(255, 255, 255, 0.95)",
                  border: "1.5px solid var(--primary-color)",
                  boxShadow: "var(--card-shadow)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px"
                }}
              >
                <div>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--primary-color)", marginBottom: "4px" }}>
                    🏫 Reached LNCT Campus!
                  </h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    Walking route highlighted from Bus Terminal to <strong>{campusLocations.find(l => l.id === selectedDestination)?.name}</strong>.
                  </p>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                  onClick={handleCampusWalkingTransition}
                >
                  Start Walking Navigation
                </button>
              </div>
            )}

          </div>

          {/* SIMULATION CONTROLS */}
          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: "8px 16px", fontSize: "0.8rem", gap: "6px" }}
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                  <span>{isPlaying ? "Pause" : "▶ Start Tracking"}</span>
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: "8px 12px", fontSize: "0.8rem", gap: "4px" }}
                  onClick={handleReset}
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </div>

              <div>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", marginRight: "8px" }}>SIM SPEED</span>
                <div style={{ display: "inline-flex", gap: "4px", background: "var(--bg-primary)", padding: "2px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                  {[1, 2, 5, 10].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setSimSpeed(speed)}
                      style={{
                        padding: "4px 8px",
                        fontSize: "0.7rem",
                        borderRadius: "4px",
                        border: "none",
                        background: simSpeed === speed ? "var(--primary-color)" : "transparent",
                        color: simSpeed === speed ? "white" : "var(--text-secondary)",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Telemetry & Journey timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Personalized Bus Telemetry Card (Part 18) */}
          <div className="glass-panel" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", display: "flex", justifyContent: "space-between" }}>
              <span>🚌 Your Bus - Route {activeRoute.routeNumber}</span>
              <span className="badge badge-success animate-pulse" style={{ fontSize: "0.65rem", padding: "2px 8px" }}>🟢 Demo Live</span>
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>ROUTE</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>Route {activeRoute.routeNumber} ({activeRoute.shift})</div>
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>YOUR PICKUP</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{selectedPickupStop}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>CURRENT LOCATION</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{busPos.currentStop}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>NEXT SCHEDULED STOP</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary-color)" }}>{busPos.nextStop}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>DISTANCE TO LNCT</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary-color)" }}>{distanceToCampus} km</div>
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>DESTINATION</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>LNCT Campus</div>
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>STOPS REMAINING</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                  {Math.max(0, (journeyStops.length - 1) - Math.floor(busProgress))} stops
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>PROGRESS</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{progressPercent}%</div>
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>SPEED / HEADING</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{busPos.speed} km/h | {busPos.heading}°</div>
              </div>
            </div>

            {proximity && (
              <div style={{ padding: "10px 14px", background: "var(--bg-primary)", borderRadius: "8px", borderLeft: `4px solid ${proximity.color}`, fontSize: "0.8rem", fontWeight: 600 }}>
                {proximity.detail}
              </div>
            )}
          </div>

          {/* Your Journey Timeline Widget (Part 15) */}
          <div className="glass-panel" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
              📋 Your Journey Timeline
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {/* Step 1 */}
              <div style={{ display: "flex", gap: "10px", alignItems: "start" }}>
                <div style={{ width: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#7c3aed" }}></div>
                  <div style={{ width: "2px", height: "24px", background: "var(--border-color)" }}></div>
                </div>
                <div style={{ fontSize: "0.8rem", paddingBottom: "10px" }}>
                  <div style={{ fontWeight: 700 }}>1. Your Location</div>
                  <div style={{ color: "var(--text-muted)" }}>Starting Area Stop</div>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ display: "flex", gap: "10px", alignItems: "start" }}>
                <div style={{ width: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b" }}></div>
                  <div style={{ width: "2px", height: "24px", background: "var(--border-color)" }}></div>
                </div>
                <div style={{ fontSize: "0.8rem", paddingBottom: "10px" }}>
                  <div style={{ fontWeight: 700 }}>2. Reach Pickup Stop</div>
                  <div style={{ color: "var(--text-muted)" }}>Walk to: {selectedPickupStop}</div>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ display: "flex", gap: "10px", alignItems: "start" }}>
                <div style={{ width: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ea580c" }}></div>
                  <div style={{ width: "2px", height: "30px", background: "var(--border-color)" }}></div>
                </div>
                <div style={{ fontSize: "0.8rem", paddingBottom: "10px" }}>
                  <div style={{ fontWeight: 700 }}>3. Board Bus (Route {activeRoute.routeNumber})</div>
                  <div style={{ color: "var(--text-muted)" }}>Scheduled Time: {journeyStops[0]?.time || activeRoute.stops[0].time}</div>
                </div>
              </div>

              {/* Step 4 */}
              <div style={{ display: "flex", gap: "10px", alignItems: "start" }}>
                <div style={{ width: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: isPlaying ? "var(--success-color)" : "var(--border-color)" }}></div>
                  <div style={{ width: "2px", height: "24px", background: "var(--border-color)" }}></div>
                </div>
                <div style={{ fontSize: "0.8rem", paddingBottom: "10px" }}>
                  <div style={{ fontWeight: 700 }}>4. Bus Journey ({progressPercent}% Completed)</div>
                  <div style={{ color: "var(--text-muted)" }}>Stops Completed: {Math.floor(busProgress) + 1} of {journeyStops.length}</div>
                </div>
              </div>

              {/* Step 5 */}
              <div style={{ display: "flex", gap: "10px", alignItems: "start" }}>
                <div style={{ width: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: busProgress >= journeyStops.length - 1 ? "var(--success-color)" : "var(--border-color)" }}></div>
                  <div style={{ width: "2px", height: "24px", background: "var(--border-color)" }}></div>
                </div>
                <div style={{ fontSize: "0.8rem", paddingBottom: "10px" }}>
                  <div style={{ fontWeight: 700 }}>5. Reach LNCT Campus Gate</div>
                  <div style={{ color: "var(--text-muted)" }}>Arrival: {journeyStops[journeyStops.length - 1]?.time || "08:15 AM"}</div>
                </div>
              </div>

              {/* Step 6 */}
              <div style={{ display: "flex", gap: "10px", alignItems: "start" }}>
                <div style={{ width: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--border-color)" }}></div>
                </div>
                <div style={{ fontSize: "0.8rem" }}>
                  <div style={{ fontWeight: 700 }}>6. Navigate Inside Campus</div>
                  <div style={{ color: "var(--text-muted)" }}>Target: {campusLocations.find(l => l.id === selectedDestination)?.name}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Complete stops timeline listing (Part 14) */}
          <div className="glass-panel" style={{ padding: "20px", maxHeight: "280px", overflowY: "auto" }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              📋 Complete Stop Listings
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {journeyStops.map((stop, idx) => {
                const stopMins = timeToMinutes(stop.time);
                const isPassed = simulatedMinutes > stopMins;
                const isCurrent = Math.floor(busProgress) === idx;
                const hasGPS = getStopGPS(stop.name, idx, journeyStops.length) !== null;

                return (
                  <div 
                    key={idx}
                    style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center", 
                      padding: "8px 12px", 
                      background: isCurrent ? "rgba(234, 88, 12, 0.05)" : "var(--bg-secondary)",
                      borderRadius: "6px",
                      border: isCurrent ? "1.5px solid var(--primary-color)" : "1px solid var(--border-color)",
                      fontSize: "0.75rem"
                    }}
                  >
                    <span style={{ fontWeight: isCurrent ? "bold" : "normal", color: isCurrent ? "var(--primary-color)" : "var(--text-primary)" }}>
                      {idx+1}. {stop.name}
                      {!hasGPS && (
                        <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginLeft: "6px", fontWeight: "normal" }}>
                          (Location coordinates unavailable)
                        </span>
                      )}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "var(--text-muted)" }}>{stop.time}</span>
                      <span className="badge" style={{ 
                        fontSize: "0.6rem", 
                        background: isPassed ? "rgba(16, 185, 129, 0.1)" : isCurrent ? "rgba(234, 88, 12, 0.1)" : "var(--bg-primary)",
                        color: isPassed ? "var(--success-color)" : isCurrent ? "var(--primary-color)" : "var(--text-muted)"
                      }}>
                        {isPassed ? "✓ Passed" : isCurrent ? "🚌 Current" : "⏳ Upcoming"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      <style>{`
        .bus-tracking-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 1023px) {
          .bus-tracking-layout {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .mobile-stacked {
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
          }
          .responsive-map-container {
            height: 320px !important;
          }
        }
        @media (min-width: 1024px) {
          .mobile-bottom-sheet {
            display: none !important;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
