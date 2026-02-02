
import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { X, Save, Cloud, Database, Sliders, Volume2, Monitor, Eye, Info, Link, Table, CheckCircle2, FileJson, Copy, Smartphone, Move, Share2, UploadCloud, DownloadCloud, AlertTriangle, Key, LogIn, Loader2 } from 'lucide-react';
import { convertToEmbedUrl } from '../../utils/generators';
import { DEFAULT_FIREBASE_CONFIG, pushToCloud } from '../../services/firebase';

export const SettingsModal: React.FC = () => {
    const { state, toggleSettings, exportSave, importSave, clearSave, connectToCloud, disconnectCloud, updateSettings, triggerEvent, loginWithGoogle, logout } = useGame();
    const [tab, setTab] = useState<'GENERAL' | 'CLOUD'>('GENERAL');
    const [importData, setImportData] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    
    // Config state - prefill with defaults if empty
    const [config, setConfig] = useState(DEFAULT_FIREBASE_CONFIG);
    const [jsonPaste, setJsonPaste] = useState('');

    const [visionMode, setVisionMode] = useState<'DIRECT' | 'SHEET'>('DIRECT');

    // Load saved config from local storage on mount
    useEffect(() => {
        const savedConfig = localStorage.getItem('ECLIPSE_FIREBASE_CONFIG');
        if (savedConfig) {
            try {
                setConfig(JSON.parse(savedConfig));
            } catch (e) { 
                setConfig(DEFAULT_FIREBASE_CONFIG);
            }
        } else {
            setConfig(DEFAULT_FIREBASE_CONFIG);
        }
    }, []);

    // MANUAL SYNC HANDLERS
    const handleForcePush = () => {
        if (!state.syncConfig?.roomId) return;
        if (confirm("FORCE UPLOAD: This will overwrite the Cloud data with the data on THIS device. Are you sure?")) {
            pushToCloud(state.syncConfig.roomId, state);
            alert("Data pushed to Cloud. Other devices should update shortly.");
        }
    };

    const handleLogin = async () => {
        setIsLoggingIn(true);
        console.log("Starting Login Flow...");
        try {
            await loginWithGoogle();
        } catch (e: any) {
            console.error("Login Handler Caught Error:", e);
            alert("LOGIN ERROR: " + (e.message || "Unknown Error. Check Console."));
        } finally {
            setIsLoggingIn(false);
        }
    };

    if (!state.isSettingsOpen) return null;

    const settings = state.settings || { masterVolume: 0.2, graphicsQuality: 'HIGH', uiScale: 1, safeAreaPadding: 0 };
    const directUrlValid = settings.directVisionUrl ? !!convertToEmbedUrl(settings.directVisionUrl) : false;
    const user = state.syncConfig?.user;

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 pointer-events-auto">
            <div className="relative w-full max-w-2xl bg-[#0c0a09] border-2 border-stone-700 h-[85vh] flex flex-col shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-stone-800 bg-[#1c1917]">
                    <h2 className="text-2xl text-stone-200 font-serif font-bold tracking-widest flex items-center gap-2">
                        <Save className="text-stone-500" /> SYSTEM
                    </h2>
                    <button onClick={toggleSettings}><X size={24} className="text-stone-500 hover:text-white" /></button>
                </div>
                
                {/* Main Tabs */}
                <div className="flex border-b border-stone-800 bg-[#151210]">
                    <button onClick={() => setTab('GENERAL')} className={`flex-1 py-4 text-xs font-bold tracking-widest ${tab === 'GENERAL' ? 'text-yellow-500 border-b-2 border-yellow-500 bg-[#1c1917]' : 'text-stone-500 hover:text-stone-300'}`}>
                        <Sliders className="inline mr-2 mb-0.5" size={14}/> A/V & DATA
                    </button>
                    <button onClick={() => setTab('CLOUD')} className={`flex-1 py-4 text-xs font-bold tracking-widest ${tab === 'CLOUD' ? 'text-blue-400 border-b-2 border-blue-400 bg-[#1c1917]' : 'text-stone-500 hover:text-stone-300'}`}>
                        <Cloud className="inline mr-2 mb-0.5" size={14}/> CLOUD SAVE
                    </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-[#0c0a09]">
                    {tab === 'GENERAL' ? (
                        <div className="space-y-10">
                             {/* AUDIO */}
                             <div>
                                <h3 className="text-stone-500 text-xs uppercase font-bold tracking-widest mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
                                    <Volume2 size={14} /> Audio & Immersion
                                </h3>
                                <div className="bg-[#151210] p-5 border border-stone-800">
                                    <div className="flex justify-between text-stone-300 text-sm mb-2 font-mono">
                                        <span>Master Volume</span>
                                        <span>{Math.round(settings.masterVolume * 100)}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" max="1" step="0.05" 
                                        value={settings.masterVolume} 
                                        onChange={(e) => updateSettings({ masterVolume: parseFloat(e.target.value) })}
                                        className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-yellow-600 mb-2"
                                    />
                                    <p className="text-[10px] text-stone-600">Controls ambient drone, interface sounds, and music.</p>
                                </div>
                             </div>

                             {/* INTERFACE ADJUSTMENTS */}
                             <div>
                                <h3 className="text-stone-500 text-xs uppercase font-bold tracking-widest mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
                                    <Smartphone size={14} /> Interface Adjustments
                                </h3>
                                <div className="bg-[#151210] p-5 border border-stone-800 space-y-6">
                                    {/* UI SCALE */}
                                    <div>
                                        <div className="flex justify-between text-stone-300 text-sm mb-2 font-mono">
                                            <span>UI Scale</span>
                                            <span>{Math.round((settings.uiScale || 1) * 100)}%</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0.5" max="1.2" step="0.05" 
                                            value={settings.uiScale || 1} 
                                            onChange={(e) => updateSettings({ uiScale: parseFloat(e.target.value) })}
                                            className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-1"
                                        />
                                        <p className="text-[10px] text-stone-600">Shrink UI for small screens if elements overlap.</p>
                                    </div>

                                    {/* SAFE AREA */}
                                    <div>
                                        <div className="flex justify-between text-stone-300 text-sm mb-2 font-mono">
                                            <span>Safe Area Padding</span>
                                            <span>{settings.safeAreaPadding || 0}px</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" max="100" step="5" 
                                            value={settings.safeAreaPadding || 0} 
                                            onChange={(e) => updateSettings({ safeAreaPadding: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-1"
                                        />
                                        <p className="text-[10px] text-stone-600">Add empty space around edges (useful for notches/rounded corners).</p>
                                    </div>
                                </div>
                             </div>

                             {/* GRAPHICS */}
                             <div>
                                <h3 className="text-stone-500 text-xs uppercase font-bold tracking-widest mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
                                    <Monitor size={14} /> Graphics
                                </h3>
                                <div className="bg-[#151210] p-5 border border-stone-800 grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => updateSettings({ graphicsQuality: 'LOW' })}
                                        className={`p-4 border text-center transition-all ${settings.graphicsQuality === 'LOW' ? 'border-yellow-600 bg-yellow-900/10 text-yellow-500' : 'border-stone-700 text-stone-500 hover:border-stone-500'}`}
                                    >
                                        <div className="font-bold mb-1 text-sm">Performance</div>
                                        <div className="text-[10px] opacity-70">No Shadows, Basic Effects</div>
                                    </button>
                                    <button 
                                        onClick={() => updateSettings({ graphicsQuality: 'HIGH' })}
                                        className={`p-4 border text-center transition-all ${settings.graphicsQuality === 'HIGH' ? 'border-yellow-600 bg-yellow-900/10 text-yellow-500' : 'border-stone-700 text-stone-500 hover:border-stone-500'}`}
                                    >
                                        <div className="font-bold mb-1 text-sm">Quality</div>
                                        <div className="text-[10px] opacity-70">Soft Shadows, Bloom, Particles</div>
                                    </button>
                                </div>
                             </div>

                             {/* VISION MIRROR */}
                             <div>
                                <h3 className="text-purple-400 text-xs uppercase font-bold tracking-widest mb-4 flex items-center gap-2 border-b border-purple-900/30 pb-2">
                                    <Eye size={14} /> Vision Mirror Source
                                </h3>
                                <div className="bg-[#151210] p-1 border border-stone-800">
                                    {/* Sub-tabs for Vision Source */}
                                    <div className="flex gap-1 mb-4 bg-black p-1">
                                        <button 
                                            onClick={() => setVisionMode('DIRECT')} 
                                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${visionMode === 'DIRECT' ? 'bg-[#2a1a35] text-purple-300 border border-purple-500/30' : 'text-stone-600 hover:text-stone-400'}`}
                                        >
                                            <Link size={12} /> Direct Link
                                        </button>
                                        <button 
                                            onClick={() => setVisionMode('SHEET')} 
                                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${visionMode === 'SHEET' ? 'bg-[#2a1a35] text-purple-300 border border-purple-500/30' : 'text-stone-600 hover:text-stone-400'}`}
                                        >
                                            <Table size={12} /> Google Sheet
                                        </button>
                                    </div>

                                    <div className="px-4 pb-4">
                                        {visionMode === 'DIRECT' ? (
                                            <div className="space-y-3 animate-fade-in">
                                                <p className="text-[10px] text-stone-400">
                                                    Paste a link below. This overrides the Google Sheet.
                                                </p>
                                                <div className="bg-blue-900/20 p-2 border border-blue-900/50 rounded mb-2">
                                                    <p className="text-[10px] text-blue-200 font-bold mb-1">PRO TIP FOR PINTEREST:</p>
                                                    <ul className="text-[9px] text-stone-400 list-disc pl-4 space-y-1">
                                                        <li><strong>For Image Mode:</strong> Right-Click the image -&gt; "Copy Image Address" (ends in .jpg/.png).</li>
                                                        <li><strong>For Portal Mode:</strong> Copy the URL from the browser bar.</li>
                                                    </ul>
                                                </div>
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g., https://i.pinimg.com/.../image.jpg" 
                                                    value={settings.directVisionUrl || ''}
                                                    onChange={(e) => updateSettings({ directVisionUrl: e.target.value })}
                                                    className="w-full bg-black border border-stone-700 p-3 text-white text-xs font-mono focus:border-purple-500 outline-none"
                                                />
                                                {settings.directVisionUrl && (
                                                    <div className={`text-[10px] flex items-center gap-1 ${directUrlValid ? 'text-green-500' : 'text-yellow-500'}`}>
                                                        {directUrlValid ? <CheckCircle2 size={10}/> : <Info size={10}/>}
                                                        {directUrlValid ? 'Direct Image detected. Will render in 3D.' : 'Webpage detected. Will render as Portal Card.'}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-3 animate-fade-in">
                                                <p className="text-[10px] text-stone-400">
                                                    Paste your <strong>Google Sheet ID</strong> OR the full <strong>"Published to Web" Link</strong>.
                                                </p>
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g. 2PACX-... or https://docs.google.com/.../pubhtml" 
                                                    value={settings.googleSheetId || ''}
                                                    onChange={(e) => updateSettings({ googleSheetId: e.target.value })}
                                                    className="w-full bg-black border border-stone-700 p-3 text-white text-xs font-mono focus:border-purple-500 outline-none"
                                                />
                                                <div className="text-[10px] text-stone-600 italic">
                                                    * Ensure the sheet is published via File &gt; Share &gt; Publish to web.
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-6 pt-4 border-t border-stone-800 flex justify-end">
                                            <button 
                                                onClick={() => { toggleSettings(); setTimeout(() => triggerEvent('VISION_RITUAL'), 100); }} 
                                                className="bg-purple-900/50 text-purple-300 border border-purple-500 px-6 py-2 text-xs font-bold hover:bg-purple-900 hover:text-white transition-colors flex items-center gap-2"
                                            >
                                                <Eye size={14} /> TEST VISION
                                            </button>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    ) : (
                        // Cloud / Data Tab
                        user ? (
                            <div className="text-center py-6 animate-fade-in">
                                <div className="text-green-500 text-xl font-bold mb-2 font-serif tracking-widest">SOUL LINK ACTIVE</div>
                                <div className="flex flex-col items-center mb-8">
                                    <div className="w-16 h-16 rounded-full bg-blue-900/30 border-2 border-blue-500 flex items-center justify-center mb-2">
                                        <span className="text-2xl text-blue-300 font-serif font-bold">{user.displayName?.[0] || 'A'}</span>
                                    </div>
                                    <div className="text-stone-300 font-bold">{user.displayName || 'Anonymous Soul'}</div>
                                    <div className="text-[10px] text-stone-600">{user.email}</div>
                                    <div className="mt-2 text-[10px] font-mono bg-black px-2 py-1 border border-stone-800 text-stone-500">ID: {user.uid.substring(0,8)}...</div>
                                </div>
                                
                                <div className="max-w-xs mx-auto mb-8 text-left space-y-6">
                                    {/* MANUAL SYNC ACTIONS */}
                                    <div className="bg-[#151210] p-4 border border-stone-800 space-y-3">
                                        <p className="text-[9px] text-stone-500 uppercase font-bold text-center mb-2 flex items-center justify-center gap-2">
                                            <AlertTriangle size={10} className="text-yellow-600"/> Data Conflicts
                                        </p>
                                        
                                        <button 
                                            onClick={handleForcePush}
                                            className="w-full bg-blue-900/30 border border-blue-800 text-blue-300 py-2 text-xs font-bold hover:bg-blue-900/50 flex items-center justify-center gap-2"
                                        >
                                            <UploadCloud size={14} /> FORCE PUSH LOCAL TO CLOUD
                                        </button>
                                        <p className="text-[9px] text-stone-600 text-center leading-tight">
                                            Use this ONLY if you made progress offline and want to overwrite the cloud save.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <button onClick={logout} className="bg-red-900/30 text-red-500 px-6 py-2 border border-red-900 hover:bg-red-900/50 font-bold text-xs">SEVER LINK (LOGOUT)</button>
                                </div>
                            </div>
                        ) : (
                             <div className="space-y-6 h-full flex flex-col justify-center pb-20">
                                <div className="bg-[#151210] p-8 border border-stone-800 text-center">
                                    <h4 className="text-stone-300 text-sm font-bold mb-4 flex items-center justify-center gap-2 uppercase tracking-widest"><Cloud size={14}/> Cloud Sync (Google)</h4>
                                    <p className="text-[10px] text-stone-500 mb-6 leading-relaxed">
                                        Connect your Google account to enable cross-device saves. <br/>
                                        Your world will be stored in the cloud.
                                    </p>
                                    
                                    <button 
                                        onClick={handleLogin}
                                        disabled={isLoggingIn}
                                        className={`w-full text-black font-bold py-4 px-6 flex items-center justify-center gap-3 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] ${isLoggingIn ? 'bg-gray-400 cursor-wait' : 'bg-white hover:bg-gray-200'}`}
                                    >
                                        {isLoggingIn ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
                                        {isLoggingIn ? "CONNECTING..." : "LOGIN WITH GOOGLE"}
                                    </button>
                                </div>

                                <div className="bg-[#151210] p-6 border border-stone-800">
                                    <h4 className="text-stone-300 text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-widest"><Database size={14}/> Manual Backup</h4>
                                    <div className="space-y-4">
                                        <p className="text-[10px] text-stone-500">Transfer raw timeline data manually.</p>
                                        <textarea value={importData} onChange={e => setImportData(e.target.value)} className="w-full h-20 bg-black border border-stone-700 p-2 text-stone-300 text-[10px] font-mono outline-none focus:border-yellow-600" placeholder="Paste save string..." />
                                        <div className="flex gap-2">
                                            <button onClick={() => importSave(importData)} className="flex-1 bg-yellow-900/30 text-yellow-500 py-2 border border-yellow-800 hover:bg-yellow-900/50 text-xs font-bold">IMPORT</button>
                                            <button onClick={() => navigator.clipboard.writeText(exportSave())} className="flex-1 bg-stone-800 text-stone-300 py-2 border border-stone-600 hover:bg-stone-700 text-xs font-bold">COPY EXPORT</button>
                                        </div>
                                        <hr className="border-stone-800"/>
                                        <button onClick={clearSave} className="w-full text-red-500 border border-red-900/50 py-2 hover:bg-red-950/30 text-xs font-bold uppercase">Hard Reset (Wipe Data)</button>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
