# 📦 Deployment Guide

## Quick Local Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/Karthikeyan1508/forex-trading-app.git
   cd forex-trading-app
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend  
   cd frontend && npm start
   ```

3. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5002
   - Test endpoint: http://localhost:5002/api/test

## 🚀 Production Deployment

### Backend (Railway/Render/Heroku)
1. Set environment variables:
   - `PORT=5002` (or Railway will auto-assign)
   - `NODE_ENV=production`

2. Build command: `npm install`
3. Start command: `npm start`

### Frontend (Vercel/Netlify)
1. Build command: `npm run build`
2. Publish directory: `build`
3. Update API URLs in production

## 🔧 Environment Variables

Create `.env` file in backend directory:
```env
PORT=5002
NODE_ENV=development
```

## 🏃‍♂️ Quick Test

After setup, test the connection:
```bash
curl http://localhost:5002/api/health
```

Should return:
```json
{
  "success": true,
  "message": "Forex Trading API is running",
  "timestamp": "2025-09-20T..."
}
```
