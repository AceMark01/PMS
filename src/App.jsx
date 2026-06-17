import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Settings from './pages/Settings';
import BOM from './pages/BOM/BOM';
import Inventory from './pages/Inventory/Inventory';
import Dasboard from './pages/Dashboard/Dasboard';
import OrderDetails from './pages/OrderOfProduction/OrderDetails';
import FullKitting from './pages/FullKiting/FullKitting';
import FullKittingApproval from './pages/FullKittingApproval/FullKittingApproval';
import ActualProduction from './pages/ActualProduction/ActualProduction';
import Testing from './pages/Testing/Testing';

import ProtectedRoute from './components/ProtectedRoute';
import { initializeStorage } from './utils/storageManager';

function App() {
  useEffect(() => {
    initializeStorage();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dasboard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="bom" element={<BOM />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="production-orders" element={<OrderDetails />} />
            <Route path="full-kitting" element={<FullKitting />} />
            <Route path="full-kitting-approval" element={<FullKittingApproval />} />
            <Route path="actual-production" element={<ActualProduction />} />
            <Route path="testing" element={<Testing />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;