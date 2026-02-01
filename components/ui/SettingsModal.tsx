
import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { X, Save, Cloud, Database, Sliders, Volume2, Monitor, Eye, Info, Link, Table, CheckCircle2 } from 'lucide-react';
import { convertToEmbedUrl } from '../../utils/generators';

export const SettingsModal: React.FC = () => {
    const { state, toggleSettings, exportSave, importSave, clearSave, connectToCloud, disconnectCloud, updateSettings, triggerEvent } = useGame();
    const [tab, setTab] = useState<'GENERAL' | 'CLOUD'>('GENERAL');
    const [importData, setImportData] = useState('');
    const [roomId, setRoomId] = useState('');
    const [config, setConfig] = useState({ apiKey: '', projectId: '', appId: '', authDomain: '', databaseURL: '' });

    // Restored UI State for Vision
    const [visionMode, setVisionMode] = useState<'DIRECT' | 'SHEET'>('DIRECT');

    // Load saved config from local storage on mount
    useEffect(() => {
        const savedConfig = localStorage.getItem('ECLIPSE_FIREBASE_CONFIG');
        const savedRoom = localStorage.getItem('ECLIPSE_ROOM_ID');
        if (savedConfig) {
            try {
                setConfig(JSON.parse(savedConfig));
            } catch (e) { console.error("Config parse error", e); }
        }
        if (savedRoom) setRoomId(savedRoom);
    }, []);

    if (!state.isSettingsOpen) return null;

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await connectToCloud(config, roomId);
        if (success) {
            // Save to local storage for convenience next time
            localStorage.setItem('ECLIPSE_FIREBASE_CONFIG', JSON.stringify(config));
            localStorage.setItem('ECLIPSE_ROOM_ID', roomId);
        }
    };

    const settings = state.settings || { masterVolume: 0.2, graphicsQuality: 'HIGH' };
    const directUrlValid = settings.directVisionUrl ? !!convertToEmbedUrl(settings.directVisionUrl) : false;

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
            <div className="relative w-full max-w-2xl bg-[#0c0a09] border-2 border-stone-700 h-[80vh] flex flex-col shadow-2xl">
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
                        <Cloud className="inline mr-2 mb-0.5" size={14}/> CLOUD SYNC
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
                        state.syncConfig?.isConnected ? (
                            <div className="text-center py-10">
                                <div className="text-green-500 text-xl font-bold mb-4 font-serif tracking-widest">CONNECTED TO VOID NET</div>
                                <div className="text-xs font-mono text-stone-500 mb-8 p-2 bg-black inline-block border border-stone-800">Room: {state.syncConfig.roomId}</div>
                                <div>
                                    <button onClick={disconnectCloud} className="bg-red-900/30 text-red-500 px-6 py-2 border border-red-900 hover:bg-red-900/50 font-bold text-xs">DISCONNECT</button>
                                </div>
                            </div>
                        ) : (
                             <div className="space-y-6">
                                <div className="bg-[#151210] p-6 border border-stone-800">
                                    <h4 className="text-stone-300 text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-widest"><Cloud size={14}/> Firebase Sync</h4>
                                    <p className="text-[10px] text-stone-500 mb-4 leading-relaxed">
                                        Syncs game state across devices sharing the same Room ID. 
                                        <br/><strong>Instructions:</strong> Create a Project at <em>console.firebase.google.com</em>, enable Realtime Database (Test Mode), and paste config below.
                                    </p>
                                    <form onSubmit={handleConnect} className="space-y-3">
                                        <input type="text" placeholder="Unique Room ID (e.g. MySecretRoom)" value={roomId} onChange={e => setRoomId(e.target.value)} className="w-full bg-black border border-stone-700 p-3 text-white text-xs outline-none focus:border-blue-500" required />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="text" placeholder="API Key" value={config.apiKey} onChange={e => setConfig({...config, apiKey: e.target.value})} className="w-full bg-black border border-stone-700 p-2 text-white text-[10px] outline-none focus:border-blue-500" required />
                                            <input type="text" placeholder="Project ID" value={config.projectId} onChange={e => setConfig({...config, projectId: e.target.value})} className="w-full bg-black border border-stone-700 p-2 text-white text-[10px] outline-none focus:border-blue-500" required />
                                            <input type="text" placeholder="App ID" value={config.appId} onChange={e => setConfig({...config, appId: e.target.value})} className="w-full bg-black border border-stone-700 p-2 text-white text-[10px] outline-none focus:border-blue-500" required />
                                            <input type="text" placeholder="Auth Domain" value={config.authDomain} onChange={e => setConfig({...config, authDomain: e.target.value})} className="w-full bg-black border border-stone-700 p-2 text-white text-[10px] outline-none focus:border-blue-500" />
                                        </div>
                                        <input type="text" placeholder="Database URL" value={config.databaseURL} onChange={e => setConfig({...config, databaseURL: e.target.value})} className="w-full bg-black border border-stone-700 p-3 text-white text-[10px] outline-none focus:border-blue-500" required />
                                        <button type="submit" className="w-full bg-blue-900/50 text-blue-200 hover:bg-blue-800 border border-blue-700 py-3 font-bold text-xs tracking-widest mt-2 uppercase transition-colors">Initialize Uplink</button>
                                    </form>
                                </div>

                                <div className="bg-[#151210] p-6 border border-stone-800">
                                    <h4 className="text-stone-300 text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-widest"><Database size={14}/> Manual Backup</h4>
                                    <div className="space-y-4">
                                        <p className="text-[10px] text-stone-500">Use this to transfer data between Localhost and your deployed site.</p>
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
