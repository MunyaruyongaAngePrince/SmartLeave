
import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarProps {
  holidays: any[];
  approvedLeaves?: any[];
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ holidays, approvedLeaves = [] }) => {
  const today = new Date();
  const [viewDate, setViewDate] = React.useState(new Date());

  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDayOfMonth + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  const monthHolidays = useMemo(() => {
    // Deduplicate holidays by date (keep first occurrence)
    const seenDates = new Set<string>();
    const uniqueHolidays = holidays.filter((h: any) => {
      const dateStr = new Date(h.date).toISOString().split('T')[0];
      if (seenDates.has(dateStr)) return false;
      seenDates.add(dateStr);
      return true;
    });

    return uniqueHolidays.filter(h => {
      const d = new Date(h.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [holidays, month, year]);

  const monthLeaves = approvedLeaves.filter(l => {
    const start = new Date(l.startDate);
    const end = new Date(l.endDate);
    return (start.getMonth() === month && start.getFullYear() === year) || 
           (end.getMonth() === month && end.getFullYear() === year);
  });

  const isHoliday = (day: number) => monthHolidays.some(h => new Date(h.date).getDate() === day);
  const isLeave = (day: number) => {
    const date = new Date(year, month, day);
    date.setHours(0,0,0,0);
    return monthLeaves.some(l => {
      const s = new Date(l.startDate);
      const e = new Date(l.endDate);
      s.setHours(0,0,0,0);
      e.setHours(0,0,0,0);
      return date >= s && date <= e;
    });
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
          {viewDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </span>
        <div className="flex gap-1">
          <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
            <ChevronLeft size={14} className="text-gray-400" />
          </button>
          <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
            <ChevronRight size={14} className="text-gray-400" />
          </button>
        </div>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[8px] font-black text-gray-400 uppercase">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={i} className="h-6 w-6"></div>;
            
            const holiday = isHoliday(day);
            const leave = isLeave(day);
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            
            return (
              <div 
                key={i} 
                className={`h-6 w-6 flex items-center justify-center text-[10px] font-bold rounded-lg transition-all relative
                  ${isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}
                  ${holiday && !isToday ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' : ''}
                  ${leave && !isToday && !holiday ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : ''}
                `}
              >
                {day}
                {(holiday || leave) && !isToday && (
                  <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${holiday ? 'bg-pink-500' : 'bg-emerald-500'}`}></span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MiniCalendar;
