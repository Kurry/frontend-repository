import { render } from 'solid-js/web';
import App from './App';
import './index.css';
import { initWebMCP } from './webmcp';

initWebMCP();

render(() => <App />, document.getElementById('root'));
