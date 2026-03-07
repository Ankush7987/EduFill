import React from 'react';

const AdminLogin = ({ password, setPassword, error, handleLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-lg shadow-emerald-500/30">EF</div>
          <h2 className="text-3xl font-extrabold text-white">Admin Access</h2>
          <p className="text-blue-200 text-sm mt-2">EduFill Secure Dashboard</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input 
              type="password" 
              placeholder="Enter Admin Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-center tracking-widest text-lg"
            />
            {error && <p className="text-red-400 text-sm mt-2 text-center font-medium">{error}</p>}
          </div>
          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1">
            Login to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;