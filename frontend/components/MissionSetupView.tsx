import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L, { LatLng, Icon } from 'leaflet';
import type { MissionPlan } from 'types';
import iconUrl from 'leaflet/dist/images/marker-icon.png?url';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png?url';

import LoadPlanModal from './LoadPlanModal';
import { mapStyleProviders } from '../utils/mapStyles'; 

const DefaultIcon = new Icon({
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
    iconAnchor: [12, 41],
    shadowAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Map Component ---
const WaypointMap = React.memo(({ waypoints, onAddWaypoint }: { 
    waypoints: LatLng[], 
    onAddWaypoint: (latlng: LatLng) => void 
}) => {
  useMapEvents({
    click(e) {
      onAddWaypoint(e.latlng);
    },
  });

  return (
    <>
      {waypoints.map((pos, idx) => (
        <Marker key={idx} position={pos} icon={DefaultIcon} />
      ))}
    </>
  );
});


// --- Main View Component ---
interface MissionSetupViewProps {
  onLaunch: (plan: MissionPlan) => void;
  onClose: () => void;
  mapStyle: string;
}

const MissionSetupView: React.FC<MissionSetupViewProps> = ({ onLaunch, onClose, mapStyle }) => {
  const { url, attribution } = mapStyleProviders[mapStyle] || mapStyleProviders['Default'];
  const [missionName, setMissionName] = useState('New Mission Plan');
  const [altitude, setAltitude] = useState(50);
  const [speed, setSpeed] = useState(10);
  const [waypoints, setWaypoints] = useState<LatLng[]>([]);
  const [undoStack, setUndoStack] = useState<LatLng[][]>([]);
  const [redoStack, setRedoStack] = useState<LatLng[][]>([]);
  const [checklist, setChecklist] = useState({
    battery: false,
    propellers: false,
    gps: false,
    weather: false,
  });
  const [preArmingChecks, setPreArmingChecks] = useState({
    uavLevelled: { status: 'loading' as 'loading' | 'success' | 'error', label: 'UAV is Levelled' },
    runtimeCalibration: { status: 'loading' as 'loading' | 'success' | 'error', label: 'Run-time Calibration' },
    cpuLoad: { status: 'loading' as 'loading' | 'success' | 'error', label: 'CPU Load' },
    navigationSafe: { status: 'loading' as 'loading' | 'success' | 'error', label: 'Navigation is Safe' },
    compassCalibrated: { status: 'loading' as 'loading' | 'success' | 'error', label: 'Compass Calibrated' },
    accelerometerCalibrated: { status: 'loading' as 'loading' | 'success' | 'error', label: 'Accelerometer Calibrated' },
    settingsValidated: { status: 'loading' as 'loading' | 'success' | 'error', label: 'Settings Validated' },
    hardwareHealth: { status: 'loading' as 'loading' | 'success' | 'error', label: 'Hardware Health' },
  });
  const [isLoadModalOpen, setLoadModalOpen] = useState(false);

  useEffect(() => {
    const checks = Object.keys(preArmingChecks) as Array<keyof typeof preArmingChecks>;
    checks.forEach((key, index) => {
      setTimeout(() => {
        setPreArmingChecks(prev => ({
          ...prev,
          [key]: { ...prev[key], status: 'success' as const }
        }));
      }, (index + 1) * 500); 
    });
  }, []);

  const handleChecklistChange = (item: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };
  
  const handleAddWaypoint = React.useCallback((latlng: LatLng) => {
    setUndoStack(prev => [...prev, waypoints]);
    setRedoStack([]);
    setWaypoints(prev => [...prev, latlng]);
  }, [waypoints]);

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, waypoints]);
      setWaypoints(previousState);
      setUndoStack(prev => prev.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, waypoints]);
      setWaypoints(nextState);
      setRedoStack(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (waypoints.length > 0) {
      setUndoStack(prev => [...prev, waypoints]);
      setRedoStack([]);
      setWaypoints([]);
    }
  };

  const isChecklistComplete = Object.values(checklist).every(Boolean);
  const allPreArmingComplete = Object.values(preArmingChecks).every(check => check.status === 'success');
  const allChecksComplete = isChecklistComplete && allPreArmingComplete;

  const savePlan = async (plan: MissionPlan): Promise<MissionPlan | null> => {
    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      });
      if (!response.ok) {
        let errorMsg = 'Failed to save plan';
        try {
          const err = await response.json();
          errorMsg = err.error || errorMsg;
        } catch (e) {
          errorMsg = `${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      alert(`Error: ${error instanceof Error ? error.message : 'Could not save mission plan.'}`);
      return null;
    }
  };

  const handleSaveAndClose = async () => {
    const plan: MissionPlan = {
      name: missionName,
      altitude,
      speed,
      waypoints: waypoints.map(wp => ({ lat: wp.lat, lon: wp.lng })),
    };
    
    const savedPlan = await savePlan(plan);
    if (savedPlan) {
      alert('Plan saved successfully!'); 
    }
  };

  const handleLaunch = async () => {
    const plan: MissionPlan = {
      name: missionName,
      altitude,
      speed,
      waypoints: waypoints.map(wp => ({ lat: wp.lat, lon: wp.lng })),
    };
    
    const savedPlan = await savePlan(plan);
    if (savedPlan) {
      onLaunch(savedPlan); 
    }
  };

  const handlePlanSelected = (plan: MissionPlan) => {
    setMissionName(plan.name);
    setAltitude(plan.altitude);
    setSpeed(plan.speed);
    
    const loadedWaypoints = plan.waypoints 
      ? plan.waypoints.map(wp => new LatLng(wp.lat, wp.lon))
      : [];
    setWaypoints(loadedWaypoints);
    
    setLoadModalOpen(false); 
  };

  return (
    <>
      {/* MODIFIED: Changed inset-0 to support mobile safe areas (dvh) */}
      <div className="fixed inset-0 h-[100dvh] bg-black bg-opacity-75 flex items-center justify-center z-[100] md:p-6">
        
        {/* MODIFIED: Fills screen on mobile, rounded modal on desktop */}
        <div className="bg-gray-900 text-white md:rounded-xl shadow-2xl w-full h-full flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900 z-10">
            <h1 className="text-lg md:text-xl font-bold">Mission Setup & Pre-flight Checklist</h1>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 text-2xl font-bold leading-none active:bg-gray-800 rounded-lg"
            >
              ×
            </button>
          </div>

          {/* Main Content Area: Stack vertically on mobile, side-by-side on desktop */}
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            
            {/* Map Area */}
            <div className="w-full md:w-2/3 h-[45vh] md:h-full p-0 md:p-4 flex flex-col border-b md:border-b-0 md:border-r border-gray-700 shrink-0">
              <h2 className="text-orange-500 text-sm font-semibold mb-2 hidden md:block">Flight Path Planning</h2>
              
              {/* Map Container */}
              <div className="flex-1 bg-gray-800 md:rounded-xl overflow-hidden relative z-0">
                <MapContainer
                  center={[14.5995, 120.9842]} 
                  zoom={13}
                  className="w-full h-full"
                >
                  <TileLayer url={url} attribution={attribution} />
                  <WaypointMap waypoints={waypoints} onAddWaypoint={handleAddWaypoint} />
                </MapContainer>
                
                {/* Floating Map Controls for Mobile */}
                <div className="absolute bottom-4 left-4 right-4 z-[400] flex justify-between gap-2">
                  <div className="flex gap-2">
                    <button onClick={handleUndo} disabled={undoStack.length === 0} className="px-4 py-2 bg-gray-900/90 backdrop-blur rounded-lg text-sm font-bold shadow disabled:opacity-50">Undo</button>
                    <button onClick={handleRedo} disabled={redoStack.length === 0} className="px-4 py-2 bg-gray-900/90 backdrop-blur rounded-lg text-sm font-bold shadow disabled:opacity-50">Redo</button>
                  </div>
                  <button onClick={handleClear} className="px-4 py-2 bg-red-900/90 backdrop-blur rounded-lg text-sm font-bold shadow text-red-100">Clear</button>
                </div>
              </div>
            </div>
            
            {/* Checklist & Form Area - Scrollable */}
            <div className="w-full md:w-1/3 p-4 flex flex-col overflow-y-auto pb-24 md:pb-4">
              
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-300">Mission Name</label>
                <input
                  type="text"
                  value={missionName}
                  onChange={e => setMissionName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-base text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Pre-flight Checklist */}
              <div className="mb-6 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-orange-400">Pre-flight Checklist</h3>
                  <button 
                    onClick={() => setChecklist({ battery: true, propellers: true, gps: true, weather: true })}
                    className="text-sm font-bold text-gray-400 hover:text-white bg-gray-700 px-3 py-1 rounded-lg"
                  >
                    Check All
                  </button>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-700 transition-colors">
                    <input type="checkbox" checked={checklist.battery} onChange={() => handleChecklistChange('battery')} className="w-5 h-5 rounded accent-orange-500" />
                    <span className={`text-sm md:text-base font-medium ${checklist.battery ? 'line-through text-gray-500' : 'text-gray-200'}`}>Battery Charged & Secure</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-700 transition-colors">
                    <input type="checkbox" checked={checklist.propellers} onChange={() => handleChecklistChange('propellers')} className="w-5 h-5 rounded accent-orange-500" />
                    <span className={`text-sm md:text-base font-medium ${checklist.propellers ? 'line-through text-gray-500' : 'text-gray-200'}`}>Propellers Secure</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-700 transition-colors">
                    <input type="checkbox" checked={checklist.gps} onChange={() => handleChecklistChange('gps')} className="w-5 h-5 rounded accent-orange-500" />
                    <span className={`text-sm md:text-base font-medium ${checklist.gps ? 'line-through text-gray-500' : 'text-gray-200'}`}>GPS Lock Acquired</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-700 transition-colors">
                    <input type="checkbox" checked={checklist.weather} onChange={() => handleChecklistChange('weather')} className="w-5 h-5 rounded accent-orange-500" />
                    <span className={`text-sm md:text-base font-medium ${checklist.weather ? 'line-through text-gray-500' : 'text-gray-200'}`}>Weather Conditions Checked</span>
                  </label>
                </div>
              </div>

              {/* Pre-arming Checks */}
              <div className="mb-6">
                <h3 className="text-base font-bold mb-3 text-gray-300">System Diagnostics</h3>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-2 bg-gray-900 rounded-xl p-3 border border-gray-800">
                  {Object.entries(preArmingChecks).map(([key, check]) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50">
                      <span className="text-sm font-medium text-gray-300">{check.label}</span>
                      {check.status === 'loading' && <span className="text-yellow-500 animate-pulse font-bold">⟳ Checking</span>}
                      {check.status === 'success' && <span className="text-green-500 font-bold">✓ Passed</span>}
                      {check.status === 'error' && <span className="text-red-500 font-bold">✗ Failed</span>}
                    </div>
                  ))}
                </div>
                {!allPreArmingComplete && <div className="mt-3 text-sm font-semibold text-yellow-400 text-center animate-pulse">Running hardware diagnostics...</div>}
                {allChecksComplete && <div className="mt-3 text-sm font-bold text-green-400 text-center bg-green-900/20 p-2 rounded-lg border border-green-900/50">All checks passed. Ready for launch.</div>}
              </div>

              {/* Mobile Sticky Footer Actions */}
              <div className="fixed md:static bottom-0 left-0 right-0 p-4 md:p-0 bg-gray-900 md:bg-transparent border-t md:border-t-0 border-gray-700 z-50 md:mt-auto">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button onClick={() => setLoadModalOpen(true)} className="py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold transition-colors border border-gray-700">Load Plan</button>
                  <button onClick={handleSaveAndClose} className="py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold transition-colors border border-gray-700">Save Plan</button>
                </div>
                <button
                  onClick={handleLaunch}
                  disabled={!allChecksComplete} 
                  className={`w-full py-4 rounded-xl text-base font-bold shadow-lg transition-all ${
                    !allChecksComplete
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-900/50' 
                  }`}
                >
                  {allChecksComplete ? 'LAUNCH DRONE' : 'Awaiting Checks...'}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {isLoadModalOpen && (
        <LoadPlanModal 
          onSelect={handlePlanSelected} 
          onClose={() => setLoadModalOpen(false)} 
        />
      )}
    </>
  );
};

export default MissionSetupView;