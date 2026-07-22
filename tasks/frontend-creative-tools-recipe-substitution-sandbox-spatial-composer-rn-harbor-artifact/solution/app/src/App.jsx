import React from 'react';
import RecipeIngredientsCollection from './components/RecipeIngredientsCollection';
import SpatialComposer from './components/SpatialComposer';
import PortableWorkArtifact from './components/PortableWorkArtifact';
import WebMCP from './components/WebMCP';

function App() {
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col gap-6 font-sans">
      <WebMCP />

      <header className="mb-2">
        <h1 className="text-2xl font-bold text-slate-800">Recipe Substitution Sandbox</h1>
        <p className="text-slate-600">Spatial Composer & Artifact Artifact Provenance</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[80vh]">
        {/* Left column: Ingredients Collection */}
        <div className="h-full">
          <RecipeIngredientsCollection />
        </div>

        {/* Right column: Composer on top, Artifact on bottom */}
        <div className="flex flex-col gap-6 h-full">
          <div className="h-2/3">
            <SpatialComposer />
          </div>
          <div className="h-1/3">
            <PortableWorkArtifact />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
