import { Layout } from './components/Layout';
import { Timeline } from './components/Timeline';
import { Lattice } from './components/Lattice';
import { Projections } from './components/Projections';
import { Controls } from './components/Controls';

function App() {
  return (
    <Layout>
      <div className="col-span-1 md:col-span-1 lg:col-span-3">
        <Timeline />
      </div>
      <Lattice />
      <Projections />
      <Controls />
    </Layout>
  );
}

export default App;
