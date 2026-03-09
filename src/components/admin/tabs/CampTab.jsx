import React from 'react';
import { Trash2 } from 'lucide-react';

export default function CampTab({ campRequests, formatTime, updateCampStatus, deleteCampRequest }) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <header className="mb-6 md:mb-10"><h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">B2B Camp Inquiries</h1></header>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50"><h2 className="text-lg md:text-xl font-bold text-gray-800">Institute Leads Directory</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead><tr className="bg-gray-50 text-gray-500 text-xs md:text-sm uppercase tracking-wider border-b border-gray-100"><th className="p-3 md:p-4">Institute</th><th className="p-3 md:p-4">Contact</th><th className="p-3 md:p-4">Volume</th><th className="p-3 md:p-4">Status</th><th className="p-3 md:p-4 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {campRequests.map((camp) => (
                <tr key={camp.id} className="hover:bg-gray-50">
                  <td className="p-3 md:p-4"><p className="font-bold text-indigo-900 text-base md:text-lg">{camp.instituteName}</p><p className="text-[10px] text-gray-400 mt-1">Date: {formatTime(camp.timestamp)}</p></td>
                  <td className="p-3 md:p-4"><p className="font-bold text-sm md:text-base">{camp.contactPerson}</p><p className="text-xs md:text-sm text-gray-600">{camp.mobile}</p></td>
                  <td className="p-3 md:p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-sm font-bold border border-blue-200 whitespace-nowrap">{camp.studentCount} Forms</span></td>
                  <td className="p-3 md:p-4"><select value={camp.status || 'New Request'} onChange={(e) => updateCampStatus(camp.id, e.target.value)} className="text-[10px] md:text-sm font-bold rounded-lg px-2 py-1 outline-none border transition-colors cursor-pointer"><option value="New Request">New Lead</option><option value="Completed">Camp Executed</option></select></td>
                  <td className="p-3 md:p-4 text-right"><button onClick={() => deleteCampRequest(camp.id)} className="p-1.5 md:p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors"><Trash2 size={16}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}