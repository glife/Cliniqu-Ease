# MedCare Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. CORS Errors (405 Method Not Allowed)

**Problem**: You see errors like:
```
INFO: 127.0.0.1:55315 - "OPTIONS /login HTTP/1.1" 405 Method Not Allowed
```

**Solution**: 
1. Make sure you're using the updated `gateway.py` with CORS middleware
2. Restart all backend servers after updating the code
3. Check that the API Gateway is running on port 8004

### 2. Network Errors in Frontend

**Problem**: Frontend shows "Network error" when making API calls

**Solutions**:
1. **Check if all services are running**:
   ```bash
   # Check API Gateway
   curl http://127.0.0.1:8004/health
   
   # Check backend servers
   curl http://127.0.0.1:8001/health
   curl http://127.0.0.1:8002/health
   curl http://127.0.0.1:8003/health
   ```

2. **Check browser console** for detailed error messages
3. **Verify API base URL** in frontend/src/App.tsx is set to `http://127.0.0.1:8004`

### 3. Services Not Starting

**Problem**: Backend servers fail to start

**Solutions**:
1. **Check if ports are available**:
   ```bash
   netstat -an | findstr :8001
   netstat -an | findstr :8002
   netstat -an | findstr :8003
   netstat -an | findstr :8004
   ```

2. **Kill existing processes** if ports are in use:
   ```bash
   taskkill /f /im python.exe
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

### 4. Frontend Not Loading

**Problem**: Frontend shows blank page or errors

**Solutions**:
1. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Check if frontend server is running**:
   ```bash
   # Should show: http://localhost:3000
   cd frontend
   npm run dev
   ```

3. **Clear browser cache** and refresh

## 🔧 Step-by-Step Debugging

### Step 1: Verify All Services
```bash
# Run the test script
python test_api.py
```

### Step 2: Check Service Health
```bash
# Test each service individually
curl http://127.0.0.1:8001/health
curl http://127.0.0.1:8002/health  
curl http://127.0.0.1:8003/health
curl http://127.0.0.1:8004/health
```

### Step 3: Test API Endpoints
```bash
# Test signup
curl -X POST http://127.0.0.1:8004/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test"}'

# Test login
curl -X POST http://127.0.0.1:8004/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test"}'
```

### Step 4: Check Frontend Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab for failed requests

## 🚀 Recommended Startup Sequence

### Option 1: Use the Complete Startup Script
```bash
start_with_checks.bat
```

### Option 2: Manual Startup (for debugging)
```bash
# Terminal 1 - Backend Server 1
python backend/main.py 8001 8001,8002,8003

# Terminal 2 - Backend Server 2
python backend/main.py 8002 8001,8002,8003

# Terminal 3 - Backend Server 3
python backend/main.py 8003 8001,8002,8003

# Terminal 4 - API Gateway
python backend/gateway.py

# Terminal 5 - Frontend
cd frontend
npm run dev
```

## 📋 Verification Checklist

- [ ] All backend servers are running (ports 8001, 8002, 8003)
- [ ] API Gateway is running (port 8004)
- [ ] Frontend server is running (port 3000)
- [ ] CORS middleware is configured in gateway.py
- [ ] No port conflicts
- [ ] All dependencies installed
- [ ] Browser console shows no errors
- [ ] API test script passes

## 🐛 Common Error Messages

### "Network Error"
- Check if API Gateway is running on port 8004
- Verify CORS configuration
- Check browser console for details

### "405 Method Not Allowed"
- CORS middleware not configured
- Restart all backend services

### "Connection Refused"
- Backend services not running
- Wrong port numbers
- Firewall blocking connections

### "Module Not Found"
- Dependencies not installed
- Run `pip install -r requirements.txt`
- Run `cd frontend && npm install`

## 📞 Getting Help

If you're still having issues:

1. **Check the logs** in each terminal window
2. **Run the test script**: `python test_api.py`
3. **Check browser console** for detailed error messages
4. **Verify all services** are running on correct ports
5. **Restart all services** in the correct order

## 🔄 Quick Reset

If everything is broken:

```bash
# Kill all Python processes
taskkill /f /im python.exe

# Kill all Node processes  
taskkill /f /im node.exe

# Wait a few seconds, then restart
start_with_checks.bat
```
