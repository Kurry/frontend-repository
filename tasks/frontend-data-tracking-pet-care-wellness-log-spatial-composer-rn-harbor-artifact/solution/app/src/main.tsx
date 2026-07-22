import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initWebMCP } from './webmcp'

initWebMCP();

const Root = () => {
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);

    React.useEffect(() => {
        const handleUpdate = () => forceUpdate();
        window.addEventListener('webmcp_state_update', handleUpdate);
        return () => window.removeEventListener('webmcp_state_update', handleUpdate);
    }, []);

    return (
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <Root />
)
