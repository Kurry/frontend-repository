import { useEffect } from 'react';
import { useFlavorStore } from './store';
import { Layout } from './components/Layout';
import { WebMCP } from './components/WebMCP';
import { MotionConfig } from 'framer-motion';

export default function App() {
  useEffect(() => {
    // Expose store for WebMCP
    window.useFlavorStore = useFlavorStore;
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <Layout />
      <WebMCP />
    </MotionConfig>
  );
}
