
import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { X, Save, Cloud, Database, Sliders, Volume2, Smartphone, Key, LogIn, Loader2, UploadCloud, CheckCircle2, AlertTriangle, Wand2, Activity, Wifi, RefreshCw, Eye, Link as LinkIcon, FileSpreadsheet, Bell, Info } from 'lucide-react';
import { DEFAULT_FIREBASE_CONFIG, pushToCloud } from '../../services/firebase';

export const SettingsModal: React.FC = () => {
    // @ts-ignore
    const { state, toggleSettings, exportSave, importSave, clearSave, updateSettings, loginWithGoogle, logout, testCloudConnection, forcePull, requestPermissions } = useGame();
    const [tab, setTab] = useState<'GENERAL' | 'CLOUD'>('GENERAL');
    const [importData, setImportData] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    
    // Config state
    const [configInput, setConfigInput] = useState('');
    const [configStatus, setConfigStatus] = useState<'VALID' | 'INVALID' | 'EMPTY' | 'MISSING_DB'>('EMPTY');
    const [parsedPreview, setParsedPreview] = useState<any>(null);

    // Diagnostics state
    const [testStatus, setTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'FAIL'>('IDLE');
    const [testMessage, setTestMessage] = useState('');

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

    // --- ROBUST REGEX PARSER ---
    const extractFirebaseConfig = (input: string) => {
        if (!input) return null;

        const keys = [
            'apiKey', 'authDomain', 'databaseURL', 'projectId', 
            'storageBucket', 'messagingSenderId', 'appId', 'measurementId'
        ];
        
        const config: any = {};
        let foundAny = false;
        
        keys.forEach(key => {
            const regex = new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`, 'i');
            const match = input.match(regex);
            if (match && match[1]) {
                config[key] = match[1].trim();
                foundAny = true;
            }
        });

        if (!foundAny) return null;
        return config;
    }

    const validateConfig = (input: string) => {
        if (!input.trim()) {
            setConfigStatus('EMPTY');
            setParsedPreview(null);
            return;
        }

        const parsed = extractFirebaseConfig(input);
        
        if (parsed && parsed.apiKey && parsed.projectId) {
            if (!parsed.databaseURL) {
                setConfigStatus('MISSING_DB');
            } else {
                setConfigStatus('VALID');
            }
            setParsedPreview(parsed);
        } else {
            setConfigStatus('INVALID');
            setParsedPreview(null);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setConfigInput(e.target.value);
        validateConfig(e.target.value);
    };

    const handleSaveConfig = () => {
        if (configStatus !== 'VALID' || !parsedPreview) {
            alert("Cannot save invalid config. Ensure databaseURL is present.");
            return;
        }

        try {
            localStorage.setItem('ECLIPSE_FIREBASE_CONFIG', JSON.stringify(parsedPreview, null, 2));
            if (confirm("Configuration Saved! The system must restart to apply the new Soul Link. Reload now?")) {
                window.location.reload();
            }
        } catch (e) {
            alert("Save failed.");
        }
    };

    const handleForcePush = () => {
        if (!state.syncConfig?.roomId) return;
        if (confirm("FORCE UPLOAD: This will overwrite the Cloud data with the data on THIS device. Are you sure?")) {
            pushToCloud(state.syncConfig.roomId, state);
            alert("Data pushed to Cloud.");
        }
    };

    const handleTestConnection = async () => {
        setTestStatus('TESTING');
        const res = await testCloudConnection();
        if (res.success) {
            setTestStatus('SUCCESS');
            setTestMessage("Write Verified. Database accessible.");
        } else {
            setTestStatus('FAIL');
            setTestMessage(res.message);
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
                        <Sliders className="inline mr-2 mb-0.5" size={14}/> GENERAL & VISION
                    </button>
                    <button onClick={() => setTab('CLOUD')} className={`flex-1 py-4 text-xs font-bold tracking-widest ${tab === 'CLOUD' ? 'text-blue-400 border-b-2 border-blue-400 bg-[#1c1917]' : 'text-stone-500 hover:text-stone-300'}`}>
                        <Cloud className="inline mr-2 mb-0.5" size={14}/> CLOUD SAVE
                    </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-[#0c0a09]">
                    {tab === 'GENERAL' ? (
                        <div className="space-y-10">
                             {/* AUDIO & NOTIFICATIONS */}
                             <div>
                                <h3 className="text-stone-500 text-xs uppercase font-bold tracking-widest mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
                                    <Volume2 size={14} /> Audio & Alerts
                                </h3>
                                <div className="bg-[#151210] p-5 border border-stone-800 space-y-4">
                                    <div>
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
                                    <hr className="border-stone-800" />
                                    <div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-stone-300 text-sm font-mono">Notifications (iOS/Desktop)</span>
                                            <button 
                                                onClick={requestPermissions}
                                                className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-1 text-xs border border-stone-600 flex items-center gap-2"
                                            >
                                                <Bell size={12}/> Enable / Test
                                            </button>
                                        </div>
                                    </div>
                                </div>
                             </div>

                             {/* VISION MIRROR SETTINGS */}
                             <div>
                                <h3 className="text-purple-400 text-xs uppercase font-bold tracking-widest mb-4 flex items-center gap-2 border-b border-purple-900/30 pb-2">
                                    <Eye size={14} /> Vision Mirror Source
                                </h3>
                                <div className="bg-[#15101a] p-5 border border-purple-900/30 space-y-4">
                                    {/* Google Sheets / Automator Guide */}
                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] uppercase text-stone-500 font-bold mb-1">
                                            <FileSpreadsheet size={12} /> Google Sheet Source A (Primary)
                                        </label>
                                        <input 
                                            type="text" 
                                            value={settings.googleSheetId || ''} 
                                            onChange={(e) => updateSettings({ googleSheetId: e.target.value })}
                                            className="w-full bg-black border border-stone-700 p-2 text-stone-300 text-xs font-mono outline-none focus:border-purple-500 mb-2"
                                            placeholder="Paste Sheet ID or URL..."
                                        />
                                        
                                        <label className="flex items-center gap-2 text-[10px] uppercase text-stone-500 font-bold mb-1 mt-3">
                                            <FileSpreadsheet size={12} /> Google Sheet Source B (Secondary)
                                        </label>
                                        <input 
                                            type="text" 
                                            value={settings.googleSheetId2 || ''} 
                                            onChange={(e) => updateSettings({ googleSheetId2: e.target.value })}
                                            className="w-full bg-black border border-stone-700 p-2 text-stone-300 text-xs font-mono outline-none focus:border-purple-500"
                                            placeholder="Paste another Sheet ID or URL..."
                                        />

                                        <details className="mt-2 text-[10px] text-stone-500 bg-black/30 p-2 rounded cursor-pointer group" open>
                                            <summary className="font-bold flex items-center gap-1 hover:text-stone-300 select-none">
                                                <Info size={10} /> How to connect (100% Free)
                                            </summary>
                                            <div className="mt-2 pl-2 border-l border-stone-700 space-y-2 text-stone-400 leading-relaxed font-mono">
                                                <p>1. Make your Pinterest Board <strong>Public</strong>.</p>
                                                <p>2. Your Feed URL is: <br/><span className="text-purple-400 break-all select-all">https://www.pinterest.com/USERNAME/BOARD.rss</span></p>
                                                <p>3. Use <strong>Zapier</strong> or <strong>IFTTT</strong>.</p>
                                                <p className="text-yellow-600">Trigger: "RSS Feed" (NOT Pinterest)</p>
                                                <p>Action: "Google Sheets" &rarr; "Create Spreadsheet Row".</p>
                                                <p>4. Paste Sheet ID above.</p>
                                            </div>
                                        </details>
                                    </div>
                                    
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <span className="bg-[#15101a] px-2 text-[9px] text-stone-600 font-bold">AND</span>
                                        </div>
                                        <hr className="border-stone-800" />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] uppercase text-stone-500 font-bold mb-1">
                                            <LinkIcon size={12} /> Direct Focus Links (Manual List)
                                        </label>
                                        <textarea
                                            value={settings.directVisionUrl || ''} 
                                            onChange={(e) => updateSettings({ directVisionUrl: e.target.value })}
                                            className="w-full h-24 bg-black border border-stone-700 p-2 text-stone-300 text-xs font-mono outline-none focus:border-purple-500 resize-none"
                                            placeholder="Paste URL lists, HTML Embed codes, or mixed text here..."
                                        />
                                        <p className="text-[9px] text-stone-600 mt-1">
                                            Accepts raw text blocks, comma-separated lists, and HTML embed codes. All sources are combined.
                                        </p>
                                    </div>
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
                        // Cloud / Data Tab (Existing Code)
                        <div className="space-y-8">
                            {user ? (
                                <div className="animate-fade-in border border-green-900/30 bg-green-950/10">
                                    <div className="p-4 border-b border-green-900/30 flex justify-between items-center">
                                         <div className="text-green-500 text-sm font-bold font-serif tracking-widest flex items-center gap-2"><CheckCircle2 size={16}/> SOUL LINK ACTIVE</div>
                                         <div className="text-[10px] text-green-700 font-mono">Connected</div>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-full bg-blue-900/30 border-2 border-blue-500 flex items-center justify-center shrink-0">
                                                <span className="text-xl text-blue-300 font-serif font-bold">{user.displayName?.[0] || 'A'}</span>
                                            </div>
                                            <div>
                                                <div className="text-stone-300 font-bold">{user.displayName || 'Anonymous Soul'}</div>
                                                <div className="text-[10px] text-stone-600">{user.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button onClick={handleForcePush} className="w-full bg-yellow-900/10 border border-yellow-800/50 text-yellow-600 py-3 text-xs font-bold hover:bg-yellow-900/30 flex items-center justify-center gap-2">
                                                <UploadCloud size={14} /> FORCE PUSH LOCAL to CLOUD (OVERWRITE)
                                            </button>
                                            <button onClick={logout} className="w-full bg-red-900/30 text-red-500 px-6 py-2 border border-red-900 hover:bg-red-900/50 font-bold text-xs">
                                                SEVER LINK (LOGOUT)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#151210] p-8 border border-stone-800 text-center">
                                    <h4 className="text-stone-300 text-sm font-bold mb-4 flex items-center justify-center gap-2 uppercase tracking-widest"><Cloud size={14}/> Cloud Connect</h4>
                                    <button onClick={handleLogin} disabled={isLoggingIn || configStatus !== 'VALID'} className={`w-full text-black font-bold py-4 px-6 flex items-center justify-center gap-3 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] ${isLoggingIn ? 'bg-gray-400 cursor-wait' : configStatus !== 'VALID' ? 'bg-stone-700 cursor-not-allowed opacity-50' : 'bg-white hover:bg-gray-200'}`}>
                                        {isLoggingIn ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
                                        {isLoggingIn ? "CONNECTING..." : "LOGIN WITH GOOGLE"}
                                    </button>
                                </div>
                            )}

                            {/* API CONFIG SECTION */}
                            <div className={`p-6 border transition-colors ${configStatus === 'VALID' ? 'bg-green-950/10 border-green-900/50' : configStatus === 'MISSING_DB' ? 'bg-yellow-950/10 border-yellow-800' : 'bg-[#151210] border-stone-800'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-stone-300 text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
                                        <Key size={14}/> Firebase Config
                                    </h4>
                                    {configStatus === 'VALID' ? 
                                        <span className="text-[10px] text-green-500 flex items-center gap-1 font-bold animate-pulse"><CheckCircle2 size={12}/> VALID CONFIG DETECTED</span> : 
                                        <span className="text-[10px] text-stone-500 flex items-center gap-1 font-bold"><AlertTriangle size={12}/> PASTE CODE SNIPPET</span>
                                    }
                                </div>
                                <textarea value={configInput} onChange={handleInputChange} spellCheck={false} className={`w-full h-32 bg-black border p-2 text-[10px] font-mono outline-none mb-2 ${configStatus === 'VALID' ? 'text-green-400 border-green-900/50' : 'text-stone-300 border-stone-700'}`} placeholder={`// Paste the ENTIRE block from Firebase here...`} />
                                <div className="flex gap-2">
                                     <button onClick={handleSaveConfig} disabled={configStatus !== 'VALID'} className={`flex-1 py-3 text-xs font-bold border transition-all flex items-center justify-center gap-2 ${configStatus === 'VALID' ? 'bg-green-900/20 text-green-400 border-green-800 hover:bg-green-900/40' : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'}`}>
                                        <Wand2 size={14} /> SAVE & RELOAD (AUTO-CLEAN)
                                    </button>
                                </div>
                            </div>

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
