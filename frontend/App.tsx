import React, { useState, useEffect } from 'react';

// ---
import Sidebar from './components/ControlPanel'; 
import DashboardHeader from './components/Header'; 
import LiveMissionView from './components/LiveMissionView';
import DashboardView from './components/DashboardView';
import AnalyticsPanel from './components/AnalyticsPanel';
import FlightLogsPanel from './components/FlightLogsPanel';
import SettingsPanel from './components/SettingsPanel';
import MissionSetupView from './components/MissionSetupView';
import GuidePanel from './components/GuidePanel';
import AboutPanel from './components/AboutPanel';

// NEW: Import your Supabase client
import { supabase } from './supabaseClient';
import { useDashboardData } from './hooks/useDashboardData';
import type { Mission, BreedingSiteInfo, MissionPlan, LiveTelemetry } from 'types';
// ---

type View = 'dashboard' | 'analytics' | 'flightLogs' | 'settings' | 'guide' | 'about';

const App: React.FC = () => {
  const [isMissionActive, setMissionActive] = useState(false);
  const [missionPlan, setMissionPlan] = useState<MissionPlan | null>(null);
  const [isSetupViewVisible, setSetupViewVisible] = useState(false);
  const [isDarkMode, setDarkMode] = useState(false);
  const [mapStyle, setMapStyle] = useState(() => {
    return localStorage.getItem('mapStyle') || 'Satellite';
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'orange';
  });

  useEffect(() => {
    localStorage.setItem('mapStyle', mapStyle);
  }, [mapStyle]);

  useEffect(() => {
    const oldTheme = localStorage.getItem('theme');
    if (oldTheme) {
      document.documentElement.classList.remove(`theme-${oldTheme}`);
    }
    document.documentElement.classList.add(`theme-${theme}`);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [missions, setMissions] = useState<Mission[]>([]); 
  const { overviewStats, time, date, liveTelemetry, setArmedState } = useDashboardData(isMissionActive);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  // MODIFIED: Fetch missions from 'mission_logs' and translate snake_case columns
  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const { data, error } = await supabase
          .from('mission_logs')
          .select('*')
          .order('id', { ascending: false }); 

        if (error) {
          throw error;
        }

        if (data) {
          // Translate DB snake_case columns to Frontend camelCase properties
          const formattedMissions = data.map((item: any) => ({
            ...item,
            gpsTrack: item.gps_track,
            detectedSites: item.detected_sites
          }));
          setMissions(formattedMissions as Mission[]);
        }
      } catch (error) {
        console.error("Failed to fetch missions from Supabase:", error);
        setMissions([]); 
      }
    };
    fetchMissions();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // MODIFIED: Save mission to 'mission_logs' using snake_case columns
  const endMission = async (duration: string, gpsTrack: { lat: number; lon: number }[], detectedSites: BreedingSiteInfo[]) => {
    
    // Format the payload to perfectly match your Supabase columns
    const dbMission = { 
        name: missionPlan?.name || `Mission ${missions.length + 1}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        duration,
        status: 'Completed',
        location: 'Live Location',
        gps_track: gpsTrack,           // Maps to DB column
        detected_sites: detectedSites, // Maps to DB column
    };

    try {
      const { data, error } = await supabase
        .from('mission_logs')
        .insert([dbMission])
        .select() 
        .single(); 

      if (error) {
        throw error;
      }

      if (data) {
        // Map the saved data back to camelCase for the React state so the UI doesn't crash
        const newSavedMission: Mission = {
          ...(data as any),
          gpsTrack: data.gps_track,
          detectedSites: data.detected_sites
        };
        setMissions(prevMissions => [newSavedMission, ...prevMissions]); 
      }
    } catch (error) {
      console.error("Failed to save mission to Supabase:", error);
    }

    setMissionActive(false);
    setMissionPlan(null);
  };
  
  const handleLaunchMission = (plan: MissionPlan) => {
    setMissionPlan(plan);
    setSetupViewVisible(false);
    setMissionActive(true);
  };

  const handleOpenMissionSetup = () => {
    setSetupViewVisible(true);
  };

  const renderView = () => {
    switch (currentView) {
      case 'analytics':
        return <AnalyticsPanel missions={missions} />;
      case 'flightLogs':
        return <FlightLogsPanel missions={missions} mapStyle={mapStyle} />;
      case 'settings':
        return <SettingsPanel 
          isDarkMode={isDarkMode} 
          onToggleDarkMode={() => setDarkMode(!isDarkMode)} 
          mapStyle={mapStyle}
          setMapStyle={setMapStyle}
          theme={theme}
          setTheme={setTheme}
        />;
      case 'guide':
        return <GuidePanel />;
      case 'about':
        return <AboutPanel />;
      case 'dashboard':
      default:
        return <DashboardView overviewStats={overviewStats} missions={missions} onMissionSetup={handleOpenMissionSetup} telemetry={liveTelemetry} setArmedState={setArmedState} />;
    }
  };
  
  const viewTitles: Record<View, string> = {
    dashboard: 'Dashboard',
    analytics: 'Analytics',
    flightLogs: 'Flight Logs',
    settings: 'Settings',
    guide: 'Guide',
    about: 'About Project',
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-gcs-background text-gcs-text-dark font-sans dark:bg-gcs-dark dark:text-gcs-text-light overflow-hidden">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      
      <main className="flex-1 flex flex-col p-4 overflow-hidden min-h-0">
        <DashboardHeader time={time} date={date} title={viewTitles[currentView]} batteryPercentage={liveTelemetry.battery.percentage} />
        <div className="flex-1 overflow-y-auto min-h-0">
          {renderView()}
        </div>
      </main>
      
      {isSetupViewVisible && <MissionSetupView onLaunch={handleLaunchMission} onClose={() => setSetupViewVisible(false)} mapStyle={mapStyle} />}
      {isMissionActive && <LiveMissionView telemetry={liveTelemetry} onEndMission={endMission} mapStyle={mapStyle} />}
    </div>
  );
};

export default App;