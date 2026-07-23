import { Provider } from 'react-redux';
import { store, RootState } from './store/store';
import Shell from './components/Shell';
import { useSelector } from 'react-redux';
import PreviewTab from "./components/PreviewTab";
import ComponentsTab from "./components/ComponentsTab";
import SavedThemes from "./components/SavedThemes";
import ExportTab from "./components/ExportTab";

function Workspace() {
  const tab = useSelector((state: RootState) => state.theme.tab);

  return (
    <Shell>
      {tab === 'preview' && <PreviewTab />}
      {tab === 'components' && <ComponentsTab />}
      {tab === 'saved' && <SavedThemes />}
      {tab === 'export' && <ExportTab />}
    </Shell>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Workspace />
    </Provider>
  );
}

export default App;
