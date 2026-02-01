
import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { AlertType } from '../../types';
import { Skull, ShieldAlert, Swords, Clock, Brain } from 'lucide-react';

const AeonBattle = ({ onComplete }: { onComplete: (subs: string[], success: boolean) => void }) => {
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [subtasks, setSubtasks] = useState(['', '', '']);
    
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(p => {
                if (p <= 1) {
                    clearInterval(timer);
                    onComplete([], false); // Time out = Defeat
                    return 0;
                }
                return p - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const valid = subtasks.filter(s => s.trim().length > 3);
        if (valid.length >= 3) {
            onComplete(valid, true);
        }
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    return (
        <div className="w-full max-w-2xl bg-[#0c0a09] border-4 border-purple-900 p-8 relative overflow-hidden">
            {/* Aeon Visuals */}
            <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                <Skull size={200} className="text-purple-500" />
            </div>

            <div className="relative z-10">
                <h2 className="text-4xl text-purple-500 font-serif font-bold tracking-widest mb-2 flex items-center gap-3">
                    <Swords size={40} /> AEON INTERVENES
                </h2>
                <p className="text-stone-300 font-serif text-lg mb-6 max-w-md">
                    "You claim you can finish? Prove it. Break the monolith into dust, or be crushed by its weight."
                </p>

                <div className="flex items-center gap-4 mb-8 bg-black/50 p-4 border border-purple-800">
                    <Clock className="text-purple-400 animate-pulse" />
                    <span className="text-3xl font-mono text-white">{formatTime(timeLeft)}</span>
                    <span className="text-stone-500 text-xs uppercase tracking-widest ml-auto">Time Remaining</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-stone-500 uppercase font-bold">Step 1: The Approach</label>
                        <input type="text" value={subtasks[0]} onChange={e => {const n=[...subtasks]; n[0]=e.target.value; setSubtasks(n)}} className="w-full bg-[#151210] border border-stone-700 p-3 text-stone-200 focus:border-purple-500 outline-none" placeholder="First action..." />
                    </div>
                    <div>
                        <label className="text-xs text-stone-500 uppercase font-bold">Step 2: The Core</label>
                        <input type="text" value={subtasks[1]} onChange={e => {const n=[...subtasks]; n[1]=e.target.value; setSubtasks(n)}} className="w-full bg-[#151210] border border-stone-700 p-3 text-stone-200 focus:border-purple-500 outline-none" placeholder="Main effort..." />
                    </div>
                    <div>
                        <label className="text-xs text-stone-500 uppercase font-bold">Step 3: The Conclusion</label>
                        <input type="text" value={subtasks[2]} onChange={e => {const n=[...subtasks]; n[2]=e.target.value; setSubtasks(n)}} className="w-full bg-[#151210] border border-stone-700 p-3 text-stone-200 focus:border-purple-500 outline-none" placeholder="Final polish..." />
                    </div>

                    <button type="submit" disabled={subtasks.filter(s => s.trim().length > 3).length < 3} className="w-full bg-purple-900 hover:bg-purple-800 text-white font-bold py-4 mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
                        STRIKE DOWN THE OBSTACLE
                    </button>
                </form>
            </div>
        </div>
    )
}

export const CrisisIntervention: React.FC = () => {
  const { state, resolveCrisisHubris, resolveCrisisHumility, resolveAeonBattle } = useGame();
  
  // Normal Crisis Mode (Choice) or Aeon Battle Mode
  const [mode, setMode] = useState<'CHOICE' | 'AEON'>('CHOICE');

  if (state.activeAlert !== AlertType.CRISIS && state.activeAlert !== AlertType.AEON_ENCOUNTER) return null;
  
  const task = state.tasks.find(t => t.id === state.alertTaskId);
  if (!task) return null;

  // If we triggered Aeon mode via context update
  if (state.activeAlert === AlertType.AEON_ENCOUNTER && mode !== 'AEON') {
      setMode('AEON');
  }

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
        {mode === 'AEON' ? (
            <AeonBattle onComplete={(subs, success) => {
                resolveAeonBattle(task.id, subs, success);
                setMode('CHOICE'); // Reset for next time
            }} />
        ) : (
            <div className="max-w-xl w-full bg-[#1c1917] border-2 border-red-600 p-8 relative shadow-2xl">
                <h2 className="text-3xl text-red-500 font-serif tracking-widest mb-4 flex items-center gap-3"><ShieldAlert size={32} /> THE 75% THRESHOLD</h2>
                <p className="text-stone-300 font-serif text-lg mb-8">
                    The task <strong>{task.title}</strong> nears its deadline. The Resistance tightens its grip. <br/><br/>
                    <span className="text-stone-500 italic">"False confidence is the enemy of completion. Do you truly have this under control, or must we break it down?"</span>
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => resolveCrisisHubris(task.id)} className="bg-[#0c0a09] border border-stone-600 hover:border-red-500 hover:bg-red-950/20 p-6 flex flex-col items-center gap-3 transition-all group">
                        <Swords size={32} className="text-stone-500 group-hover:text-red-500" />
                        <span className="text-xl font-serif text-stone-200">I WILL FINISH</span>
                        <span className="text-[10px] text-stone-500 uppercase">Hubris (High Risk)</span>
                    </button>
                    <button onClick={() => resolveCrisisHumility(task.id)} className="bg-[#0c0a09] border border-stone-600 hover:border-purple-500 hover:bg-purple-950/20 p-6 flex flex-col items-center gap-3 transition-all group">
                        <Brain size={32} className="text-stone-500 group-hover:text-purple-500" />
                        <span className="text-xl font-serif text-stone-200">I NEED STRATEGY</span>
                        <span className="text-[10px] text-stone-500 uppercase">Humility (Aeon Battle)</span>
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};
