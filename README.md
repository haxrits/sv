# SocialVibe — Mini Social Post Application (3W Full Stack Internship Task)

![SocialVibe Header](https://via.placeholder.com/800x200.png?text=SocialVibe+-+Share+Your+World)

A modern, responsive, and fully functional full-stack social media application built for the **3W - Full Stack Internship Assignment**. It allows users to create accounts, post text and images, view a public feed, and interact with other users' posts via likes and comments.

## 🚀 Features

- **Authentication**: Secure email/password Signup & Login using JWT and bcrypt.
- **Create Post**: Users can post thoughts, images, or both. Image uploads are converted to Base64 (using Multer in memory) for easy database storage and deployment compatibility.
- **Global Feed**: A public feed where all posts are visible, paginated, and loaded using **Infinite Scrolling**.
- **Interactions**: Users can intuitively Like and Comment on posts. Dynamic, optimistic UI updates make interactions feel instant.
- **Modern User Interface**: Built with **React** & **Material UI (MUI)**. Features custom theming, glassmorphism effects, responsive design, micro-animations, and a highly polished dark-mode-ready aesthetic (no Tailwind used per task constraints).
- **Backend Architecture**: Node.js & Express.js REST API with robust Mongoose models and comprehensive error handling.

## 🛠️ Tech Stack

### Frontend
- React.js (Vite)
- Material UI (MUI) v6
- React Router DOM
- Axios
- Emotion (Styled Components)

### Backend
- Node.js
- Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT)
- bcryptjs
- Multer (Image processing)

## 📦 Project Structure

```
3w/
│
├── backend/                  # Node.js + Express backend
│   ├── config/               # DB connection logic
│   ├── middleware/           # JWT auth middleware
│   ├── models/               # Mongoose schemas (User, Post with Sub-Docs)
│   ├── routes/               # Express API routes (auth, posts)
│   ├── .env.example          # Environment variables template
│   └── server.js             # API entrypoint
│
└── frontend/                 # React.js + Vite frontend
    ├── src/
    │   ├── api/              # Axios instance configuration
    │   ├── components/       # Reusable UI components (Navbar, Post, CreatePost)
    │   ├── context/          # State management (JWT Authentication)
    │   ├── pages/            # Application views (Feed, Login, Signup)
    │   ├── App.jsx           # Routing definition
    │   ├── index.css         # Global styles & keyframe animations
    │   └── theme.js          # Custom MUI theme
    ├── .env.example
    └── package.json
```

## ⚙️ Local Setup Instructions

### 1. Database Setup
You will need a MongoDB URI. You can create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

### 2. Backend Setup
```bash
cd backend
npm install

# Create a .env file based on the example
cp .env.example .env

# Start the server (runs on port 5000)
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start the React development server (runs on port 3000)
npm run dev
```

The application will be available at `http://localhost:3000` 🚀🔥

## 🌐 Deployment Ready
- **Frontend (Vercel/Netlify)**: Set `VITE_API_URL` to your live Render backend URL.
- **Backend (Render)**: Set `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL` environment variables. Ensure the Start Command is `node server.js`.
