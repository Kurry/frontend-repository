import type { DerivedStats } from '../types';

interface LivePreviewProps {
  stats: DerivedStats;
}

export function LivePreview({ stats }: LivePreviewProps) {
  return (
    <div className="bg-gray-800 text-white rounded-3xl w-64 h-[500px] border-8 border-gray-900 shadow-xl overflow-hidden flex flex-col mx-auto shrink-0 relative">
      <div className="bg-gray-900 h-6 flex justify-between px-4 items-center text-[10px] text-gray-400">
        <span>9:41</span>
        <div className="flex space-x-1">
          <span className="w-3 h-2 border border-gray-400 rounded-sm inline-block relative after:absolute after:inset-px after:bg-gray-400 after:rounded-[1px]"></span>
        </div>
      </div>

      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <h3 className="font-semibold text-lg text-white">Stock Preview</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-gray-700 p-3 rounded-lg shadow-inner">
          <div className="text-xs text-gray-400 mb-1">Total Items</div>
          <div className="text-2xl font-bold">{stats.totalIngredients}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-700 p-2 rounded-lg text-center">
            <div className="text-[10px] text-gray-400">Calories</div>
            <div className="font-bold text-sm text-yellow-400">{stats.totalCalories.toLocaleString()}</div>
          </div>
          <div className="bg-gray-700 p-2 rounded-lg text-center">
            <div className="text-[10px] text-gray-400">Protein</div>
            <div className="font-bold text-sm text-blue-400">{stats.totalProtein.toLocaleString()}g</div>
          </div>
          <div className="bg-gray-700 p-2 rounded-lg text-center">
            <div className="text-[10px] text-gray-400">Carbs</div>
            <div className="font-bold text-sm text-green-400">{stats.totalCarbs.toLocaleString()}g</div>
          </div>
          <div className="bg-gray-700 p-2 rounded-lg text-center">
            <div className="text-[10px] text-gray-400">Fat</div>
            <div className="font-bold text-sm text-red-400">{stats.totalFat.toLocaleString()}g</div>
          </div>
        </div>

        <div className="bg-gray-700 p-3 rounded-lg">
           <div className="text-xs text-gray-400 mb-2">Status Breakdown</div>
           <div className="space-y-1 text-sm">
             <div className="flex justify-between"><span>Ready</span> <span>{stats.statusCounts.ready}</span></div>
             <div className="flex justify-between"><span>Draft</span> <span>{stats.statusCounts.draft}</span></div>
             <div className="flex justify-between text-red-400"><span>Conflict</span> <span>{stats.statusCounts.conflict}</span></div>
           </div>
        </div>
      </div>

      <div className="bg-gray-900 h-1 rounded-full w-20 mx-auto my-2"></div>
    </div>
  );
}
