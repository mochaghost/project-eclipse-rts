
import React from 'react';
import { Html, Float, Sparkles, ContactShadows, Billboard } from '@react-three/drei';
import { useGame } from '../../context/GameContext';
import { X, ExternalLink, RefreshCcw, SignalHigh, Instagram, Youtube, Image as ImageIcon, Globe } from 'lucide-react';
import { VisionContent } from '../../utils/generators';

export const VisionMirror: React.FC = () => {
    const { state, closeVision, rerollVision, toggleSettings } = useGame();
    
    let content: VisionContent | null = null;

    try {
        if (state.activeVisionVideo) {
            if (state.activeVisionVideo === "NO_SIGNAL") {
                content = null;
            } else if (state.activeVisionVideo.startsWith("{")) {
                content = JSON.parse(state.activeVisionVideo);
            } else {
                // Legacy support
                content = { type: 'VIDEO', embedUrl: state.activeVisionVideo, originalUrl: state.activeVisionVideo, platform: 'YOUTUBE' };
            }
        }
    } catch (e) {
        console.error("Vision Parse Error", e);
    }

    const isVisible = state.activeMapEvent === 'VISION_RITUAL';

    if (!isVisible) return null;

    // --- RENDER CONTENT BASED ON TYPE ---
    const renderContent = () => {
        if (!content) {
            return (
                 <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#0a0a0a] relative">
                    <SignalHigh size={64} className="text-stone-700 mb-4 animate-pulse" />
                    <h2 className="text-xl text-stone-500 font-serif font-bold tracking-widest mb-2">NO SIGNAL</h2>
                    <p className="text-stone-600 text-xs font-mono mb-6">The Void could not retrieve your visions.</p>
                    <button onClick={() => { closeVision(); toggleSettings(); }} className="px-4 py-2 border border-stone-600 text-stone-400 text-xs hover:bg-stone-800 transition-colors z-10 cursor-pointer">
                        CHECK SETTINGS
                    </button>
                </div>
            );
        }

        // VIDEO (YouTube Embeds work fine)
        // Strictly only render iframe for explicit VIDEO type
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

        // DIRECT IMAGE
        // This supports Pinterest Image Links (if ending in .jpg/.png), Discord images, etc.
        if (content.type === 'IMAGE') {
            return (
                <div className="w-full h-full bg-black flex flex-col items-center justify-center relative overflow-hidden">
                    <img 
                        src={content.embedUrl} 
                        alt="Vision" 
                        className="max-w-full max-h-full object-contain z-10" 
                    />
                    {/* Blurred background for aesthetic */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center blur-xl opacity-30 z-0"
                        style={{ backgroundImage: `url(${content.embedUrl})` }}
                    ></div>
                </div>
            )
        }

        // SOCIAL PORTAL CARD (Default Fallback)
        // Used for Instagram Posts, Pinterest BOARDS/PINS (webpages), TikTok, or ANY unknown link
        const isInsta = content.platform === 'INSTAGRAM';
        const isPin = content.platform === 'PINTEREST';
        const isTikTok = content.platform === 'TIKTOK';
        
        let cardColor = "text-purple-300";
        let cardBorder = "border-purple-500/30";
        let cardBg = "bg-purple-900/10";
        
        if (isPin) { cardColor = "text-red-300"; cardBorder = "border-red-500/30"; cardBg = "bg-red-900/10"; }
        if (isInsta) { cardColor = "text-pink-300"; cardBorder = "border-pink-500/30"; cardBg = "bg-pink-900/10"; }
        if (isTikTok) { cardColor = "text-cyan-300"; cardBorder = "border-cyan-500/30"; cardBg = "bg-cyan-900/10"; }

        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] relative p-6">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-[#1a1025] to-black pointer-events-none"></div>
                
                {/* Icon */}
                <div className={`mb-6 p-4 rounded-full border-2 ${cardBorder} ${cardBg} shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10`}>
                    {isInsta ? <Instagram size={48} className="text-pink-500" /> : 
                        isPin ? <div className="text-red-500 font-bold text-4xl font-serif">P</div> : 
                        isTikTok ? <div className="text-cyan-400 font-bold text-xl font-mono">TikTok</div> :
                        <Globe size={48} className="text-blue-400" />}
                </div>

                <h3 className={`${cardColor} font-serif text-lg tracking-widest mb-2 font-bold uppercase z-10`}>
                    {content.platform} SIGNAL
                </h3>
                <p className="text-stone-500 text-xs text-center mb-8 max-w-[80%] leading-relaxed z-10">
                    This scroll is sealed by the Ancients (Security Wards). <br/>
                    {isPin ? "Use 'Copy Image Address' for a direct view." : "Open the portal to view it."}
                </p>

                <a 
                    href={content.originalUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="group relative px-6 py-3 bg-stone-900/80 text-white font-serif font-bold tracking-widest uppercase border border-stone-600 hover:bg-stone-800 transition-all shadow-lg flex items-center gap-2 pointer-events-auto cursor-pointer z-50 hover:scale-105"
                >
                        OPEN PORTAL <ExternalLink size={14}/>
                </a>
                
                <div className="absolute bottom-16 text-[10px] text-stone-700 font-mono break-all max-w-[90%] text-center z-10 opacity-50">
                    {content.originalUrl.substring(0, 40)}...
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
                        {/* Frame */}
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

                                {/* Controls */}
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-auto">
                                    <button 
                                        onClick={rerollVision} 
                                        className="bg-black/80 text-yellow-500 border border-yellow-600 p-3 rounded-full hover:bg-yellow-900/50 hover:scale-110 transition-all shadow-lg cursor-pointer" 
                                        title="Next Vision"
                                    >
                                        <RefreshCcw size={24} />
                                    </button>
                                </div>

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
