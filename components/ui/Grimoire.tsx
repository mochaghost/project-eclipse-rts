
import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { TaskPriority, Task, AlertType, SubtaskDraft } from '../../types';
import { X, ChevronLeft, ChevronRight, ShieldAlert, Users, Scroll, Plus, Trash2, Eye, Skull, Link as LinkIcon, Pen, Save, Hourglass, Network, BookOpen, GripVertical, AlignLeft, CalendarDays, RefreshCw, Flame, ArrowRightCircle, Map, Telescope, Crown } from 'lucide-react';

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({length: 24}, (_, i) => i);

type ViewMode = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export const Grimoire: React.FC = () => {
  // @ts-ignore
  const { state, toggleGrimoire, addTask, editTask, moveTask, completeRitual, resolveFailedTask } = useGame();
  
  // Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('WEEK');
  const [showRealNames, setShowRealNames] = useState(false); 
  
  // Drag State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Form State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null); 
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [startTimeStr, setStartTimeStr] = useState("09:00");
  const [endTimeStr, setEndTimeStr] = useState("10:00");
  const [duration, setDuration] = useState(60); 
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.LOW);
  const [subtasks, setSubtasks] = useState<SubtaskDraft[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [newSubtaskDeadlineStr, setNewSubtaskDeadlineStr] = useState('');
  const [parentId, setParentId] = useState<string>(''); 
  
  // Failed Task Resolution State
  const [resolvingTaskId, setResolvingTaskId] = useState<string | null>(null);

  // Derived State
  const isEditing = !!editingTaskId;
  const isResolving = !!resolvingTaskId;

  // Potential Parents
  const potentialParents = useMemo(() => {
      return state.tasks.filter(t => !t.completed && !t.failed && t.id !== editingTaskId && !t.parentId);
  }, [state.tasks, editingTaskId]);

  // Selected Task Enemy Data (For Lore Display)
  const selectedEnemy = useMemo(() => {
      if (!editingTaskId) return null;
      return state.enemies.find(e => e.taskId === editingTaskId && !e.subtaskId);
  }, [editingTaskId, state.enemies]);

  if (!state.isGrimoireOpen) return null;
  const isRitual = state.activeAlert === AlertType.RITUAL_MORNING || state.activeAlert === AlertType.RITUAL_EVENING;

  // --- HELPER: GET NAME ---
  const getTaskDisplayTitle = (t: Task) => {
      if (showRealNames) return t.title;
      const enemy = state.enemies.find(e => e.taskId === t.id);
      return enemy ? enemy.title : t.title;
  };

  // --- HELPER: FORESIGHT CALCULATION ---
  const getForesightInfo = (t: Task) => {
      const lead = t.startTime - t.createdAt;
      if (lead > 3 * 24 * 60 * 60 * 1000) return { icon: <Crown size={10} className="text-yellow-400" />, label: "Prophetic (2x XP)", color: "border-yellow-500/50" };
      if (lead > 12 * 60 * 60 * 1000) return { icon: <Telescope size={10} className="text-purple-400" />, label: "Strategic (1.5x XP)", color: "border-purple-500/50" };
      if (lead > 4 * 60 * 60 * 1000) return { icon: <Map size={10} className="text-blue-400" />, label: "Tactical (1.2x XP)", color: "border-blue-500/50" };
      return { icon: null, label: "", color: "" };
  };

  // --- STRICT CLOSE HANDLER ---
  const handleBackdropClick = (e: React.MouseEvent) => {
      // Only close if clicking the Backdrop explicitly, NOT children
      if (e.target === e.currentTarget) {
          toggleGrimoire();
      }
  };

  // --- DRAG & DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, task: Task) => {
      e.stopPropagation(); 
      e.dataTransfer.setData("taskId", task.id);
      setDraggedTaskId(task.id);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); 
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date, targetHour?: number) => {
      e.preventDefault();
      e.stopPropagation();
      const taskId = e.dataTransfer.getData("taskId");
      setDraggedTaskId(null);
      
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
      setEditingTaskId(null);
      setResolvingTaskId(null);
      resetForm();
  };

  const handleTaskClick = (task: Task) => {
      if (task.failed) {
          setResolvingTaskId(task.id);
          setEditingTaskId(null);
      } else {
          handleEditTask(task);
          setResolvingTaskId(null);
      }
  };

  const handleEditTask = (task: Task) => {
      setEditingTaskId(task.id);
      setTitle(task.title);
      setNotes(task.description || '');
      setDuration(task.estimatedDuration);
      setPriority(task.priority);
      setSubtasks((task.subtasks || []).map(s => ({ title: s.title, startTime: s.startTime, deadline: s.deadline })));
      setParentId(task.parentId || '');
      
      const deadlineDate = new Date(task.deadline);
      const startDate = new Date(task.startTime);
      
      setSelectedDate(startDate); 
      setStartTimeStr(startDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: false}));
      setEndTimeStr(deadlineDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: false}));
  };

  const resetForm = () => {
      setEditingTaskId(null);
      setResolvingTaskId(null);
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
    
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);
    
    const startDate = new Date(selectedDate);
    startDate.setHours(startH, startM, 0);
    
    if (startDate.getTime() < Date.now() - 60000 && !editingTaskId) {
        alert("Time flows forward, Summoner. You cannot schedule in the past.");
        return;
    }
    
    let deadlineDate = new Date(selectedDate);
    deadlineDate.setHours(endH, endM, 0);
    if (deadlineDate <= startDate) {
        deadlineDate.setTime(startDate.getTime() + 60 * 60 * 1000); 
    }
    
    const dur = Math.max(15, (deadlineDate.getTime() - startDate.getTime()) / 60000);

    const finalSubtasks: SubtaskDraft[] = [...subtasks];
    if(newSubtask.trim()) {
        finalSubtasks.push({ title: newSubtask.trim() });
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

  const handleMergeTask = (oldTaskId: string, oldTitle: string) => {
      resolveFailedTask(oldTaskId, 'MERGE');
      setEditingTaskId(null); 
      setTitle(`Revenge: ${oldTitle}`);
      setNotes(`A new attempt born from the ashes of failure. +XP Bonus.`);
      setPriority(TaskPriority.HIGH); 
      const now = new Date();
      setSelectedDate(now);
      const h = now.getHours();
      setStartTimeStr(`${h < 10 ? '0'+h : h}:00`);
      setEndTimeStr(`${h+1 < 10 ? '0'+(h+1) : (h+1)}:00`);
      setResolvingTaskId(null);
  };

  const handleAddSubtask = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (newSubtask.trim()) {
          setSubtasks([...subtasks, { title: newSubtask.trim() }]);
          setNewSubtask('');
      }
  };

  // --- VIEW RENDERERS ---
  const renderDayView = () => {
      const d = new Date(currentDate);
      const dayTasks = state.tasks.filter(t => new Date(t.startTime).toDateString() === d.toDateString());
      const sorted = [...dayTasks].sort((a,b) => a.startTime - b.startTime);
      const columns: Task[][] = [];
      sorted.forEach(task => {
          let placed = false;
          for(let i=0; i<columns.length; i++) {
              const lastInCol = columns[i][columns[i].length-1];
              if (task.startTime >= lastInCol.deadline) {
                  columns[i].push(task);
                  placed = true;
                  break;
              }
          }
          if (!placed) columns.push([task]);
      });

      return (
          <div className="flex h-full overflow-hidden flex-col">
              <div className="flex border-b border-[#292524] bg-[#0c0a09]"><div className="w-16 border-r border-[#292524]"></div><div className={`flex-1 text-center py-2 ${d.toDateString() === new Date().toDateString() ? 'bg-yellow-950/10' : ''}`}><div className="text-xs text-stone-500 uppercase">{DAYS[d.getDay()]}</div><div className={`text-lg font-serif ${d.toDateString() === new Date().toDateString() ? 'text-yellow-500 font-bold' : 'text-stone-300'}`}>{d.getDate()}</div></div></div>
              <div className="flex-1 overflow-y-auto flex custom-scrollbar relative"><div className="w-16 bg-[#0c0a09] border-r border-[#292524] shrink-0">{HOURS.map(h => (<div key={h} className="h-32 text-[10px] text-stone-600 text-right pr-2 pt-1 border-b border-[#1c1917] bg-[#0c0a09]">{h}:00</div>))}</div><div className="flex-1 border-r border-[#1c1917] relative bg-[#050202]">
                {HOURS.map(h => (
                    <div key={h} onClick={() => handleSelectSlot(d, h)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, d, h)} className="h-32 border-b border-[#1c1917] hover:bg-[#151210] cursor-pointer"></div>
                ))}
                {sorted.map((t) => {
                  const date = new Date(t.startTime); 
                  const startHour = date.getHours() + (date.getMinutes()/60); 
                  const deadline = new Date(t.deadline);
                  const endHour = deadline.getHours() + (deadline.getMinutes()/60);
                  const displayEndHour = deadline.getDate() !== date.getDate() ? 24 : endHour;
                  const durationHrs = Math.max(0.25, displayEndHour - startHour);
                  const top = startHour * 128; 
                  const height = durationHrs * 128;
                  let colIndex = 0;
                  for(let c=0; c<columns.length; c++) { if(columns[c].includes(t)) { colIndex = c; break; } }
                  const widthPercent = 100 / columns.length;
                  const leftPercent = colIndex * widthPercent;
                  
                  const foresight = getForesightInfo(t);

                  return (
                      <div 
                            key={t.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, t)}
                            onClick={(e) => { e.stopPropagation(); handleTaskClick(t); }} 
                            title={`${getTaskDisplayTitle(t)}${foresight.label ? `\n${foresight.label}` : ''}`}
                            className={`absolute rounded border overflow-hidden p-2 text-xs flex flex-col cursor-grab active:cursor-grabbing pointer-events-auto shadow-md hover:scale-[1.02] transition-transform z-10 ${t.completed ? 'bg-green-950/50 border-green-800 text-green-300 opacity-60' : t.failed ? 'bg-red-950/90 border-red-500 text-red-100 shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-pulse-slow' : 'bg-yellow-950/80 text-yellow-100 hover:z-20'} ${foresight.color ? foresight.color : 'border-yellow-800'}`} 
                            style={{ top: `${top}px`, height: `${height}px`, left: `${leftPercent}%`, width: `${widthPercent}%`, borderLeftWidth: '4px' }}
                      >
                            <div className="font-bold flex items-center justify-between">
                                <span className="truncate">{getTaskDisplayTitle(t)}</span>
                                {foresight.icon && <span title={foresight.label}>{foresight.icon}</span>}
                                {t.parentId && !foresight.icon && <LinkIcon size={10} className="opacity-50" />}
                            </div>
                            {t.failed && <div className="mt-auto text-[9px] font-bold text-red-200 uppercase bg-red-900 text-center py-1 border-t border-red-500">ENEMY STILL STANDS</div>}
                      </div>
                  )
              })}</div></div></div>
      );
  }

  const renderOtherViews = () => {
      if (viewMode === 'MONTH') {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const grid = [];
        for (let d=1; d<=daysInMonth; d++) {
            const date = new Date(year, month, d);
            const isToday = new Date().toDateString() === date.toDateString();
            const tasks = state.tasks.filter(t => new Date(t.startTime).toDateString() === date.toDateString());
            grid.push(
                <div key={d} onClick={() => handleSelectSlot(date)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, date)} className="border border-[#292524] p-1 min-h-[80px] hover:bg-[#151210] relative flex flex-col gap-1">
                    <div className={`text-xs font-serif ${isToday ? 'text-yellow-500' : 'text-stone-500'}`}>{d}</div>
                    {tasks.map(t => {
                        const foresight = getForesightInfo(t);
                        return (
                            <div key={t.id} draggable onDragStart={(e) => handleDragStart(e, t)} onClick={(e) => {e.stopPropagation(); handleTaskClick(t)}} title={`${getTaskDisplayTitle(t)} ${foresight.label ? `(${foresight.label})` : ''}`} className={`text-[9px] truncate px-1 rounded cursor-grab flex items-center justify-between border ${t.failed ? 'bg-red-900/50 text-red-200 border-red-800' : 'bg-yellow-900/20 text-yellow-200'} ${foresight.color ? foresight.color : 'border-transparent'}`}>
                                <span className="truncate">{getTaskDisplayTitle(t)}</span>
                                {foresight.icon}
                            </div>
                        )
                    })}
                </div>
            )
        }
        return <div className="grid grid-cols-7 h-full overflow-y-auto bg-[#050202]">{grid}</div>;
      }
      return renderDayView();
  }

  const renderResolvePanel = () => {
      const task = state.tasks.find(t => t.id === resolvingTaskId);
      if (!task) return null;
      return (
          <div className="h-full flex flex-col p-6 bg-red-950/20 border-l border-red-900/50">
              <div className="text-center mb-6">
                  <Skull size={48} className="text-red-600 mx-auto mb-2 animate-pulse" />
                  <h3 className="text-xl font-serif text-red-500 tracking-widest font-bold uppercase">Enemy Unvanquished</h3>
                  <p className="text-stone-400 text-sm mt-2 italic">"{task.title}" haunts the timeline.</p>
              </div>
              <div className="space-y-4">
                  <button onClick={() => resolveFailedTask(task.id, 'RESCHEDULE', Date.now())} className="w-full bg-[#1c1917] border border-stone-600 p-4 hover:border-yellow-500 text-left group">
                      <div className="flex items-center gap-3 text-yellow-600 font-bold mb-1"><RefreshCw size={20} /> RESCHEDULE</div>
                      <p className="text-xs text-stone-500">Move battle to now. Enemy remains.</p>
                  </button>
                  <button onClick={() => handleMergeTask(task.id, task.title)} className="w-full bg-[#1c1917] border border-stone-600 p-4 hover:border-purple-500 text-left group">
                      <div className="flex items-center gap-3 text-purple-500 font-bold mb-1"><Flame size={20} /> FUSION</div>
                      <p className="text-xs text-stone-500">Consume failure to fuel a new task.</p>
                  </button>
              </div>
              <button onClick={() => setResolvingTaskId(null)} className="mt-auto w-full py-2 border-t border-stone-800 text-stone-500">Close</button>
          </div>
      )
  }

  const renderLorePanel = () => {
      if (!selectedEnemy) return null;
      return (
          <div className="mb-4 bg-[#151210] border border-stone-800 p-3">
              <h4 className="text-[10px] text-yellow-700 uppercase font-bold mb-2 flex items-center gap-2 border-b border-stone-800 pb-1"><Scroll size={10} /> Nemesis Intel</h4>
              <div className="flex justify-between items-center mb-1">
                  <span className="text-stone-300 font-serif font-bold text-sm">{selectedEnemy.name}</span>
                  <span className="text-[9px] text-stone-500 uppercase">{selectedEnemy.race}</span>
              </div>
              <p className="text-[10px] text-stone-400 italic mb-2">"{selectedEnemy.lore}"</p>
          </div>
      )
  }

  return (
    <div 
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md md:p-4 pointer-events-auto"
        onClick={handleBackdropClick} // STRICT CLICK HANDLER
    >
      <div 
        className="relative w-full h-full md:max-w-[95vw] md:h-[85vh] bg-[#0c0a09] border border-[#44403c] flex flex-col md:flex-row shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* LEFT PANEL */}
        <div className="w-full md:w-3/4 flex flex-col border-r border-[#292524] bg-[#050202] h-[50%] md:h-full">
            <div className="h-14 flex items-center justify-between px-4 border-b border-[#292524] bg-[#0c0a09]">
                <div className="flex gap-2">
                    <button onClick={() => handleNav(-1)} className="text-stone-400"><ChevronLeft/></button>
                    <button onClick={() => handleNav(1)} className="text-stone-400"><ChevronRight/></button>
                    <span className="font-serif text-stone-200 ml-2">{MONTHS[currentDate.getMonth()]}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setViewMode('DAY')} className={`text-xs font-bold px-2 py-1 ${viewMode==='DAY'?'bg-yellow-900/30 text-yellow-500':''}`}>DAY</button>
                    <button onClick={() => setViewMode('MONTH')} className={`text-xs font-bold px-2 py-1 ${viewMode==='MONTH'?'bg-yellow-900/30 text-yellow-500':''}`}>MONTH</button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
                {viewMode === 'DAY' ? renderDayView() : renderOtherViews()}
            </div>
        </div>

        {/* RIGHT PANEL */}
        <div className={`w-full md:w-1/4 bg-[#0c0a09] flex flex-col h-[50%] md:h-full relative z-20 transition-colors duration-500 ${isEditing ? 'border-l border-blue-900' : isResolving ? 'border-l border-red-900' : 'border-l border-[#292524]'}`}>
            {isResolving ? renderResolvePanel() : (
                <>
                    <div className="h-14 border-b border-[#292524] flex items-center justify-center">
                        <span className={`font-serif tracking-widest font-bold ${isEditing ? 'text-blue-400' : 'text-yellow-700'}`}>{isEditing ? 'EDITING FATE' : 'SUMMONING'}</span>
                    </div>
                    <form onSubmit={handleSubmit} className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
                        {isEditing && renderLorePanel()}
                        
                        <div className="bg-[#151210] p-4 border border-[#292524] text-center">
                            <input type="date" value={selectedDate.toISOString().split('T')[0]} onChange={e => { const d=new Date(e.target.value); const n=new Date(selectedDate); n.setFullYear(d.getFullYear(), d.getMonth(), d.getDate()); setSelectedDate(n); }} className="bg-black text-stone-300 font-serif text-xs border border-stone-800 p-1 mb-2 block mx-auto"/>
                            <div className="flex justify-center gap-2">
                                <input type="time" value={startTimeStr} onChange={e => setStartTimeStr(e.target.value)} className="bg-black border border-[#292524] text-stone-300 font-mono text-sm p-1 w-20 text-center" />
                                <span className="text-stone-600">-</span>
                                <input type="time" value={endTimeStr} onChange={e => setEndTimeStr(e.target.value)} className="bg-black border border-yellow-900/30 text-yellow-500 font-mono text-sm p-1 w-20 text-center" />
                            </div>
                        </div>

                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#151210] border-b border-[#292524] p-3 text-stone-200 font-serif text-lg outline-none" placeholder="Enemy Name..." />
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-[#151210] border border-[#292524] p-3 text-stone-400 text-xs min-h-[80px]" placeholder="Description..." />
                        
                        <div className="flex gap-0 border border-[#292524]">
                            {[1,2,3].map(p => (
                                <button key={p} type="button" onClick={() => setPriority(p as TaskPriority)} className={`flex-1 py-3 text-sm font-serif font-bold ${priority === p ? 'bg-yellow-900/20 text-yellow-500' : 'bg-[#0c0a09] text-stone-600'}`}>{p === 3 ? 'III' : p === 2 ? 'II' : 'I'}</button>
                            ))}
                        </div>
                    </form>
                    <div className="p-4 border-t border-[#292524]">
                        <button onClick={handleSubmit} className="w-full bg-[#3f2818] text-[#d6d3d1] border border-[#5c3a22] py-4 font-serif font-bold tracking-widest uppercase hover:bg-[#5c3a22] transition-colors">{isEditing ? 'REWRITE FATE' : 'MANIFEST ENEMY'}</button>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
