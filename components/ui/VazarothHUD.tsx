
import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Eye, Crown } from 'lucide-react';

export const VazarothHUD: React.FC = () => {
    const { state } = useGame();
    const [animateText, setAnimateText] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setAnimateText(true);
        const timer = setTimeout(() => setAnimateText(false), 300);
        return () => clearTimeout(timer);
    }, [state.vazarothMessage]);

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            // Normalize -1 to 1 based on screen center
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (e.clientY / window.innerHeight) * 2 - 1;
            setMousePos({ x, y });
        };
        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, []);

    const isAngry = state.winStreak > 2;
    const isHappy = state.lossStreak > 0;
    const eyeColor = isAngry ? "text-red-500 animate-pulse" : isHappy ? "text-purple-400" : "text-red-900";
    const borderColor = isAngry ? "border-red-600" : "border-red-950";

    // Calculate eye rotation/transform based on mouse
    // We want the pupil (the Icon) to shift slightly in the direction of the mouse
    const eyeStyle = {
        transform: `translate(${mousePos.x * 5}px, ${mousePos.y * 5}px) rotate(-45deg)`
    };

    return (
        <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-0 mt-4">
            <div className="pointer-events-auto flex flex-col items-center">
                <div className="relative mb-2 group">
                    <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse-slow"></div>
                    <div className={`w-16 h-16 bg-black border-2 ${borderColor} rotate-45 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,1)] overflow-hidden`}>
                         {/* The Eye/Crown icon shifts inside the box */}
                        <div className={`transition-transform duration-100 ease-out ${eyeColor}`} style={eyeStyle}>
                            {isAngry ? <Eye size={32} strokeWidth={3} /> : <Crown size={32} />}
                        </div>
                    </div>
                    {state.winStreak > 1 && (
                        <div className="absolute -right-12 top-4 text-[10px] text-yellow-600 font-bold uppercase tracking-widest animate-bounce">
                            Streak x{state.winStreak}
                        </div>
                    )}
                </div>
                <div className={`max-w-md text-center transition-all duration-500 ${animateText ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
                    <div className="bg-gradient-to-r from-transparent via-black/80 to-transparent px-8 py-2">
                        <h3 className="text-[10px] text-red-900 uppercase tracking-[0.3em] font-bold mb-1">Vazaroth</h3>
                        <p className={`font-serif text-lg leading-tight drop-shadow-md ${isAngry ? 'text-red-400' : 'text-stone-400'}`}>
                            "{state.vazarothMessage}"
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
