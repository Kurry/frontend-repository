import { useState } from 'react';
import { useStore, type BrewExperiment } from '../store';
import { Save, X } from 'lucide-react';

interface BrewFormProps {
  initialData?: BrewExperiment;
  onClose: () => void;
}

export function BrewForm({ initialData, onClose }: BrewFormProps) {
  const addRecord = useStore(state => state.addRecord);
  const updateRecord = useStore(state => state.updateRecord);

  const [formData, setFormData] = useState<Omit<BrewExperiment, 'id'> | BrewExperiment>({
    title: initialData?.title || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    coffee: initialData?.coffee || '',
    roaster: initialData?.roaster || '',
    brewMethod: initialData?.brewMethod || '',
    dose: initialData?.dose || 15,
    yield: initialData?.yield || 250,
    time: initialData?.time || '0:00',
    grindSetting: initialData?.grindSetting || '',
    waterTemp: initialData?.waterTemp || 98,
    notes: initialData?.notes || '',
    status: initialData?.status || 'draft',
    ...(initialData?.id ? { id: initialData.id } : {})
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.coffee.trim()) newErrors.coffee = 'Coffee is required';
    if (formData.dose <= 0 || formData.dose > 100) newErrors.dose = 'Dose must be between 1 and 100';
    if (formData.yield <= 0 || formData.yield > 1000) newErrors.yield = 'Yield must be between 1 and 1000';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if ('id' in formData) {
      updateRecord(formData.id as string, formData);
    } else {
      addRecord(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{'id' in formData ? 'Edit Experiment' : 'New Experiment'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Coffee *</label>
              <input
                type="text"
                value={formData.coffee}
                onChange={e => setFormData({...formData, coffee: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              {errors.coffee && <p className="text-red-500 text-xs mt-1">{errors.coffee}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Roaster</label>
              <input
                type="text"
                value={formData.roaster}
                onChange={e => setFormData({...formData, roaster: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Brew Method</label>
              <input
                type="text"
                value={formData.brewMethod}
                onChange={e => setFormData({...formData, brewMethod: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dose (g) *</label>
              <input
                type="number"
                value={formData.dose}
                onChange={e => setFormData({...formData, dose: Number(e.target.value)})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              {errors.dose && <p className="text-red-500 text-xs mt-1">{errors.dose}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Yield (g) *</label>
              <input
                type="number"
                value={formData.yield}
                onChange={e => setFormData({...formData, yield: Number(e.target.value)})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              {errors.yield && <p className="text-red-500 text-xs mt-1">{errors.yield}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time (mm:ss)</label>
              <input
                type="text"
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Grind Setting</label>
              <input
                type="text"
                value={formData.grindSetting}
                onChange={e => setFormData({...formData, grindSetting: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Water Temp (°C)</label>
              <input
                type="number"
                value={formData.waterTemp}
                onChange={e => setFormData({...formData, waterTemp: Number(e.target.value)})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
              <option value="empty">Empty</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 h-24"
            />
          </div>

          <div className="flex justify-end pt-4 border-t gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Save size={16} /> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
