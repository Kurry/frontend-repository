import { useState } from 'react';
import { useStore } from '../store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Archive } from 'lucide-react';

import { IngredientStatusSchema } from '../schema';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  status: IngredientStatusSchema,
});

export const RecipeIngredients: React.FC = () => {
  const { records, addRecord, updateRecord, deleteRecord } = useStore();
  const [filter, setFilter] = useState<string>('all');


  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { status: 'draft', name: '' }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    addRecord({ ...data, substitute: '', substituteRatio: '' });
    reset();
  };

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4 text-slate-800">Recipe Ingredients</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="mb-4 space-y-2" data-testid="create-ingredient-form">
        <div className="flex gap-2">
          <input
            {...register('name')}
            placeholder="Ingredient Name"
            className="flex-1 border rounded px-3 py-2 text-sm"
          />
          <select {...register('status')} className="border rounded px-3 py-2 text-sm">
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Add</button>
        </div>
        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
        {errors.status && <p className="text-red-500 text-xs">{errors.status.message}</p>}
      </form>

      <div className="mb-4">
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded px-3 py-2 text-sm w-full" data-testid="filter-status">
          <option value="all">All Statuses</option>
          <option value="empty">Empty</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {filteredRecords.map(record => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              key={record.id}
              className={`p-3 mb-2 rounded border flex justify-between items-center ${record.status === 'archived' ? 'bg-slate-50 opacity-70' : 'bg-white border-slate-200'}`}
              data-testid={`ingredient-${record.id}`}
            >
              <div>
                <div className="font-medium text-slate-700">{record.name}</div>
                <div className="text-xs text-slate-500 flex gap-2">
                  <span className={`px-2 py-0.5 rounded-full ${
                    record.status === 'ready' ? 'bg-green-100 text-green-800' :
                    record.status === 'draft' ? 'bg-amber-100 text-amber-800' :
                    record.status === 'changed' ? 'bg-blue-100 text-blue-800' :
                    record.status === 'archived' ? 'bg-red-100 text-red-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>{record.status}</span>
                  {record.substitute && <span>Sub: {record.substitute} ({record.substituteRatio})</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateRecord(record.id, { status: record.status === 'archived' ? 'draft' : 'archived' })} className="text-slate-400 hover:text-amber-600" aria-label="Archive">
                  <Archive size={16} />
                </button>
                <button onClick={() => deleteRecord(record.id)} className="text-slate-400 hover:text-red-600" aria-label="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredRecords.length === 0 && (
          <div className="text-center text-slate-400 py-8 text-sm">No ingredients found.</div>
        )}
      </div>
    </div>
  );
};