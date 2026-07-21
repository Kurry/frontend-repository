import { render } from '@builder.io/qwik';
import { QWIK_LOADER } from '@builder.io/qwik/loader';
import App from './app';
import './app.css';

// CSR-only builds need the loader injected manually before render.
if (!('__q_context__' in document)) {
  const loader = document.createElement('script');
  loader.id = 'qwikloader';
  loader.textContent = QWIK_LOADER;
  document.head.appendChild(loader);
}

const root = document.getElementById('app');
if (!root) throw new Error('Missing #app mount element');

render(root, <App />);
