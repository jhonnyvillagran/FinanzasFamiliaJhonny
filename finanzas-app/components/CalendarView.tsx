
import React, { useState, useMemo } from 'react';
import format from 'date-fns/format';
import endOfMonth from 'date-fns/endOfMonth';
import endOfWeek from 'date-fns/endOfWeek';
import eachDayOfInterval from 'date-fns/eachDayOfInterval';
import isSameMonth from 'date-fns/isSameMonth';
import isSameDay from 'date-fns/isSameDay';
import addMonths from 'date-fns/addMonths';
import isToday from 'date-fns/isToday';
import startOfMonth from 'date-fns/startOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
import subMonths from 'date-fns/subMonths';
import parseISO from 'date-fns/parseISO';
import es from 'date-fns/locale/es';
import { Reminder } from '../types';

interface CalendarViewProps {
  reminders: Reminder[];
  onAddReminder: (title: string, date: Date) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
  onToggleComplete: (reminder: Reminder) => Promise<void>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ reminders, onAddReminder, onDeleteReminder, onToggleComplete }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00');

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunes
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const remindersOnSelectedDate = useMemo(() => {
    return reminders.filter(r => isSameDay(parseISO(r.date), selectedDate)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [reminders, selectedDate]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    // Combinar fecha seleccionada con hora seleccionada
    const [hours, minutes] = newTime.split(':').map(Number);
    const finalDate = new Date(selectedDate);
    finalDate.setHours(hours, minutes, 0, 0);

    await onAddReminder(newTitle, finalDate);
    setNewTitle('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header Calendario */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
            &larr;
        </button>
        <h2 className="text-lg font-bold text-gray-800 dark:text-white capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h2>
        <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
            &rarr;
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grid del Calendario */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-7 mb-4">
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const dayReminders = reminders.filter(r => isSameDay(parseISO(r.date), day));
              const hasPending = dayReminders.some(r => !r.is_completed);

              return (
                <div 
                  key={idx} 
                  onClick={() => handleDayClick(day)}
                  className={`
                    relative h-14 sm:h-24 rounded-lg border cursor-pointer transition-all flex flex-col items-start p-1 sm:p-2
                    ${isSelected 
                      ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900 bg-indigo-50 dark:bg-indigo-900/20' 
                      : 'border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-gray-500'
                    }
                    ${!isCurrentMonth && 'opacity-40 bg-gray-50 dark:bg-gray-900'}
                    ${isToday(day) && !isSelected && 'bg-blue-50 dark:bg-blue-900/10'}
                  `}
                >
                  <span className={`
                    text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'}
                  `}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Dots indicators */}
                  <div className="mt-auto flex gap-1 flex-wrap content-end w-full">
                    {dayReminders.slice(0, 4).map((r, i) => (
                      <div 
                        key={i} 
                        className={`w-1.5 h-1.5 rounded-full ${r.is_completed ? 'bg-gray-300 dark:bg-gray-600' : 'bg-indigo-500'}`}
                      />
                    ))}
                    {dayReminders.length > 4 && <span className="text-[10px] text-gray-400">+</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Lateral: Detalles del Día */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white capitalize">{format(selectedDate, 'EEEE d', { locale: es })}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{format(selectedDate, 'MMMM yyyy', { locale: es })}</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-md transition-transform active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-12H4"></path></svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {remindersOnSelectedDate.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <p className="text-4xl mb-2">🔕</p>
                        <p>Sin recordatorios</p>
                    </div>
                ) : (
                    remindersOnSelectedDate.map(reminder => (
                        <div key={reminder.id} className={`group flex items-start gap-3 p-3 rounded-lg border transition-all ${reminder.is_completed ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 opacity-75' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300'}`}>
                            <button 
                                onClick={() => onToggleComplete(reminder)}
                                className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${reminder.is_completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-500 hover:border-indigo-500'}`}
                            >
                                {reminder.is_completed && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${reminder.is_completed ? 'text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
                                    {reminder.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <span>⏰</span> {format(parseISO(reminder.date), 'HH:mm')}
                                </p>
                            </div>
                            <button 
                                onClick={() => onDeleteReminder(reminder.id)}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      {/* Modal Agregar Recordatorio */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white">Nuevo Recordatorio</h3>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Fecha</label>
                        <p className="text-gray-800 dark:text-white font-medium capitalize">{format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es })}</p>
                    </div>
                    <div>
                        <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Título</label>
                        <input 
                            autoFocus
                            type="text" 
                            value={newTitle} 
                            onChange={e => setNewTitle(e.target.value)} 
                            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Ej: Pagar luz, Cita médica..." 
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase font-bold text-gray-500 mb-1">Hora</label>
                        <input 
                            type="time" 
                            value={newTime} 
                            onChange={e => setNewTime(e.target.value)} 
                            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                        />
                    </div>
                    <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-colors">
                        Guardar Recordatorio
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
