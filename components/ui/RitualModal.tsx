
import React from 'react';
import { useGame } from '../../context/GameContext';
import { AlertType } from '../../types';
import { Moon, Sun, Scroll, Skull, Shield, Sword, Crown } from 'lucide-react';

export const RitualModal: React.FC = () => {
  const { state, toggleGrimoire, closeBattleReport } = useGame();
  
  // Battle Report Logic
  if (state.activeAlert === AlertType.BATTLE_REPORT && state.lastBattleReport) {
      const report = state.lastBattleReport;
      const isVictory = report.outcome === 'VICTORY' || report.outcome === 'CRUSHING_VICTORY';
      
      return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 pointer-events-auto animate-in fade-in zoom-in-95">
            <div className={`max-w-lg w-full border-4 p-8 text-center relative overflow-hidden ${isVictory ? 'border-yellow-600 bg-[#1c1917]' : 'border-red-900 bg-[#0c0a09]'}`}>
                {/* Background FX */}
                <div className={`absolute inset-0 opacity-20 pointer-events-none ${isVictory ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/50 via-transparent to-transparent' : 'bg-[url("https://www.transparenttextures.com/patterns/black-felt.png")]'}`}></div>

                <div className="relative z-10">
                    <div className="flex justify-center mb-6">
                        {report.outcome === 'CRUSHING_VICTORY' ? (
                            <div className="relative">
                                <Crown size={80} className="text-yellow-500 animate-bounce" />
                                <div className="absolute inset-0 blur-xl bg-yellow-500/50"></div>
                            </div>
                        ) : isVictory ? (
                            <Shield size={64} className="text-yellow-600" />
                        ) : (
                            <Skull size={64} className="text-red-600 animate-pulse" />
                        )}
                    </div>
                    
                    <h2 className={`text-4xl font-serif font-black tracking-widest mb-2 ${isVictory ? 'text-yellow-500' : 'text-red-600'}`}>
                        {report.outcome === 'CRUSHING_VICTORY' ? 'CONQUEST!' : isVictory ? 'DEFENSE SUCCESS' : 'WALLS BREACHED'}
                    </h2>
                    
                    <div className="flex justify-center items-center gap-4 text-xs font-mono text-stone-500 mb-6 uppercase tracking-widest">
                        <span>Threat: {report.threatLevel}</span>
                        <span>vs</span>
                        <span>Defense: {report.defenseLevel}</span>
                    </div>

                    <div className="bg-black/40 border border-white/10 p-4 mb-6 space-y-2 text-sm text-stone-300">
                        {report.damageTaken > 0 && (
                            <div className="flex justify-between text-red-400">
                                <span>Base Damage</span>
                                <span>-{report.damageTaken} HP</span>
                            </div>
                        )}
                        {report.lootStolen > 0 && (
                            <div className="flex justify-between text-yellow-700">
                                <span>Gold Plundered</span>
                                <span>-{report.lootStolen}g</span>
                            </div>
                        )}
                        {report.enemiesDefeated > 0 && (
                            <div className="flex justify-between text-green-400">
                                <span>Enemies Slain</span>
                                <span>+{report.enemiesDefeated * 20} XP</span>
                            </div>
                        )}
                        {report.conqueredFaction && (
                            <div className="mt-4 pt-4 border-t border-white/10 text-yellow-400 font-bold animate-pulse">
                                ⚔️ You launched a counter-siege against {report.conqueredFaction}! Territory Gained.
                            </div>
                        )}
                    </div>

                    <button onClick={closeBattleReport} className="w-full py-4 px-6 text-xl font-bold font-serif uppercase bg-stone-900 border border-stone-600 hover:bg-stone-800 flex items-center justify-center gap-3 transition-all hover:scale-105">
                        <Sword size={24} /> Stand Your Ground
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // Regular Ritual Logic
  if ((state.activeAlert !== AlertType.RITUAL_MORNING && state.activeAlert !== AlertType.RITUAL_EVENING) || state.isGrimoireOpen) return null;
  const isMorning = state.activeAlert === AlertType.RITUAL_MORNING;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 pointer-events-auto">
        <div className={`max-w-lg w-full border-4 p-8 text-center ${isMorning ? 'border-yellow-600 bg-[#1c1917]' : 'border-indigo-900 bg-[#0c0a09]'}`}>
            <div className="flex justify-center mb-6">{isMorning ? <Sun size={64} className="text-yellow-500" /> : <Moon size={64} className="text-indigo-400" />}</div>
            <h2 className={`text-3xl font-serif tracking-[0.2em] mb-4 ${isMorning ? 'text-yellow-500' : 'text-indigo-400'}`}>{isMorning ? 'DAWN PROTOCOL' : 'DUSK REFLECTION'}</h2>
            <button onClick={toggleGrimoire} className="w-full py-4 px-6 text-xl font-bold font-serif uppercase bg-stone-900 border border-stone-600 hover:bg-stone-800 flex items-center justify-center gap-3">
                <Scroll size={24} /> Open Grimoire
            </button>
        </div>
    </div>
  );
};
