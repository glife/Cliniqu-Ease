import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import PatientDashboard from "./pages/patient/PatientDashboard";
import BookAppointment from "./pages/patient/BookAppointment";
import ConsultFlow from "./pages/patient/ConsultFlow";
import Medicines from "./pages/patient/Medicines";
import UserAppointments from "./pages/patient/UserAppointments";
import UserPrescriptions from "./pages/patient/UserPrescriptions";
import DoctorHome from "./pages/doctor/DoctorHome";
import PharmacyHome from "./pages/pharmacy/PharmacyHome";

// Main App
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/patient" element={<PatientDashboard />} />
          <Route path="/patient/book" element={<BookAppointment />} />
          <Route path="/patient/consult" element={<ConsultFlow />} />
          <Route path="/patient/medicines" element={<Medicines />} />
          <Route path="/patient/appointments" element={<UserAppointments />} />
          <Route path="/patient/prescriptions" element={<UserPrescriptions />} />
          <Route path="/doctor" element={<DoctorHome />} />
          <Route path="/pharmacy" element={<PharmacyHome />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}