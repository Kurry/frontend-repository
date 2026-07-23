import { render } from 'solid-js/web';
import App from './App';
import './global.css';
import './webmcp';

const root = document.getElementById('app');
render(() => <App />, root!);
