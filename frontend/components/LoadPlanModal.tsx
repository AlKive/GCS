import React, { useState, useEffect } from 'react';
import type { MissionPlan } from 'types';

// Import the Supabase client (going up one directory level)
import { supabase } from '../supabaseClient';

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

  // MODIFIED: Fetch just the IDs and Names from the 'mission_plans' table
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError('');
        
        const { data, error: supabaseError } = await supabase
          .from('mission_plans') // Updated table name
          .select('id, name')
          .order('id', { ascending: false }); // Newest plans at the top

        if (supabaseError) {
          throw supabaseError;
        }
        
        setPlans(data as MissionPlanHeader[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  // MODIFIED: Fetch the full details from the 'mission_plans' table
  const handleSelectPlan = async (planId: string | number) => {
    try {
      const { data, error } = await supabase
        .from('mission_plans') // Updated table name
        .select('*')
        .eq('id', planId)
        .single();

      if (error) {
        throw error;
      }
      
      // Send the complete plan object back to MissionSetupView
      onSelect(data as MissionPlan);
      onClose(); 

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load plan');
    }
  };

  return (
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