import React from 'react';
import { AlertTriangle, MessageCircle, CheckCircle, Check, Trash2 } from 'lucide-react';

export default function MissingTab({ missingRequests, formatTime, resolveMissingRequest, deleteMissingRequest }) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <header className="mb-6 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Missing Items Tracker</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">Manage requests submitted by students.</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
          <AlertTriangle className="text-red-500" size={20} />
          <h2 className="text-lg md:text-xl font-bold text-gray-800">Student Reports</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs md:text-sm uppercase tracking-wider border-b border-gray-100">
                <th className="p-3 md:p-4 font-semibold">Student Name & Contact</th>
                <th className="p-3 md:p-4 font-semibold">Reported Missing Items</th>
                <th className="p-3 md:p-4 font-semibold">Date Reported</th>
                <th className="p-3 md:p-4 font-semibold">Status</th>
                <th className="p-3 md:p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {missingRequests.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500 font-medium">🎉 Great! No missing item requests right now.</td></tr>
              ) : (
                missingRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 md:p-4">
                      <p className="font-bold text-gray-900 text-base md:text-lg">{req.studentName}</p>
                      <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1 mt-1"><MessageCircle size={12}/> {req.mobile}</p>
                    </td>
                    <td className="p-3 md:p-4">
                      <div className="flex flex-wrap gap-2">
                        {req.missingItems && req.missingItems.map((item, idx) => (
                          <span key={idx} className="bg-red-50 text-red-700 border border-red-200 px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold shadow-sm whitespace-nowrap">
                            {item}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 md:p-4 text-xs md:text-sm text-gray-500 font-medium">{formatTime(req.timestamp)}</td>
                    <td className="p-3 md:p-4">
                      {req.status === 'Pending' ? (
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold animate-pulse inline-block whitespace-nowrap">Needs Attention</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold flex items-center gap-1 w-fit whitespace-nowrap"><CheckCircle size={12}/> Resolved</span>
                      )}
                    </td>
                    <td className="p-3 md:p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.status === 'Pending' && (
                          <button onClick={() => resolveMissingRequest(req.id)} className="flex items-center gap-1 px-2 py-1.5 md:px-3 md:py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] md:text-xs font-bold transition-all shadow-sm whitespace-nowrap">
                            <Check size={12}/> Mark Printed
                          </button>
                        )}
                        <button onClick={() => deleteMissingRequest(req.id)} className="p-1.5 md:p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-100">
                          <Trash2 size={14}/>
                        </button>
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