
// A Web Audio API synthesizer for creating sound effects without external assets
// Designed for a Mystical, Ethereal aesthetic (Pleasant Dark Fantasy)

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientNodes: { osc: OscillatorNode, gain: GainNode }[] = [];

export const initAudio = () => {
    if (audioCtx) return;
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContext();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.3; // Balanced master volume
        masterGain.connect(audioCtx.destination);
    } catch (e) {
        console.error("Audio Init Failed", e);
    }
};

export const startAmbientDrone = () => {
    if (!audioCtx || !masterGain || ambientNodes.length > 0) return;

    // Create a "Celestial Pad" chord (Major 7th suspended feeling)
    // Frequencies: Low Root, Root, 5th, Major 7th
    const freqs = [110, 220, 329.63, 415.3]; // A2, A3, E4, G#4
    
    freqs.forEach((f, i) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        
        // Sine waves are smoother and more pleasant
        osc.type = 'sine'; 
        osc.frequency.value = f;
        
        // Detune slightly for a "chorus" effect (richer sound)
        osc.detune.value = (Math.random() * 10) - 5;

        // LFO for "breathing" movement
        const lfo = audioCtx!.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1 + (Math.random() * 0.1); // Slow breath
        const lfoGain = audioCtx!.createGain();
        lfoGain.gain.value = 0.02; // Subtle volume shift
        
        lfo.connect(gain.gain);
        lfo.start();

        // Base volume for this note (lower notes louder, high notes softer)
        gain.gain.value = 0.03 / (i + 1); 

        osc.connect(gain);
        gain.connect(masterGain!);
        osc.start();

        ambientNodes.push({ osc, gain });
    });
};

export const setVolume = (val: number) => {
    if (masterGain) {
        const now = audioCtx?.currentTime || 0;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setTargetAtTime(val, now, 0.2);
    }
};

export const playSfx = (type: 'UI_CLICK' | 'UI_HOVER' | 'COMBAT_HIT' | 'VICTORY' | 'FAILURE' | 'ERROR') => {
    if (!audioCtx || !masterGain) {
        initAudio();
        if (!audioCtx || !masterGain) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Connect
    osc.connect(gain);
    gain.connect(masterGain);

    switch (type) {
        case 'UI_CLICK':
            // Glassy/Woodblock sound
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;

        case 'UI_HOVER':
            // Soft wind tick
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
            break;

        case 'COMBAT_HIT':
            // Deep impact thump (less noise, more bass)
            osc.type = 'triangle'; 
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.3);
            
            gain.gain.setValueAtTime(0.6, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            
            osc.start(now);
            osc.stop(now + 0.3);
            break;

        case 'VICTORY':
            // Ethereal Chime (Ascending)
            osc.type = 'sine';
            const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major
            chord.forEach((note, i) => {
                const o = audioCtx!.createOscillator();
                const g = audioCtx!.createGain();
                o.type = 'sine';
                o.frequency.value = note;
                o.connect(g);
                g.connect(masterGain!);
                
                const start = now + (i * 0.1);
                g.gain.setValueAtTime(0, start);
                g.gain.linearRampToValueAtTime(0.2, start + 0.05);
                g.gain.exponentialRampToValueAtTime(0.001, start + 1.5);
                
                o.start(start);
                o.stop(start + 1.5);
            });
            break;

        case 'FAILURE':
            // Low Drone Fade (Sad but not annoying)
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(100, now + 1.5);
            
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0, now + 1.5);
            
            osc.start(now);
            osc.stop(now + 1.5);
            break;
            
         case 'ERROR':
            // Soft Buzzer
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.linearRampToValueAtTime(150, now + 0.15);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
            break;
    }
};
