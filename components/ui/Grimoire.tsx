
import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { TaskPriority, Task, AlertType, SubtaskDraft, TaskTemplate } from '../../types';
import { X, ChevronLeft, ChevronRight, ShieldAlert, Users, Scroll, Plus, Trash2, Eye, EyeOff, Skull, Link as LinkIcon, Pen, Save, Hourglass, Network, BookOpen, GripVertical, AlignLeft, CalendarDays, RefreshCw, Flame, ArrowRightCircle, Map, Telescope, Crown, CheckSquare, Clock, Star, Bookmark, Book, RotateCcw, Check, Sparkles, MousePointerClick, Square, Swords } from 'lucide-react';

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({length: 24}, (_, i) => i);

type ViewMode = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

// Extended draft type for local state to handle completion toggling
type LocalSubtaskState = SubtaskDraft & { id?: string; completed?: boolean };

interface TaskCardProps {
    task: Task;
    style?: React.CSSProperties;
    onClick: (e: any) => void;
    onDragStart: (e: any) => void;
    showFantasy: boolean;
}

// Helper for formatting time
const formatTimeLeft = (deadline: number) => {
    const now = Date.now();
    const diff = deadline - now;
    const isOverdue = diff < 0;
    const absDiff = Math.abs(diff);
    
    const h = Math.floor(absDiff / 3600000);
    const m = Math.floor((absDiff % 3600000) / 60000);
    const s = Math.floor((absDiff % 60000) / 1000);
    
    return {
        text: `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`,
        isOverdue
    };
};

// --- MOVED OUTSIDE FOR PERFORMANCE AND TYPE SAFETY ---
const TaskCard: React.FC<TaskCardProps> = ({ task, style, onClick, onDragStart, showFantasy }) => {
    const { state } = useGame();
    const [timeLeft, setTimeLeft] = useState(formatTimeLeft(task.deadline));
    const enemy = state.enemies.find(e => e.taskId === task.id && !e.subtaskId);
    const displayName = showFantasy ? (enemy ? enemy.title : task.title) : task.title;
    
    let borderClass = "border-stone-700";
    let bgClass = "bg-stone-800/90 text-stone-200";
    
    if (task.priority === TaskPriority.HIGH) { borderClass = "border-red-600"; bgClass = "bg-red-950/90 text-red-100"; }
    else if (task.priority === TaskPriority.MEDIUM) { borderClass = "border-yellow-600"; bgClass = "bg-yellow-950/90 text-yellow-100"; }

    let icon = null;
    if (task.foresightBonus && task.foresightBonus >= 0.5) { icon = <Crown size={10} className="text-yellow-400" />; } 
    else if (task.foresightBonus && task.foresightBonus >= 0.25) { icon = <Telescope size={10} className="text-purple-400" />; }
    else if (task.foresightBonus && task.foresightBonus >= 0.1) { icon = <Star size={10} className="text-blue-400" />; }
    
    if (task.completed) { bgClass = "bg-green-950/50 text-green-300 opacity-60 border-green-800"; }
    if (task.failed) { bgClass = "bg-red-950/90 text-red-100 border-red-500 animate-pulse-slow"; }

    const subtaskCount = task.subtasks?.length || 0;
    const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;

    // Timer logic
    useEffect(() => {
        if (task.completed || task.failed) return;
        const interval = setInterval(() => {
            setTimeLeft(formatTimeLeft(task.deadline));
        }, 1000);
        return () => clearInterval(interval);
    }, [task.deadline, task.completed, task.failed]);

    return (
        <div 
          draggable 
          onDragStart={onDragStart}
          onClick={onClick}
          className={`absolute rounded border overflow-hidden p-1.5 text-xs flex flex-col cursor-grab active:cursor-grabbing pointer-events-auto shadow-md hover:scale-[1.02] transition-transform z-10 ${bgClass} ${borderClass}`}
          style={{ ...style, borderLeftWidth: '4px', borderStyle: task.parentId ? 'dashed' : 'solid' }}
          title={displayName}
        >
            <div className="font-bold flex items-center justify-between gap-1 leading-tight">
                <span className="truncate">{displayName}</span>
                {icon}
            </div>
            
            {/* Countdown Timer */}
            {!task.completed && !task.failed && (
                <div className={`mt-1 font-mono text-[10px] flex items-center gap-1 ${timeLeft.isOverdue ? 'text-red-500 animate-pulse font-bold' : 'text-stone-400'}`}>
                    <Clock size={8} />
                    {timeLeft.isOverdue ? '-' : ''}{timeLeft.text}
                </div>
            )}
            
            {subtaskCount > 0 && (
                <div className="mt-auto flex items-center gap-1 text-[9px] opacity-80 pt-1">
                    <Network size={10} />
                    <span>{completedSubtasks}/{subtaskCount}</span>
                    <div className="h-1 flex-1 bg-black/30 rounded-full overflow-hidden">
                        <div className="h-full bg-current" style={{ width: `${(completedSubtasks/subtaskCount)*100}%` }}></div>
                    </div>
                </div>
            )}

            {task.parentId && (
                <div className="absolute top-0 right-0 p-0.5 bg-blue-900 text-blue-200 rounded-bl">
                    <LinkIcon size={8}/>
                </div>
            )}
        </div>
    )
};

export const Grimoire: React.FC = () => {
  // @ts-ignore
  const { state, toggleGrimoire, addTask, editTask, moveTask, deleteTask, completeTask, completeSubtask, resolveFailedTask, saveTemplate, deleteTemplate } = useGame();
  
  // Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('WEEK');
  
  // View Options
  const [showFantasy, setShowFantasy] = useState(true);
  
  // Template Manager View
  const [showTemplates, setShowTemplates] = useState(false);

  // Drag State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Form State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null); 
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [startTimeStr, setStartTimeStr] = useState("09:00");
  const [endTimeStr, setEndTimeStr] = useState("10:00");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.LOW);
  
  // Updated state type to handle IDs and Completion
  const [subtasks, setSubtasks] = useState<LocalSubtaskState[]>([]);
  
  const [newSubtask, setNewSubtask] = useState('');
  const [parentId, setParentId] = useState<string>(''); 
  const [saveStatus, setSaveStatus] = useState<string>(''); // For feedback
  
  // Failed Task Resolution State
  const [resolvingTaskId, setResolvingTaskId] = useState<string | null>(null);

  const isEditing = !!editingTaskId;
  const isResolving = !!resolvingTaskId;

  // Clear save feedback after delay
  useEffect(() => {
      if(saveStatus) {
          const t = setTimeout(() => setSaveStatus(''), 3000);
          return () => clearTimeout(t);
      }
  }, [saveStatus]);

  // --- ACTIONS & HANDLERS ---

  const handleNav = (direction: number) => {
      const d = new Date(currentDate);
      if (viewMode === 'DAY') d.setDate(d.getDate() + direction);
      if (viewMode === 'WEEK') d.setDate(d.getDate() + (direction * 7));
      if (viewMode === 'MONTH') d.setMonth(d.getMonth() + direction);
      if (viewMode === 'YEAR') d.setFullYear(d.getFullYear() + direction);
      setCurrentDate(d);
  };

  const getHeaderTitle = () => {
      if (viewMode === 'DAY') return currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (viewMode === 'WEEK') {
          const start = new Date(currentDate);
          start.setDate(currentDate.getDate() - currentDate.getDay());
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          if (start.getFullYear() === end.getFullYear()) {
             return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`;
          }
          return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
      if (viewMode === 'MONTH') return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      if (viewMode === 'YEAR') return currentDate.getFullYear().toString();
      return "";
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
          toggleGrimoire();
      }
  };

  const handleSelectSlot = (date: Date, hour?: number) => {
      // IMPORTANT: Ensure we exit template mode so the user sees the form they are populating
      setShowTemplates(false);
      
      setEditingTaskId(null);
      const d = new Date(date);
      if (hour !== undefined) {
          d.setHours(hour, 0, 0, 0);
          const startH = hour.toString().padStart(2, '0');
          const endH = (hour + 1).toString().padStart(2, '0');
          setStartTimeStr(`${startH}:00`);
          setEndTimeStr(`${endH}:00`);
      } else {
          setStartTimeStr("09:00");
          setEndTimeStr("10:00");
      }
      setSelectedDate(d);
      
      // Reset form fields
      setTitle("");
      setNotes("");
      setSubtasks([]);
      setParentId("");
      setPriority(TaskPriority.LOW);
  };

  const handleClearForm = () => {
      setEditingTaskId(null);
      setTitle("");
      setNotes("");
      setSubtasks([]);
      setParentId("");
      setPriority(TaskPriority.LOW);
      setSaveStatus("Form Reset");
  };

  const handleTaskClick = (task: Task) => {
      setShowTemplates(false); // Ensure form is visible
      setEditingTaskId(task.id);
      setTitle(task.title);
      setNotes(task.description || "");
      setPriority(task.priority);
      
      // FIX: Preserve ID and Completed status when loading into form
      setSubtasks((task.subtasks || []).map(s => ({ 
          id: s.id, 
          title: s.title, 
          completed: s.completed,
          startTime: s.startTime, 
          deadline: s.deadline 
      })));
      
      const d = new Date(task.startTime);
      setSelectedDate(d);
      
      const sh = d.getHours().toString().padStart(2, '0');
      const sm = d.getMinutes().toString().padStart(2, '0');
      setStartTimeStr(`${sh}:${sm}`);
      
      const ed = new Date(task.deadline);
      const eh = ed.getHours().toString().padStart(2, '0');
      const em = ed.getMinutes().toString().padStart(2, '0');
      setEndTimeStr(`${eh}:${em}`);
      
      setParentId(task.parentId || "");
  };

  const handleAddSubtask = (e: any) => {
      e.preventDefault();
      if (newSubtask.trim()) {
          setSubtasks([...subtasks, { title: newSubtask, completed: false }]);
          setNewSubtask("");
      }
  };

  const handleToggleSubtask = (index: number) => {
      const s = subtasks[index];
      // If we are editing a real task and this subtask has an ID, verify it in the backend
      if (editingTaskId && s.id && !s.completed) {
          completeSubtask(editingTaskId, s.id);
          // Optimistically update UI
          const newSubs = [...subtasks];
          newSubs[index].completed = true;
          setSubtasks(newSubs);
      } else {
          // If creating new task, just toggle locally
          const newSubs = [...subtasks];
          newSubs[index].completed = !newSubs[index].completed;
          setSubtasks(newSubs);
      }
  };

  const handleCompleteTask = () => {
      if (editingTaskId) {
          completeTask(editingTaskId);
          setEditingTaskId(null);
          setTitle("");
          setNotes("");
          setSubtasks([]);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;

      const [sh, sm] = startTimeStr.split(':').map(Number);
      const [eh, em] = endTimeStr.split(':').map(Number);
      
      const start = new Date(selectedDate);
      start.setHours(sh, sm, 0, 0);
      
      const end = new Date(selectedDate);
      end.setHours(eh, em, 0, 0);
      
      if (end <= start) {
          end.setTime(start.getTime() + 60 * 60 * 1000); 
      }

      const durationMins = (end.getTime() - start.getTime()) / 60000;

      if (editingTaskId) {
          editTask(editingTaskId, {
              title,
              description: notes,
              startTime: start.getTime(),
              deadline: end.getTime(),
              priority,
              subtasks,
              parentId: parentId || undefined
          });
      } else {
          addTask(title, start.getTime(), end.getTime(), priority, subtasks, durationMins, notes, parentId || undefined);
      }
      
      setEditingTaskId(null);
      setTitle("");
      setNotes("");
      setSubtasks([]);
      setParentId("");
  };

  const handleDeleteTask = () => {
      if (editingTaskId) {
          deleteTask(editingTaskId);
          setEditingTaskId(null);
          setTitle("");
          setNotes("");
          setSubtasks([]);
      }
  };

  const handleMergeTask = (taskId: string, oldTitle: string) => {
        resolveFailedTask(taskId, 'MERGE');
        setResolvingTaskId(null);
        handleSelectSlot(new Date());
        setTitle(`Redemption: ${oldTitle}`);
  };

  // --- TEMPLATE LOGIC ---
  const handleSaveAsTemplate = () => {
      if (!title.trim()) {
          setSaveStatus("Error: Title required");
          return;
      }
      const [sh, sm] = startTimeStr.split(':').map(Number);
      const [eh, em] = endTimeStr.split(':').map(Number);
      let duration = (eh * 60 + em) - (sh * 60 + sm);
      if (duration <= 0) duration = 60;

      try {
          // CLEAN SUBTASKS: Remove IDs and completion status when saving as template
          const cleanSubtasks = subtasks.map(s => ({
              title: s.title,
              startTime: undefined,
              deadline: undefined
          }));

          saveTemplate({
              title,
              description: notes,
              priority,
              subtasks: cleanSubtasks,
              estimatedDuration: duration
          });
          setSaveStatus("Saved to Archive");
      } catch (e) {
          setSaveStatus("Error: Failed to save");
          console.error(e);
      }
  };

  const handleLoadTemplate = (t: TaskTemplate) => {
      setTitle(t.title || "");
      setNotes(t.description || "");
      setPriority(t.priority || TaskPriority.LOW);
      
      // DEEP COPY & RESET: Load subtasks as fresh items (no IDs, no completion)
      setSubtasks(t.subtasks ? t.subtasks.map(s => ({
          title: s.title,
          completed: false,
          // We don't copy start/deadlines from templates as they are relative
      })) : []);
      
      // Calculate new end time based on template duration
      const [sh, sm] = startTimeStr.split(':').map(Number);
      const startTotal = sh * 60 + sm;
      const endTotal = startTotal + (t.estimatedDuration || 60);
      
      const newEh = Math.floor(endTotal / 60) % 24;
      const newEm = endTotal % 60;
      
      setEndTimeStr(`${newEh.toString().padStart(2,'0')}:${newEm.toString().padStart(2,'0')}`);
      setShowTemplates(false);
      setSaveStatus("Template Loaded");
  };

  const calculatePotentialBonus = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      
      const diffTime = selectedDay.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 7) return { label: 'PROPHETIC', amount: 50 };
      if (diffDays >= 3) return { label: 'STRATEGIC', amount: 25 };
      if (diffDays >= 1) return { label: 'TACTICAL', amount: 10 };
      return null;
  };

  const selectedEnemy = editingTaskId ? state.enemies.find(e => e.taskId === editingTaskId) : null;
  const foresight = calculatePotentialBonus();

  if (!state.isGrimoireOpen) return null;

  const handleDragStart = (e: React.DragEvent, task: Task) => {
      e.stopPropagation(); 
      e.dataTransfer.setData("taskId", task.id);
      setDraggedTaskId(task.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); 
      e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date, targetHour?: number) => {
      e.preventDefault();
      e.stopPropagation();
      const taskId = e.dataTransfer.getData("taskId");
      const task = state.tasks.find(t => t.id === taskId);
      if(!task) return;

      const newStart = new Date(targetDate);
      if (targetHour !== undefined) {
          newStart.setHours(targetHour, 0, 0, 0);
      } else {
          const originalStart = new Date(task.startTime);
          newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
      }
      moveTask(taskId, newStart.getTime());
  };

  const renderDayView = (date: Date) => {
      const dayTasks = state.tasks.filter(t => new Date(t.startTime).toDateString() === date.toDateString());
      const sorted = [...dayTasks].sort((a,b) => a.startTime - b.startTime);
      const columns: Task[][] = [];
      sorted.forEach(task => {
          let placed = false;
          for(let i=0; i<columns.length; i++) {
              if (task.startTime >= columns[i][columns[i].length-1].deadline) {
                  columns[i].push(task);
                  placed = true;
                  break;
              }
          }
          if (!placed) columns.push([task]);
      });

      const now = new Date();
      const isToday = now.toDateString() === date.toDateString();
      const nowTop = isToday ? (now.getHours() + now.getMinutes()/60) * 80 : -1;

      return (
          <div className="flex h-full overflow-hidden relative bg-[#050202]">
              <div className="w-12 bg-[#0c0a09] border-r border-[#292524] shrink-0 overflow-hidden">
                  {HOURS.map(h => (
                      <div key={h} className="h-20 text-[10px] text-stone-600 text-right pr-2 pt-1 border-b border-[#1c1917]">{h}:00</div>
                  ))}
              </div>
              
              <div className="flex-1 relative overflow-y-auto custom-scrollbar">
                  <div className="absolute inset-0 w-full h-[1920px]"> 
                    {HOURS.map(h => (
                        <div key={h} onClick={() => handleSelectSlot(date, h)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, date, h)} className="h-20 border-b border-[#1c1917] hover:bg-[#151210] w-full cursor-pointer group">
                            <div className="hidden group-hover:flex items-center justify-center h-full opacity-50">
                                <Plus size={24} className="text-stone-600" />
                            </div>
                        </div>
                    ))}
                    
                    {isToday && (
                        <div className="absolute w-full border-t-2 border-red-500 z-20 pointer-events-none flex items-center" style={{ top: `${nowTop}px` }}>
                            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1"></div>
                        </div>
                    )}

                    {sorted.map(t => {
                        const d = new Date(t.startTime);
                        const startH = d.getHours() + (d.getMinutes()/60);
                        const durHrs = (t.deadline - t.startTime) / 3600000;
                        const top = startH * 80;
                        const height = Math.max(20, durHrs * 80);
                        
                        let colIndex = 0;
                        for(let c=0; c<columns.length; c++) { if(columns[c].includes(t)) { colIndex = c; break; } }
                        const widthPct = 100 / columns.length;
                        const leftPct = colIndex * widthPct;

                        return <TaskCard key={t.id} task={t} style={{ top: `${top}px`, height: `${height}px`, left: `${leftPct}%`, width: `${widthPct}%` }} onClick={(e) => {e.stopPropagation(); handleTaskClick(t)}} onDragStart={(e) => handleDragStart(e, t)} showFantasy={showFantasy} />
                    })}
                  </div>
              </div>
          </div>
      );
  };

  const renderWeekView = () => {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const weekDays = Array.from({length: 7}, (_, i) => {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          return d;
      });

      return (
          <div className="flex flex-col h-full bg-[#050202]">
              <div className="flex border-b border-[#292524] bg-[#0c0a09]">
                  <div className="w-10 border-r border-[#292524]"></div>
                  {weekDays.map((d, i) => (
                      <div key={i} className={`flex-1 text-center py-1 border-r border-[#292524] last:border-0 ${d.toDateString() === new Date().toDateString() ? 'bg-yellow-950/20' : ''}`}>
                          <div className="text-[10px] text-stone-500 uppercase">{DAYS[d.getDay()]}</div>
                          <div className={`text-sm font-bold ${d.toDateString() === new Date().toDateString() ? 'text-yellow-500' : 'text-stone-300'}`}>{d.getDate()}</div>
                      </div>
                  ))}
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar flex relative">
                  <div className="w-10 bg-[#0c0a09] border-r border-[#292524] shrink-0">
                      {HOURS.map(h => (<div key={h} className="h-16 text-[9px] text-stone-600 text-right pr-1 pt-1 border-b border-[#1c1917]">{h}</div>))}
                  </div>
                  {weekDays.map((d, colIndex) => {
                      const dayTasks = state.tasks.filter(t => new Date(t.startTime).toDateString() === d.toDateString());
                      return (
                          <div key={colIndex} className="flex-1 border-r border-[#1c1917] relative min-w-[80px]">
                              {HOURS.map(h => (
                                  <div key={h} onClick={() => handleSelectSlot(d, h)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, d, h)} className="h-16 border-b border-[#1c1917] hover:bg-[#151210] cursor-pointer"></div>
                              ))}
                              {dayTasks.map(t => {
                                  const date = new Date(t.startTime);
                                  const startH = date.getHours() + (date.getMinutes()/60);
                                  const durHrs = (t.deadline - t.startTime) / 3600000;
                                  return <TaskCard key={t.id} task={t} style={{ top: `${startH * 64}px`, height: `${Math.max(24, durHrs * 64)}px`, width: '95%', left: '2.5%' }} onClick={(e) => { e.stopPropagation(); handleTaskClick(t); }} onDragStart={(e) => handleDragStart(e, t)} showFantasy={showFantasy} />
                              })}
                          </div>
                      )
                  })}
              </div>
          </div>
      )
  };

  const renderMonthView = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const cells = [];
      for(let i=0; i<firstDay; i++) cells.push(null);
      for(let i=1; i<=daysInMonth; i++) cells.push(new Date(year, month, i));

      return (
          <div className="h-full flex flex-col bg-[#050202]">
              <div className="grid grid-cols-7 border-b border-[#292524] bg-[#0c0a09]">
                  {DAYS.map(d => <div key={d} className="text-center py-2 text-xs text-stone-500 font-bold uppercase">{d}</div>)}
              </div>
              <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
                  {cells.map((date, i) => {
                      if (!date) return <div key={i} className="border border-[#1c1917] bg-[#0a0a0a]"></div>;
                      const dayTasks = state.tasks.filter(t => new Date(t.startTime).toDateString() === date.toDateString());
                      const isToday = date.toDateString() === new Date().toDateString();
                      return (
                          <div key={i} onClick={() => handleSelectSlot(date)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, date)} className={`border border-[#1c1917] p-1 flex flex-col hover:bg-[#151210] cursor-pointer min-h-[80px] ${isToday ? 'bg-yellow-950/10' : ''}`}>
                              <div className={`text-right text-xs font-bold mb-1 ${isToday ? 'text-yellow-500' : 'text-stone-600'}`}>{date.getDate()}</div>
                              <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                                  {dayTasks.map(t => (
                                      <div key={t.id} draggable onDragStart={(e) => handleDragStart(e, t)} onClick={(e) => {e.stopPropagation(); handleTaskClick(t)}} className={`text-[9px] truncate px-1 rounded border ${t.failed ? 'bg-red-900/50 border-red-800 text-red-200' : 'bg-stone-800 border-stone-700 text-stone-300'}`}>
                                          {showFantasy ? (state.enemies.find(e=>e.taskId===t.id)?.title || t.title) : t.title}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )
                  })}
              </div>
          </div>
      )
  };

  const renderYearView = () => {
      const year = currentDate.getFullYear();
      return (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 p-4 overflow-y-auto h-full bg-[#050202]">
              {MONTHS.map((m, monthIndex) => {
                  const monthTasks = state.tasks.filter(t => {
                      const d = new Date(t.startTime);
                      return d.getFullYear() === year && d.getMonth() === monthIndex;
                  });
                  const prioritySum = monthTasks.reduce((acc, t) => acc + t.priority, 0);
                  const intensity = Math.min(1, prioritySum / 30);
                  const bgStyle = { backgroundColor: `rgba(127, 29, 29, ${intensity * 0.5})` };

                  return (
                      <div key={m} onClick={() => { setCurrentDate(new Date(year, monthIndex, 1)); setViewMode('MONTH'); }} className="border border-[#292524] bg-[#0c0a09] p-3 hover:border-yellow-700 cursor-pointer flex flex-col h-32 relative overflow-hidden group transition-all" style={bgStyle}>
                          <div className="text-sm font-bold text-stone-400 font-serif uppercase z-10">{m}</div>
                          <div className="text-[10px] text-stone-600 z-10">{monthTasks.length} Enemies</div>
                          <div className="absolute inset-0 flex flex-wrap content-end p-1 gap-0.5 opacity-30">
                              {monthTasks.map(t => <div key={t.id} className={`w-2 h-2 rounded-full ${t.failed ? 'bg-red-500' : t.completed ? 'bg-green-500' : 'bg-yellow-500'}`}></div>)}
                          </div>
                      </div>
                  )
              })}
          </div>
      )
  };

  const renderRightPanel = () => {
      if (isResolving) {
          const task = state.tasks.find(t => t.id === resolvingTaskId);
          return (
              <div className="h-full flex flex-col p-6 bg-red-950/20 border-l border-red-900/50">
                  <div className="text-center mb-6">
                      <Skull size={48} className="text-red-600 mx-auto mb-2 animate-pulse" />
                      <h3 className="text-xl font-serif text-red-500 tracking-widest font-bold uppercase">Enemy Unvanquished</h3>
                      <p className="text-stone-400 text-sm mt-2 italic">"{task?.title}" haunts the timeline.</p>
                  </div>
                  <div className="space-y-4">
                      <button onClick={() => task && resolveFailedTask(task.id, 'RESCHEDULE', Date.now())} className="w-full bg-[#1c1917] border border-stone-600 p-4 hover:border-yellow-500 text-left group">
                          <div className="flex items-center gap-3 text-yellow-600 font-bold mb-1"><RefreshCw size={20} /> RESCHEDULE</div>
                          <p className="text-xs text-stone-500">Move battle to now. Enemy remains.</p>
                      </button>
                      <button onClick={() => task && handleMergeTask(task.id, task.title)} className="w-full bg-[#1c1917] border border-stone-600 p-4 hover:border-purple-500 text-left group">
                          <div className="flex items-center gap-3 text-purple-500 font-bold mb-1"><Flame size={20} /> FUSION</div>
                          <p className="text-xs text-stone-500">Consume failure to fuel a new task.</p>
                      </button>
                  </div>
                  <button onClick={() => setResolvingTaskId(null)} className="mt-auto w-full py-2 border-t border-stone-800 text-stone-500">Close</button>
              </div>
          )
      }

      return (
          <>
            <div className="h-14 border-b border-[#292524] flex items-center justify-between px-4 relative bg-[#0c0a09]">
                <span className={`font-serif tracking-widest font-bold ${isEditing ? 'text-blue-400' : 'text-yellow-700'}`}>{isEditing ? 'EDITING FATE' : 'SUMMONING'}</span>
                
                <div className="flex gap-2">
                    {isEditing && (
                        <button onClick={handleDeleteTask} className="text-red-500 hover:text-red-400 bg-red-950/30 p-2 rounded-full border border-red-900" title="Banish Enemy (Delete)">
                            <Trash2 size={16} />
                        </button>
                    )}
                    {/* TOGGLE: The Bookmark acts as the switch between Form and List */}
                    <button 
                        onClick={() => setShowTemplates(!showTemplates)} 
                        className={`p-2 rounded-full border transition-all relative ${showTemplates ? 'bg-purple-900 text-white border-purple-500' : 'bg-stone-900 text-stone-400 border-stone-700'}`} 
                        title="Ritual Scrolls (Templates)"
                    >
                        <Bookmark size={16} />
                        {saveStatus && !showTemplates && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                        )}
                        {/* Dot indicator if templates exist */}
                        {state.templates?.length > 0 && !showTemplates && (
                            <span className="absolute top-0 right-0 w-2 h-2 bg-purple-500 rounded-full border border-black"></span>
                        )}
                    </button>
                </div>
            </div>
            
            {showTemplates ? (
                <div className="flex-1 p-4 overflow-y-auto bg-[#0a0a0a] space-y-4 custom-scrollbar">
                    {/* Explicit Return Button for better UX */}
                    <button onClick={() => setShowTemplates(false)} className="w-full py-3 bg-stone-900 border border-stone-700 text-stone-300 font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors">
                        <Plus size={16} /> Create New Ritual
                    </button>

                    <div className="flex items-center gap-2 text-stone-500 uppercase font-bold text-xs tracking-widest border-b border-stone-800 pb-2 mt-4">
                        <Book size={14} /> Ritual Archives ({state.templates?.length || 0})
                    </div>
                    {(!state.templates || state.templates.length === 0) && (
                        <p className="text-stone-600 text-xs text-center py-8 italic">No scrolls inscribed yet.<br/>Create a task and click the save icon.</p>
                    )}
                    {state.templates?.map(t => (
                        <div key={t.id} className="bg-[#151210] border border-stone-700 p-3 hover:border-yellow-600 transition-colors group relative flex flex-col gap-2">
                            <div className="flex-1">
                                <div className="font-serif font-bold text-stone-300 text-sm mb-1 group-hover:text-yellow-500">{t.title}</div>
                                <div className="text-[10px] text-stone-500 flex gap-2">
                                    <span>{t.estimatedDuration}m</span>
                                    <span>•</span>
                                    <span className={t.priority === 3 ? 'text-red-500' : t.priority === 2 ? 'text-yellow-600' : 'text-stone-600'}>
                                        Priority {t.priority === 3 ? 'III' : t.priority === 2 ? 'II' : 'I'}
                                    </span>
                                </div>
                                {t.subtasks && t.subtasks.length > 0 && (
                                    <div className="mt-1 text-[10px] text-stone-600">
                                        {t.subtasks.length} subtasks
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex gap-2 mt-1">
                                <button 
                                    onClick={() => handleLoadTemplate(t)} 
                                    className="flex-1 py-1.5 bg-purple-900/30 border border-purple-800/50 text-purple-300 text-[10px] uppercase font-bold hover:bg-purple-900/50 transition-colors flex items-center justify-center gap-1"
                                >
                                    <Sparkles size={12} /> Summon
                                </button>
                                <button 
                                    onClick={(e) => {e.stopPropagation(); deleteTemplate(t.id)}} 
                                    className="px-2 py-1.5 bg-red-950/20 border border-red-900/30 text-red-500 text-[10px] hover:bg-red-900/40"
                                    title="Burn Scroll"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
                    {selectedEnemy && (
                        <div className="mb-4 bg-[#151210] border border-stone-800 p-3">
                            <h4 className="text-[10px] text-yellow-700 uppercase font-bold mb-2 flex items-center gap-2 border-b border-stone-800 pb-1"><Scroll size={10} /> Nemesis Intel</h4>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-stone-300 font-serif font-bold text-sm">{selectedEnemy.name}</span>
                                <span className="text-[9px] text-stone-500 uppercase">{selectedEnemy.race}</span>
                            </div>
                            <p className="text-[10px] text-stone-400 italic mb-2">"{selectedEnemy.lore}"</p>
                        </div>
                    )}

                    <div className="bg-[#151210] p-4 border border-[#292524] text-center relative group">
                        <input type="date" value={selectedDate.toISOString().split('T')[0]} onChange={e => { const d=new Date(e.target.value); const n=new Date(selectedDate); n.setFullYear(d.getFullYear(), d.getMonth(), d.getDate()); setSelectedDate(n); }} className="bg-black text-stone-300 font-serif text-xs border border-stone-800 p-1 mb-2 block mx-auto"/>
                        <div className="flex justify-center gap-2">
                            <input type="time" value={startTimeStr} onChange={e => setStartTimeStr(e.target.value)} className="bg-black border border-[#292524] text-stone-300 font-mono text-sm p-1 w-20 text-center" />
                            <span className="text-stone-600">-</span>
                            <input type="time" value={endTimeStr} onChange={e => setEndTimeStr(e.target.value)} className="bg-black border border-yellow-900/30 text-yellow-500 font-mono text-sm p-1 w-20 text-center" />
                        </div>
                        
                        {/* FORESIGHT INDICATOR */}
                        {!isEditing && foresight && (
                            <div className="mt-3 bg-purple-900/20 border border-purple-500/50 p-2 text-center animate-pulse">
                                <div className="text-[10px] text-purple-300 font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                                    {foresight.label === 'PROPHETIC' ? <Crown size={12}/> : <Telescope size={12}/>}
                                    {foresight.label} BONUS ACTIVE
                                </div>
                                <div className="text-xs text-purple-200">+{foresight.amount}% Rewards for planning ahead.</div>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#151210] border-b border-[#292524] p-3 text-stone-200 font-serif text-lg outline-none pr-8" placeholder="Enemy Name..." />
                        {/* ALLOW SAVING EVEN WHEN EDITING - REMOVED !isEditing check */}
                        {title.trim().length > 0 && (
                            <button type="button" onClick={handleSaveAsTemplate} className="absolute right-2 top-3 text-stone-500 hover:text-purple-400 hover:scale-110 transition-transform" title="Inscribe as Ritual Scroll (Save Template)">
                                <Save size={16} />
                            </button>
                        )}
                        {saveStatus && (
                            <div className="absolute right-0 -top-8 text-[10px] text-green-400 font-bold bg-green-950/90 px-2 py-1 border border-green-800 animate-in fade-in zoom-in slide-in-from-bottom-2 shadow-lg z-20">
                                {saveStatus}
                            </div>
                        )}
                    </div>

                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-[#151210] border border-[#292524] p-3 text-stone-400 text-xs min-h-[80px]" placeholder="Description..." />
                    
                    {/* HIERARCHY SELECTOR */}
                    <div className="border border-[#292524] p-3 bg-[#0a0a0a]">
                        <label className="text-[10px] text-stone-500 uppercase font-bold flex items-center gap-2 mb-2"><LinkIcon size={10} /> Bind to Overlord (Parent Task)</label>
                        <select 
                            value={parentId} 
                            onChange={(e) => setParentId(e.target.value)}
                            className="w-full bg-[#151210] border border-stone-800 text-stone-300 text-xs p-2 outline-none"
                        >
                            <option value="">-- Independent (No Parent) --</option>
                            {state.tasks
                                .filter(t => t.id !== editingTaskId) 
                                .map(t => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                ))
                            }
                        </select>
                    </div>

                    <div className="border border-[#292524] p-3 bg-[#0a0a0a]">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] text-stone-500 uppercase font-bold flex items-center gap-2"><Network size={10} /> Minions (Subtasks)</label>
                            <span className="text-[9px] text-stone-600">{subtasks.length} active</span>
                        </div>
                        <div className="space-y-2 mb-2">
                            {subtasks.map((st, i) => (
                                <div key={i} className={`flex items-center gap-2 text-xs p-1 border ${st.completed ? 'bg-green-950/20 border-green-900 text-green-700' : 'bg-[#151210] border-stone-800 text-stone-300'}`}>
                                    <button 
                                        type="button" 
                                        onClick={() => handleToggleSubtask(i)}
                                        className={`shrink-0 ${st.completed ? 'text-green-500' : 'text-stone-600 hover:text-stone-400'}`}
                                        title={st.completed ? "Minion Defeated" : "Mark as Defeated"}
                                    >
                                        {st.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                                    </button>
                                    
                                    <span className={`flex-1 truncate ${st.completed ? 'line-through opacity-50' : ''}`}>{st.title}</span>
                                    
                                    <button type="button" onClick={() => setSubtasks(subtasks.filter((_, idx) => idx !== i))} className="text-stone-700 hover:text-red-500"><X size={10}/></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-1">
                            <input type="text" value={newSubtask} onChange={e => setNewSubtask(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddSubtask(e)} className="flex-1 bg-black border border-stone-800 p-1 text-xs text-stone-300" placeholder="Add minion..." />
                            <button type="button" onClick={handleAddSubtask} className="bg-stone-800 text-stone-400 px-2 hover:text-white"><Plus size={12} /></button>
                        </div>
                    </div>

                    <div className="flex gap-0 border border-[#292524]">
                        {[1,2,3].map(p => (
                            <button key={p} type="button" onClick={() => setPriority(p as TaskPriority)} className={`flex-1 py-3 text-sm font-serif font-bold ${priority === p ? 'bg-yellow-900/20 text-yellow-500' : 'bg-[#0c0a09] text-stone-600'}`}>{p === 3 ? 'III' : p === 2 ? 'II' : 'I'}</button>
                        ))}
                    </div>
                </form>
            )}
            
            {!showTemplates && (
                <div className="p-4 border-t border-[#292524] flex gap-2">
                    <button type="button" onClick={handleClearForm} className="bg-stone-900 border border-stone-700 text-stone-500 p-4 hover:text-white" title="Reset Form">
                        <RotateCcw size={20} />
                    </button>
                    {isEditing ? (
                        <div className="flex-1 flex gap-2">
                            <button onClick={handleSubmit} className="flex-1 bg-stone-800 text-stone-300 border border-stone-600 py-4 font-serif font-bold tracking-widest uppercase hover:bg-stone-700 transition-colors">
                                UPDATE
                            </button>
                            <button onClick={handleCompleteTask} className="flex-[1.5] bg-green-950 text-green-300 border border-green-800 py-4 font-serif font-bold tracking-widest uppercase hover:bg-green-900 transition-colors flex items-center justify-center gap-2">
                                <Swords size={16} /> VANQUISH
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleSubmit} className="flex-1 bg-[#3f2818] text-[#d6d3d1] border border-[#5c3a22] py-4 font-serif font-bold tracking-widest uppercase hover:bg-[#5c3a22] transition-colors">
                            MANIFEST ENEMY
                        </button>
                    )}
                </div>
            )}
          </>
      )
  };

  return (
    <div 
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md md:p-4 pointer-events-auto"
        onClick={handleBackdropClick} 
    >
      <div 
        className="relative w-full h-full md:max-w-[95vw] md:h-[90vh] bg-[#0c0a09] border border-[#44403c] flex flex-col md:flex-row shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="w-full md:w-3/4 flex flex-col border-r border-[#292524] bg-[#050202] h-[60%] md:h-full">
            <div className="h-14 flex items-center justify-between px-4 border-b border-[#292524] bg-[#0c0a09]">
                <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                        <button onClick={() => handleNav(-1)} className="text-stone-400 hover:text-white"><ChevronLeft/></button>
                        <button onClick={() => handleNav(1)} className="text-stone-400 hover:text-white"><ChevronRight/></button>
                    </div>
                    <span className="font-serif text-stone-200 font-bold text-lg w-48">{getHeaderTitle()}</span>
                </div>
                
                <div className="flex gap-4 items-center">
                    <button 
                        onClick={() => setShowFantasy(!showFantasy)} 
                        className="text-stone-500 hover:text-yellow-500 transition-colors"
                        title="Pierce the Veil (Toggle Names)"
                    >
                        {showFantasy ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>

                    <div className="flex gap-2 bg-[#151210] p-1 rounded border border-stone-800">
                        <button onClick={() => setViewMode('DAY')} className={`text-[10px] font-bold px-3 py-1 rounded ${viewMode==='DAY'?'bg-stone-700 text-white':'text-stone-500'}`}>DAY</button>
                        <button onClick={() => setViewMode('WEEK')} className={`text-[10px] font-bold px-3 py-1 rounded ${viewMode==='WEEK'?'bg-stone-700 text-white':'text-stone-500'}`}>WEEK</button>
                        <button onClick={() => setViewMode('MONTH')} className={`text-[10px] font-bold px-3 py-1 rounded ${viewMode==='MONTH'?'bg-stone-700 text-white':'text-stone-500'}`}>MONTH</button>
                        <button onClick={() => setViewMode('YEAR')} className={`text-[10px] font-bold px-3 py-1 rounded ${viewMode==='YEAR'?'bg-stone-700 text-white':'text-stone-500'}`}>YEAR</button>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-hidden relative">
                {viewMode === 'DAY' && renderDayView(currentDate)}
                {viewMode === 'WEEK' && renderWeekView()}
                {viewMode === 'MONTH' && renderMonthView()}
                {viewMode === 'YEAR' && renderYearView()}
            </div>
        </div>

        <div className={`w-full md:w-1/4 bg-[#0c0a09] flex flex-col h-[40%] md:h-full relative z-20 transition-colors duration-500 ${isEditing ? 'border-l border-blue-900' : isResolving ? 'border-l border-red-900' : 'border-l border-[#292524]'}`}>
            {renderRightPanel()}
        </div>
      </div>
    </div>
  );
};
