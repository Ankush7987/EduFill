import React from 'react';
// 🌟 YAHAN LOADER2 MISSING THA, JO AB ADD HO GAYA HAI 🌟
import { Radio, PlusCircle, Download, Filter, Search, Calendar, UserCircle, X, Users, Clock, CheckCircle, IndianRupee, Edit, Camera, Printer, FileText, Upload, MessageCircle, Trash2, Loader2 } from 'lucide-react';

export default function DashboardTab({
  bookings, loading, filteredBookings, activeFilter, setActiveFilter, searchQuery, setSearchQuery,
  dateFilter, setDateFilter, agentFilter, setAgentFilter, allAgentsList, clearFilters, exportToExcel,
  pendingCount, completedCount, totalPaidAmount, setIsWalkInModalOpen, setSelectedStudent,
  setDocsModalOpen, setUploadTarget, setIsUploadModalOpen, markAsCompleted, deleteBooking,
  openPaymentModal, togglePhotoDeliveryStatus, toggleConfirmationStatus, formatTime
}) {
  return (
    <div className="animate-in fade-in duration-500">
      <header className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Database Overview</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Real-time student booking records</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-emerald-100"><Radio size={14} className="text-emerald-500 animate-pulse" /><span className="text-xs md:text-sm font-bold text-emerald-700">Live Sync</span></div>
          <button onClick={() => setIsWalkInModalOpen(true)} className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 md:px-5 md:py-2 rounded-full shadow-md transition-all font-bold text-xs md:text-sm"><PlusCircle size={14} /> Add Walk-in</button>
          <button onClick={exportToExcel} className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-white px-3 py-2 md:px-5 md:py-2 rounded-full shadow-md transition-all font-bold text-xs md:text-sm"><Download size={14} /> Export</button>
        </div>
      </header>

      <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 md:mb-8 flex flex-col xl:flex-row gap-4 justify-between xl:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-gray-500 font-bold mr-2 text-sm"><Filter size={16} /> Filters:</div>
          {['All', 'Ribosome', 'Unacademy', 'Others'].map(category => (
            <button key={category} onClick={() => setActiveFilter(category)} className={`px-3 py-1.5 md:px-4 md:py-1.5 rounded-full text-xs md:text-sm font-bold transition-all ${activeFilter === category ? 'bg-blue-900 text-white shadow-md' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
              {category} {category === 'All' && `(${bookings.length})`}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full xl:w-auto">
          <div className="relative flex-1 min-w-[150px] xl:w-64">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search Name/App No..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"/>
          </div>
          
          <div className="relative flex-1 min-w-[130px] xl:w-48">
            <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type={dateFilter ? "date" : "text"} placeholder="Filter Date..." onFocus={(e) => e.target.type = 'date'} onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-600 rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all cursor-pointer" />
          </div>

          <div className="relative flex-1 min-w-[140px] xl:w-48">
            <UserCircle size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-600 rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none">
              <option value="All">All Agents</option>
              {allAgentsList.map((agentName, idx) => <option key={idx} value={agentName}>{agentName}</option>)}
              <option value="Unassigned">Unassigned</option>
            </select>
          </div>

          {(searchQuery || dateFilter || activeFilter !== 'All' || agentFilter !== 'All') && (
            <button onClick={clearFilters} className="flex items-center justify-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-full transition-all"><X size={14} /> Clear</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
          <div className="bg-blue-100 p-2 md:p-3 rounded-xl text-blue-600"><Users size={20} className="md:w-6 md:h-6"/></div>
          <div><p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase">Total Leads</p><p className="text-xl md:text-2xl font-black text-gray-900">{filteredBookings.length}</p></div>
        </div>
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
          <div className="bg-amber-100 p-2 md:p-3 rounded-xl text-amber-600"><Clock size={20} className="md:w-6 md:h-6"/></div>
          <div><p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase">Pending</p><p className="text-xl md:text-2xl font-black text-gray-900">{pendingCount}</p></div>
        </div>
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
          <div className="bg-emerald-100 p-2 md:p-3 rounded-xl text-emerald-600"><CheckCircle size={20} className="md:w-6 md:h-6"/></div>
          <div><p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase">Completed</p><p className="text-xl md:text-2xl font-black text-gray-900">{completedCount}</p></div>
        </div>
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
          <div className="bg-purple-100 p-2 md:p-3 rounded-xl text-purple-600"><IndianRupee size={20} className="md:w-6 md:h-6"/></div>
          <div><p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase">Revenue</p><p className="text-xl md:text-2xl font-black text-gray-900">₹{totalPaidAmount}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50"><h2 className="text-lg md:text-xl font-bold text-gray-800">Application Records</h2></div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs md:text-sm uppercase tracking-wider border-b border-gray-100">
                <th className="p-3 md:p-4 font-semibold whitespace-nowrap">Student Info</th>
                <th className="p-3 md:p-4 font-semibold whitespace-nowrap">Exam details</th>
                <th className="p-3 md:p-4 font-semibold whitespace-nowrap">Appointment</th>
                <th className="p-3 md:p-4 font-semibold whitespace-nowrap w-48">Status Tracker</th>
                <th className="p-3 md:p-4 font-semibold whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500 font-medium"><Loader2 className="animate-spin inline mr-2"/> Fetching records...</td></tr>
              ) : filteredBookings.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No records found.</td></tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                    <td className="p-3 md:p-4 align-top">
                      <p className="font-bold text-gray-900">{booking.fullName}</p>
                      <p className="text-xs md:text-sm text-gray-500">{booking.mobile}</p>
                      <span className="text-[10px] md:text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded mt-1 mr-2 inline-block font-bold">{booking.category}</span>
                      {booking.assignedTo && booking.assignedTo !== 'Unassigned' && (
                        <span className="text-[10px] md:text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mt-1 inline-block font-bold">Agent: {booking.assignedTo}</span>
                      )}
                    </td>
                    <td className="p-3 md:p-4 align-top">
                      <p className="font-bold text-blue-900">{booking.exam}</p>
                      <p className="text-xs md:text-sm text-gray-600">{booking.institute}</p>
                      {booking.batchName && <p className="text-[10px] md:text-xs text-emerald-600 font-medium mt-1">Batch: {booking.batchName}</p>}
                    </td>
                    <td className="p-3 md:p-4 align-top">
                      <p className="font-bold text-gray-800 text-sm">{booking.slotDate}</p>
                      <p className="text-xs md:text-sm text-gray-500 flex items-center gap-1 mb-1"><Clock size={12}/> {booking.slotTime}</p>
                    </td>
                    <td className="p-3 md:p-4 align-top">
                      <p className="font-black text-indigo-600 text-xs md:text-sm mb-2">{booking.tokenNumber}</p>
                      <div className="flex gap-2 items-center mb-2 flex-wrap">
                        <span className={`px-2 py-1 rounded text-[10px] md:text-[11px] font-bold ${booking.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{booking.status || 'Pending'}</span>
                        {booking.paymentStatus === 'Paid' ? (
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-1 rounded text-[10px] md:text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 flex items-center gap-1"><CheckCircle size={10}/> ₹{booking.paymentAmount}</span>
                            <button onClick={() => openPaymentModal(booking)} className="text-gray-400 hover:text-blue-500 p-1 bg-gray-100 rounded" title="Edit Payment Data"><Edit size={12} /></button>
                          </div>
                        ) : (
                          <button onClick={() => openPaymentModal(booking)} className="px-2 py-1 rounded text-[10px] md:text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors">Payment Due</button>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 mt-2">
                        <button onClick={() => togglePhotoDeliveryStatus(booking.id, booking.collectionName, booking.photoDelivered)} className={`flex w-fit items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all border ${booking.photoDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          <Camera size={12}/> {booking.photoDelivered ? 'Photos ✅' : 'Give Photos'}
                        </button>
                        <button onClick={() => toggleConfirmationStatus(booking.id, booking.collectionName, booking.confirmationDelivered)} className={`flex w-fit items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all border ${booking.confirmationDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          <Printer size={12}/> {booking.confirmationDelivered ? 'Confirm ✅' : 'Give Confirm'}
                        </button>
                      </div>
                      {booking.applicationNumber && booking.applicationNumber !== 'N/A' && (
                        <p className="text-[10px] md:text-[11px] font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded inline-block mt-2">App No: {booking.applicationNumber}</p>
                      )}
                    </td>
                    <td className="p-3 md:p-4 align-top">
                      <div className="flex items-center justify-end gap-1 md:gap-2">
                        {booking.documents ? (
                          <button onClick={() => { setSelectedStudent(booking); setDocsModalOpen(true); }} className="flex items-center justify-center p-1.5 md:p-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-colors border border-blue-100"><FileText size={16}/></button>
                        ) : (
                          <button onClick={() => { setUploadTarget(booking); setIsUploadModalOpen(true); }} className="flex items-center gap-1 px-2 py-1.5 md:px-3 md:py-2 text-[10px] md:text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-lg transition-all shadow-sm"><Upload size={12}/> Upload</button>
                        )}
                        <a href={`https://wa.me/91${booking.mobile}?text=Hello ${booking.fullName}...`} target="_blank" rel="noreferrer" className="flex items-center justify-center p-1.5 md:p-2 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-lg transition-colors border border-green-100"><MessageCircle size={16}/></a>
                        {booking.status !== 'Completed' && (
                          <button onClick={() => markAsCompleted(booking.id, booking.collectionName)} className="flex items-center justify-center p-1.5 md:p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors border border-emerald-100"><CheckCircle size={16}/></button>
                        )}
                        <button onClick={() => deleteBooking(booking.id, booking.collectionName)} className="flex items-center justify-center p-1.5 md:p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-100"><Trash2 size={16}/></button>
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