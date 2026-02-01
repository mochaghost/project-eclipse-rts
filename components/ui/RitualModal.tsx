
import React from 'react';
import { useGame } from '../../context/GameContext';
import { AlertType } from '../../types';
import { Moon, Sun, Scroll } from 'lucide-react';

export const RitualModal: React.FC = () => {
  const { state, toggleGrimoire } = useGame();
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
