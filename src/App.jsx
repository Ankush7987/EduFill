import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home';
import AdminPanel from './components/Admin';
import AgentPanel from './components/AgentPanel';

// 🌟 NAYE PAGES KE IMPORTS 🌟
// (Ye files abhi hum banayenge src/pages/ folder ke andar)
import About from './pages/About';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import RefundPolicy from './pages/RefundPolicy';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Main Website View */}
        <Route path="/" element={<HomePage />} />
        
        {/* 🌟 NAYE ROUTES (Legal & Info Pages) 🌟 */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsConditions />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />

        {/* Super Admin Dashboard */}
        <Route path="/admin" element={<AdminPanel />} />
        
        {/* Employee Agent Panel */}
        <Route path="/agent" element={<AgentPanel />} />
        
      </Routes>
    </Router>
  );
}