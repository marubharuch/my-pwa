 🏠 Oswal Directory (React + Firebase + PWA)

A modern **community directory app** built using:

- ⚛️ **React + Vite**
- 🔥 **Firebase** (Auth, Realtime Database, Storage)
- 🎨 **TailwindCSS**
- 📱 **PWA (Installable App + Offline Support)**

This project is optimized for **mobile users**, **offline-first experience**, and **Firebase realtime sync** with minimal billing usage.

---

## 🚀 Features

### ✔ Progressive Web App (PWA)
- Installable on Android & Desktop  
- Offline mode support  
- Auto-update using service worker  
- Manifest + app icons  

### ✔ Firebase Integration
- Authentication (Google / Email)  
- Realtime Database (families, members, users)  
- Role-based access (admin, member, guest)  
- Firebase Storage for JSON backup  
- Delta-sync architecture for minimal RTDB cost  

### ✔ Directory System
- Families + Members listing  
- Editors can update their own family  
- Admins can create unlimited families  
- Join-by-link supported (invite tokens)  

### ✔ UI/UX (TailwindCSS)
- Fully responsive  
- Mobile-friendly design  
- Clean minimal layout  
- Dark-mode ready  

---

## 📂 Project Structure

src/
├─ components/
├─ pages/
├─ firebase.js
├─ App.jsx
├─ main.jsx
├─ index.css
public/
├─ pwa-192x192.png
├─ pwa-512x512.png
├─ favicon.ico

yaml
Copy code

---

## 🔧 Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
2. Install dependencies
bash
Copy code
npm install
🔥 Firebase Setup
Create a .env file in the project root:

ini
Copy code
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
VITE_FIREBASE_DB_URL=your-db-url
VITE_FIREBASE_PROJECT_ID=your-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket
VITE_FIREBASE_MSG_ID=your-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-id
▶️ Running the App
bash
Copy code
npm run dev
📦 Build for Production
bash
Copy code
npm run build
Preview build:

bash
Copy code
npm run preview
☁️ Deploy to Firebase Hosting
bash
Copy code
firebase login
firebase init hosting
firebase deploy
📱 PWA Support
vite-plugin-pwa configured

manifest + icons included

service worker auto registers

shows Install App option

offline caching available

🧑‍💻 Author
Sanjay Shah
React + Firebase Developer
Community Directory Project

⭐ License
This project is for private/community usage.

❤️ Contributions
Pull requests are welcome!

yaml
Copy code

---

