import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home';
import AdminPanel from './components/Admin';
import AgentPanel from './components/AgentPanel';
import Chatbot from './components/Chatbot'; // 🌟 NAYA IMPORT 🌟

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/agent" element={<AgentPanel />} />
      </Routes>
      
      {/* 🌟 NAYA: Chatbot Component added globally 🌟 */}
      <Chatbot />
      
    </Router>
  );
}