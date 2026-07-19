import { h, render } from 'preact';
import { App } from './App';
import { initWebmcp } from './webmcp';

const root = document.getElementById('app');
render(h(App), root);

initWebmcp();
