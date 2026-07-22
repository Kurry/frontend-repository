import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

// WebMCP stubs
window.webmcp_session_info = () => ({ status: 'ready', tools: ['editor', 'entity', 'artifact'] });
window.webmcp_list_tools = () => [];
window.webmcp_invoke_tool = async (tool, args) => ({ success: true, result: {} });
