import React, { useState, useEffect } from 'react';
import type { MissionPlan } from 'types';

// This is just the data we need for the list
type MissionPlanHeader = Pick<MissionPlan, 'id' | 'name'>;

interface LoadPlanModalProps {
  onSelect: (plan: MissionPlan) => void;
  onClose: () => void;
}

const LoadPlanModal: React.FC<LoadPlanModalProps> = ({ onSelect, onClose }) => {
  const [plans, setPlans] = useState<MissionPlanHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('/api/plans'); 
        if (!response.ok) throw new Error('Failed to fetch plans');
        const data: MissionPlanHeader[] = await response.json();
        setPlans(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = async (planId: string | number) => {
    try {
      const response = await fetch(`/api/plans/${planId}`);
      if (!response.ok) throw new Error('Failed to load plan details');
      
      const fullPlanData: MissionPlan = await response.json();
      
      onSelect(fullPlanData);
      onClose(); 

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load plan');
    }
  };

  return (
    // MODIFIED: Increased z-index to 200 so it sits ABOVE the MissionSetupView (which is z-[100])
    // Added p-4 so it doesn't stretch to the exact edges of the phone screen
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[200] p-4">
      <div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Load Mission Plan</h2>
        
        <div className="h-64 overflow-y-auto border dark:border-gray-700 rounded-lg">
          {loading && <p className="p-4 text-center text-gray-500">Loading plans...</p>}
          {error && <p className="p-4 text-center text-red-500">{error}</p>}
          {!loading && !error && plans.length === 0 && (
            <p className="p-4 text-center text-gray-500">No saved plans found.</p>
          )}
          
          <ul className="divide-y dark:divide-gray-700">
            {plans.map(plan => (
              <li 
                key={plan.id} 
                onClick={() => handleSelectPlan(plan.id!)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <p className="font-semibold">{plan.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">ID: {plan.id}</p>
              </li>
            ))}
          </ul>
        </div>

        <button 
          onClick={onClose} 
          className="mt-4 w-full py-3 px-4 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-bold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default LoadPlanModal;