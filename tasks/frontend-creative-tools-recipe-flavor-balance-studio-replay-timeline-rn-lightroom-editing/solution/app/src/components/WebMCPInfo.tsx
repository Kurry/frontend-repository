import { useEffect } from 'react';
import { initWebMCP } from '../webmcp';

export function WebMCPInfo() {
  useEffect(() => {
    initWebMCP();
  }, []);

  return null;
}
