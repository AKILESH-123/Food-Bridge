# 🌱 FoodBridge — Next-Gen Food Surplus Redistribution Platform

> **Empowering Communities, Eliminating Food Waste, and Delivering Warm Meals with Real-Time Smart Logistics & Government-Verified NGOs.**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-%5E18.2.0-blue.svg)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/mysql-8.0-orange.svg)](https://www.mysql.com/)
[![Socket.IO](https://img.shields.io/badge/realtime-Socket.IO-black.svg)](https://socket.io/)
[![NGO Darpan](https://img.shields.io/badge/NITI%20Aayog-NGO%20Darpan%20Verified-teal.svg)](https://ngodarpan.gov.in/)

---

## 🌟 Executive Summary

**FoodBridge** is an award-winning, full-stack food rescue platform built for hackathons and social impact initiatives. It connects restaurants, catering halls, wedding venues, and food donors with verified NGOs and volunteer networks in real time. 

Equipped with an **algorithmic food safety countdown**, **official NGO Darpan registry authentication**, **multi-step pickup assurances**, and **interactive 3D tech visualizations**, FoodBridge ensures surplus food is redirected to hungry bellies safely and with dignity before it spoils.

---

## 🚀 Key Innovations & Features

### 1. 🛡️ Official NGO Darpan Registry Verification
* **NITI Aayog Integration**: Seamlessly validates NGO credentials against authentic India NGO Darpan records (e.g., `TN/2011/0042860`, `TN/2010/0035348`, `DL/2009/0004778`).
* **Instant Verification API**: Dedicated endpoint `POST /api/ngo/verify` checks NGO legitimacy in real-time.
* **Holographic Trust Badging**: Verified non-profits unlock an exclusive **"🛡️ Verified from NGO Darpan Registry"** badge upon signing in.
* **Fraud Prevention**: Unverified or inactive organizations cannot claim donations, eliminating misuse.

### 2. ⏳ Time-Based Food Safety Status Engine
* **Dynamic Safe-Use Countdown**: Automatically calculates freshness based on cooking timestamp, preservation method (*refrigerated*, *covered*, *room temperature*), and ingredients.
* **3-Tier Traffic Light Alert System**:
  * 🟢 **Safe to Review** (`< 50%` window used): Recently prepared, prime freshness.
  * 🟡 **Urgent Pickup** (`50% – 75%` window used): Urgent alerts dispatched to nearby NGOs with required on-site temperature/sensory verification.
  * 🔴 **Do Not Distribute** (`> 75%` window used): Claim buttons automatically lock to prevent spoiled food from reaching beneficiaries.
* **Auto-Refreshing Timer**: Live-updates every 60 seconds on all NGO browsing views.

### 3. 📸 Mandatory Food Photo & Safety Protocol
* **Compulsory Food Photo Upload**: Donors must attach at least one high-clarity photo of the food before a listing can be posted.
* **5-Point Pickup Verification Checklist**:
  1. Visual inspection matches listing photos.
  2. Odor and freshness check passed.
  3. Safe temperature verification.
  4. Packaging securely sealed for transit.
  5. Hygiene standards maintained during transport.
* **Delivery Impact Receipt**: NGOs submit proof photos and exact counts of people fed upon final distribution.

### 4. ⚡ Real-Time Socket.IO Geofencing & Telemetry
* Instant notifications pushed to all verified NGOs within a **15 km radius** when food is posted.
* Live status transitions (`available` ➔ `reserved` ➔ `pickup_confirmed` ➔ `picked_up` ➔ `completed`).
* Real-time notification bell with auditable status history.

### 5. 🎨 Hackathon-Winning 3D User Interface
* **3D Perspective Tilt Showcase**: Interactive 3D ecosystem cards (`tilt-3d`) featuring holographic glowing borders, ambient lighting, and live telemetry widgets.
* **Curated Visual Design**: Soft gradients, glassmorphism, responsive micro-animations, and custom typography.
* **Interactive Donor & NGO Dashboards**: Comprehensive analytics tracking meals saved, CO₂ emissions reduced, and community impact leaderboard points.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React.js 18, React Router v6, Tailwind CSS, Lucide Icons, Recharts, React Hot Toast |
| **Backend** | Node.js, Express.js, Socket.IO, Multer, Express Validator, JWT (JSON Web Tokens) |
| **Database** | MySQL 8.0, Sequelize ORM (Relational tables, schema migrations, and indexing) |
| **Authentication** | Custom JWT Token Auth, Google OAuth 2.0 (Google Identity Services) |
| **Mobile Ready** | Capacitor (Android cross-platform support) |

---

## 📂 Project Structure

```
FoodBridge/
├── backend/
│   ├── config/             # Database connection, origins, and food safety thresholds
│   ├── controllers/        # Express controllers (auth, donation, requests, users, stats, ngo)
│   ├── data/               # Seed JSON files & mock registries
│   ├── middleware/         # Auth protection, role guards, file upload (Multer)
│   ├── models/             # Sequelize models (User, Donation, NGO, NgoRegistry, Notification, etc.)
│   ├── routes/             # REST API routes (/api/auth, /api/donations, /api/ngo, etc.)
│   ├── services/           # NGO Darpan registry comparison service
│   ├── uploads/            # Statically served photo uploads
│   ├── ngo_seed.sql        # MySQL seed script with 20 real Darpan records
│   ├── server.js           # Server entry point & Socket.IO initialization
│   └── package.json
│
├── frontend/
│   ├── public/             # Static assets (3D renders, logo, manifest, index.html)
│   │   ├── hero_3d.jpg     # 3D Ecosystem showcase
│   │   ├── darpan_badge_3d.jpg # 3D Holographic Darpan shield badge
│   │   ├── logistics_3d.jpg # 3D Logistics & GPS dispatch grid
│   │   └── community_3d.jpg # 3D Community kitchen render
│   ├── src/
│   │   ├── components/     # Reusable UI (Navbar, Sidebar, DonationCard, Modals)
│   │   ├── context/        # AuthContext, SocketContext
│   │   ├── pages/          # Landing, Dashboards, DonationDetail, CreateDonation, Login, Register, Leaderboard
│   │   ├── services/       # Axios API client & backend URL builders
│   │   ├── utils/          # Food safety calculations & distance algorithms
│   │   └── index.css       # Tailwind directives, 3D perspective, and glassmorphism styles
│   └── package.json
│
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
* **Node.js** (v18 or higher)
* **npm** (v9 or higher)
* **MySQL Server** (running locally on port `3306`)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/AKILESH-123/Food-Bridge.git
cd Food-Bridge
```

---

### Step 2: Configure MySQL Database

1. Open your MySQL client (MySQL Workbench or command line) and create the database:
   ```sql
   CREATE DATABASE foodbridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. *(Optional)* Import the 20 real NGO Darpan records:
   ```bash
   mysql -u root -p foodbridge < backend/ngo_seed.sql
   ```

---

### Step 3: Backend Configuration & Setup

1. Navigate to the `backend` folder and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file inside `backend/` with the following variables:
   ```env
   NODE_ENV=development
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=foodbridge
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   JWT_SECRET=foodbridge_super_secret_jwt_key_2024_change_in_production
   JWT_EXPIRE=30d
   CLIENT_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

3. Start the backend server:
   ```bash
   npm start
   # or for auto-reloading during development:
   npm run dev
   ```
   > Backend will run at: `http://localhost:5000`

---

### Step 4: Frontend Configuration & Setup

1. Open a new terminal, navigate to the `frontend` folder, and install dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

2. Start the React development server:
   ```bash
   npm start
   ```
   > Frontend will run at: `http://localhost:3000`

---

## 🧪 Verified Demo Credentials & Testing Flow


### 1. End-to-End Donation Lifecycle Test
1. **Donor**: Log in ➔ Click **"Post Donation"** ➔ Fill details (*title, meal type, cooking time, mandatory food photos*) ➔ Submit.
2. **Instant Notification**: All nearby NGOs receive real-time push alerts with food safety countdowns.
3. **NGO**: View donation details ➔ Review the **🟢 Safe to Review** status ➔ Click **"Review Safety & Claim"**.
4. **Donor Assurance**: Donor confirms pickup readiness.
5. **Collection**: NGO arrives ➔ Completes **5-point safety checklist** ➔ Confirms pickup.
6. **Distribution**: NGO distributes food ➔ Uploads delivery proof photo ➔ Donor receives impact receipt and leaderboard points.

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Register new Donor or NGO (supports multipart document uploads).
* `POST /api/auth/login` — Sign in with email & password (returns JWT & Darpan status).
* `POST /api/auth/google` — Authenticate via Google OAuth 2.0 credential.
* `GET /api/auth/me` — Retrieve current authenticated user profile.

### NGO Darpan Registry (`/api/ngo`)
* `POST /api/ngo/verify` — Validate Darpan ID against official government dataset.
  * **Payload**: `{ "darpan_id": "TN/2011/0042860" }`
  * **Response**: `{ "verified": true, "darpan_id": "...", "ngo_name": "...", "state": "...", "city": "..." }`

### Donations (`/api/donations`)
* `GET /api/donations` — Browse available surplus food listings with distance calculation.
* `POST /api/donations` — Create a new donation with mandatory photo uploads.
* `GET /api/donations/:id` — Fetch complete donation metadata and audit history.
* `POST /api/donations/:id/request` — Reserve donation (restricted to Darpan-verified NGOs).
* `POST /api/donations/:id/confirm-pickup` — Donor assurance step.
* `POST /api/donations/:id/pickup` — NGO verified pickup with 5-point checklist.
* `POST /api/donations/:id/confirm-delivery` — Complete handover with proof photo.

---

## 🏆 Hackathon Highlights & Social Impact

* 🍱 **Zero Food Wastage Target**: Reclaims commercial surplus meals before safe-use degradation.
* 🌿 **Carbon Footprint Reduction**: Diverts edible food from landfills, cutting methane emissions.
* 🤝 **Transparency & Trust**: Strict NGO Darpan verification stops fake claims and ensures public accountability.
* 📱 **Mobile & Web Synergy**: Built with web-first responsiveness and ready for Android deployment via Capacitor.

---

## 📄 License
Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ by the <strong>FoodBridge Team</strong> for a hunger-free, sustainable future.</sub>
</div>
