import React, { useMemo, useState, useCallback } from 'react';
import { Radio, PlusCircle, Download, Filter, Search, Calendar, UserCircle, X, Users, Clock, CheckCircle, IndianRupee, Edit, Camera, Printer, FileText, Upload, MessageCircle, Trash2, Loader2, ArrowUpRight, ArrowDownRight, ArrowRight, Maximize2, ArrowLeft } from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function DashboardTab({
  bookings, loading, filteredBookings, activeFilter, setActiveFilter, searchQuery, setSearchQuery,
  dateFilter, setDateFilter, agentFilter, setAgentFilter, allAgentsList, clearFilters, exportToExcel,
  pendingCount, completedCount, totalPaidAmount, setIsWalkInModalOpen, setSelectedStudent,
  setDocsModalOpen, setUploadTarget, setIsUploadModalOpen, markAsCompleted, deleteBooking,
  openPaymentModal, togglePhotoDeliveryStatus, toggleConfirmationStatus
}) {
  
  // --- STATE FOR VIEW ALL INFINITE SCROLL ---
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [scrollLimit, setScrollLimit] = useState(20);

  // Handle infinite scroll in View All mode
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (scrollLimit < filteredBookings.length) {
        setScrollLimit(prev => prev + 20); 
      }
    }
  }, [scrollLimit, filteredBookings.length]);

  const openViewAll = () => {
    setScrollLimit(20);
    setIsViewAllOpen(true);
  };

  // --- REAL-TIME DYNAMIC CHART DATA CALCULATION ---
  
  // 1. Calculate Real-time Pie Chart Data
  const pieChartData = useMemo(() => {
    if (!filteredBookings || filteredBookings.length === 0) return [];
    
    const counts = {};
    filteredBookings.forEach(b => {
      const source = b.category || b.source || 'Website';
      counts[source] = (counts[source] || 0) + 1;
    });

    const colors = ['#34d399', '#3b82f6', '#8b5cf6', '#fbbf24', '#f87171', '#2dd4bf'];
    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    })).sort((a, b) => b.value - a.value); 
  }, [filteredBookings]);

  const totalPieValue = pieChartData.reduce((acc, curr) => acc + curr.value, 0);

  // 2. Calculate Real-time Area Chart Data
  const lineChartData = useMemo(() => {
    if (!filteredBookings || filteredBookings.length === 0) return [];

    const dateMap = {};
    filteredBookings.forEach(b => {
      const dateStr = b.slotDate || 'Unknown';
      const shortDate = dateStr.length > 5 ? dateStr.substring(0, 6) : dateStr; 

      if (!dateMap[shortDate]) {
        dateMap[shortDate] = { date: shortDate, all: 0, ribosome: 0, unacademy: 0 };
      }
      
      dateMap[shortDate].all += 1;
      
      const cat = (b.category || '').toLowerCase();
      if (cat.includes('ribosome')) dateMap[shortDate].ribosome += 1;
      if (cat.includes('unacademy')) dateMap[shortDate].unacademy += 1;
    });

    return Object.values(dateMap).slice(-7);
  }, [filteredBookings]);

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl text-sm font-bold min-w-[150px] z-50 relative">
          <p className="text-gray-500 mb-2 pb-2 border-b border-gray-100">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between items-center py-1 gap-4">
              <span className="flex items-center gap-2" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                {entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}
              </span>
              <span className="text-gray-800">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // --- REUSABLE TABLE ROW COMPONENT ---
  const renderTableRow = (booking) => {
    // 🚀 FIXED: Check if documents object exists AND actually has files inside it
    const hasDocs = booking.documents && Object.keys(booking.documents).length > 0;

    return (
      <tr key={booking.id} className="hover:bg-blue-50/40 transition-colors group">
        <td className="p-4 align-top border-b border-gray-50">
          <p className="font-bold text-gray-900 text-sm mb-1">{booking.fullName}</p>
          <p className="text-[11px] text-gray-500 mb-2 font-medium">{booking.mobile}</p>
          <div className="flex flex-wrap gap-2">
            <span className="text-[9px] bg-gray-100 text-gray-600 px-2 py-1 rounded font-black uppercase tracking-wider">{booking.category}</span>
            {booking.assignedTo && booking.assignedTo !== 'Unassigned' && (
              <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-black uppercase tracking-wider border border-indigo-100">Agent: {booking.assignedTo}</span>
            )}
          </div>
        </td>
        <td className="p-4 align-top border-b border-gray-50">
          <p className="font-black text-blue-900 text-sm mb-1">{booking.exam}</p>
          <p className="text-[11px] text-gray-600 mb-1 font-bold">{booking.institute}</p>
          {booking.batchName && <p className="text-[10px] text-emerald-600 font-bold mt-1 bg-emerald-50 w-max px-2 py-0.5 rounded">Batch: {booking.batchName}</p>}
        </td>
        <td className="p-4 align-top border-b border-gray-50">
          <p className="font-bold text-gray-800 text-xs mb-1">{booking.slotDate}</p>
          <p className="text-[11px] text-gray-500 flex items-center gap-1 mb-1.5 font-medium"><Clock size={10} className="text-blue-500"/> {booking.slotTime}</p>
          <p className="text-[9px] font-black text-amber-600 mt-1 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded w-max uppercase tracking-wider">Report: {booking.reportingTime || '11:20 AM'}</p>
        </td>
        <td className="p-4 align-top border-b border-gray-50">
          <p className="font-black text-indigo-600 text-xs mb-2 bg-indigo-50 w-max px-2 py-0.5 rounded border border-indigo-100">{booking.tokenNumber}</p>
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider w-max block mb-2 shadow-sm border ${booking.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : booking.status === 'Arrived' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : booking.status === 'Absent' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {booking.status || 'Pending'}
          </span>
          {booking.paymentStatus === 'Paid' ? (
            <button onClick={() => openPaymentModal(booking)} className="text-[10px] font-black text-emerald-700 flex items-center gap-1 hover:bg-emerald-100 transition-colors bg-emerald-50 px-2 py-1 rounded border border-emerald-200 shadow-sm w-max">
              Paid ₹{booking.paymentAmount} <Edit size={10}/>
            </button>
          ) : (
            <button onClick={() => openPaymentModal(booking)} className="text-[10px] font-black text-red-600 hover:bg-red-100 transition-colors bg-red-50 px-2 py-1 rounded border border-red-200 shadow-sm w-max">Payment Due</button>
          )}
        </td>
        <td className="p-4 align-middle text-right border-b border-gray-50">
          <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
            {/* 🚀 FIXED: Render correct button based on hasDocs logic */}
            {hasDocs ? (
              <button onClick={() => { setSelectedStudent(booking); setDocsModalOpen(true); }} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm border border-blue-200 hover:shadow-md" title="View Docs">
                <FileText size={14}/>
              </button>
            ) : (
              <button onClick={() => { setUploadTarget(booking); setIsUploadModalOpen(true); }} className="p-2 bg-gray-50 text-gray-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md" title="Upload Docs">
                <Upload size={14}/>
              </button>
            )}
            
            <a href={`https://wa.me/91${booking.mobile}?text=Hello ${booking.fullName}...`} target="_blank" rel="noreferrer" className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all shadow-sm border border-emerald-200 hover:shadow-md" title="WhatsApp">
              <MessageCircle size={14}/>
            </a>
            <button onClick={() => deleteBooking(booking.id, booking.collectionName)} className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all shadow-sm border border-red-200 hover:shadow-md" title="Delete">
              <Trash2 size={14}/>
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // --- 🚀 INLINE VIEW ALL (FIXES SIDEBAR OVERLAP) 🚀 ---
  if (isViewAllOpen) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-[calc(100vh-80px)] flex flex-col bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm shrink-0 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsViewAllOpen(false)} 
              className="p-2 bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 rounded-xl transition-all shadow-sm font-bold flex items-center gap-2"
            >
              <ArrowLeft size={18} /> Back
            </button>
            <div>
              <h2 className="text-xl font-black text-gray-900">All Application Records</h2>
              <p className="text-xs font-bold text-gray-500 mt-1">Showing {Math.min(scrollLimit, filteredBookings.length)} of {filteredBookings.length} records</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-0" onScroll={handleScroll}>
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
              <tr className="text-gray-500 text-[10px] uppercase tracking-widest font-black">
                <th className="p-4 whitespace-nowrap">Student Info</th>
                <th className="p-4 whitespace-nowrap">Exam details</th>
                <th className="p-4 whitespace-nowrap">Appointment</th>
                <th className="p-4 whitespace-nowrap w-40">Status Tracker</th>
                <th className="p-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {filteredBookings.length === 0 ? (
                <tr><td colSpan="5" className="p-12 text-center text-gray-500 font-bold text-lg">No records match your filters.</td></tr>
              ) : (
                filteredBookings.slice(0, scrollLimit).map(renderTableRow)
              )}
            </tbody>
          </table>
          {scrollLimit < filteredBookings.length && (
            <div className="p-6 flex justify-center items-center text-blue-600 font-bold gap-2">
              <Loader2 className="animate-spin" size={18} /> Loading more records...
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- STANDARD DASHBOARD UI ---
  return (
    <div className="animate-in fade-in duration-500 font-sans">
      
      {/* HEADER */}
      <header className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Database Overview</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1 font-medium">Real-time student booking records</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-emerald-100 shadow-sm">
            <Radio size={14} className="text-emerald-500 animate-pulse" />
            <span className="text-xs md:text-sm font-black text-emerald-700 tracking-wide uppercase">Live Sync</span>
          </div>
          <button onClick={() => setIsWalkInModalOpen(true)} className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 md:px-5 md:py-2 rounded-full shadow-md hover:shadow-lg transition-all font-black text-xs md:text-sm active:scale-95">
            <PlusCircle size={16} /> Add Walk-in
          </button>
          <button onClick={exportToExcel} className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-white px-3 py-2 md:px-5 md:py-2 rounded-full shadow-md hover:shadow-lg transition-all font-black text-xs md:text-sm active:scale-95">
            <Download size={16} /> Export
          </button>
        </div>
      </header>

      {/* PROFESSIONAL FILTER CONTROLS BAR */}
      <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-200 mb-8">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
          <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
            <Filter size={16} className="text-blue-600"/> Advanced Filters & Search
          </h3>
          {(searchQuery || dateFilter || activeFilter !== 'All' || agentFilter !== 'All') && (
            <button onClick={clearFilters} className="text-[10px] font-black tracking-widest text-red-500 hover:text-white hover:bg-red-500 border border-red-100 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1">
              <X size={12} strokeWidth={3} /> CLEAR ALL
            </button>
          )}
        </div>
        
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-center">
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto bg-gray-50/50 p-1.5 rounded-xl border border-gray-100">
            {['All', 'Ribosome', 'Unacademy', 'Others'].map(category => (
              <button key={category} onClick={() => setActiveFilter(category)} className={`px-4 py-2 rounded-lg text-xs font-black tracking-wide transition-all flex-1 sm:flex-none text-center ${activeFilter === category ? 'bg-white text-blue-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'}`}>
                {category} {category === 'All' && <span className="ml-1 opacity-60">({bookings.length})</span>}
              </button>
            ))}
          </div>

          {/* Search & Select Inputs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto flex-1 xl:justify-end">
            <div className="relative w-full sm:max-w-[220px]">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search Name/App No..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"/>
            </div>
            
            <div className="relative w-full sm:max-w-[180px]">
              <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type={dateFilter ? "date" : "text"} placeholder="Filter Date..." onFocus={(e) => e.target.type = 'date'} onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full bg-white border border-gray-200 text-gray-700 font-bold rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm" />
            </div>

            <div className="relative w-full sm:max-w-[180px]">
              <UserCircle size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="w-full bg-white border border-gray-200 text-gray-700 font-bold rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer appearance-none shadow-sm">
                <option value="All">All Agents</option>
                {allAgentsList.map((agentName, idx) => <option key={idx} value={agentName}>{agentName}</option>)}
                <option value="Unassigned">Unassigned</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* TOP STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-shadow hover:border-blue-200">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all"><Users size={64} className="text-blue-900"/></div>
           <div className="flex items-center gap-2 text-gray-500 font-black text-[10px] md:text-[11px] uppercase tracking-widest z-10">
             <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shadow-sm border border-blue-100"><Users size={14}/></div> Total Leads
           </div>
           <div className="z-10">
             <div className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{filteredBookings?.length || 0}</div>
             <div className="text-[10px] md:text-[11px] font-black text-emerald-600 flex items-center gap-1 mt-1 uppercase tracking-wider"><ArrowUpRight size={12}/> Live Data</div>
           </div>
        </div>
        
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-shadow hover:border-amber-200">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all"><Clock size={64} className="text-amber-900"/></div>
           <div className="flex items-center gap-2 text-gray-500 font-black text-[10px] md:text-[11px] uppercase tracking-widest z-10">
             <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shadow-sm border border-amber-100"><Clock size={14}/></div> Queue Pending
           </div>
           <div className="z-10">
             <div className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{pendingCount}</div>
             <div className="text-[10px] md:text-[11px] font-black text-amber-600 flex items-center gap-1 mt-1 uppercase tracking-wider"><ArrowDownRight size={12}/> Waiting</div>
           </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-shadow hover:border-emerald-200">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all"><CheckCircle size={64} className="text-emerald-900"/></div>
           <div className="flex items-center gap-2 text-gray-500 font-black text-[10px] md:text-[11px] uppercase tracking-widest z-10">
             <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shadow-sm border border-emerald-100"><CheckCircle size={14}/></div> Completed
           </div>
           <div className="z-10">
             <div className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{completedCount}</div>
             <div className="text-[10px] md:text-[11px] font-black text-emerald-600 flex items-center gap-1 mt-1 uppercase tracking-wider"><ArrowUpRight size={12}/> Done</div>
           </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-shadow hover:border-purple-200">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all"><IndianRupee size={64} className="text-purple-900"/></div>
           <div className="flex items-center gap-2 text-gray-500 font-black text-[10px] md:text-[11px] uppercase tracking-widest z-10">
             <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg shadow-sm border border-purple-100"><IndianRupee size={14}/></div> Revenue
           </div>
           <div className="z-10">
             <div className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">₹{totalPaidAmount}</div>
             <div className="text-[10px] md:text-[11px] font-black text-purple-600 flex items-center gap-1 mt-1 uppercase tracking-wider"><ArrowUpRight size={12}/> Collected</div>
           </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Area Chart - Fixed Graph Display */}
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Leads Overview</h2>
            <div className="flex items-center gap-4 text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-wider">
               <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm border border-white"></div> All</span>
               <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm border border-white"></div> Ribosome</span>
               <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-sm border border-white"></div> Unacademy</span>
            </div>
          </div>
          
          <div className="w-full min-h-[300px] h-72">
            {lineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAll" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRibosome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorUnacademy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="all" stroke="#34d399" strokeWidth={4} fillOpacity={1} fill="url(#colorAll)" activeDot={{ r: 6, strokeWidth: 0, fill: '#34d399' }} />
                  <Area type="monotone" dataKey="ribosome" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRibosome)" activeDot={{ r: 5, strokeWidth: 0, fill: '#3b82f6' }}/>
                  <Area type="monotone" dataKey="unacademy" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorUnacademy)" activeDot={{ r: 5, strokeWidth: 0, fill: '#8b5cf6' }}/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Not enough data for chart
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Leads by Source</h2>
          </div>
          
          <div className="flex-1 flex flex-col justify-center relative min-h-[220px]">
            {pieChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      animationDuration={1500}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} leads`, name]}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black text-gray-900 tracking-tighter">{totalPieValue}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Total</span>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No data available
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 mt-4">
            {pieChartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-3 h-3 rounded-full shadow-sm border border-white" style={{ backgroundColor: item.color }}></div>
                  {item.name}
                </div>
                <div className="text-gray-900 flex items-center gap-2 font-black">
                  {item.value} <span className="text-gray-400 font-medium">({((item.value / totalPieValue) * 100).toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM LAYOUT: Main Table & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Main Records Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2 flex flex-col relative">
          <div className="p-5 md:p-6 flex justify-between items-center border-b border-gray-100 bg-gray-50/50">
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">Recent Applications</h2>
              <p className="text-[11px] font-bold text-gray-500 mt-1 uppercase tracking-widest">Showing top 7 latest entries</p>
            </div>
            <button onClick={openViewAll} className="text-xs font-black tracking-wide text-blue-600 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 shadow-sm active:scale-95">
              <Maximize2 size={14} /> VIEW ALL
            </button>
          </div>
          
          <div className="overflow-x-auto w-full flex-1">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-100 bg-white">
                  <th className="p-4 font-black whitespace-nowrap">Student Info</th>
                  <th className="p-4 font-black whitespace-nowrap">Exam details</th>
                  <th className="p-4 font-black whitespace-nowrap">Appointment</th>
                  <th className="p-4 font-black whitespace-nowrap w-32">Status Tracker</th>
                  <th className="p-4 font-black whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="5" className="p-12 text-center text-gray-500 font-bold text-lg"><Loader2 className="animate-spin inline mr-2"/> Fetching secure records...</td></tr>
                ) : filteredBookings.length === 0 ? (
                  <tr><td colSpan="5" className="p-12 text-center text-gray-500 font-bold text-lg">No records found.</td></tr>
                ) : (
                  filteredBookings.slice(0, 7).map(renderTableRow)
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Today's Activity Feed */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 flex-1 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-gray-900 tracking-tight">System Activity</h2>
              <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">See Logs</button>
            </div>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              <div className="relative flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 z-10 shrink-0 shadow-sm group-hover:scale-110 transition-transform"><UserCircle size={18}/></div>
                  <div>
                    <p className="text-sm font-black text-gray-900">New lead captured</p>
                    <p className="text-[11px] text-gray-500 font-bold mt-0.5">From EduFill Platform</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md border border-gray-100">JUST NOW</span>
              </div>
              
              <div className="relative flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 z-10 shrink-0 shadow-sm group-hover:scale-110 transition-transform"><CheckCircle size={18}/></div>
                  <div>
                    <p className="text-sm font-black text-gray-900">Form submitted</p>
                    <p className="text-[11px] text-gray-500 font-bold mt-0.5">Application Complete</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md border border-gray-100">10m AGO</span>
              </div>

              <div className="relative flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 z-10 shrink-0 shadow-sm group-hover:scale-110 transition-transform"><IndianRupee size={18}/></div>
                  <div>
                    <p className="text-sm font-black text-gray-900">Payment received</p>
                    <p className="text-[11px] text-gray-500 font-bold mt-0.5">Gateway Auto-Sync</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md border border-gray-100">1h AGO</span>
              </div>

              <div className="relative flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 z-10 shrink-0 shadow-sm group-hover:scale-110 transition-transform"><FileText size={18}/></div>
                  <div>
                    <p className="text-sm font-black text-gray-900">Docs uploaded</p>
                    <p className="text-[11px] text-gray-500 font-bold mt-0.5">Student Dashboard</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md border border-gray-100">2h AGO</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}