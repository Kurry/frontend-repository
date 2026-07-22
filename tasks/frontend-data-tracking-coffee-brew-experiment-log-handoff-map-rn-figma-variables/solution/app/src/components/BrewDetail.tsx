import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { z } from 'zod';

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  beanWeight: z.number().min(0, "Must be >= 0").max(1000),
  waterVolume: z.number().min(0, "Must be >= 0").max(5000),
  temperature: z.number().min(0, "Must be >= 0").max(100)
});

export const BrewDetail: React.FC = () => {
  const { records, activeRecordId, updateRecord, createRecord, selectRecord } = useStore();

  const [formData, setFormData] = useState({
    title: '',
    beanWeight: '15',
    waterVolume: '250',
    temperature: '92'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeRecord = records.find(r => r.id === activeRecordId);

  useEffect(() => {
    if (activeRecord) {
      setFormData({
        title: activeRecord.title,
        beanWeight: activeRecord.beanWeight.toString(),
        waterVolume: activeRecord.waterVolume.toString(),
        temperature: activeRecord.temperature.toString()
      });
      setErrors({});
    } else {
      setFormData({
        title: '',
        beanWeight: '15',
        waterVolume: '250',
        temperature: '92'
      });
      setErrors({});
    }
  }, [activeRecordId, activeRecord]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedData = {
      title: formData.title,
      beanWeight: Number(formData.beanWeight),
      waterVolume: Number(formData.waterVolume),
      temperature: Number(formData.temperature)
    };

    const result = formSchema.safeParse(parsedData);
    if (!result.success) {
      const formErrors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => {
        if (err.path[0]) formErrors[err.path[0].toString()] = err.message;
      });
      setErrors(formErrors);
      return;
    }

    setErrors({});

    if (activeRecord) {
      updateRecord(activeRecord.id, result.data);
    } else {
      createRecord(result.data);
      setFormData({ title: '', beanWeight: '15', waterVolume: '250', temperature: '92' });
    }
  };

  return (
    <div className="bg-white p-6 h-full flex flex-col border-r border-stone-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-stone-800">
          {activeRecord ? 'Edit Experiment' : 'New Experiment'}
        </h2>
        {activeRecord && (
          <button
            onClick={() => selectRecord(null)}
            className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
          >
            Clear Selection
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(p => ({...p, title: e.target.value}))}
            className={`w-full p-2 border rounded-md focus:ring-2 focus:outline-none ${errors.title ? 'border-red-500 focus:ring-red-200' : 'border-stone-300 focus:ring-amber-200 focus:border-amber-500'}`}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Bean (g)</label>
            <input
              type="number"
              value={formData.beanWeight}
              onChange={(e) => setFormData(p => ({...p, beanWeight: e.target.value}))}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:outline-none ${errors.beanWeight ? 'border-red-500 focus:ring-red-200' : 'border-stone-300 focus:ring-amber-200 focus:border-amber-500'}`}
            />
            {errors.beanWeight && <p className="text-red-500 text-xs mt-1">{errors.beanWeight}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Water (ml)</label>
            <input
              type="number"
              value={formData.waterVolume}
              onChange={(e) => setFormData(p => ({...p, waterVolume: e.target.value}))}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:outline-none ${errors.waterVolume ? 'border-red-500 focus:ring-red-200' : 'border-stone-300 focus:ring-amber-200 focus:border-amber-500'}`}
            />
            {errors.waterVolume && <p className="text-red-500 text-xs mt-1">{errors.waterVolume}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Temp (°C)</label>
            <input
              type="number"
              value={formData.temperature}
              onChange={(e) => setFormData(p => ({...p, temperature: e.target.value}))}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:outline-none ${errors.temperature ? 'border-red-500 focus:ring-red-200' : 'border-stone-300 focus:ring-amber-200 focus:border-amber-500'}`}
            />
            {errors.temperature && <p className="text-red-500 text-xs mt-1">{errors.temperature}</p>}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-stone-800 text-white py-2 rounded-md hover:bg-stone-700 focus:ring-2 focus:ring-stone-500 focus:outline-none transition-colors mt-6 font-medium"
        >
          {activeRecord ? 'Save Changes' : 'Create Experiment'}
        </button>
      </form>

      {activeRecord && (
        <div className="mt-8 pt-6 border-t border-stone-200">
           <h3 className="text-sm font-semibold text-stone-500 mb-3 uppercase tracking-wider">Handoff State</h3>
           <div className="bg-stone-50 p-3 rounded border border-stone-200 text-sm flex flex-col gap-2">
             <div className="flex justify-between">
               <span className="text-stone-500">Owner:</span>
               <span className="font-medium text-stone-800">{activeRecord.handoffMapState.owner || 'Unassigned'}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-stone-500">Readiness:</span>
               <span className="font-medium text-stone-800 capitalize">{activeRecord.handoffMapState.readiness}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-stone-500">Status:</span>
               <span className="font-medium text-stone-800 capitalize">{activeRecord.status}</span>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};
