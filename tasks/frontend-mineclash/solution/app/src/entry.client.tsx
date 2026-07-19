import { render } from '@builder.io/qwik';
import { QWIK_LOADER } from '@builder.io/qwik/loader';
import { App } from './components/App';
import './global.css';

if (!('__q_context__' in document)) {
  const loader = document.createElement('script');
  loader.id = 'qwikloader';
  loader.textContent = QWIK_LOADER;
  document.head.appendChild(loader);
}

const app = document.getElementById('app');
if (!app) throw new Error('Missing #app mount element');

render(app, <App />);
