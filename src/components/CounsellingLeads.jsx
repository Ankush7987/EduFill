import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase'; 
import { Users, ChevronDown } from 'lucide-react';

const STATUS_OPTIONS = [
  "New Request",
  "Agent Assigned",
  "Documents Pending",
  "Form Filled",
  "Completed"
];

export default function CounsellingLeads() {
  const [requests, setRequests] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Firebase se Counselling Requests aur Agents ka data lana
  useEffect(() => {
    // 1. Fetch Counselling Requests
    const unsubRequests = onSnapshot(collection(db, "Counselling_Requests"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by newest first
      data.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setRequests(data);
      setLoading(false);
    });

    // 2. Fetch Active Agents from Employees collection
    const qAgents = query(collection(db, "Employees"), where("active", "==", true));
    const unsubAgents = onSnapshot(qAgents, (snapshot) => {
      const agentsData = snapshot.docs.map(doc => doc.data().name);
      // Remove duplicates just in case
      setAgents([...new Set(agentsData)]);
    });
    
    return () => {
      unsubRequests();
      unsubAgents();
    };
  }, []);

  // Agent Assign karne ka function
  const handleAssignAgent = async (requestId, agentName) => {
    try {
      const requestRef = doc(db, "Counselling_Requests", requestId);
      await updateDoc(requestRef, {
        assignedAgentName: agentName,
        status: "Agent Assigned" // Assignment hote hi status auto-update ho jayega
      });
    } catch (error) {
      console.error("Error assigning agent: ", error);
      alert("Failed to assign agent.");
    }
  };

  // Status Update karne ka function
  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const requestRef = doc(db, "Counselling_Requests", requestId);
      await updateDoc(requestRef, {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating status: ", error);
      alert("Failed to update status.");
    }
  };

  // Status ke hisaab se colors
  const getStatusColor = (status) => {
    switch(status) {
      case 'New Request': return 'bg-red-100 text-red-700 border-red-200';
      case 'Agent Assigned': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Documents Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Form Filled': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="w-full animation-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-2">
            <Users className="text-indigo-600" size={32} /> Counselling Leads
          </h2>
          <p className="text-gray-500 font-medium mt-1">Manage all student counselling and form-filling requests</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 uppercase">Total Leads</span>
            <span className="text-xl font-black text-indigo-600">{requests.length}</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider font-bold">
                <th className="p-4">Student Details</th>
                <th className="p-4">Target Exam & Plan</th>
                <th className="p-4">Assign Agent</th>
                <th className="p-4">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center p-8 text-gray-500 font-medium">
                    Loading counselling leads...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-8 text-gray-500 font-medium">
                    No counselling requests yet.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    
                    {/* Student Details */}
                    <td className="p-4">
                      <div className="font-bold text-gray-900 text-sm md:text-base">{req.studentName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{req.mobile}</div>
                      <div className="text-xs text-gray-400 mt-0.5 font-medium">Score: {req.score || 'N/A'}</div>
                    </td>

                    {/* Exam & Plan */}
                    <td className="p-4">
                      <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] md:text-xs font-black px-2 py-1 rounded-md mb-1 uppercase tracking-wider">
                        {req.examTarget}
                      </span>
                      <div className="text-xs md:text-sm font-bold text-gray-700">{req.planSelected}</div>
                    </td>

                    {/* Agent Assignment Dropdown */}
                    <td className="p-4">
                      <div className="relative inline-block w-full min-w-[140px] max-w-[180px]">
                        <select 
                          className={`w-full appearance-none border-2 text-xs md:text-sm font-bold rounded-xl px-3 py-2 outline-none cursor-pointer transition-colors ${
                            req.assignedAgentName 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                              : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                          }`}
                          value={req.assignedAgentName || ""}
                          onChange={(e) => handleAssignAgent(req.id, e.target.value)}
                        >
                          <option value="" disabled>Assign Agent...</option>
                          {agents.map(agent => (
                            <option key={agent} value={agent}>{agent}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </td>

                    {/* Status Update Dropdown */}
                    <td className="p-4">
                      <div className="relative inline-block w-full min-w-[150px] max-w-[180px]">
                        <select 
                          className={`w-full appearance-none border-2 text-xs md:text-sm font-bold rounded-xl px-3 py-2 outline-none cursor-pointer transition-colors ${getStatusColor(req.status || 'New Request')}`}
                          value={req.status || "New Request"}
                          onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                      </div>
                    </td>

                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}