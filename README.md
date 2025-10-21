# MedCare - Healthcare Management System

A full-stack healthcare management system with React frontend and FastAPI backend.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd medcare
```

2. **Install Backend Dependencies**
```bash
pip install -r requirements.txt
```

3. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

### Running the Application

**Option 1: Use the cleanup script (Recommended)**
```bash
clean_start.bat
```

**Option 2: Manual startup**
```bash
# Terminal 1 - Backend
python backend/main.py 8001 8001,8002,8003

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8001
- **API Documentation**: http://127.0.0.1:8001/docs

## 🎯 Features

### Patient Portal
- User registration and authentication
- Book appointments with doctors
- Online consultations
- Order medicines from pharmacy
- View appointment history

### Doctor Dashboard
- Manage patient appointments
- Conduct consultations
- Prescribe medicines
- View patient history

### Pharmacy System
- Medicine inventory management
- Process medicine orders
- Stock tracking
- Order fulfillment

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **Distributed Architecture** - Multiple backend servers with load balancing

### Frontend
- **React 18** - User interface library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Styling
- **Simple CSS** - Clean, responsive design
- **Tailwind CSS** - Available for future use (see SETUP_TAILWIND.md)

## 📁 Project Structure

```
medcare/
├── backend/
│   ├── main.py              # Main backend server
│   └── gateway.py           # API Gateway
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main React application
│   │   ├── main.tsx         # React entry point
│   │   └── index.css        # Styling
│   ├── package.json         # Frontend dependencies
│   └── vite.config.ts       # Vite configuration
├── requirements.txt         # Python dependencies
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🔧 Development

### Backend Development
```bash
# Start backend server
python backend/main.py 8001 8001,8002,8003

# Start API gateway
python backend/gateway.py
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Adding Tailwind CSS
See `SETUP_TAILWIND.md` for instructions on adding Tailwind CSS to the project.

## 🐛 Troubleshooting

### Port Already in Use Error
If you get `[Errno 10048]` error:
```bash
# Find process using port
netstat -ano | findstr :8001

# Kill the process
taskkill /PID [PID_NUMBER] /F

# Or use the cleanup script
clean_start.bat
```

### Frontend Not Loading
- Make sure you're in the `frontend` directory
- Run `npm install` to install dependencies
- Check that port 3000 is not in use

## 📝 API Endpoints

### Authentication
- `POST /login` - User login
- `POST /signup` - User registration

### Doctors
- `GET /doctors` - List all doctors
- `GET /doctors/{id}/available` - Get doctor's available slots

### Appointments
- `POST /book` - Book an appointment
- `POST /consult` - Start a consultation

### Pharmacy
- `GET /medicines` - List all medicines
- `POST /buy_bulk` - Purchase medicines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Ensure all dependencies are installed
3. Verify ports are not in use
4. Check the console for error messages

## 🎉 Success!

Your MedCare application is now ready to use! The system provides a complete healthcare management solution with patient, doctor, and pharmacy interfaces.