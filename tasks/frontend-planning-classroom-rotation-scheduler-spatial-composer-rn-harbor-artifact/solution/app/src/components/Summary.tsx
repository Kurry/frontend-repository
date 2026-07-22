import React from 'react';
import { useStations } from '../context/StationsContext';
import { Users, LayoutTemplate, AlertTriangle, CheckCircle } from 'lucide-react';

export const Summary: React.FC = () => {
  const { state } = useStations();
  const { derived } = state;

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">Session Summary</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-md border border-gray-100 flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-full text-blue-600">
            <LayoutTemplate className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Ready Stations</div>
            <div className="text-xl font-bold text-gray-900">{derived.readyStationsCount}</div>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-md border border-gray-100 flex items-center space-x-3">
          <div className="bg-purple-100 p-2 rounded-full text-purple-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Total Capacity</div>
            <div className="text-xl font-bold text-gray-900">{derived.totalStudentsAssigned} / {derived.totalCapacity}</div>
          </div>
        </div>
      </div>

      <div className={`mt-4 p-3 rounded-md border flex items-start space-x-3 ${
        derived.overallStatus === 'balanced' ? 'bg-green-50 border-green-200 text-green-800' :
        derived.overallStatus === 'over_capacity' ? 'bg-red-50 border-red-200 text-red-800' :
        'bg-yellow-50 border-yellow-200 text-yellow-800'
      }`}>
        {derived.overallStatus === 'balanced' ? <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
        <div>
          <div className="font-semibold text-sm capitalize">Status: {derived.overallStatus.replace('_', ' ')}</div>
          <div className="text-xs mt-1 opacity-90">
            {derived.overallStatus === 'balanced' && "All ready stations have appropriate capacity."}
            {derived.overallStatus === 'over_capacity' && "Students assigned exceed total capacity across ready stations."}
            {derived.overallStatus === 'under_capacity' && "There is available capacity across ready stations."}
          </div>
        </div>
      </div>
    </div>
  );
};
