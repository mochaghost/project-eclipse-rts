
import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { X, Save, Cloud, Database, Sliders, Volume2, Smartphone, Key, LogIn, Loader2, UploadCloud, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DEFAULT_FIREBASE_CONFIG, pushToCloud } from '../../services/firebase';

export const SettingsModal: React.FC = () => {
    const { state, toggleSettings, exportSave, importSave, clearSave, updateSettings, loginWithGoogle, logout } = useGame();
    const [tab, setTab] = useState<'GENERAL' | 'CLOUD'>('GENERAL');
    const [importData, setImportData] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    
    // Config state
    const [configInput, setConfigInput] = useState('');
    const [configStatus, setConfigStatus] = useState<'VALID' | 'INVALID' | 'EMPTY'>('EMPTY');

    // Load saved config from local storage on mount
    useEffect(() => {
        const savedConfig = localStorage.getItem('ECLIPSE_FIREBASE_CONFIG');
        if (savedConfig) {
            setConfigInput(savedConfig);
            validateConfig(savedConfig);
        } else {
            const def = JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2);
            setConfigInput(def);
            validateConfig(def);
        }
    }, []);

    const validateConfig = (input: string) => {
        try {
            // Try strict parse first
            JSON.parse(input);
            setConfigStatus('VALID');
        } catch (e) {
            try {
                // Try "Loose" parse (add quotes to keys) common in JS objects
                const loose = input.replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
                JSON.parse(loose);
                setConfigStatus('VALID');
            } catch (e2) {
                setConfigStatus('INVALID');
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setConfigInput(e.target.value);
        validateConfig(e.target.value);
    };

    const handleSaveConfig = () => {
        try {
            let parsed;
            try {
                parsed = JSON.parse(configInput);
            } catch (e) {
                // Auto-fix JS object notation to JSON
                const loose = configInput.replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
                parsed = JSON.parse(loose);
            }
            
            // Check for required fields
            if (!parsed.apiKey || !parsed.projectId) {
                alert("Config looks incomplete. Missing 'apiKey' or 'projectId'.");
                return;
            }

            localStorage.setItem('ECLIPSE_FIREBASE_CONFIG', JSON.stringify(parsed));
            if (confirm("Configuration Saved! The page must reload to initialize the new connection. Reload now?")) {
                window.location.reload();
            }
        } catch (e) {
            alert("Could not parse configuration. Please ensure you copied the object correctly from Firebase.");
        }
    };

    const handleForcePush = () => {
        if (!state.syncConfig?.roomId) return;
        if (confirm("FORCE UPLOAD: This will overwrite the Cloud data with the data on THIS device. Are you sure?")) {
            pushToCloud(state.syncConfig.roomId, state);
            alert("Data pushed to Cloud.");
        }
    };

    const handleLogin = async () => {
        setIsLoggingIn(true);
        try {
            await loginWithGoogle();
        } catch (e: any) {
            console.error(e);
            alert("LOGIN FAILED: " + (e.message || "Unknown Error. Check Console."));
        } finally {
            setIsLoggingIn(false);
        }
    };

    if (!state.isSettingsOpen) return null;

    const settings = state.settings || { masterVolume: 0.2, graphicsQuality: 'HIGH', uiScale: 1, safeAreaPadding: 0 };
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
                                </div>
                             </div>

                             {/* INTERFACE */}
                             <div>
                                <h3 className="text-stone-500 text-xs uppercase font-bold tracking-widest mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
                                    <Smartphone size={14} /> Interface
                                </h3>
                                <div className="bg-[#151210] p-5 border border-stone-800 space-y-6">
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
                                    </div>
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
                                    </div>
                                </div>
                             </div>
                        </div>
                    ) : (
                        // Cloud / Data Tab
                        <div className="space-y-8">
                            {/* API CONFIG SECTION */}
                            <div className={`p-6 border transition-colors ${configStatus === 'VALID' ? 'bg-green-950/10 border-green-900/50' : 'bg-[#151210] border-stone-800'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-stone-300 text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
                                        <Key size={14}/> Firebase Config
                                    </h4>
                                    {configStatus === 'VALID' ? 
                                        <span className="text-[10px] text-green-500 flex items-center gap-1 font-bold"><CheckCircle2 size={12}/> VALID FORMAT</span> : 
                                        <span className="text-[10px] text-red-500 flex items-center gap-1 font-bold"><AlertTriangle size={12}/> INVALID</span>
                                    }
                                </div>
                                
                                <textarea 
                                    value={configInput}
                                    onChange={handleInputChange}
                                    className={`w-full h-32 bg-black border p-2 text-[10px] font-mono outline-none mb-2 ${configStatus === 'VALID' ? 'text-green-400 border-green-900/50' : 'text-red-300 border-red-900/50'}`}
                                    placeholder='Paste the "firebaseConfig" object from Firebase Console here...'
                                />
                                <button 
                                    onClick={handleSaveConfig}
                                    disabled={configStatus !== 'VALID'}
                                    className={`w-full py-2 text-xs font-bold border transition-all ${configStatus === 'VALID' ? 'bg-green-900/20 text-green-400 border-green-800 hover:bg-green-900/40' : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'}`}
                                >
                                    SAVE & RELOAD
                                </button>
                                <p className="text-[10px] text-stone-500 mt-2 italic text-center">
                                    Paste the object found in Project Settings {`{ apiKey: "...", ... }`}
                                </p>
                            </div>

                            {user ? (
                                <div className="text-center py-6 animate-fade-in border border-green-900/30 bg-green-950/10">
                                    <div className="text-green-500 text-xl font-bold mb-2 font-serif tracking-widest">SOUL LINK ACTIVE</div>
                                    <div className="flex flex-col items-center mb-8">
                                        <div className="w-16 h-16 rounded-full bg-blue-900/30 border-2 border-blue-500 flex items-center justify-center mb-2">
                                            <span className="text-2xl text-blue-300 font-serif font-bold">{user.displayName?.[0] || 'A'}</span>
                                        </div>
                                        <div className="text-stone-300 font-bold">{user.displayName || 'Anonymous Soul'}</div>
                                        <div className="text-[10px] text-stone-600">{user.email}</div>
                                    </div>
                                    
                                    <div className="max-w-xs mx-auto mb-8 space-y-3">
                                        <button 
                                            onClick={handleForcePush}
                                            className="w-full bg-blue-900/30 border border-blue-800 text-blue-300 py-2 text-xs font-bold hover:bg-blue-900/50 flex items-center justify-center gap-2"
                                        >
                                            <UploadCloud size={14} /> FORCE PUSH LOCAL TO CLOUD
                                        </button>
                                        <button onClick={logout} className="w-full bg-red-900/30 text-red-500 px-6 py-2 border border-red-900 hover:bg-red-900/50 font-bold text-xs">
                                            SEVER LINK (LOGOUT)
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#151210] p-8 border border-stone-800 text-center">
                                    <h4 className="text-stone-300 text-sm font-bold mb-4 flex items-center justify-center gap-2 uppercase tracking-widest"><Cloud size={14}/> Cloud Connect</h4>
                                    <button 
                                        onClick={handleLogin}
                                        disabled={isLoggingIn || configStatus !== 'VALID'}
                                        className={`w-full text-black font-bold py-4 px-6 flex items-center justify-center gap-3 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] ${isLoggingIn ? 'bg-gray-400 cursor-wait' : configStatus !== 'VALID' ? 'bg-stone-700 cursor-not-allowed opacity-50' : 'bg-white hover:bg-gray-200'}`}
                                    >
                                        {isLoggingIn ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
                                        {isLoggingIn ? "CONNECTING..." : "LOGIN WITH GOOGLE"}
                                    </button>
                                    {configStatus !== 'VALID' && (
                                        <p className="text-red-500 text-[10px] mt-2 font-mono">Valid Config Required First</p>
                                    )}
                                </div>
                            )}

                            {/* Manual Backup */}
                            <div className="bg-[#151210] p-6 border border-stone-800">
                                <h4 className="text-stone-300 text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-widest"><Database size={14}/> Manual Backup</h4>
                                <div className="space-y-4">
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
                    )}
                </div>
            </div>
        </div>
    );
};
