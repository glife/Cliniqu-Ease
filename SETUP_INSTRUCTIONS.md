# MedCare Healthcare Management System

A comprehensive healthcare management system with distributed backend architecture and modern React frontend.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: FastAPI with distributed architecture
- **API Gateway**: Load balancing and request routing
- **Database**: In-memory with replication across servers

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

1. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Running the Application

#### Option 1: Complete Setup (Recommended)
```bash
# Windows
start_complete.bat

# This will start:
# - 3 Backend servers (ports 8001, 8002, 8003)
# - API Gateway (port 8004)
# - Frontend server (port 3000)
```

#### Option 2: Manual Setup

**Start Backend Servers:**
```bash
# Terminal 1 - Backend Server 1
python backend/main.py 8001 8001,8002,8003

# Terminal 2 - Backend Server 2  
python backend/main.py 8002 8001,8002,8003

# Terminal 3 - Backend Server 3
python backend/main.py 8003 8001,8002,8003

# Terminal 4 - API Gateway
python backend/gateway.py
```

**Start Frontend:**
```bash
cd frontend
npm run dev
```

## 📋 Available Endpoints

### Authentication
- `POST /signup` - User registration
- `POST /login` - User login

### Doctors & Appointments
- `GET /doctors` - Get all doctors
- `GET /doctors/{id}/available` - Get doctor availability
- `POST /book` - Book appointment
- `DELETE /appointments/{id}` - Cancel appointment
- `POST /appointments/{id}/reschedule` - Reschedule appointment
- `POST /consult` - Doctor consultation

### User Management
- `GET /users/{id}/appointments` - User appointments
- `GET /users/{id}/prescriptions` - User prescriptions

### Pharmacy
- `GET /medicines` - Get all medicines
- `GET /medicines/search` - Search medicines
- `POST /buy` - Buy single medicine
- `POST /buy_bulk` - Buy multiple medicines
- `POST /buy_prescription` - Buy prescription medicines
- `POST /medicines/{id}/restock` - Restock medicine
- `GET /reports/sales` - Sales report

### Doctor Ratings
- `POST /ratings/{id}` - Rate doctor
- `GET /ratings/{id}` - Get doctor rating

## 🎯 Frontend Features

### Patient Portal
- **Dashboard**: View available doctors
- **Book Appointment**: Schedule appointments with doctors
- **Consult Doctor**: Get AI-powered medical consultation
- **Order Medicines**: Browse and purchase medicines
- **My Appointments**: Manage your appointments
- **My Prescriptions**: View and purchase prescribed medicines

### Doctor Portal
- **Doctor Ratings**: View and manage doctor ratings
- **Rate Doctors**: Submit ratings for doctors

### Pharmacy Portal
- **Inventory Management**: View medicine inventory
- **Restock Medicines**: Add stock to medicines
- **Sales Reports**: Generate revenue reports with Map-Reduce

## 🔧 Technical Features

### Backend Architecture
- **Distributed System**: 3 backend servers with coordinator election
- **Fault Tolerance**: Automatic failover and load balancing
- **Data Replication**: State synchronization across servers
- **API Gateway**: Request routing and load balancing

### Frontend Features
- **Modern UI**: Responsive design with Tailwind CSS
- **Real-time Updates**: Dynamic data loading
- **Search Functionality**: Medicine search with backend API
- **Shopping Cart**: Multi-item medicine ordering
- **Authentication**: User login/signup with local storage

### Data Management
- **In-memory Database**: Fast access with replication
- **Map-Reduce**: Sales report generation
- **State Management**: React Context for authentication
- **Error Handling**: Comprehensive error handling and user feedback

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **API Gateway**: http://127.0.0.1:8004
- **Backend Servers**: 
  - Server 1: http://127.0.0.1:8001
  - Server 2: http://127.0.0.1:8002
  - Server 3: http://127.0.0.1:8003

## 📱 Usage Guide

1. **Start the Application**: Run `start_complete.bat`
2. **Access Frontend**: Open http://localhost:3000
3. **Create Account**: Sign up as a new user
4. **Book Appointment**: Select a doctor and time slot
5. **Consult Doctor**: Describe symptoms for AI consultation
6. **Order Medicines**: Browse pharmacy and add to cart
7. **Manage Appointments**: View and cancel appointments
8. **View Prescriptions**: Access prescribed medicines

## 🔍 Testing Endpoints

You can test the API endpoints directly:

```bash
# Test API Gateway health
curl http://127.0.0.1:8004/health

# Test user signup
curl -X POST http://127.0.0.1:8004/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'

# Test getting doctors
curl http://127.0.0.1:8004/doctors
```

## 🛠️ Development

### Project Structure
```
medcare/
├── backend/
│   ├── main.py          # Backend server implementation
│   └── gateway.py       # API Gateway
├── frontend/
│   ├── src/
│   │   ├── App.tsx      # Main React application
│   │   └── main.tsx     # React entry point
│   └── package.json     # Frontend dependencies
├── start_complete.bat   # Complete startup script
└── requirements.txt     # Python dependencies
```

### Key Components
- **Distributed Backend**: Fault-tolerant server architecture
- **API Gateway**: Load balancing and request routing
- **React Frontend**: Modern UI with comprehensive features
- **Authentication**: User management with local storage
- **Pharmacy System**: Medicine inventory and sales
- **Appointment System**: Doctor booking and management

## 🚨 Troubleshooting

1. **Port Conflicts**: Ensure ports 8001-8004 and 3000 are available
2. **Python Dependencies**: Run `pip install -r requirements.txt`
3. **Node Dependencies**: Run `cd frontend && npm install`
4. **Backend Issues**: Check server logs in individual terminal windows
5. **Frontend Issues**: Check browser console for errors

## 📊 System Status

- ✅ All 18 endpoints implemented and working
- ✅ Frontend components for all features
- ✅ Distributed backend architecture
- ✅ API Gateway with load balancing
- ✅ Authentication system
- ✅ Pharmacy management
- ✅ Appointment system
- ✅ Doctor rating system
- ✅ Sales reporting with Map-Reduce
