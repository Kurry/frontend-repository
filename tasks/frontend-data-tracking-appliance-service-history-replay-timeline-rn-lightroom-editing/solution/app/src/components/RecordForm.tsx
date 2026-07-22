import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { ApplianceRecordSchema } from '../utils';

interface Props {
  recordId: string | null;
  onClose: () => void;
}

export default function RecordForm({ recordId, onClose }: Props) {
  const { records, createRecord, updateRecord } = useStore();
  const [formData, setFormData] = useState({
    type: '',
    brand: '',
    model: '',
    serial_number: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (recordId) {
      const record = records.find(r => r.id === recordId);
      if (record) {
        setFormData({
          type: record.type,
          brand: record.brand,
          model: record.model,
          serial_number: record.serial_number
        });
      }
    }
  }, [recordId, records]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.type.trim()) newErrors.type = "Appliance type is required.";
    if (!formData.brand.trim()) newErrors.brand = "Brand is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (recordId) {
      updateRecord(recordId, formData);
    } else {
      createRecord(formData);
    }
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {recordId ? 'Edit Appliance Record' : 'Add Appliance Record'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-slate-700 mb-1">
                Brand <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.brand ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300'}`}
                placeholder="e.g. Samsung, LG"
              />
              {errors.brand && <p className="mt-1 text-sm text-red-600">{errors.brand}</p>}
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">
                Appliance Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.type ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300'}`}
                placeholder="e.g. Refrigerator, Oven"
              />
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium text-slate-700 mb-1">
                Model Name/Number
              </label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="serial_number" className="block text-sm font-medium text-slate-700 mb-1">
                Serial Number
              </label>
              <input
                type="text"
                id="serial_number"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {recordId ? 'Save Changes' : 'Create Record'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
