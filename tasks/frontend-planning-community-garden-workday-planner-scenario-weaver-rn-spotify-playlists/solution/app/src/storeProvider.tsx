import { ReactNode } from 'react';
import { StoreContext, useStoreProvider } from './store';

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const store = useStoreProvider();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};
