import React, { useState, useMemo } from 'react';
import type { Mission } from 'types';
import MissionTrackMap from './MissionTrackMap'; // Preserved actual map import

// ---
// FIX #1: Import the new 'downloadMissionReport' function
// ---
import { downloadMissionReport } from '../utils/downloadReport'; 

// --- Helper Icons for Buttons (Using inline SVGs) ---
const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);

const ExportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const SearchIcon = () => (
  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

// Added Back Icon for Mobile Navigation
const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);
// ---

interface FlightLogsPanelProps {
  missions: Mission[];
  mapStyle: string;
}

const FlightLogsPanel: React.FC<FlightLogsPanelProps> = ({ missions, mapStyle }) => {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(missions[0] || null);
  
  // NEW STATE: Tracks if we are viewing the details page on a mobile device
  const [showMobileDetails, setShowMobileDetails] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false); 
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Missions');

  // This is the GPS track to display on the map.
  const displayTrack = selectedMission?.gpsTrack || selectedMission?.plan_waypoints || [];

  // ---
  // FIX #2: Update the download handler
  // ---
  const handleDownloadReport = () => {
    if (!selectedMission) {
      alert("Please select a mission to download.");
      return;
    }
    downloadMissionReport(selectedMission);
  };
  // --- END OF FIX ---

  const handleExport = () => {
    alert("Exporting all logs...");
    // In a real app, you would convert 'filteredMissions' to CSV here
  };
  
  // Helper function to handle selecting a mission on mobile
  const handleSelectMission = (mission: Mission) => {
    setSelectedMission(mission);
    setShowMobileDetails(true); // Slide to details view on mobile
  };

  const filteredMissions = useMemo(() => {
    if (!Array.isArray(missions)) return [];
    
    const now = new Date();
    
    return missions.filter(mission => {
      // 1. Filter by Search Query
      if (!mission.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // 2. Filter by Status
      if (statusFilter !== 'All' && mission.status !== statusFilter) {
        return false;
      }

      // 3. Filter by Date Range
      if (dateFilter !== 'All Missions') {
        const missionDate = new Date(mission.date);
        if (isNaN(missionDate.getTime())) return false; // Skip invalid dates

        const diffTime = now.getTime() - missionDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (dateFilter === 'Last 7 Days' && diffDays > 7) {
          return false;
        }
        if (dateFilter === 'Last 30 Days' && diffDays > 30) {
          return false;
        }
      }
      return true;
    });
  }, [missions, searchQuery, statusFilter, dateFilter]);

  return (
    // MODIFIED Container: Stack on mobile, side-by-side on desktop
    <div className="flex flex-col md:flex-row h-full animate-fade-in gap-0 md:gap-4">
      
      {/* LEFT PANEL: Mission List */}
      <div className={`w-full md:w-1/3 h-full flex flex-col bg-white dark:bg-gray-800 rounded-none md:rounded-xl shadow-none md:shadow-sm p-4 ${showMobileDetails ? 'hidden md:flex' : 'flex'}`}>
        <h2 className="text-xl font-bold mb-4 dark:text-white">Mission History</h2>
        
        {/* Search Bar */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search missions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3 pl-10 pr-4 rounded-xl bg-gray-100 dark:bg-gray-700 dark:text-white border border-transparent focus:border-orange-500 focus:ring-0 focus:outline-none text-base"
          />
          <SearchIcon />
        </div>

        {/* Filter/Export Buttons */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center text-sm font-medium py-2 px-4 rounded-xl transition-colors
              ${showFilters 
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-600/30 dark:text-orange-300' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
          >
            <FilterIcon />
            <span className="ml-2">{showFilters ? 'Close Filters' : 'Filters'}</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 py-2 px-4 rounded-xl transition-colors"
          >
            <ExportIcon />
            <span className="ml-2">Export Logs</span>
          </button>
        </div>

        {/* Filter Panel (Stacking dropdowns for mobile readability) */}
        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl mb-4 border border-gray-200 dark:border-gray-600 animate-fade-in-fast">
            <h4 className="font-semibold text-sm mb-3 dark:text-white">Filter Options</h4>
            <div className="flex flex-col md:grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white focus:border-orange-500 focus:ring-0 focus:outline-none appearance-none"
                >
                  <option>All</option>
                  <option>Completed</option>
                  <option>Interrupted</option>
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date Range</label>
                <select 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white focus:border-orange-500 focus:ring-0 focus:outline-none appearance-none"
                >
                  <option>All Missions</option>
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Mission List */}
        <div className="flex-1 overflow-y-auto pr-1 pb-20 md:pb-0">
          {filteredMissions.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
               <p>No missions found.</p>
             </div>
          ) : (
            filteredMissions.map(mission => (
              <div
                key={mission.id}
                onClick={() => handleSelectMission(mission)}
                className={`p-4 rounded-xl mb-3 cursor-pointer border-l-4 transition-all
                  ${selectedMission?.id === mission.id
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500 shadow-sm'
                    : 'border-transparent bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <p className="font-bold text-base dark:text-white">{mission.name}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                    mission.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {mission.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>{mission.date}</span>
                  <span className="mx-2">•</span>
                  <span>{mission.duration || '0'} secs</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Mission Details */}
      <div className={`w-full md:w-2/3 h-full flex flex-col ${showMobileDetails ? 'flex' : 'hidden md:flex'}`}>
        <div className="bg-white dark:bg-gray-800 rounded-none md:rounded-xl shadow-none md:shadow-sm h-full flex flex-col p-4 md:p-6 pb-24 md:pb-6">
          
          {/* Mobile Back Button Header */}
          <div className="md:hidden flex items-center mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
            <button 
              onClick={() => setShowMobileDetails(false)}
              className="flex items-center text-orange-600 dark:text-orange-400 font-semibold py-2 pr-4 rounded-lg active:bg-orange-50 dark:active:bg-gray-700"
            >
              <ChevronLeftIcon /> Back to List
            </button>
          </div>

          {!selectedMission ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Select a mission to view details.
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-1 dark:text-white">
                {selectedMission.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {selectedMission.date}
              </p>
              
              <div className="w-full h-[35vh] md:h-2/5 rounded-xl overflow-hidden bg-gray-700 shadow-inner">
                <MissionTrackMap track={displayTrack} mapStyle={mapStyle} />
              </div>

              <h3 className="text-lg font-bold mt-6 mb-3 dark:text-white border-b pb-2 dark:border-gray-700">Detected Objects</h3>
              <div className="flex-1 w-full overflow-y-auto bg-gray-100 dark:bg-gray-900 rounded-xl p-4 min-h-0">
                {(!selectedMission.detectedSites || selectedMission.detectedSites.length === 0) ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">No objects detected for this mission.</p>
                ) : (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedMission.detectedSites.map((site, index) => (
                      <li key={index} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-orange-600 dark:text-orange-400 text-base">
                            {site.object}
                          </span>
                          <span className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md">
                            {site.type}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-2">
                          BBox: {site.bbox ? site.bbox.map(coord => coord.toFixed(4)).join(', ') : 'N/A'}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 gap-4">
                <div className="w-full md:w-auto grid grid-cols-2 md:block gap-2">
                  <InfoItem label="Status" value={selectedMission.status} />
                  <InfoItem label="Duration" value={`${selectedMission.duration || '0'} secs`} />
                  <InfoItem label="Location" value={selectedMission.location} className="col-span-2" />
                </div>
                {/* ---
                FIX #3: Button text and onClick handler updated
                ---
                */}
                <button
                  onClick={handleDownloadReport}
                  disabled={!selectedMission}
                  className="w-full md:w-auto py-3 px-6 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  <ExportIcon /> <span className="ml-2">Download Report</span>
                </button>
                {/* --- END OF FIX --- */}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Modified InfoItem to support extra classes for the mobile grid
const InfoItem: React.FC<{ label: string, value: string | number, className?: string }> = ({ label, value, className = '' }) => (
  <p className={`text-sm text-gray-500 dark:text-gray-400 mb-1 ${className}`}>
    <span className="block text-xs uppercase tracking-wider font-semibold mb-0.5">{label}</span> 
    <span className="font-bold text-gray-800 dark:text-white text-base">{value}</span>
  </p>
);

export default FlightLogsPanel;