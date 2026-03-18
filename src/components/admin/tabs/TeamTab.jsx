import React, { useState } from 'react';
import { UserPlus, Shield, Trash2, Building, Briefcase, Hash, Filter } from 'lucide-react';

export default function TeamTab({ 
  employees, 
  empInstituteFilter, 
  setEmpInstituteFilter, 
  approvedInstitutesList, 
  setIsEmployeeModalOpen, 
  deleteEmployee 
}) {
  
  // 🌟 NAYA STATE: Role Filter ke liye 🌟
  const [roleFilter, setRoleFilter] = useState('All');

  // Filter Employees based on BOTH Institute AND Role
  const filteredEmployees = employees.filter(emp => {
    const matchInstitute = empInstituteFilter === 'All' || emp.institute === empInstituteFilter;
    const matchRole = roleFilter === 'All' || emp.role === roleFilter;
    
    return matchInstitute && matchRole;
  });

  return (
    <div className="animation-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-2">
            <Shield className="text-blue-600" size={32} /> Team & Agents
          </h2>
          <p className="text-gray-500 font-medium mt-1">Manage your form filling and counselling team</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          
          {/* 🌟 NAYA FILTER UI: Agent Role 🌟 */}
          <div className="relative">
            <select 
              className="w-full sm:w-auto appearance-none border-2 border-gray-200 rounded-xl pl-10 pr-8 py-2.5 font-bold text-gray-700 bg-white outline-none focus:border-blue-500 transition-colors"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="Form Filling (NEET/JEE)">NEET/JEE Forms</option>
              <option value="12th Counselling">12th Counselling</option>
            </select>
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Existing Institute Filter */}
          <div className="relative">
            <select 
              className="w-full sm:w-auto appearance-none border-2 border-gray-200 rounded-xl pl-10 pr-8 py-2.5 font-bold text-gray-700 bg-white outline-none focus:border-blue-500 transition-colors"
              value={empInstituteFilter}
              onChange={(e) => setEmpInstituteFilter(e.target.value)}
            >
              <option value="All">All Institutes</option>
              <option value="Ribosome Institute">Ribosome Institute</option>
              <option value="Unacademy">Unacademy</option>
              <option value="Others">Others</option>
              {approvedInstitutesList.map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
            <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          
          <button 
            onClick={() => setIsEmployeeModalOpen(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md whitespace-nowrap"
          >
            <UserPlus size={18} /> Add New Agent
          </button>
        </div>
      </div>

      {/* Agents Grid/List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-500 font-medium shadow-sm">
            No agents found matching your filters.
          </div>
        ) : (
          filteredEmployees.map((emp) => (
            <div key={emp.id} className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-md transition-all relative group">
              
              {/* Delete Button (Visible on hover) */}
              <button 
                onClick={() => deleteEmployee(emp.id)}
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-full transition-colors opacity-100 md:opacity-0 group-hover:opacity-100"
                title="Remove Agent"
              >
                <Trash2 size={18} />
              </button>

              {/* Agent Info */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black text-xl border border-blue-100 uppercase">
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-lg text-gray-900 leading-tight">{emp.name}</h3>
                  
                  {/* Category Badge */}
                  <div className="mt-1.5">
                    {emp.role === '12th Counselling' ? (
                      <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-1">
                        12th Counselling
                      </span>
                    ) : (
                      <span className="bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-1">
                        NEET/JEE Forms
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                  <Hash size={16} className="text-gray-400" />
                  <span className="text-gray-400">Login PIN:</span> 
                  <span className="font-mono font-bold text-gray-900 tracking-widest">{emp.pin}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                  <Building size={16} className="text-gray-400" />
                  <span className="text-gray-400">Institute:</span> 
                  <span className="font-bold text-gray-900 truncate">{emp.institute}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                  <Briefcase size={16} className="text-gray-400" />
                  <span className="text-gray-400">Total Assigned:</span> 
                  <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{emp.assignedCount || 0} Students</span>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}