import React from 'react';
import { Sparkles, Trash2, Download } from 'lucide-react';

export default function PredictorLeadsTab({ predictorLeads, formatTime, updatePredictorStatus, deletePredictorLead, exportPredictorToCSV }) {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Sparkles className="text-orange-500" size={32} /> Predictor Leads
          </h1>
          <p className="text-gray-500 font-medium mt-1">Manage students seeking college predictions.</p>
        </div>
        
        {/* 🌟 NAYA: EXPORT BUTTON 🌟 */}
        <button 
          onClick={exportPredictorToCSV}
          className="flex items-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm active:scale-95"
        >
          <Download size={18} /> Export to CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-black">
              <th className="p-4">Student Info</th>
              <th className="p-4">Academics</th>
              <th className="p-4">Target & Score</th>
              <th className="p-4">AI Result</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {predictorLeads.length === 0 ? (
              <tr><td colSpan="6" className="p-10 text-center text-gray-500">No predictor leads found yet.</td></tr>
            ) : (
              predictorLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{lead.studentName || 'Guest User'}</p>
                    <p className="text-xs font-semibold text-gray-600">{lead.mobile || 'N/A'}</p>
                    <p className="text-[10px] text-gray-400">{formatTime(lead.timestamp)}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-800">{lead.exam}</p>
                    <p className="text-xs text-gray-500">{lead.state} • {lead.category}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-800">{lead.dream}</p>
                    <p className="text-sm text-orange-600 font-black">Score: {lead.score}</p>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${lead.result === 'Positive' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {lead.result || 'Alternative'}
                    </span>
                  </td>
                  <td className="p-4">
                    <select 
                      value={lead.status || 'New Request'} 
                      onChange={(e) => updatePredictorStatus(lead.id, e.target.value)}
                      className={`text-xs font-bold px-2 py-1 rounded outline-none cursor-pointer ${lead.status === 'Contacted' ? 'bg-blue-100 text-blue-700' : lead.status === 'Closed' ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-700'}`}
                    >
                      <option value="New Request">New Request</option>
                      <option value="New Lead">New Request</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button onClick={() => deletePredictorLead(lead.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete Lead"><Trash2 size={18}/></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}