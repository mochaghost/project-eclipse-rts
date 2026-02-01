import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Scroll, Sparkles } from 'lucide-react';

export const WorldRumorHUD: React.FC = () => {
    const { state } = useGame();
    const rumor = state.activeRumor;
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (rumor) setVisible(true);
        else setVisible(false);
    }, [rumor]);

    if (!rumor && !visible) return null;

    return (
        <div className={`absolute top-24 left-6 z-20 pointer-events-none max-w-sm transition-all duration-500 transform ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <div className="bg-[#1a0f1d]/90 border border-purple-900/50 p-4 shadow-[0_0_20px_rgba(88,28,135,0.3)] relative overflow-hidden grim-border">
                <div className="absolute top-0 right-0 p-1 text-purple-500/20"><Sparkles size={40} /></div>
                <div className="flex items-start gap-3 relative z-10">
                    <div className="bg-purple-950/50 p-2 rounded border border-purple-800"><Scroll size={20} className="text-purple-400" /></div>
                    <div>
                        <h4 className="text-purple-300 font-serif text-xs uppercase tracking-widest font-bold mb-1">{rumor?.message}</h4>
                        <p className="text-stone-300 font-serif italic text-sm leading-relaxed">"{rumor?.details}"</p>
                    </div>
                </div>
            </div>
        </div>
    );
};