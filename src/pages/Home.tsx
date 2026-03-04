import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ShieldCheck, Zap, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-bottom border-gray-100 dark:border-gray-800">
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
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-full">
              Modern Leave Management
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-8 leading-[1.1] tracking-tight">
              Manage your team's <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">time off</span> with ease.
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
              SmartLeave is the all-in-one platform for employees to apply for leave and for HR managers to approve them instantly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/register" 
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center group shadow-xl shadow-indigo-100 dark:shadow-none"
              >
                Start Free Trial
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
              <Link hidden
                to="/login" 
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                View Demo
              </Link>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-950 via-transparent to-transparent z-10" />
            <div className="rounded-[40px] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
              <img 
                src="https://picsum.photos/seed/dashboard/1920/1080" 
                alt="Dashboard Preview" 
                className="rounded-[24px] w-full object-cover aspect-video"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Everything you need to manage leave</h2>
            <p className="text-gray-500 dark:text-gray-400">Streamlined workflows for both employees and management.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="text-amber-500" />,
                title: "Instant Requests",
                desc: "Employees can apply for annual, sick, or emergency leave in seconds from any device."
              },
              {
                icon: <ShieldCheck className="text-emerald-500" />,
                title: "Smart Approvals",
                desc: "HR managers get real-time notifications and can approve or reject requests with one click."
              },
              {
                icon: <Users className="text-indigo-500" />,
                title: "Team Overview",
                desc: "Keep track of who is away and manage department capacity effectively with visual calendars."
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 p-8 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
                Built for teams that value <br />
                <span className="text-indigo-600">transparency.</span>
              </h2>
              <div className="space-y-6">
                {[
                  "Automated balance tracking",
                  "Custom leave categories",
                  "Detailed reporting & analytics",
                  "Encashment request management"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={16} />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Link 
                  to="/register" 
                  className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-bold hover:gap-2 transition-all"
                >
                  Learn more about our features <ArrowRight className="ml-1" size={18} />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img 
                src="https://picsum.photos/seed/team1/600/800" 
                alt="Team" 
                className="rounded-[32px] w-full h-64 object-cover"
                referrerPolicy="no-referrer"
              />
              <img 
                src="https://picsum.photos/seed/team2/600/800" 
                alt="Team" 
                className="rounded-[32px] w-full h-80 object-cover mt-8"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <CalendarCheck className="text-indigo-600" size={24} />
            <span className="text-xl font-bold text-gray-900 dark:text-white">SmartLeave</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            © 2026 SmartLeave Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
