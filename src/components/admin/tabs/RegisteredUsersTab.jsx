import React from 'react';
import { Users, Search, FileText, ShieldAlert, ShieldCheck, Trash2, Download } from 'lucide-react';

export default function RegisteredUsersTab({ 
  filteredRegisteredUsers, 
  userSearchTerm, 
  setUserSearchTerm, 
  setSelectedStudent, 
  setDocsModalOpen, 
  toggleUserRole, 
  deleteRegisteredUser,
  exportUsersToCSV // 🌟 NAYA: Export Prop 🌟
}) {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Users className="text-emerald-600" size={32} /> Web Users
          </h1>
          <p className="text-gray-500 font-medium mt-1">Manage students registered via Login/Vault.</p>
        </div>
        
        {/* 🌟 NAYA: SEARCH & EXPORT CONTAINER 🌟 */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72 flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search name or phone..." 
              value={userSearchTerm} 
              onChange={(e) => setUserSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-emerald-500 outline-none" 
            />
          </div>
          
          <button 
            onClick={exportUsersToCSV}
            className="flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm active:scale-95 shrink-0"
            title="Export to Excel"
          >
            <Download size={18} /> <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-black">
              <th className="p-4">Student Info</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Qualification</th>
              <th className="p-4 text-center">Vault Docs</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRegisteredUsers.length === 0 ? (
              <tr><td colSpan="5" className="p-10 text-center text-gray-500">No users found.</td></tr>
            ) : (
              filteredRegisteredUsers.map(user => {
                const docCount = user.documents ? Object.keys(user.documents).length : 0;
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">{user.fullName?.charAt(0) || 'S'}</div>
                        <div><p className="font-bold text-gray-900">{user.fullName || 'No Name'}</p><span className="text-[10px] font-bold uppercase bg-gray-100 px-2 py-0.5 rounded-full">{user.role || 'Student'}</span></div>
                      </div>
                    </td>
                    <td className="p-4"><p className="text-sm font-bold text-gray-800">{user.phone || 'N/A'}</p><p className="text-xs text-gray-500">{user.email || 'N/A'}</p></td>
                    <td className="p-4"><span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-lg">{user.qualification || 'N/A'}</span></td>
                    
                    <td className="p-4 text-center">
                      {docCount > 0 ? (
                        <button 
                          onClick={() => { setSelectedStudent({ ...user, collectionName: 'Users' }); setDocsModalOpen(true); }}
                          className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors w-full"
                        >
                          <FileText size={14}/> View ({docCount})
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Empty</span>
                      )}
                    </td>

                    <td className="p-4 flex justify-center gap-2">
                      <button onClick={() => toggleUserRole(user.id, user.role)} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Toggle Admin Role">{user.role === 'admin' ? <ShieldAlert size={18}/> : <ShieldCheck size={18}/>}</button>
                      <button onClick={() => deleteRegisteredUser(user.id, user.fullName)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete User"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}