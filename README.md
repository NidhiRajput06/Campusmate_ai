# 🏫 CampusMate AI
> **The Intelligent Campus Companion for LNCT University, Bhopal**

CampusMate AI is a highly optimized, responsive student companion application designed specifically for the students, faculty, and visitors of Lakshmi Narain College of Technology (LNCT) University. It simplifies transit, campus navigation, academic discovery, and daily schedules into a single, mobile-first interface.

---

## 🚀 Key Features

### 1. 🚌 Smart Bus Tracking Map
* **Leaflet Interactive Map**: Zero static screenshots or canvases—uses actual geographic coordinates mapped precisely in the Bhopal region.
* **Two-Level Zoom Transitions**:
  * **Level 1 (Regional / Amritika)**: Zooms wide (level 10-11) when the bus is outside the Bhopal metropolitan area.
  * **Level 2 (Bhopal Region)**: Automatically flies closer (level 13-14) as the bus enters the city boundaries (`lat: [23.15, 23.32]`, `lng: [77.28, 77.55]`).
* **Live Simulated ETA & Scheduler**: Dynamically calculates `pickupETA = scheduledTime - simulatedTime` based on the active simulation clock.
* **Plan Your Departure**: Displays dynamic departure advice so students know exactly when to walk to their boarding stop.
* **Live Stop Statuses**: Pins and timeline stops update status labels in real-time (`✓ Passed`, `🚌 Current`, or `⏳ Upcoming`).
* **Interactive popups**: Tap the bus or any stop marker to reveal schedules, progress percentages, and current metrics.
* **Camera Gating**: The camera remains completely stable during tracking by default (`Follow Bus = OFF`) and smoothly centers on the bus only when toggled `ON`.

### 🎓 2. Searchable Academics Portal
* **17 Schools Database**: Pre-populated with courses (B.Tech, BCA, MCA, MBA, BAMS, BJMC, Law, Pharmacy, etc.) including specialized programs (Data Science, Business Intelligence, CA, Banking) merged seamlessly under parent schools.
* **Instant Filter Search**: Search by school name or course abbreviation (e.g. typing `BCA`, `Pharmacy`, `MBA` filters and highlights the correct school cards).
* **Office Directory**: Side-by-side tab listing official engineering HOD contact details, email addresses, and block directories.

### 🏫 3. Campus Map & Navigation
* **Campus Vector Map**: Multi-level detailed layout showing lecture blocks, canteens, hostels, and sports facilities.
* **Walking Navigation**: Highlights walking routes from the bus terminal terminal block to the student's selected target building.

### 🖼️ 4. Explore Catalog Gallery
* **High-Res Assets**: Displays 9 cropped campus photographs extracted page-by-page from the official manualcatalog.
* **Trash Card Triggers**: Click to delete card actions that dynamically remove entries from the active state list.

---

## 🛠️ Technology Stack

* **Frontend Framework**: [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
* **Map Engine**: [Leaflet JS](https://leafletjs.com/) (OpenStreetMap Tiles)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Linter**: [Oxlint](https://oxc.rs/)
* **Styling**: Vanilla CSS (Fluid grids and layout tokens)

---

## 💻 Local Installation & Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/NidhiRajput06/Campusmate_ai.git
   cd Campusmate_ai
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173/](http://localhost:5173/) in your web browser.

4. **Run and expose on Local Network (for Phone/Tablet testing)**:
   ```bash
   npm run dev -- --host
   ```
   Connect your phone to the same Wi-Fi and enter the displayed network IP address (e.g. `http://192.168.1.9:5173/`).

5. **Build for Production**:
   ```bash
   npm run build
   ```
   Outputs minified build bundles to the `/dist` directory.
