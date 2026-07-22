import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AirQualityRecordSchema } from '../types';
import type { AirQualityRecord } from '../types';
import { useAppContext } from '../store';
import { X } from 'lucide-react';

interface RecordFormProps {
  onClose: () => void;
  record?: AirQualityRecord;
}

export const RecordForm: React.FC<RecordFormProps> = ({ onClose, record }) => {
  const { dispatch } = useAppContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<AirQualityRecord>({
    resolver: zodResolver(AirQualityRecordSchema),
    defaultValues: record || {
      id: crypto.randomUUID(),
      status: 'Draft',
      reading: 0,
      room: '',
      timestamp: new Date().toISOString()
    }
  });

  const onSubmit = (data: AirQualityRecord) => {
    if (record) {
      dispatch({ type: 'UPDATE_RECORD', payload: data });
    } else {
      dispatch({ type: 'CREATE_RECORD', payload: data });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{record ? 'Edit Record' : 'New Record'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <input type="hidden" {...register('id')} />
          <input type="hidden" {...register('timestamp')} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
            <input
              {...register('room')}
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Living Room"
            />
            {errors.room && <p className="text-red-500 text-sm mt-1">{errors.room.message}. Enter a valid room name.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Air Quality Reading (AQI)</label>
            <input
              type="number"
              {...register('reading', { valueAsNumber: true })}
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0-1000"
            />
            {errors.reading && <p className="text-red-500 text-sm mt-1">Reading must be between 0 and 1000.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              {...register('status')}
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Draft">Draft</option>
              <option value="Ready">Ready</option>
              <option value="Changed">Changed</option>
              <option value="Archived">Archived</option>
            </select>
            {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
            >
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
