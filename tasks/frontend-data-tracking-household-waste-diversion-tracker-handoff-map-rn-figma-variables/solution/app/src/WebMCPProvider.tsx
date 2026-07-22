import React, { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAppStore } from './store';
import { setupWebMCP } from './webmcp';

export const WebMCPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state, dispatch } = useAppStore();

  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    setupWebMCP(
      () => stateRef.current,
      dispatch
    );
  }, [dispatch]);

  return <>{children}</>;
};
