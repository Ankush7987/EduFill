import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase'; 
import { Clock, Loader2, X, Search, CalendarDays, UserCog, CalendarX } from 'lucide-react';

export default function AgentTrackerTab({ employees }) {
  const [leaveInputs, setLeaveInputs] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // SEARCH & FILTER STATES
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState(''); 

  // Live Timer for precise break tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); 
    return () => clearInterval(interval);
  }, []);

  const handleAddLeave = async (empId, currentLeaves) => {
    const dateStr = leaveInputs[empId];
    if (!dateStr) return alert("Please select a date first.");
    if (currentLeaves && currentLeaves.includes(dateStr)) return alert("Date is already added.");
    
    try {
      const updatedLeaves = currentLeaves ? [...currentLeaves, dateStr] : [dateStr];
      await updateDoc(doc(db, "Employees", empId), { leaves: updatedLeaves });
      setLeaveInputs({ ...leaveInputs, [empId]: '' });
    } catch (err) {
      console.error(err);
      alert("Failed to assign leave.");
    }
  };

  const handleRemoveLeave = async (empId, currentLeaves, dateToRemove) => {
    try {
      const updatedLeaves = currentLeaves.filter(d => d !== dateToRemove);
      await updateDoc(doc(db, "Employees", empId), { leaves: updatedLeaves });
    } catch (err) {
      console.error(err);
      alert("Failed to remove leave.");
    }
  };

  // AGENT FILTERING LOGIC
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.institute.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="animate-in fade-in duration-500 pb-10 max-w-7xl mx-auto">
      
      {/* 🌟 HEADER 🌟 */}
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <UserCog className="text-indigo-600" size={32} />
          Agent Tracker & Leaves
        </h1>
        <p className="text-gray-500 text-sm mt-2 font-medium">Monitor active breaks, filter by institute, and manage employee off-days seamlessly.</p>
      </header>

      {/* 🌟 SEARCH & FILTER BAR 🌟 */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-8 sticky top-0 z-10">
        
        {/* Name Search */}
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by Agent Name or Institute..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-xl outline-none font-medium text-gray-800 transition-all shadow-sm"
          />
        </div>
        
        {/* Month Filter */}
        <div className="md:w-72 relative group">
          <CalendarDays className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input 
            type="month" 
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-xl outline-none font-bold text-gray-700 transition-all shadow-sm uppercase tracking-wider text-sm"
          />
          {filterMonth && (
            <button onClick={() => setFilterMonth('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-red-100 text-red-500 hover:bg-red-500 hover:text-white p-1 rounded-full transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 🌟 AGENT CARDS GRID 🌟 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEmployees.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-dashed border-gray-200">
            <UserCog className="text-gray-300 mb-3" size={48} />
            <h3 className="text-lg font-bold text-gray-700">No Agents Found</h3>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search filters.</p>
          </div>
        ) : (
          filteredEmployees.map(emp => {
            
            // Break Time Calculation
            let breakMins = emp.breakMinutesToday || 0;
            if (emp.onBreak && emp.lastBreakStart) {
              const startMs = typeof emp.lastBreakStart.toMillis === 'function' ? emp.lastBreakStart.toMillis() : emp.lastBreakStart;
              breakMins += Math.floor((currentTime - startMs) / 60000);
            }
            const hrs = Math.floor(breakMins / 60);
            const mins = breakMins % 60;
            const breakText = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} mins`;

            const allLeaves = emp.leaves || [];
            
            // FILTER LEAVES BY SELECTED MONTH
            const displayedLeaves = allLeaves.filter(dateStr => {
              if (!filterMonth) return true; 
              return dateStr.startsWith(filterMonth); 
            });

            return (
              <div key={emp.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all overflow-hidden flex flex-col h-full">
                
                {/* Agent Header */}
                <div className="p-5 border-b border-gray-50 flex items-center gap-4 bg-gradient-to-br from-gray-50 to-white">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xl shadow-inner shrink-0">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 truncate">{emp.name}</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate">{emp.institute}</p>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="shrink-0 flex items-center justify-center">
                    {emp.active && !emp.onBreak ? (
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
                      </span>
                    ) : emp.onBreak ? (
                      <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> On Break
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 border border-gray-200 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Offline
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col gap-6">
                  
                  {/* ⏱️ Break Tracker */}
                  <div className={`p-4 rounded-2xl border transition-colors ${emp.onBreak ? 'bg-blue-50/50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <Clock size={12} className={emp.onBreak ? "text-blue-500" : ""} /> Break Time Today
                        </p>
                        <p className={`text-2xl font-black ${emp.onBreak ? 'text-blue-700' : 'text-gray-700'}`}>{breakText}</p>
                      </div>
                      {emp.onBreak && (
                        <div className="bg-white border border-amber-200 text-amber-600 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          <Loader2 size={10} className="animate-spin"/> Running
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 🏖️ Leave Manager */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CalendarX size={12} /> Approved Leaves
                      </p>
                      {filterMonth && (
                        <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold uppercase border border-indigo-100">
                          {new Date(filterMonth + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>

                    {/* Add Leave Input */}
                    <div className="flex gap-2 mb-4">
                      <input 
                        type="date" 
                        value={leaveInputs[emp.id] || ''} 
                        onChange={(e) => setLeaveInputs({...leaveInputs, [emp.id]: e.target.value})}
                        className="flex-1 bg-gray-50 border border-gray-200 focus:border-red-400 rounded-xl px-3 py-2 text-sm outline-none font-medium text-gray-700 transition-colors"
                      />
                      <button 
                        onClick={() => handleAddLeave(emp.id, allLeaves)}
                        className="bg-gray-900 hover:bg-black text-white font-bold px-4 rounded-xl text-sm transition-transform active:scale-95 shadow-sm"
                      >
                        Add
                      </button>
                    </div>

                    {/* Display Leaves */}
                    <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-3 flex-1">
                      <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto custom-scrollbar">
                        {displayedLeaves.length > 0 ? (
                          displayedLeaves.sort().map(dateStr => (
                            <span key={dateStr} className="bg-white border border-red-100 text-red-600 text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all hover:border-red-300">
                              {new Date(dateStr).toLocaleDateString('en-GB')}
                              <button onClick={() => handleRemoveLeave(emp.id, allLeaves, dateStr)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-md p-0.5 transition-colors">
                                <X size={12}/>
                              </button>
                            </span>
                          ))
                        ) : (
                          <div className="w-full h-full flex items-center justify-center py-2">
                            <p className="text-xs text-gray-400 font-medium italic">No leaves recorded.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}