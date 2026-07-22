import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useStore } from '../store/index';

interface DragContextType {
  activePatchId: string | null;
  dragTargetRange: [number, number] | null;
  setActivePatchId: (id: string | null) => void;
  setDragTargetRange: (range: [number, number] | null) => void;
  isConfirming: boolean;
  setConfirming: (val: boolean) => void;
}

const DragContext = createContext<DragContextType | undefined>(undefined);

export const DragProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [activePatchId, setActivePatchId] = useState<string | null>(null);
  const [dragTargetRange, setDragTargetRange] = useState<[number, number] | null>(null);
  const [isConfirming, setConfirming] = useState<boolean>(false);

  return (
    <DragContext.Provider value={{
      activePatchId,
      dragTargetRange,
      setActivePatchId,
      setDragTargetRange,
      isConfirming,
      setConfirming
    }}>
      {children}
    </DragContext.Provider>
  );
};

export const useDrag = () => {
  const context = useContext(DragContext);
  if (!context) throw new Error('useDrag must be used within DragProvider');
  return context;
};

// Modal for patch confirmation
export const PatchConfirmModal: React.FC = () => {
  const { activePatchId, isConfirming, setConfirming, setActivePatchId } = useDrag();

  if (!isConfirming) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 focus:outline-none"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-xl font-bold mb-4">Confirm Patch Application</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to apply patch <span className="font-mono bg-gray-100 px-1 rounded">{activePatchId}</span>?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            onClick={() => {
              setConfirming(false);
              setActivePatchId(null);
            }}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded shadow-sm"
            onClick={() => {
              if (activePatchId) {
                useStore.getState().applyPatch(activePatchId);
              }
              setConfirming(false);
              setActivePatchId(null);
            }}
          >
            Confirm Apply
          </button>
        </div>
      </div>
    </div>
  );
};
