
import React, { useState, useEffect } from 'react';
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
import { AlertTriangle } from 'lucide-react';

const GameContainer = () => {
    const { state, toggleProfile } = useGame();
    return (
        <main className="relative w-full h-screen overflow-hidden bg-[#050202]">
            {/* 3D Layer */}
            <div className="absolute inset-0 z-0">
                <Scene />
            </div>

            {/* UI Layer */}
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
            className="fixed bottom-2 left-2 z-[9999] opacity-50 hover:opacity-100 bg-red-900/50 text-red-200 text-[10px] p-2 border border-red-500 rounded flex items-center gap-2 cursor-pointer font-sans"
            title="Click if screen is black/stuck"
        >
            <AlertTriangle size={12} />
            EMERGENCY RESET
        </button>
    )
}

const App: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="text-stone-500 p-4 font-mono">Initializing Neural Link...</div>;

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
