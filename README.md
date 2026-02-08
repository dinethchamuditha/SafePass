# 🌊 SafePass - Flood Response App

<div align="center">

![SafePass](https://img.shields.io/badge/SafePass-Flood%20Response-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-v9-FFCA28?style=flat-square&logo=firebase)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**A lightweight, mobile-first flood reporting map for Sri Lanka**

[Demo](#demo) • [Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

##  Overview

SafePass is a real-time flood response application designed to help communities in Sri Lanka report and track flood conditions. Built with modern web technologies, it provides an intuitive map interface for citizens to report road blockages, flooded areas, and emergency situations.

##  Features

| Feature | Description |
|---------|-------------|
|  **Real-time Map** | Interactive map showing flood reports from the last 24 hours |
|  **Smart Clustering** | Color-coded clusters prioritizing danger levels (red/yellow for critical areas) |
|  **GPS Reporting** | Location-based reporting with image uploads (auto-compressed to 1MB) |
|  **Updates Room** | Scrollable gallery showing images and messages from selected areas |
|  **Spam Protection** | 2-minute cooldown between submissions |
|  **Mobile-First** | Fully responsive design optimized for mobile devices |
|  **Community Voting** | Vote reports as "True" or "Fake" to filter misinformation |

##  Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Firebase v9 (Firestore + Storage)
- **Maps:** react-leaflet v4+ with clustering
- **Styling:** Tailwind CSS
- **Icons:** lucide-react

##  Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/safepass.git
   cd safepass
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_ADMIN_EMAIL=admin@example.com
   VITE_ADMIN_PASSWORD=your_secure_password
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

##  Project Structure

```
safepass/
├── src/
│   ├── components/
│   │   ├── AddReportModal.jsx   # Report submission form
│   │   ├── AdminDashboard.jsx   # Admin panel
│   │   ├── AdminLogin.jsx       # Admin authentication
│   │   ├── GalleryView.jsx      # Updates Room gallery
│   │   ├── LoadingScreen.jsx    # Splash screen
│   │   └── MapView.jsx          # Main map with clustering
│   ├── firebase/
│   │   └── config.js            # Firebase configuration
│   ├── utils/
│   │   ├── adminAuth.js         # Admin authentication utilities
│   │   └── geo.js               # Geolocation utilities
│   ├── App.jsx                  # Main application
│   └── main.jsx                 # Entry point
├── .env.example                 # Environment template
├── firestore.rules              # Firestore security rules
├── storage.rules                # Storage security rules
└── cors.json                    # CORS configuration
```

##  Firebase Configuration

### 1. CORS Configuration (Required for Image Uploads)

```bash
# Using Google Cloud SDK
gsutil cors set cors.json gs://YOUR_STORAGE_BUCKET_NAME
```

The `cors.json` file is included in the project root.

### 2. Firestore Rules

Deploy the included `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /incidents/{incidentId} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(['location', 'type', 'timestamp', 'voteCount', 'message', 'images']);
      allow update: if request.resource.data.diff(resource.data).affectedKeys().hasOnly(['voteCount']);
    }
  }
}
```

### 3. Storage Rules

Deploy the included `storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /incidents/{allPaths=**} {
      allow read: if true;
      allow write: if request.resource.size < 1048576 && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## 🎯 Report Types

| Type | Color | Description |
|------|-------|-------------|
| 🔴 Road Blocked | Red | Road is completely blocked |
| 🟡 Flooded Area | Yellow | Area has flooding |
| 🔵 Help Needed | Blue | People need assistance |
| 🟢 Safe Zone | Green | Area is confirmed safe |

### Clustering Priority

Clusters are colored by highest priority report:
1. **Red** - Contains "blocked" reports (highest)
2. **Yellow** - Contains "flood" reports
3. **Blue** - Contains "help_needed" reports
4. **Green** - Only "safe" reports

## 🗳️ Voting System

Community members can vote reports as:
-  **True** - Confirms the report
-  **Fake** - Flags as misinformation

Reports with `voteCount < -3` are automatically hidden.

## 📱 Screenshots

*Coming soon*

##  Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

A volunteer initiative by [ToolTeek](https://toolteek.com) to help communities during flood emergencies.

---

<div align="center">

**Made with ❤️ for Sri Lanka**

</div>
