'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type ConnectingValue = {
  connecting: boolean;
  setConnecting: (value: boolean) => void;
};

const ConnectingContext = createContext<ConnectingValue>({
  connecting: false,
  setConnecting: () => undefined,
});

export const useConnecting = (): ConnectingValue => useContext(ConnectingContext);

export const ConnectingProvider = ({ children }: { children: ReactNode }) => {
  const [connecting, setConnecting] = useState(false);
  const value = useMemo(() => ({ connecting, setConnecting }), [connecting]);

  return <ConnectingContext.Provider value={value}>{children}</ConnectingContext.Provider>;
};
