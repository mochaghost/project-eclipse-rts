
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Scene } from './components/3d/Scene';
import { HUD } from './components/ui/HUD';
import { Grimoire } from './components/ui/Grimoire';
import { HeroProfile } from './components/ui/HeroProfile';
import { CrisisIntervention } from './components/ui/CrisisIntervention';
import { RitualModal } from './components/ui/RitualModal';
import { EnemyProfile } from './components/ui/EnemyProfile';
import { MarketModal } from './components/ui/MarketModal';
import { AuditModal } from './components/ui/AuditModal';
import { SettingsModal } from './components/ui/SettingsModal';
import { DiplomacyMap } from './components/ui/DiplomacyMap';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AlertTriangle, Sparkles } from 'lucide-react';

const UIEmbers = () => {
    // Generate random particles that float up
    const particles = useMemo(() => Array.from({length: 20}).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4,
        size: 2 + Math.random() * 3
    })), []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
            {particles.map(p => (
                <div 
                    key={p.id}
                    className="absolute bottom-0 bg-orange-500/30 rounded-full animate-rise"
                    style={{
                        left: `${p.left}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        animationDuration: `${p.duration}s`,
                        animationDelay: `${p.delay}s`,
                        boxShadow: `0 0 ${p.size * 2}px rgba(234, 88, 12, 0.4)`
                    }}
                />
            ))}
            <style>{`
                @keyframes rise {
                    0% { transform: translateY(10vh) translateX(0); opacity: 0; }
                    20% { opacity: 0.6; }
                    100% { transform: translateY(-110vh) translateX(${Math.random() * 20 - 10}vw); opacity: 0; }
                }
                .animate-rise {
                    animation-name: rise;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
            `}</style>
        </div>
    )
}

const GameContainer = () => {
    const { state, toggleProfile } = useGame();
    const containerRef = useRef<HTMLDivElement>(null);

    // KEYBOARD/MOBILE LAYOUT FIX
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                // Force reset scroll to avoid layout shift when keyboard closes
                window.scrollTo(0, 0);
                // On some mobile browsers, window.innerHeight changes when keyboard opens
                containerRef.current.style.height = `${window.innerHeight}px`;
            }
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('blur', () => window.scrollTo(0, 0)); 
        
        // Initial set
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('blur', () => window.scrollTo(0, 0));
        };
    }, []);

    // Apply UI Scaling and Safe Area from settings
    const uiStyle = {
        transform: `scale(${state.settings?.uiScale || 1})`,
        transformOrigin: 'center center',
        padding: `${state.settings?.safeAreaPadding || 0}px`
    };

    return (
        <main 
            ref={containerRef}
            className="relative w-full overflow-hidden bg-[#050202]"
            style={{ height: '100dvh' }} // Fallback to dvh for modern browsers
        >
            {/* 3D Layer - Always Full Screen, No Padding */}
            <div className="absolute inset-0 z-0">
                <Scene />
            </div>

            {/* Atmosphere Layer */}
            <UIEmbers />

            {/* UI Layer - Scaled and Padded */}
            <div className="absolute inset-0 z-10 pointer-events-none" style={uiStyle}>
                {/* Repass pointer-events-auto to children in their specific components */}
                <div className="w-full h-full relative">
                    <HUD />
                    <Grimoire />
                    <HeroProfile isOpen={state.isProfileOpen} onClose={toggleProfile} level={state.playerLevel} />
                    <MarketModal />
                    <AuditModal />
                    <SettingsModal />
                    <DiplomacyMap />
                    
                    {/* Entity Modals */}
                    <EnemyProfile />

                    {/* Interruption Modals */}
                    <CrisisIntervention />
                    <RitualModal />
                </div>
            </div>
        </main>
    )
}

const EmergencyReset = () => {
    const handleReset = () => {
        if(confirm("EMERGENCY RESET: This will wipe local data to fix the black screen. Continue?")) {
            localStorage.clear();
            window.location.reload();
        }
    }
    return (
        <button 
            onClick={handleReset}
            className="fixed bottom-2 left-2 z-[9999] opacity-30 hover:opacity-100 bg-red-950/20 text-red-500 text-[9px] px-2 py-1 border border-red-900/50 rounded flex items-center gap-2 cursor-pointer font-mono hover:scale-105 transition-all"
            title="Wipe Save Data (Debug)"
        >
            <AlertTriangle size={10} />
            RESET_TIMELINE
        </button>
    )
}

const LoadingScreen = () => {
    const [step, setStep] = useState(0);
    const messages = [
        "INITIALIZING NEURAL LINK...",
        "SUMMONING THE CITADEL...",
        "OBSERVING THE VOID...",
        "MANIFESTING..."
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setStep(s => s < messages.length ? s + 1 : s);
        }, 150); // Speed up loading
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full h-screen bg-[#050202] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-900/20 via-black to-black"></div>
            <div className="z-10 flex flex-col items-center gap-4">
                <Sparkles size={48} className="text-yellow-600 animate-pulse" />
                <h1 className="text-3xl font-serif text-stone-200 tracking-[0.3em] font-bold">PROJECT ECLIPSE</h1>
                <div className="h-0.5 w-64 bg-stone-900 rounded-full overflow-hidden mt-4">
                    <div 
                        className="h-full bg-yellow-600 transition-all duration-500 ease-out" 
                        style={{ width: `${Math.min(100, (step + 1) * 25)}%` }}
                    ></div>
                </div>
                <div className="text-[10px] font-mono text-stone-500 uppercase tracking-widest animate-pulse mt-2">
                    {messages[Math.min(step, messages.length - 1)]}
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100); 
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return <LoadingScreen />;

  return (
    <ErrorBoundary>
        <GameProvider>
            <GameContainer />
            <EmergencyReset />
        </GameProvider>
    </ErrorBoundary>
  );
};

export default App;
