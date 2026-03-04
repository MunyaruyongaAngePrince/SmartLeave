
import React, { useState } from 'react';
import { Terminal, Cpu, Clock, ShieldCheck, Filter, Search, Zap, AlertTriangle, Info } from 'lucide-react';

const SystemLogs: React.FC = () => {
  const [logs] = useState([
    { id: 1, type: 'info', actor: 'System', action: 'Daily Leave Balance Sync', time: '2026-07-25 00:00:01', status: 'Success' },
    { id: 2, type: 'zap', actor: 'System', action: 'Email Notification Sent: req2-reminder', time: '2026-07-24 14:30:12', status: 'Success' },
    { id: 3, type: 'shield', actor: 'Admin', action: 'Modified Permission Policy: HR_LEAVE_WRITE', time: '2026-07-24 09:15:44', status: 'Success' },
    { id: 4, type: 'warning', actor: 'System', action: 'Database Backup Delayed', time: '2026-07-24 02:00:00', status: 'Warning' },
    { id: 5, type: 'info', actor: 'System', action: 'Monthly Report Generated', time: '2026-07-01 08:00:00', status: 'Success' },
    { id: 6, type: 'shield', actor: 'Admin', action: 'User Session Termination: id_882', time: '2026-06-30 22:11:05', status: 'Success' },
  ]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Activity Logs</h1>
          <p className="text-gray-500 dark:text-gray-400">Monitoring automated processes and administrative actions</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl flex items-center">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse"></div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">Engine Online</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search logs by action or actor..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button className="px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center hover:bg-gray-50 dark:hover:bg-gray-600">
              <Filter className="mr-2" size={16} />
              Filter Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${
                          log.type === 'shield' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                          log.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                          'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        }`}>
                          {log.type === 'shield' ? <ShieldCheck size={16} /> : log.type === 'zap' ? <Zap size={16} /> : <Terminal size={16} />}
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        log.actor === 'System' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400'
                      }`}>
                        {log.actor}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {log.time}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {log.status === 'Success' ? <ShieldCheck className="text-emerald-500 mr-2" size={14} /> : <AlertTriangle className="text-amber-500 mr-2" size={14} />}
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{log.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 dark:bg-indigo-700 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100 dark:shadow-none">
            <h3 className="text-lg font-bold flex items-center mb-4">
              <Cpu className="mr-2" size={20} />
              System Actor Stats
            </h3>
            <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-2xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-100">Uptime</p>
                <p className="text-2xl font-black mt-1">99.99%</p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-100">Daily Tasks Executed</p>
                <p className="text-2xl font-black mt-1">1,248</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Info className="mr-2 text-indigo-600 dark:text-indigo-400" size={18} />
              Engine Metadata
            </h3>
            <div className="space-y-3 text-[11px] font-medium text-gray-500 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Version</span>
                <span className="text-gray-900 dark:text-white">v4.2.0-stable</span>
              </div>
              <div className="flex justify-between">
                <span>Region</span>
                <span className="text-gray-900 dark:text-white">East Africa (KGL)</span>
              </div>
              <div className="flex justify-between">
                <span>Last Sync</span>
                <span className="text-gray-900 dark:text-white">3 mins ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
