# NEXT STEP - Setup Instructions

## 🚀 Quick Setup Guide

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- Google Gemini API key (for AI features)

### 1. Backend Setup

```bash
cd Backend
npm install
```

**Environment Configuration:**
1. Copy `.env.example` to `.env`
2. Fill in your configuration:

```env
MONGO_URI=mongodb://localhost:27017/nextstep
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
GEMINI_API_KEY=your-gemini-api-key-here
NODE_ENV=development
PORT=5000
```

**Start Backend:**
```bash
npm run dev    # Development with auto-reload
# OR
npm start      # Production mode
```

### 2. Frontend Setup

```bash
cd Frontend
npm install
```

**Environment Configuration:**
1. Copy `.env.example` to `.env.local`
2. Configure API endpoint:

```env
VITE_API_BASE=http://localhost:5000
```

**Start Frontend:**
```bash
npm run dev    # Development server (usually port 5173)
```

### 3. Access the Application

- **Frontend:** http://localhost:5173 (or the port shown in terminal)
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000 (should show welcome message)

## 🔧 Development Scripts

### Backend Scripts
- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server
- `npm run setup` - Install dependencies and show setup instructions

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Check TypeScript types

## 🛠️ Fixed Issues

✅ **Authentication Controller** - Uncommented and fixed all auth logic  
✅ **AI Service** - Fixed Google Generative AI integration  
✅ **CORS Configuration** - Supports both ports 3000 and 5173  
✅ **Package Dependencies** - Removed conflicting AI packages  
✅ **Environment Templates** - Created proper .env examples  
✅ **Development Scripts** - Added proper npm scripts  
✅ **TypeScript Support** - Fixed frontend TypeScript configuration  

## 🌟 Features Now Working

- ✅ User Registration & Login
- ✅ Google OAuth Integration (when configured)
- ✅ JWT Authentication with Cookies
- ✅ Resume Analysis (with Gemini AI)
- ✅ Hackathon Idea Generation
- ✅ AI Career Chat
- ✅ User Dashboard with Activity Tracking
- ✅ Responsive UI with Tailwind CSS

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/update-activity` - Add user activity

### Features
- `POST /api/resume/*` - Resume analysis endpoints
- `POST /api/hackathon/*` - Hackathon idea endpoints
- `POST /api/ai/*` - AI chat endpoints

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token authentication
- HTTP-only cookies
- CORS protection
- Input validation
- Environment variable protection

## 🚨 Troubleshooting

### Common Issues

1. **"Cannot connect to database"**
   - Ensure MongoDB is running
   - Check MONGO_URI in .env file

2. **"JWT_SECRET not defined"**
   - Copy .env.example to .env
   - Set a strong JWT_SECRET

3. **"AI service error"**
   - Get a Gemini API key from Google AI Studio
   - Set GEMINI_API_KEY in .env file

4. **"CORS errors"**
   - Ensure backend is running on port 5000
   - Frontend should auto-connect to correct backend

### Need Help?

Check the console logs for detailed error messages. Both frontend and backend provide comprehensive logging for debugging.