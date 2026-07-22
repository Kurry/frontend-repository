import { AppProvider } from './store';
import { Layout } from './components/Layout';
import { WorkTasksList } from './components/WorkTasksList';
import { SpatialComposer } from './components/SpatialComposer';
import { ArtifactInspector } from './components/ArtifactInspector';
import { WebMCPIntegration } from './WebMCP';

const AppContent = () => (
  <Layout>
      <WorkTasksList />
      <SpatialComposer />
      <ArtifactInspector />
  </Layout>
);

function App() {
  return (
    <AppProvider>
      <WebMCPIntegration />
      <AppContent />
    </AppProvider>
  )
}

export default App;
