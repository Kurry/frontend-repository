import React from 'react';
import { useLambdaStore } from '../store';
import { computeNamed, computeDeBruijn } from '../utils/reducer';

export const FormViews = () => {
  const nodes = useLambdaStore(state => state.nodes);

  const named = computeNamed(nodes);
  const deBruijn = computeDeBruijn(nodes);

  return (
    <div className="flex gap-8 p-4 bg-slate-100 rounded-lg shadow mt-4">
      <div className="flex-1">
        <h3 className="font-bold text-gray-700 mb-2">Named Form</h3>
        <code className="block p-3 bg-white border rounded text-lg">{named || '((λx.(λy.(x y))) y)'}</code>
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-gray-700 mb-2">De Bruijn Form</h3>
        <code className="block p-3 bg-white border rounded text-lg">{deBruijn || '((λ.λ.(1 0)) free:y)'}</code>
      </div>
    </div>
  );
};
