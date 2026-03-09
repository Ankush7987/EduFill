import React from 'react';
import { Shield, UserPlus, Building, Trash2 } from 'lucide-react';

export default function TeamTab({ employees, empInstituteFilter, setEmpInstituteFilter, approvedInstitutesList, setIsEmployeeModalOpen, deleteEmployee }) {
  const filteredEmployees = employees.filter(emp => {
    if (empInstituteFilter === 'All') return true;
    return emp.institute === empInstituteFilter;
  });

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <header className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 mb-6 md:mb-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Agent Management</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Add your employees here. Forms will be auto-assigned to them.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-48">
              <Building size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={empInstituteFilter}
                onChange={(e) => setEmpInstituteFilter(e.target.value)}
                className="w-full bg-white border border-gray-300 text-gray-700 rounded-full pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer appearance-none shadow-sm"
              >
                <option value="All">All Institutes</option>
                <option value="Ribosome Institute">Ribosome Institute</option>
                <option value="Unacademy">Unacademy</option>
                <option value="Others">Others</option>
                {approvedInstitutesList.map(inst => <option key={inst} value={inst}>{inst}</option>)}
              </select>
            </div>
            
            <button onClick={() => setIsEmployeeModalOpen(true)} className="flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full shadow-lg transition-all font-bold w-full sm:w-auto">
              <UserPlus size={18} /> Add New Agent
            </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
          <Shield className="text-indigo-500" size={20} />
          <h2 className="text-lg md:text-xl font-bold text-gray-800">Active Team Members</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs md:text-sm uppercase tracking-wider border-b border-gray-100">
                <th className="p-3 md:p-4 font-semibold">Agent Info</th>
                <th className="p-3 md:p-4 font-semibold">Login PIN</th>
                <th className="p-3 md:p-4 font-semibold">Assigned Institute</th>
                <th className="p-3 md:p-4 font-semibold">Forms Today</th>
                <th className="p-3 md:p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500 font-medium">No agents found for this selection.</td></tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 md:p-4">
                      <p className="font-bold text-gray-900 text-base">{emp.name}</p>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block font-bold">Active</span>
                    </td>
                    <td className="p-3 md:p-4"><span className="font-mono bg-gray-100 px-3 py-1 rounded text-gray-800 font-bold tracking-widest">{emp.pin}</span></td>
                    <td className="p-3 md:p-4"><span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200">{emp.institute}</span></td>
                    <td className="p-3 md:p-4">
                      <div className="flex items-center gap-2"><span className="text-lg font-black text-gray-800">{emp.assignedCount || 0}</span><span className="text-xs text-gray-500">assigned</span></div>
                    </td>
                    <td className="p-3 md:p-4 text-right">
                      <button onClick={() => deleteEmployee(emp.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-100"><Trash2 size={16}/></button>
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