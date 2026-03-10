import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home';
import AdminPanel from './components/Admin';
// 🌟 NAYA IMPORT: Agent Panel 🌟
import AgentPanel from './components/AgentPanel';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Main Website View */}
        <Route path="/" element={<HomePage />} />
        
        {/* Super Admin Dashboard */}
        <Route path="/admin" element={<AdminPanel />} />
        
        {/* 🌟 NAYA ROUTE: Employee Agent Panel 🌟 */}
        <Route path="/agent" element={<AgentPanel />} />
      </Routes>
    </Router>
  );
}