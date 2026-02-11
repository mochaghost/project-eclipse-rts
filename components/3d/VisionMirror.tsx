
import React, { useState, useEffect } from 'react';
import { Html, Float, Sparkles, ContactShadows, Billboard } from '@react-three/drei';
import { useGame } from '../../context/GameContext';
import { X, ExternalLink, RefreshCcw, SignalHigh, Instagram, Youtube, Image as ImageIcon, Globe, Loader2, SkipForward, AlertTriangle } from 'lucide-react';
import { VisionContent } from '../../utils/generators';

export const VisionMirror: React.FC = () => {
    const { state, closeVision, rerollVision, toggleSettings } = useGame();
    const [loading, setLoading] = useState(false);
    
    let content: VisionContent | null = null;

    try {
        if (state.activeVisionVideo) {
            if (state.activeVisionVideo === "NO_SIGNAL") {
                content = null;
            } else if (state.activeVisionVideo.startsWith("{")) {
                content = JSON.parse(state.activeVisionVideo);
            } else {
                // Fallback for legacy string URLs
                content = { type: 'VIDEO', embedUrl: state.activeVisionVideo, originalUrl: state.activeVisionVideo, platform: 'YOUTUBE' };
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
        // Fake delay for effect
        setTimeout(() => setLoading(false), 800);
    }

    const handleOpenPopup = (url: string) => {
        const width = 1000;
        const height = 800;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        try {
            // Validate first
            new URL(url); 
            
            const popup = window.open(
                url, 
                'VisionPortal', 
                `width=${width},height=${height},top=${top},left=${left},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
            );
            // Fallback if blocked
            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                window.open(url, '_blank');
            }
        } catch (e) {
            console.error("Failed to open portal:", e);
            if (url && url.startsWith('http')) {
                try { window.open(url, '_blank'); } catch(err) {}
            }
        }
    };

    // Effect to stop loading when content changes
    useEffect(() => {
        setLoading(false);
    }, [state.activeVisionVideo]);

    if (!isVisible) return null;

    // --- RENDER CONTENT BASED ON TYPE ---
    const renderContent = () => {
        if (loading) {
            return (
                <div className="w-full h-full bg-black flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Static Noise CSS */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')] bg-cover pointer-events-none"></div>
                    <Loader2 size={48} className="text-purple-500 animate-spin relative z-10" />
                    <div className="text-purple-400 font-mono text-xs mt-4 tracking-widest relative z-10">TUNING VOID FREQUENCY...</div>
                </div>
            )
        }

        if (!content) {
            return (
                 <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#0a0a0a] relative">
                    <SignalHigh size={64} className="text-stone-700 mb-4 animate-pulse" />
                    <h2 className="text-xl text-stone-500 font-serif font-bold tracking-widest mb-2">NO SIGNAL</h2>
                    <p className="text-stone-600 text-xs font-mono mb-6">The Void could not retrieve your visions.</p>
                    <div className="flex flex-col gap-2 w-full max-w-[180px] z-20">
                        <button onClick={handleReroll} className="px-4 py-2 border border-purple-500 text-purple-400 text-xs hover:bg-purple-900/20 transition-colors cursor-pointer pointer-events-auto flex items-center justify-center gap-2">
                            <RefreshCcw size={14}/> RETRY SIGNAL
                        </button>
                        <button onClick={() => { closeVision(); toggleSettings(); }} className="px-4 py-2 border border-stone-600 text-stone-400 text-xs hover:bg-stone-800 transition-colors cursor-pointer pointer-events-auto">
                            CHECK SETTINGS
                        </button>
                    </div>
                </div>
            );
        }

        if (content.type === 'VIDEO') {
            return (
                <iframe 
                    src={content.embedUrl} 
                    title="Vision" 
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation" 
                    style={{ width: '100%', height: '100%', border: 'none', background: 'black' }} 
                />
            );
        }

        if (content.type === 'IMAGE') {
            return (
                <div className="w-full h-full bg-black flex flex-col items-center justify-center relative overflow-hidden">
                    <img 
                        src={content.embedUrl} 
                        alt="Vision" 
                        className="w-full h-full object-contain z-10" 
                    />
                    <div 
                        className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 z-0"
                        style={{ backgroundImage: `url(${content.embedUrl})` }}
                    ></div>
                </div>
            )
        }

        // SOCIAL LINKS (Instagram, Pinterest Social, etc)
        const isInsta = content.platform === 'INSTAGRAM';
        const isPin = content.platform === 'PINTEREST';
        const isShortLink = content.embedUrl.includes('pin.it'); // Explicit check
        
        let cardColor = "text-purple-300";
        let cardBorder = "border-purple-500/30";
        let cardBg = "bg-purple-900/10";
        let PlatformIcon: any = Globe;
        let actionText = "Open Portal";
        
        if (isPin) { 
            cardColor = "text-red-300"; cardBorder = "border-red-500/30"; cardBg = "bg-red-900/10"; 
            PlatformIcon = (props: any) => <div className={`text-red-500 font-bold text-4xl font-serif ${props.className || ''}`}>P</div>;
            // UPDATE: Check for '/pin/' to decide label
            const isStandardPin = content.embedUrl.includes('/pin/');
            actionText = isShortLink ? "Visit Pin" : isStandardPin ? "View Pin" : "View Board";
        }
        if (isInsta) { 
            cardColor = "text-pink-300"; cardBorder = "border-pink-500/30"; cardBg = "bg-pink-900/10"; 
            PlatformIcon = Instagram;
            actionText = "View Reel";
        }

        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] relative p-6">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-[#1a1025] to-black pointer-events-none"></div>
                
                <div className={`mb-6 p-4 rounded-full border-2 ${cardBorder} ${cardBg} shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10 animate-pulse-slow`}>
                    <PlatformIcon size={48} className={cardColor} />
                </div>

                <h3 className={`${cardColor} font-serif text-lg tracking-widest mb-2 font-bold uppercase z-10`}>
                    {content.platform} SIGNAL
                </h3>
                <p className="text-stone-500 text-xs text-center mb-8 max-w-[80%] leading-relaxed z-10">
                    The Void has intercepted a fragment from another world. <br/>
                    Open the portal to view the source.
                </p>

                <div className="flex flex-col gap-3 w-full max-w-[200px] z-50">
                    <button 
                        onClick={() => handleOpenPopup(content!.embedUrl)}
                        className="group relative px-6 py-3 bg-stone-900/80 text-white font-serif font-bold tracking-widest uppercase border border-stone-600 hover:bg-stone-800 transition-all shadow-lg flex items-center justify-center gap-2 pointer-events-auto cursor-pointer hover:scale-105 hover:border-yellow-600"
                    >
                            {actionText} <ExternalLink size={14}/>
                    </button>

                    <button 
                        onClick={handleReroll}
                        className="group relative px-6 py-3 bg-purple-900/20 text-purple-300 font-serif font-bold tracking-widest uppercase border border-purple-900/50 hover:bg-purple-900/40 transition-all shadow-lg flex items-center justify-center gap-2 pointer-events-auto cursor-pointer hover:scale-105"
                    >
                        NEXT SIGNAL <SkipForward size={14} />
                    </button>
                </div>
                
                <div className="absolute bottom-16 text-[10px] text-stone-700 font-mono break-all max-w-[90%] text-center z-10 opacity-50 truncate">
                    {content.embedUrl}
                </div>
            </div>
        );
    }

    return (
        <group position={[4, 5, 8]}>
            <fogExp2 attach="fog" args={['#2e1065', 0.05]} />
            <ambientLight intensity={0.5} color="#c084fc" />

            <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
                <pointLight position={[0, 0, 2]} intensity={2} color="#a855f7" distance={10} />
                <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
                    <group>
                        {/* Frame Glow */}
                        <mesh position={[0, 0, -0.2]}>
                            <planeGeometry args={[4.5, 7]} />
                            <meshBasicMaterial color="#a855f7" transparent opacity={0.1} />
                        </mesh>

                        {/* Frame Structure */}
                        <mesh position={[0, 0, -0.1]}>
                            <boxGeometry args={[3.8, 6.4, 0.2]} />
                            <meshStandardMaterial color="#0f0518" roughness={0.2} metalness={0.8} />
                        </mesh>
                        <mesh position={[0, 0, -0.15]}>
                            <boxGeometry args={[4.0, 6.6, 0.1]} />
                            <meshStandardMaterial color="#7e22ce" emissive="#7e22ce" emissiveIntensity={0.5} />
                        </mesh>

                        <Html 
                            transform 
                            position={[0, 0, 0.05]} 
                            style={{ 
                                width: '360px', 
                                height: '640px', 
                                background: '#000', 
                                borderRadius: '4px',
                                overflow: 'hidden'
                            }}
                            occlude="blending"
                        >
                            <div className="w-full h-full relative group bg-black border-2 border-purple-900/50 overflow-hidden">
                                {renderContent()}

                                <button onClick={closeVision} className="absolute top-2 right-2 bg-red-900/90 text-white p-2 rounded-full border border-red-500 hover:bg-red-700 shadow-lg pointer-events-auto z-50 cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>
                        </Html>
                    </group>
                </Float>
                <Sparkles count={100} scale={[5, 8, 5]} size={6} speed={0.4} opacity={0.6} color="#d8b4fe" />
            </Billboard>
            <ContactShadows opacity={0.8} scale={10} blur={2} far={10} color="#581c87" position={[0, -5, 0]} />
        </group>
    );
};
