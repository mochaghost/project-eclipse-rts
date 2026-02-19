
import React, { useState, useEffect } from 'react';
import { Html, Float, Sparkles, ContactShadows, Billboard } from '@react-three/drei';
import { useGame } from '../../context/GameContext';
import { X, ExternalLink, RefreshCcw, SignalHigh, Instagram, Youtube, Globe, Loader2, SkipForward, AlertTriangle } from 'lucide-react';
import { VisionContent } from '../../types';

export const VisionMirror: React.FC = () => {
    const { state, closeVision, rerollVision, toggleSettings } = useGame();
    const [loading, setLoading] = useState(false);
    
    // --- ROBUST CONTENT PARSER ---
    let content: VisionContent | null = null;

    try {
        if (state.activeVisionVideo) {
            if (state.activeVisionVideo === "NO_SIGNAL") {
                content = null;
            } else if (state.activeVisionVideo.startsWith("{")) {
                content = JSON.parse(state.activeVisionVideo);
            } else {
                // AUTO-DETECT PLATFORM FROM URL STRING
                const url = state.activeVisionVideo;
                let platform: any = 'OTHER';
                let type: any = 'VIDEO';

                if (url.includes('instagram.com')) { platform = 'INSTAGRAM'; type = 'SOCIAL'; }
                else if (url.includes('pinterest.')) { platform = 'PINTEREST'; type = 'SOCIAL'; }
                else if (url.includes('tiktok.com')) { platform = 'TIKTOK'; type = 'SOCIAL'; }
                else if (url.includes('youtube.com') || url.includes('youtu.be')) { platform = 'YOUTUBE'; type = 'VIDEO'; }
                
                content = { type, embedUrl: url, originalUrl: url, platform };
            }
        }
    } catch (e) {
        console.error("Vision Parse Error", e);
    }

    const isVisible = state.activeMapEvent === 'VISION_RITUAL';

    const handleReroll = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setLoading(true);
        rerollVision();
        setTimeout(() => setLoading(false), 800);
    }

    const handleOpenPopup = (url: string) => {
        const width = 1000;
        const height = 800;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        try {
            const popup = window.open(url, 'VisionPortal', `width=${width},height=${height},top=${top},left=${left},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`);
            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                window.open(url, '_blank');
            }
        } catch (e) {
            window.open(url, '_blank');
        }
    };

    useEffect(() => { setLoading(false); }, [state.activeVisionVideo]);

    if (!isVisible) return null;

    // --- RENDER CONTENT ---
    const renderContent = () => {
        if (loading) {
            return (
                <div className="w-full h-full bg-black flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')] bg-cover opacity-20 pointer-events-none"></div>
                    <Loader2 size={48} className="text-purple-500 animate-spin relative z-10" />
                    <div className="text-purple-400 font-mono text-xs mt-4 tracking-widest relative z-10">TUNING FREQUENCY...</div>
                </div>
            )
        }

        // STATIC NOISE (Fallback / No Signal)
        if (!content) {
            return (
                 <div className="w-full h-full flex flex-col items-center justify-center bg-black relative overflow-hidden">
                    {/* RESTORED STATIC VIDEO EFFECT */}
                    <iframe 
                        src="https://www.youtube.com/embed/vzKjC5sMipk?autoplay=1&mute=1&controls=0&loop=1&playlist=vzKjC5sMipk" 
                        title="Static"
                        className="absolute inset-0 w-full h-full opacity-30 pointer-events-none scale-150"
                        style={{ border: 'none' }}
                    />
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <SignalHigh size={64} className="text-stone-500 mb-4 animate-pulse" />
                        <h2 className="text-xl text-stone-300 font-serif font-bold tracking-[0.5em] mb-2 bg-black/50 px-2">NO SIGNAL</h2>
                        
                        <div className="flex flex-col gap-2 w-full max-w-[180px] mt-4">
                            <button onClick={handleReroll} className="px-4 py-2 border border-purple-500 text-purple-400 text-xs bg-black/80 hover:bg-purple-900/40 transition-colors cursor-pointer flex items-center justify-center gap-2">
                                <RefreshCcw size={14}/> RETRY SIGNAL
                            </button>
                            <button onClick={() => { closeVision(); toggleSettings(); }} className="px-4 py-2 border border-stone-600 text-stone-400 text-xs bg-black/80 hover:bg-stone-800 transition-colors cursor-pointer">
                                CONFIGURE SOURCE
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // SOCIAL MEDIA CARD (For Instagram, Pinterest, etc that block iframes)
        if (content.platform === 'INSTAGRAM' || content.platform === 'PINTEREST' || content.platform === 'TIKTOK' || content.type === 'SOCIAL') {
            const isInsta = content.platform === 'INSTAGRAM';
            const isPin = content.platform === 'PINTEREST';
            
            let cardColor = "text-purple-300";
            let cardBorder = "border-purple-500/30";
            let PlatformIcon: any = Globe;
            
            if (isPin) { cardColor = "text-red-300"; cardBorder = "border-red-500/30"; PlatformIcon = (p:any)=><div className={`font-bold text-3xl font-serif ${p.className}`}>P</div>; }
            if (isInsta) { cardColor = "text-pink-300"; cardBorder = "border-pink-500/30"; PlatformIcon = Instagram; }

            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#050505] relative p-6">
                    <div className="absolute inset-0 bg-gradient-to-b from-black via-[#100510] to-black opacity-80"></div>
                    <div className={`mb-6 p-4 rounded-full border-2 ${cardBorder} bg-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10 animate-pulse-slow`}>
                        <PlatformIcon size={48} className={cardColor} />
                    </div>
                    <h3 className={`${cardColor} font-serif text-lg tracking-widest mb-2 font-bold uppercase z-10`}>{content.platform} SIGNAL</h3>
                    <p className="text-stone-500 text-xs text-center mb-8 max-w-[80%] z-10">
                        Secure channel requires external viewer.<br/>The Void cannot render this directly.
                    </p>
                    <button onClick={() => handleOpenPopup(content!.embedUrl)} className="group relative z-10 px-6 py-3 bg-stone-900 border border-stone-600 text-white font-serif font-bold tracking-widest uppercase hover:bg-stone-800 hover:border-white transition-all flex items-center gap-2">
                        OPEN PORTAL <ExternalLink size={14}/>
                    </button>
                    <button onClick={handleReroll} className="mt-4 z-10 text-stone-600 hover:text-stone-400 text-[10px] uppercase flex items-center gap-1">
                        <SkipForward size={12}/> Skip Signal
                    </button>
                </div>
            );
        }

        // STANDARD VIDEO (YouTube/Direct)
        if (content.type === 'VIDEO') {
            return (
                <div className="w-full h-full bg-black relative">
                    <iframe 
                        src={content.embedUrl} 
                        title="Vision" 
                        allow="autoplay; encrypted-media;"
                        className="w-full h-full border-0"
                    />
                    {/* Overlay control to skip if video is broken */}
                    <button onClick={handleReroll} className="absolute bottom-2 right-2 p-2 bg-black/50 text-white/50 hover:text-white rounded-full z-20">
                        <RefreshCcw size={12}/>
                    </button>
                </div>
            );
        }

        // IMAGE FALLBACK
        return (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <img src={content.embedUrl} className="max-w-full max-h-full object-contain" alt="Vision" />
            </div>
        );
    }

    return (
        <group position={[4, 5, 8]}>
            <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
                <pointLight position={[0, 0, 2]} intensity={2} color="#a855f7" distance={10} />
                <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
                    <group>
                        {/* Frame */}
                        <mesh position={[0, 0, -0.1]}>
                            <boxGeometry args={[3.8, 6.4, 0.2]} />
                            <meshStandardMaterial color="#0f0518" roughness={0.2} metalness={0.8} />
                        </mesh>
                        {/* Screen Container */}
                        <Html transform position={[0, 0, 0.05]} style={{ width: '360px', height: '640px', background: '#000', borderRadius: '4px', overflow: 'hidden' }} occlude="blending">
                            <div className="w-full h-full relative group bg-black border-2 border-purple-900/50 overflow-hidden">
                                {renderContent()}
                                <button onClick={closeVision} className="absolute top-2 right-2 bg-red-900/90 text-white p-2 rounded-full border border-red-500 hover:bg-red-700 shadow-lg pointer-events-auto z-50 cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>
                        </Html>
                    </group>
                </Float>
                <Sparkles count={50} scale={[5, 8, 5]} size={6} speed={0.4} opacity={0.6} color="#d8b4fe" />
            </Billboard>
            <ContactShadows opacity={0.8} scale={10} blur={2} far={10} color="#581c87" position={[0, -5, 0]} />
        </group>
    );
};
