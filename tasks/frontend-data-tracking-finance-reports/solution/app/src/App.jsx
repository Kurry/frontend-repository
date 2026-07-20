import { h } from 'preact';
import { Layout } from './components/Layout.jsx';
import { Dashboard } from './components/Dashboard.jsx';
import { TransactionsList } from './components/TransactionsList.jsx';
import { toastMessage } from './state.js';

export function App() {
  return (
    <>
      <Layout>
        <Dashboard />
        <TransactionsList />
      </Layout>

      {toastMessage.value && (
        <div class="toast toast-bottom toast-center z-50 transition-all duration-300">
          <div class="alert alert-info shadow-lg">
            <span>{toastMessage.value}</span>
          </div>
        </div>
      )}
    </>
  );
}
