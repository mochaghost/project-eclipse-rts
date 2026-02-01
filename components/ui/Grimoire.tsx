
import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { TaskPriority, Task, AlertType, SubtaskDraft } from '../../types';
import { X, ChevronLeft, ChevronRight, Clock, ShieldAlert, Users, Scroll, Calendar as CalIcon, Plus, Trash2, Layout, LayoutGrid, List, CalendarDays, Eye, Skull, Link as LinkIcon, Edit3, Save, Hourglass } from 'lucide-react';

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({length: 24}, (_, i) => i);

type ViewMode = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export const Grimoire: React.FC = () => {
  const { state, toggleGrimoire, addTask, editTask, completeRitual } = useGame();
  
  // Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('WEEK');
  const [showRealNames, setShowRealNames] = useState(false); 
  
  // Form State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null); 
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [startTimeStr, setStartTimeStr] = useState("09:00");
  const [endTimeStr, setEndTimeStr] = useState("10:00");
  const [duration, setDuration] = useState(60); // Auto-calculated
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.LOW);
  const [subtasks, setSubtasks] = useState<SubtaskDraft[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [newSubtaskDeadlineStr, setNewSubtaskDeadlineStr] = useState(''); // Optional specific deadline for subtask
  const [parentId, setParentId] = useState<string>(''); 

  if (!state.isGrimoireOpen) return null;
  const isRitual = state.activeAlert === AlertType.RITUAL_MORNING || state.activeAlert === AlertType.RITUAL_EVENING;

  // --- HELPER: GET NAME ---
  const getTaskDisplayTitle = (t: Task) => {
      if (showRealNames) return t.title;
      const enemy = state.enemies.find(e => e.taskId === t.id);
      return enemy ? enemy.title : t.title;
  };

  // --- NAVIGATION HELPERS ---
  
  const handleNav = (dir: -1 | 1) => {
      const newDate = new Date(currentDate);
      if (viewMode === 'DAY') newDate.setDate(newDate.getDate() + dir);
      if (viewMode === 'WEEK') newDate.setDate(newDate.getDate() + (dir * 7));
      if (viewMode === 'MONTH') newDate.setMonth(newDate.getMonth() + dir);
      if (viewMode === 'YEAR') newDate.setFullYear(newDate.getFullYear() + dir);
      setCurrentDate(newDate);
  };

  const handleSelectSlot = (date: Date, hour?: number) => {
      setSelectedDate(date);
      if (hour !== undefined) {
          const start = `${hour < 10 ? '0'+hour : hour}:00`;
          const end = `${hour+1 < 10 ? '0'+(hour+1) : (hour+1)}:00`;
          setStartTimeStr(start);
          setEndTimeStr(end);
      }
  };

  const handleEditTask = (task: Task) => {
      setEditingTaskId(task.id);
      setTitle(task.title);
      setNotes(task.description || '');
      setDuration(task.estimatedDuration);
      setPriority(task.priority);
      setSubtasks(task.subtasks.map(s => ({ title: s.title, startTime: s.startTime, deadline: s.deadline })));
      setParentId(task.parentId || '');
      
      const deadlineDate = new Date(task.deadline);
      const startDate = new Date(task.startTime);
      
      setSelectedDate(deadlineDate); // Focus on deadline day
      setStartTimeStr(startDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: false}));
      setEndTimeStr(deadlineDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: false}));
  };

  const resetForm = () => {
      setEditingTaskId(null);
      setTitle(''); 
      setNotes(''); 
      setSubtasks([]); 
      setNewSubtask(''); 
      setNewSubtaskDeadlineStr('');
      setParentId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    
    // Parse Main Task Times
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);
    
    const startDate = new Date(selectedDate);
    startDate.setHours(startH, startM, 0);
    
    const deadlineDate = new Date(selectedDate);
    deadlineDate.setHours(endH, endM, 0);
    
    // Auto-calculate duration in minutes
    const dur = Math.max(15, (deadlineDate.getTime() - startDate.getTime()) / 60000);

    const finalSubtasks: SubtaskDraft[] = [...subtasks];
    if(newSubtask.trim()) {
        finalSubtasks.push({ title: newSubtask.trim() }); // Add pending text if any
    }

    if (editingTaskId) {
        editTask(editingTaskId, {
            title,
            description: notes,
            startTime: startDate.getTime(),
            deadline: deadlineDate.getTime(),
            priority,
            subtasks: finalSubtasks,
            estimatedDuration: dur,
            parentId: parentId || undefined
        });
        resetForm();
    } else {
        addTask(title, startDate.getTime(), deadlineDate.getTime(), priority, finalSubtasks, dur, notes, parentId || undefined);
        resetForm();
    }
  };

  const handleAddSubtask = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (newSubtask.trim()) {
          let deadline: number | undefined = undefined;
          let startTime: number | undefined = undefined;

          // If user picked a specific time for subtask
          if (newSubtaskDeadlineStr) {
              const [h, m] = newSubtaskDeadlineStr.split(':').map(Number);
              const d = new Date(selectedDate);
              d.setHours(h, m, 0);
              deadline = d.getTime();
              startTime = d.getTime() - (30 * 60000); // Default 30 min before
          }

          setSubtasks([...subtasks, { title: newSubtask.trim(), startTime, deadline }]);
          setNewSubtask('');
          setNewSubtaskDeadlineStr('');
      }
  };

  // --- VIEW RENDERERS ---

  const renderMonthView = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const startDay = firstDay.getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const grid = [];
      for (let i=0; i<startDay; i++) grid.push(<div key={`empty-${i}`} className="bg-[#050202] border border-[#1c1917] min-h-[100px]"></div>);
      
      for (let d=1; d<=daysInMonth; d++) {
          const date = new Date(year, month, d);
          const isToday = new Date().toDateString() === date.toDateString();
          const isSelected = selectedDate.toDateString() === date.toDateString();
          const tasks = state.tasks.filter(t => new Date(t.deadline).toDateString() === date.toDateString());

          grid.push(
              <div 
                key={d} 
                onClick={() => handleSelectSlot(date)}
                className={`border border-[#1c1917] p-2 min-h-[100px] hover:bg-[#151210] cursor-pointer relative ${isSelected ? 'bg-[#1a1512]' : 'bg-[#050202]'}`}
              >
                  <div className={`text-xs font-serif ${isToday ? 'text-yellow-500 font-bold' : 'text-stone-500'}`}>{d}</div>
                  <div className="mt-2 space-y-1">
                      {tasks.map(t => (
                          <div 
                            key={t.id} 
                            onClick={(e) => { e.stopPropagation(); handleEditTask(t); }}
                            className={`text-[9px] px-1 truncate rounded cursor-pointer hover:brightness-125 ${t.completed ? 'bg-green-950/30 text-green-700 line-through' : t.failed ? 'bg-red-950/30 text-red-700' : 'bg-yellow-950/30 text-yellow-600'}`}
                          >
                              {getTaskDisplayTitle(t)}
                          </div>
                      ))}
                  </div>
                  {isSelected && <div className="absolute inset-0 border-2 border-yellow-800 pointer-events-none"></div>}
              </div>
          );
      }

      return (
          <div className="grid grid-cols-7 gap-0 h-full overflow-y-auto">
              {DAYS.map(d => <div key={d} className="text-center text-[10px] uppercase text-stone-600 py-2 bg-[#0c0a09] border-b border-[#292524]">{d}</div>)}
              {grid}
          </div>
      );
  };

  const renderDayView = () => {
      const d = new Date(currentDate);
      const dayTasks = state.tasks.filter(t => new Date(t.deadline).toDateString() === d.toDateString());

      return (
          <div className="flex h-full overflow-hidden flex-col">
              <div className="flex border-b border-[#292524] bg-[#0c0a09]">
                  <div className="w-16 border-r border-[#292524]"></div>
                  <div className={`flex-1 text-center py-2 ${d.toDateString() === new Date().toDateString() ? 'bg-yellow-950/10' : ''}`}>
                      <div className="text-xs text-stone-500 uppercase">{DAYS[d.getDay()]}</div>
                      <div className={`text-lg font-serif ${d.toDateString() === new Date().toDateString() ? 'text-yellow-500 font-bold' : 'text-stone-300'}`}>{d.getDate()}</div>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto flex custom-scrollbar relative">
                  <div className="w-16 bg-[#0c0a09] border-r border-[#292524] shrink-0">
                      {HOURS.map(h => (
                          <div key={h} className="h-32 text-[10px] text-stone-600 text-right pr-2 pt-1 border-b border-[#1c1917] bg-[#0c0a09]">{h}:00</div>
                      ))}
                  </div>
                  <div className="flex-1 border-r border-[#1c1917] relative bg-[#050202]">
                      {HOURS.map(h => (
                          <div 
                            key={h} 
                            onClick={() => handleSelectSlot(d, h)}
                            className="h-32 border-b border-[#1c1917] hover:bg-[#151210] cursor-pointer"
                          ></div>
                      ))}
                      {dayTasks.map(t => {
                          const date = new Date(t.startTime); // Use START time for visual pos
                          const startHour = date.getHours() + (date.getMinutes()/60);
                          const durationHrs = t.estimatedDuration / 60;
                          const top = startHour * 128; 
                          const height = Math.max(32, durationHrs * 128);
                          
                          return (
                              <div 
                                key={t.id}
                                onClick={(e) => { e.stopPropagation(); handleEditTask(t); }} 
                                className={`absolute left-2 right-2 rounded border overflow-hidden p-2 text-xs flex flex-col cursor-pointer pointer-events-auto shadow-md hover:scale-[1.01] transition-transform
                                    ${t.completed ? 'bg-green-950/50 border-green-800 text-green-300 opacity-60' : 
                                      t.failed ? 'bg-red-950/50 border-red-800 text-red-300' : 
                                      'bg-yellow-950/50 border-yellow-800 text-yellow-100 hover:z-10'}`}
                                style={{ top: `${top}px`, height: `${height}px` }}
                              >
                                  <div className="font-bold flex items-center justify-between">
                                      <span className="truncate">{getTaskDisplayTitle(t)}</span>
                                      {t.parentId && <LinkIcon size={10} className="opacity-50" />}
                                  </div>
                                  <span className="text-[10px] opacity-70 font-mono mt-1">
                                      {new Date(t.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(t.deadline).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                  </span>
                              </div>
                          )
                      })}
                  </div>
              </div>
          </div>
      );
  }

  const renderWeekView = () => {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const weekDays = Array.from({length: 7}, (_, i) => {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          return d;
      });

      return (
          <div className="flex h-full overflow-hidden flex-col">
              <div className="flex border-b border-[#292524] bg-[#0c0a09]">
                  <div className="w-12 border-r border-[#292524]"></div>
                  {weekDays.map(d => (
                      <div key={d.toISOString()} className={`flex-1 text-center py-2 border-r border-[#292524] ${d.toDateString() === new Date().toDateString() ? 'bg-yellow-950/10' : ''}`}>
                          <div className="text-[10px] text-stone-500 uppercase">{DAYS[d.getDay()]}</div>
                          <div className={`text-sm font-serif ${d.toDateString() === new Date().toDateString() ? 'text-yellow-500 font-bold' : 'text-stone-300'}`}>{d.getDate()}</div>
                      </div>
                  ))}
              </div>
              <div className="flex-1 overflow-y-auto flex custom-scrollbar relative">
                  <div className="w-12 bg-[#0c0a09] border-r border-[#292524] shrink-0">
                      {HOURS.map(h => (
                          <div key={h} className="h-20 text-[9px] text-stone-600 text-right pr-2 pt-1 border-b border-[#1c1917] bg-[#0c0a09]">{h}:00</div>
                      ))}
                  </div>
                  {weekDays.map(d => {
                      const dayTasks = state.tasks.filter(t => new Date(t.deadline).toDateString() === d.toDateString());
                      return (
                          <div key={d.toISOString()} className="flex-1 border-r border-[#1c1917] relative bg-[#050202]">
                              {HOURS.map(h => (
                                  <div 
                                    key={h} 
                                    onClick={() => handleSelectSlot(d, h)}
                                    className="h-20 border-b border-[#1c1917] hover:bg-[#151210] cursor-pointer"
                                  ></div>
                              ))}
                              {dayTasks.map(t => {
                                  const date = new Date(t.startTime);
                                  const startHour = date.getHours() + (date.getMinutes()/60);
                                  const durationHrs = t.estimatedDuration / 60;
                                  const top = startHour * 80;
                                  const height = Math.max(20, durationHrs * 80);
                                  
                                  return (
                                      <div 
                                        key={t.id} 
                                        onClick={(e) => { e.stopPropagation(); handleEditTask(t); }}
                                        className={`absolute left-1 right-1 rounded border overflow-hidden p-1 text-[10px] flex flex-col cursor-pointer pointer-events-auto hover:scale-[1.02] transition-transform
                                            ${t.completed ? 'bg-green-950/50 border-green-800 text-green-300 opacity-60' : 
                                              t.failed ? 'bg-red-950/50 border-red-800 text-red-300' : 
                                              'bg-yellow-950/50 border-yellow-800 text-yellow-100 hover:z-10'}`}
                                        style={{ top: `${top}px`, height: `${height}px` }}
                                      >
                                          <span className="font-bold truncate">{getTaskDisplayTitle(t)}</span>
                                      </div>
                                  )
                              })}
                          </div>
                      )
                  })}
              </div>
          </div>
      );
  };

  const renderYearView = () => {
      return (
          <div className="grid grid-cols-4 gap-4 p-4 overflow-y-auto h-full bg-[#050202]">
              {MONTHS.map((m, i) => (
                  <div key={m} className="border border-[#292524] bg-[#0c0a09] p-2 hover:border-stone-500 cursor-pointer" onClick={() => { setCurrentDate(new Date(currentDate.getFullYear(), i, 1)); setViewMode('MONTH'); }}>
                      <div className="text-center font-serif text-stone-400 mb-2 font-bold">{m}</div>
                      <div className="grid grid-cols-7 gap-0.5">
                          {Array.from({length: new Date(currentDate.getFullYear(), i+1, 0).getDate()}).map((_, d) => {
                              const dDate = new Date(currentDate.getFullYear(), i, d+1);
                              const count = state.tasks.filter(t => new Date(t.deadline).toDateString() === dDate.toDateString()).length;
                              let bg = 'bg-[#1c1917]';
                              if (count > 0) bg = 'bg-yellow-900/40';
                              if (count > 2) bg = 'bg-yellow-700/60';
                              return <div key={d} className={`w-full h-2 ${bg}`}></div>
                          })}
                      </div>
                  </div>
              ))}
          </div>
      );
  };

  const isEditing = !!editingTaskId;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <div className="relative w-full max-w-[95vw] h-[90vh] bg-[#0c0a09] border border-[#44403c] flex flex-col md:flex-row shadow-2xl overflow-hidden">
        
        {!isRitual && (
            <button onClick={toggleGrimoire} className="absolute top-4 right-4 text-stone-600 hover:text-stone-300 z-50 transition-colors">
                <X size={24} />
            </button>
        )}

        {/* LEFT PANEL: CALENDAR VISUALIZER */}
        <div className="w-full md:w-3/4 flex flex-col border-r border-[#292524] bg-[#050202]">
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#292524] bg-[#0c0a09]">
                <div className="flex items-center gap-4">
                    <div className="flex border border-[#292524] rounded overflow-hidden">
                        <button onClick={() => handleNav(-1)} className="p-2 hover:bg-[#1c1917] text-stone-400"><ChevronLeft size={18}/></button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 text-xs font-bold text-stone-300 hover:bg-[#1c1917]">TODAY</button>
                        <button onClick={() => handleNav(1)} className="p-2 hover:bg-[#1c1917] text-stone-400"><ChevronRight size={18}/></button>
                    </div>
                    <h2 className="font-serif text-xl text-stone-200 tracking-widest uppercase">
                        {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowRealNames(!showRealNames)} 
                        className={`flex items-center gap-2 px-3 py-2 border rounded transition-all ${showRealNames ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-red-900/30 border-red-500 text-red-400'}`}
                    >
                        {showRealNames ? <Eye size={16} /> : <Skull size={16} />}
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">{showRealNames ? "True Sight" : "Void Sight"}</span>
                    </button>

                    <div className="flex border border-[#292524] rounded overflow-hidden">
                        <button onClick={() => setViewMode('DAY')} className={`px-3 py-2 text-xs font-bold ${viewMode === 'DAY' ? 'bg-yellow-900/30 text-yellow-500' : 'text-stone-500 hover:bg-[#1c1917]'}`}>DAY</button>
                        <button onClick={() => setViewMode('WEEK')} className={`px-3 py-2 text-xs font-bold ${viewMode === 'WEEK' ? 'bg-yellow-900/30 text-yellow-500' : 'text-stone-500 hover:bg-[#1c1917]'}`}>WEEK</button>
                        <button onClick={() => setViewMode('MONTH')} className={`px-3 py-2 text-xs font-bold ${viewMode === 'MONTH' ? 'bg-yellow-900/30 text-yellow-500' : 'text-stone-500 hover:bg-[#1c1917]'}`}>MONTH</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {viewMode === 'MONTH' && renderMonthView()}
                {viewMode === 'WEEK' && renderWeekView()}
                {viewMode === 'DAY' && renderDayView()} 
                {viewMode === 'YEAR' && renderYearView()}
            </div>
        </div>

        {/* RIGHT PANEL: SUMMONING FORM */}
        <div className={`w-full md:w-1/4 bg-[#0c0a09] flex flex-col relative z-20 shadow-[-10px_0_20px_rgba(0,0,0,0.5)] transition-colors duration-500 ${isEditing ? 'border-l-2 border-blue-900' : ''}`}>
            <div className={`h-16 flex items-center justify-center border-b border-[#292524] ${isEditing ? 'bg-blue-950/20' : 'bg-[#0c0a09]'}`}>
                <div className={`flex items-center gap-2 font-serif text-lg tracking-[0.2em] font-bold ${isEditing ? 'text-blue-400' : 'text-yellow-700'}`}>
                    {isEditing ? <Edit3 size={16} /> : <Scroll size={16} className="rotate-45" />}
                    <span>{isEditing ? 'EDITING FATE' : 'SUMMONING'}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 p-6 overflow-y-auto space-y-5 custom-scrollbar">
                
                {/* Date/Time Readout */}
                <div className={`bg-[#151210] border p-4 text-center ${isEditing ? 'border-blue-900/30' : 'border-[#292524]'}`}>
                    <div className="text-xs text-stone-500 uppercase tracking-widest mb-2 font-bold">{DAYS[selectedDate.getDay()]}, {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]}</div>
                    
                    <div className="flex items-center justify-center gap-2">
                        <div className="flex flex-col items-center">
                            <label className="text-[9px] text-stone-600 mb-1 uppercase">Manifestation</label>
                            <input 
                                type="time" 
                                value={startTimeStr} 
                                onChange={(e) => setStartTimeStr(e.target.value)} 
                                className="bg-black border border-[#292524] text-stone-300 font-mono text-sm p-1 w-20 text-center outline-none focus:border-stone-500"
                            />
                        </div>
                        <span className="text-stone-600 mt-4">-</span>
                        <div className="flex flex-col items-center">
                            <label className="text-[9px] text-yellow-900 mb-1 uppercase font-bold">Doom</label>
                            <input 
                                type="time" 
                                value={endTimeStr} 
                                onChange={(e) => setEndTimeStr(e.target.value)} 
                                className="bg-black border border-yellow-900/30 text-yellow-500 font-mono text-sm p-1 w-20 text-center outline-none focus:border-yellow-600"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 block">Enemy Name</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        className="w-full bg-[#151210] border-b border-[#292524] p-3 text-stone-200 focus:border-yellow-900 outline-none font-serif text-lg placeholder:text-stone-800 placeholder:italic transition-colors"
                        placeholder="e.g., The Tax Beast"
                        autoFocus={!isEditing}
                    />
                </div>

                <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 block">Tactical Notes</label>
                    <textarea 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)} 
                        className="w-full bg-[#151210] border border-[#292524] p-3 text-stone-400 focus:border-yellow-900 outline-none text-xs resize-none h-20 placeholder:text-stone-800 font-mono"
                        placeholder="Intel on the objective..."
                    />
                </div>

                <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2 block">Threat Level</label>
                    <div className="flex gap-0 border border-[#292524]">
                        {[1,2,3].map(p => (
                            <button 
                                key={p} 
                                type="button" 
                                onClick={() => setPriority(p as TaskPriority)} 
                                className={`
                                    flex-1 py-3 flex flex-col items-center justify-center gap-1 transition-all
                                    ${priority === p ? 'bg-yellow-900/20 text-yellow-500 border-x border-yellow-900/50' : 'bg-[#0c0a09] text-stone-600 hover:bg-[#151210] border-x border-transparent'}
                                `}
                            >
                                <span className="font-serif font-bold text-sm">{p === 1 ? 'I' : p === 2 ? 'II' : 'III'}</span>
                                {p === 3 && <ShieldAlert size={10} />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
                        <Users size={12} /> Minions (Subtasks)
                    </label>
                    <div className="bg-[#050202] border border-[#292524] p-0 flex-1 min-h-[100px] flex flex-col">
                        <div className="flex-1 space-y-0 p-0">
                            {subtasks.map((st, idx) => (
                                <div key={idx} className="flex justify-between items-center group text-xs text-stone-400 p-2 border-b border-[#1c1917] hover:bg-[#151210]">
                                    <div className="flex flex-col">
                                        <span className="font-mono truncate">{st.title}</span>
                                        {st.deadline && (
                                            <span className="text-[9px] text-stone-600 flex items-center gap-1">
                                                <Hourglass size={8} /> Due: {new Date(st.deadline).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </span>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setSubtasks(subtasks.filter((_,i)=>i!==idx))} className="text-stone-700 hover:text-red-500"><Trash2 size={12} /></button>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-[#292524] bg-[#151210]">
                            <div className="flex gap-0">
                                <input 
                                    type="text" 
                                    value={newSubtask} 
                                    onChange={e => setNewSubtask(e.target.value)} 
                                    onKeyDown={e => e.key === 'Enter' && handleAddSubtask(e)}
                                    className="flex-1 bg-transparent text-xs text-stone-300 outline-none placeholder:text-stone-700 p-2"
                                    placeholder="Add minion..."
                                />
                                <input 
                                    type="time"
                                    value={newSubtaskDeadlineStr}
                                    onChange={e => setNewSubtaskDeadlineStr(e.target.value)}
                                    className="w-16 bg-black border-l border-[#292524] text-[10px] text-stone-500 text-center outline-none"
                                    title="Optional specific deadline"
                                />
                                <button type="button" onClick={handleAddSubtask} className="text-stone-500 hover:text-stone-200 px-3 border-l border-[#292524]"><Plus size={14} /></button>
                            </div>
                        </div>
                    </div>
                </div>

            </form>

            <div className={`p-4 border-t ${isEditing ? 'border-blue-900/30 bg-blue-950/10' : 'border-[#292524] bg-[#0c0a09]'}`}>
                {isEditing ? (
                    <div className="flex gap-2">
                         <button 
                            onClick={handleSubmit} 
                            className="flex-1 bg-blue-900/30 text-blue-300 border border-blue-800 py-4 font-serif font-bold tracking-[0.2em] uppercase hover:bg-blue-900/50 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={16} /> Rewrite Fate
                        </button>
                         <button 
                            onClick={resetForm} 
                            className="px-4 bg-stone-900 text-stone-400 border border-stone-700 font-bold hover:bg-stone-800"
                            title="Cancel Edit"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={handleSubmit} 
                        className="w-full bg-[#3f2818] text-[#d6d3d1] border border-[#5c3a22] py-4 font-serif font-bold tracking-[0.2em] uppercase hover:bg-[#5c3a22] hover:text-white transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                    >
                        Manifest Enemy
                    </button>
                )}
                
                {isRitual && !isEditing && (
                     <button type="button" onClick={completeRitual} className="w-full mt-2 text-[10px] text-indigo-400 uppercase tracking-widest hover:text-indigo-300">
                        Seal Pact (End Ritual)
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
