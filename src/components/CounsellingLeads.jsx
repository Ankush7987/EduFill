import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Apna firebase path check kar lein
import { Phone, User, Target, Wallet, MapPin, CalendarClock, ChevronDown } from 'lucide-react';

export default function CounsellingLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time Firebase se data lana
  useEffect(() => {
    const q = query(collection(db, 'Counselling_Leads'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = [];
      snapshot.forEach((docSnap) => leadsData.push({ id: docSnap.id, ...docSnap.data() }));
      setLeads(leadsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Status update karne ka function
  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'Counselling_Leads', id), {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Status update fail ho gaya. Kripya dobara try karein.");
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'New Lead': return 'bg-red-100 text-red-700 border-red-200';
      case 'Called - Thinking': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Meeting Scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Converted (Paid)': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Closed / Not Interested': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return <div className="p-8 text-center font-bold text-gray-500">Loading Leads...</div>;
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Counselling Leads</h2>
          <p className="text-gray-500 text-sm font-medium">Manage your high-ticket admission inquiries here.</p>
        </div>
        <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl font-bold">
          Total Leads: {leads.length}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leads.length === 0 ? (
          <p className="text-gray-500">Abhi koi nayi lead nahi aayi hai.</p>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                    <User size={18} className="text-emerald-500"/> {lead.fullName}
                  </h3>
                  <a href={`tel:${lead.mobile}`} className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1 mt-1">
                    <Phone size={14} /> +91 {lead.mobile}
                  </a>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Plan</span>
                  <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-md">
                    {lead.planSelected?.replace(' (Paid)', '') || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2 border border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1"><Target size={14}/> Exam:</span>
                  <span className="font-bold text-gray-800">{lead.exam}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1"><CalendarClock size={14}/> Expected Score:</span>
                  <span className="font-bold text-gray-800">{lead.expectedScore}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1"><Wallet size={14}/> Budget:</span>
                  <span className="font-bold text-gray-800">{lead.budget}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1"><MapPin size={14}/> State:</span>
                  <span className="font-bold text-gray-800">{lead.state}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 relative">
                <label className="text-xs font-bold text-gray-500 mb-1 block">Lead Status</label>
                <div className="relative">
                  <select 
                    value={lead.status || 'New Lead'} 
                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                    className={`w-full appearance-none border-2 rounded-xl px-3 py-2 text-sm font-bold outline-none cursor-pointer transition-colors ${getStatusColor(lead.status || 'New Lead')}`}
                  >
                    <option value="New Lead">🔴 New Lead</option>
                    <option value="Called - Thinking">🟡 Called - Thinking</option>
                    <option value="Meeting Scheduled">🔵 Meeting Scheduled</option>
                    <option value="Converted (Paid)">🟢 Converted (Paid)</option>
                    <option value="Closed / Not Interested">⚪ Closed / Not Interested</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-2.5 pointer-events-none text-gray-500" />
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}