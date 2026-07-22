import React, { useState, useEffect } from 'react';

const forecastOptions = [
  { id: 'f1', label: 'Live Performance', projectedTempoDiff: +10, projectedComplexity: 'high', validationRequired: ['tempo'] },
  { id: 'f2', label: 'Studio Recording', projectedTempoDiff: -5, projectedComplexity: 'medium', validationRequired: [] },
  { id: 'f3', label: 'Acoustic Jam', projectedTempoDiff: -15, projectedComplexity: 'low', validationRequired: ['tempo'] }
];

export default function ForecastRibbon({ pattern, onMutate, onUndo }) {
  const [selectedForecast, setSelectedForecast] = useState(pattern.forecastRibbonState || null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setSelectedForecast(pattern.forecastRibbonState || null);
    setError(null);
  }, [pattern.id, pattern.forecastRibbonState]);

  const handleSelectForecast = (forecastId) => {
    const option = forecastOptions.find(o => o.id === forecastId);

    if (option.validationRequired.includes('tempo')) {
      const newTempo = pattern.tempo + option.projectedTempoDiff;
      if (newTempo < 60 || newTempo > 200) {
        setError(`Conflict: Projected tempo (${newTempo}) is out of bounds (60-200). Adjust base tempo first to apply this forecast.`);
        return;
      }
    }

    setError(null);
    setSelectedForecast(forecastId);

    onMutate(pattern.id, {
      forecastRibbonState: forecastId,
      status: 'changed'
    });
  };

  const getProjectedTempo = (forecastId) => {
    if (!forecastId) return pattern.tempo;
    return pattern.tempo + forecastOptions.find(o => o.id === forecastId).projectedTempoDiff;
  };

  const getProjectedComplexity = (forecastId) => {
    if (!forecastId) return 'base';
    return forecastOptions.find(o => o.id === forecastId).projectedComplexity;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-semibold text-gray-700">Projected Outcomes Ribbon</h4>
        <button onClick={() => onUndo(pattern.id)} disabled={pattern.history.length === 0} className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded disabled:opacity-50 transition-colors">
          Undo Last Change
        </button>
      </div>

      <div className="flex flex-nowrap overflow-x-auto gap-4 pb-2 snap-x">
        {forecastOptions.map(option => (
          <div key={option.id} onClick={() => handleSelectForecast(option.id)} className={`snap-center flex-none w-48 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ease-in-out transform ${selectedForecast === option.id ? 'border-indigo-600 bg-indigo-50 scale-105 shadow-md' : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'}`}>
            <div className="font-medium text-gray-900 mb-2">{option.label}</div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>Tempo Adjust: {option.projectedTempoDiff > 0 ? '+' : ''}{option.projectedTempoDiff} bpm</div>
              <div>Complexity: {option.projectedComplexity}</div>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">{error}</div>}

      <div className="mt-8 bg-gray-50 rounded-lg p-4 border border-gray-100 transition-all">
        <h5 className="text-sm font-medium text-gray-800 mb-3">Linked Derived Consequence</h5>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Base Tempo</div>
            <div className="text-xl font-semibold text-gray-900 mt-1">{pattern.tempo} bpm</div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
            <div className="text-xs text-indigo-500 uppercase tracking-wide">Projected Tempo</div>
            <div className={`text-xl font-semibold mt-1 transition-all duration-300 ${selectedForecast ? 'text-indigo-600' : 'text-gray-900'}`}>{getProjectedTempo(selectedForecast)} bpm</div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm border border-gray-100 col-span-2">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Projected Complexity Profile</div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-500 ease-out ${getProjectedComplexity(selectedForecast) === 'high' ? 'bg-red-500 w-full' : getProjectedComplexity(selectedForecast) === 'medium' ? 'bg-yellow-400 w-2/3' : getProjectedComplexity(selectedForecast) === 'low' ? 'bg-green-400 w-1/3' : 'bg-gray-400 w-1/2'}`} />
            </div>
            <div className="text-xs font-medium text-gray-600 mt-2 capitalize text-right">{getProjectedComplexity(selectedForecast)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
