# 🛒 LappyShoppy - Modern E-commerce Laptop Shop

<div align="center">

![React](https://img.shields.io/badge/React-19.2.0-blue)
![Firebase](https://img.shields.io/badge/Firebase-Integrated-orange)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4.1.17-38bdf8)

**A modern e-commerce platform for laptops built with React, Firebase, and Tailwind CSS**

</div>

---

## 📋 About

**LappyShoppy** is a modern e-commerce platform specializing in laptop sales, featuring secure user authentication, profile management, and responsive design.

### ✨ Key Features
- 🔐 Firebase authentication (Email/Password, Google, Facebook)
- 👤 User profiles with photo uploads
- 📱 Responsive design
- ⚡ Fast performance with Vite

---

## 🚀 Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Firebase
- **Backend:** Node.js, Express, MongoDB, JWT
- **Storage:** Firebase Storage, Cloudinary

---

## 📦 Installation

### Prerequisites
- Node.js (v14+)
- MongoDB
- Firebase account

### Quick Setup

1. **Clone & Install**
```bash
git clone <repository-url>
cd LappyShoppy

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

2. **Environment Setup**

**Backend `.env`:**
```env
PORT=4001
DB_URI=mongodb://localhost:27017/lappyshoppy
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="your_private_key"
```

**Frontend `.env`:**
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. **Firebase Setup**
   - Create project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password, Google, Facebook)
   - Enable Storage
   - Copy config to frontend `.env`
   - Generate service account key for backend `.env`

4. **Database Setup**
```bash
# Populate sample products and calculate ratings
cd backend && node scripts/addSampleProducts.js

# Create admin user (automatically creates both Firebase and MongoDB entries)
cd backend && node scripts/createAdmin.js
```

5. **Start Application**
```bash
# Backend (Terminal 1)
cd backend && npm run dev

# Frontend (Terminal 2)
cd frontend && npm run dev
```

Visit http://localhost:5173

### ⚠️ Important Notes
- **Firebase configuration is required** for Google/Facebook sign-in to work
- Without proper Firebase setup, only email/password authentication will work
- MongoDB must be running locally or use MongoDB Atlas
- **Admin account is created automatically** with email `admin@lappyshoppy.com` and password `admin123`

---

## 📖 Usage

1. **Register/Login** - Create account or sign in
2. **Update Profile** - Upload photo, change name
3. **Browse** - View available features

<div align="center">

**Built with ❤️ using React, Firebase, and Tailwind CSS**

</div>
