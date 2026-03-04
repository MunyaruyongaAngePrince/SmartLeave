import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ShieldCheck, Zap, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
                <CalendarCheck className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">SmartLeave</span>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                to="/login" 
                className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-full">
              Modern Leave Management
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
              Manage your team's <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">time off</span> with ease.
            </h1>
            <p className="max-w-xl mx-auto text-base md:text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              SmartLeave is the all-in-one platform for employees to apply for leave and for HR managers to approve them instantly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/register" 
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center group shadow-xl shadow-indigo-100 dark:shadow-none"
              >
                Start Now
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
              <Link 
                to="/login" 
                className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Login
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="text-amber-500" />,
                title: "Instant Requests",
                desc: "Apply for leave in seconds from any device."
              },
              {
                icon: <ShieldCheck className="text-emerald-500" />,
                title: "Smart Approvals",
                desc: "Approve or reject requests with one click."
              },
              {
                icon: <Users className="text-indigo-500" />,
                title: "Team Overview",
                desc: "Track who is away with visual calendars."
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700 shadow-sm transition-all">
                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            © 2026 SmartLeave Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
