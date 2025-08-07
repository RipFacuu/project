import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ScanView from './pages/ScanView';
// Eliminada la importación de PublicScan

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/scan/:id" element={<ScanView />} />
          {/* Eliminada la ruta /public */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;