import React, { useState, useEffect } from 'react';
import type { LiveTelemetry, BreedingSiteInfo } from 'types';
import MissionTrackMap from './MissionTrackMap'; 

// --- Instrument Components ---

const GaugeWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    // Slightly more flexible sizing for mobile (w-24/h-24 on small phones, w-28 on larger)
    <div className={`relative w-24 h-24 md:w-28 md:h-28 bg-[#0A1019] rounded-full border-2 border-gray-700 flex items-center justify-center shrink-0 ${className}`}>
        {children}
    </div>
);

const Speedometer: React.FC<{ speed: number }> = ({ speed }) => {
    const SPEED_MAX = 22;
    const angle = Math.min(speed, SPEED_MAX) / SPEED_MAX * 270 - 135;
    return (
        <GaugeWrapper>
            <div className="absolute w-full h-full">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="absolute w-full h-full" style={{ transform: `rotate(${i * (270 / 11) - 135}deg)` }}>
                        <div className="w-0.5 h-3 bg-white/50 absolute top-2.5 left-1/2 -ml-0.25 rounded-full"></div>
                    </div>
                ))}
            </div>
            <div className="absolute w-full h-full text-white text-[10px] md:text-xs text-center" style={{transform: `rotate(135deg)`}}>
                <span className="absolute" style={{transform: 'rotate(-135deg) translateY(-2.8rem)'}}>0</span>
                <span className="absolute" style={{transform: 'rotate(-90deg) translateY(-2.8rem)'}}>6</span>
                <span className="absolute" style={{transform: 'rotate(0deg) translateY(-2.8rem)'}}>12</span>
                <span className="absolute" style={{transform: 'rotate(90deg) translateY(-2.8rem)'}}>20</span>
                <span className="absolute" style={{transform: 'rotate(135deg) translateY(-2.8rem)'}}>22</span>
            </div>
            <div className="absolute w-1 h-1/2 bg-transparent top-0 left-1/2 -ml-0.5 origin-bottom transition-transform duration-200" style={{ transform: `rotate(${angle}deg)` }}>
                <div className="w-1 h-10 md:h-12 bg-green-400 rounded-t-full" />
            </div>
            <div className="relative z-10 text-center bg-[#0A1019] p-1 rounded-lg">
                <p className="text-[10px] md:text-xs text-gray-400">SPEED</p>
                <p className="text-base md:text-lg font-mono font-bold text-white">{speed.toFixed(1)}</p>
                <p className="text-[10px] text-gray-400">m/s</p>
            </div>
        </GaugeWrapper>
    );
};

const AttitudeIndicatorGauge: React.FC<{ roll: number; pitch: number }> = ({ roll, pitch }) => {
    return (
        <GaugeWrapper>
            <div className="w-full h-full rounded-full overflow-hidden transition-transform duration-100 ease-linear" style={{ transform: `rotate(${-roll}deg)` }}>
                <div className="absolute w-full h-[200%] bg-sky-400 top-[-50%]" style={{ transform: `translateY(${-pitch * 2.5}px)` }}>
                    <div className="h-1/2 bg-yellow-800 absolute bottom-0 w-full" />
                </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 100 50" fill="none" className="w-12 h-6 md:w-16 md:h-8">
                    <path d="M50 25 L30 35 M50 25 L70 35 M50 25 L50 10 M10 25 H 90" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
                </svg>
            </div>
        </GaugeWrapper>
    );
};

const HeadingIndicator: React.FC<{ heading: number }> = ({ heading }) => {
    const cardinals = ['N', 'E', 'S', 'W'];
    return (
        <GaugeWrapper>
            <div className="absolute w-[120%] h-[120%] rounded-full transition-transform duration-200" style={{ transform: `rotate(${-heading}deg)` }}>
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="absolute w-full h-full" style={{ transform: `rotate(${i * 30}deg)` }}>
                        <div className={`absolute top-2.5 left-1/2 -ml-0.5 ${i % 3 === 0 ? 'w-0.5 h-4 bg-white' : 'w-px h-2.5 bg-gray-400'}`} />
                        {i % 3 === 0 && <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[10px] md:text-sm font-bold text-white">{cardinals[i/3]}</span>}
                    </div>
                ))}
            </div>
             <div className="absolute inset-0 flex items-center justify-center">
                 <svg viewBox="0 0 50 50" fill="#2DD4BF" className="w-6 h-6 md:w-7 md:h-7 drop-shadow-lg"><path d="M25 5 L40 45 L25 35 L10 45 Z" /></svg>
             </div>
             <div className="absolute top-1 text-green-400 font-mono text-[10px] md:text-sm">{Math.round(heading)}°</div>
        </GaugeWrapper>
    );
};

const VerticalSpeedIndicator: React.FC<{ vspeed: number }> = ({ vspeed }) => {
    const VSPEED_MAX = 10;
    const angle = Math.max(-VSPEED_MAX, Math.min(vspeed, VSPEED_MAX)) / VSPEED_MAX * 90;
    return (
        <GaugeWrapper>
            <div className="absolute w-full h-full text-white text-[10px] md:text-xs">
                <span className="absolute top-1/2 -translate-y-1/2 left-3">0</span>
                <span className="absolute top-1/4 -translate-y-1/2 left-4">6</span>
                <span className="absolute bottom-1/4 translate-y-1/2 left-4">6</span>
                <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px]">UP</span>
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px]">DN</span>
            </div>
             <div className="absolute w-1/2 h-0.5 bg-transparent top-1/2 -mt-px right-0 origin-left transition-transform duration-200" style={{ transform: `rotate(${angle}deg)` }}>
                <div className="w-full h-0.5 bg-green-400 rounded-r-full" />
             </div>
            <div className="relative z-10 text-center bg-[#0A1019] p-1 rounded-lg">
                <p className="text-[10px] md:text-xs text-gray-400">V.SPEED</p>
                <p className="text-base md:text-lg font-mono font-bold text-white">{vspeed.toFixed(1)}</p>
                <p className="text-[10px] text-gray-400">m/s</p>
            </div>
        </GaugeWrapper>
    );
};

// --- Panels ---

const FlightInstruments: React.FC<{ telemetry: LiveTelemetry }> = ({ telemetry }) => {
  return (
    <div className="bg-gray-800 rounded-xl shadow-inner p-2 md:p-1.5 border border-gray-700">
      <h2 className="text-xs font-semibold uppercase text-gray-400 mb-2 md:mb-1 text-center tracking-wider">Instruments</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-2 justify-items-center">
          <Speedometer speed={telemetry.speed} />
          <AttitudeIndicatorGauge roll={telemetry.roll} pitch={telemetry.pitch} />
          <HeadingIndicator heading={telemetry.heading} />
          <VerticalSpeedIndicator vspeed={telemetry.verticalSpeed} />
      </div>
    </div>
  );
};

const ModeButton: React.FC<{ label: string, active: boolean }> = ({ label, active }) => (
  <div
    className={`flex flex-1 items-center justify-center text-center py-2 md:py-1 px-1 rounded-lg md:rounded-md transition-colors ${
      active
        ? 'bg-orange-600 text-white shadow-lg'
        : 'bg-gray-700 md:bg-gray-600/50 text-gray-300 border border-gray-600 md:border-transparent'
    }`}
  >
    <span className="text-[10px] md:text-[10px] font-bold md:font-semibold uppercase tracking-tight">{label}</span>
  </div>
);

const ModesPanel: React.FC<{ telemetry: LiveTelemetry }> = ({ telemetry }) => {
  return (
    <div className="bg-gray-800 rounded-xl shadow-inner p-2 md:p-1.5 border border-gray-700">
      <h2 className="text-xs font-semibold uppercase text-gray-400 mb-2 md:mb-0.5 tracking-wider">Modes</h2>
      {/* 3 columns on mobile looks cleaner for small buttons, 2 on desktop */}
      <div className="grid grid-cols-3 md:grid-cols-2 gap-2 md:gap-1">
        <ModeButton label="ARM" active={telemetry.armed} />
        <ModeButton label="ANGLE" active={telemetry.modes.angle} />
        <ModeButton label="POS HOLD" active={telemetry.modes.positionHold} />
        <ModeButton label="RTL" active={telemetry.modes.returnToHome} />
        <ModeButton label="ALT HOLD" active={telemetry.modes.altitudeHold} />
        <ModeButton label="HDG HOLD" active={telemetry.modes.headingHold} />
        <ModeButton label="AIRMODE" active={telemetry.modes.airmode} />
        <ModeButton label="SURFACE" active={telemetry.modes.surface} />
        <ModeButton label="BRAKING" active={telemetry.modes.mcBraking} />
        <ModeButton label="BEEPER" active={telemetry.modes.beeper} />
      </div>
    </div>
  );
};

const TelemetryPanel: React.FC<{ telemetry: LiveTelemetry }> = ({ telemetry }) => {
  return (
    <div className="bg-gray-800 rounded-xl shadow-inner p-2 md:p-1.5 border border-gray-700">
      <h2 className="text-xs font-semibold uppercase text-gray-400 mb-2 md:mb-0.5 tracking-wider">Telemetry</h2>
      <div className="grid grid-cols-2 gap-2 md:gap-1">
        <div className="flex flex-col items-center justify-center bg-gray-900 md:bg-gray-700/50 py-2 md:py-1.5 px-1 rounded-lg md:rounded-md border border-gray-700 md:border-transparent">
          <span className="text-[10px] md:text-[9px] text-gray-400 uppercase font-bold">Signal</span>
          <span className="font-mono text-sm md:text-xs font-semibold text-white">{telemetry.signalStrength}</span>
          <span className="text-[9px] md:text-[8px] text-gray-400">dBm</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-gray-900 md:bg-gray-700/50 py-2 md:py-1.5 px-1 rounded-lg md:rounded-md border border-gray-700 md:border-transparent">
          <span className="text-[10px] md:text-[9px] text-gray-400 uppercase font-bold">Battery</span>
          <span className="font-mono text-sm md:text-xs font-semibold text-white">{telemetry.battery.percentage.toFixed(1)}%</span>
          <span className="text-[9px] md:text-[8px] text-gray-400">{telemetry.battery.voltage.toFixed(1)}V</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-gray-900 md:bg-gray-700/50 py-2 md:py-1.5 px-1 rounded-lg md:rounded-md border border-gray-700 md:border-transparent">
          <span className="text-[10px] md:text-[9px] text-gray-400 uppercase font-bold">Satellites</span>
          <span className="font-mono text-sm md:text-xs font-semibold text-white">{telemetry.satellites}</span>
          <span className="text-[9px] md:text-[8px] text-gray-400">GPS</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-gray-900 md:bg-gray-700/50 py-2 md:py-1.5 px-1 rounded-lg md:rounded-md border border-gray-700 md:border-transparent">
          <span className="text-[10px] md:text-[9px] text-gray-400 uppercase font-bold">Distance</span>
          <span className="font-mono text-sm md:text-xs font-semibold text-white">{telemetry.distanceFromHome.toFixed(0)}</span>
          <span className="text-[9px] md:text-[8px] text-gray-400">m</span>
        </div>
      </div>
    </div>
  );
};

// --- Main Live View Component ---

interface LiveMissionViewProps {
  telemetry: LiveTelemetry;
  onEndMission: (durationSeconds: number, gpsTrack: { lat: number; lon: number }[], detectedSites: BreedingSiteInfo[]) => void;
  mapStyle: string;
}

const LiveMissionView: React.FC<LiveMissionViewProps> = ({ telemetry, onEndMission, mapStyle }) => {
  const [isConfirmingEndMission, setConfirmingEndMission] = useState(false);
  const missionName = "Sector 7G"; 

  const [missionSeconds, setMissionSeconds] = useState(0);

  useEffect(() => {
    setMissionSeconds(0); 
    const timer = setInterval(() => {
      setMissionSeconds(seconds => seconds + 1);
    }, 1000); 
    return () => clearInterval(timer); 
  }, []); 

  const formattedMissionTime = `${Math.floor(missionSeconds / 60).toString().padStart(2, '0')}:${(missionSeconds % 60).toString().padStart(2, '0')}`;

  return (
    // MODIFIED: h-[100dvh] and flex-col for mobile sizing, z-[100] so it covers the bottom navigation bar
    <div className="fixed inset-0 h-[100dvh] bg-gray-900 text-white font-sans z-[100] flex flex-col animate-fade-in overflow-hidden">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center p-3 md:p-4 bg-gray-900 border-b border-gray-800 shrink-0 shadow-md z-10">
        <div>
            <h1 className="text-sm md:text-xl font-bold text-orange-500">Live Mission:</h1>
            <h2 className="text-lg md:text-xl font-bold text-white leading-tight">{missionName}</h2>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="text-right">
            <span className="text-[10px] md:text-xs uppercase text-gray-400 block tracking-wider">Mission Time</span>
            <p className="font-mono text-lg md:text-xl font-bold">{formattedMissionTime}</p>
          </div>
          <button
            onClick={() => setConfirmingEndMission(true)}
            className="bg-red-600 text-white font-bold py-2 md:py-2 px-3 md:px-4 rounded-lg shadow-md hover:bg-red-700 transition-colors text-sm md:text-base"
          >
            End Mission
          </button>
        </div>
      </div>

      {/* Main Layout: Stack on mobile, side-by-side on desktop */}
      <main className="flex-1 flex flex-col md:flex-row min-h-0 bg-gray-950">

        {/* Top/Left Column: Map/Camera */}
        {/* On mobile: Takes exactly 45% of the screen height. On desktop: takes 2/3 of width */}
        <div className="w-full md:w-2/3 h-[45vh] md:h-full bg-black relative flex items-center justify-center shrink-0 border-b md:border-b-0 md:border-r border-gray-800">
          
          <p className="text-gray-500 text-sm md:text-lg px-8 text-center">(Map / Camera Feed Placeholder)</p>
          
          {/* OSD (On-Screen Display) */}
          <div className="absolute top-2 md:top-4 left-2 md:left-4 p-1 md:p-2 bg-black/50 backdrop-blur rounded">
            <span className="text-[10px] md:text-xs uppercase text-gray-300">LAT</span>
            <p className="font-mono text-sm md:text-lg">{telemetry.gps.lat.toFixed(6)}</p>
          </div>
          <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 p-1 md:p-2 bg-black/50 backdrop-blur rounded">
            <span className="text-[10px] md:text-xs uppercase text-gray-300">ALT</span>
            <p className="font-mono text-sm md:text-lg">{telemetry.altitude.toFixed(1)} <span className="text-xs md:text-base">m</span></p>
          </div>
          <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 p-1 md:p-2 bg-black/50 backdrop-blur rounded">
            <span className="text-[10px] md:text-xs uppercase text-gray-300">SPD</span>
            <p className="font-mono text-sm md:text-lg">{telemetry.speed.toFixed(1)} <span className="text-xs md:text-base">m/s</span></p>
          </div>

          {/* Mini-Map - Scaled down slightly for mobile */}
          <div className="absolute top-2 md:top-4 right-2 md:right-4 w-32 h-24 md:w-48 md:h-40 bg-gray-900/80 backdrop-blur rounded-lg border border-gray-600 p-2 flex flex-col shadow-lg">
            <span className="text-[10px] md:text-xs text-gray-300 font-semibold tracking-wide">Mini Map</span>
            <div className="flex-1 flex items-center justify-center">
              <span className="text-gray-500 text-[10px] md:text-sm">(Map View)</span>
            </div>
            <div className="flex justify-between md:flex-col">
              <p className="font-mono text-[9px] md:text-xs text-gray-400">{telemetry.gps.lat.toFixed(4)}</p>
              <p className="font-mono text-[9px] md:text-xs text-gray-400">{telemetry.gps.lon.toFixed(4)}</p>
            </div>
          </div>
        </div>

        {/* Bottom/Right Column: Scrollable Instruments Panel */}
        <div className="w-full md:w-1/3 flex flex-col gap-3 md:gap-1.5 overflow-y-auto p-3 md:p-2 pb-8 md:pb-2">
          <FlightInstruments telemetry={telemetry} />
          <ModesPanel telemetry={telemetry} />
          <TelemetryPanel telemetry={telemetry} />
        </div>
        
      </main>

      {/* End Mission Modal: Updated z-index to 200 */}
      {isConfirmingEndMission && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200]" aria-modal="true" role="dialog">
            <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-600 max-w-sm w-[90%] text-center animate-dialog-in">
                <h2 className="text-xl font-bold text-white mb-2">End Mission?</h2>
                <p className="text-sm text-gray-400 mb-6">Are you sure you want to completely terminate the current live flight operation?</p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <button 
                        onClick={() => setConfirmingEndMission(false)} 
                        className="w-full sm:w-auto px-6 py-3 text-sm bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onEndMission(missionSeconds, telemetry.gpsTrack, telemetry.detectedSites)} 
                        className="w-full sm:w-auto px-6 py-3 text-sm bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/50 transition-colors"
                    >
                        Confirm Termination
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// Animations
const style = document.createElement('style');
style.innerHTML = `
@keyframes fade-in {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
    animation: fade-in 0.3s ease-out forwards;
}
@keyframes dialog-in {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-dialog-in {
    animation: dialog-in 0.2s ease-out forwards;
}
`;
document.head.appendChild(style);

export default LiveMissionView;