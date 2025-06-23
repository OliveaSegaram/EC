import { createContext, useState, useContext } from 'react';
import type {ReactNode} from 'react';

interface AppContextType {
  backendUrl: string;
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
}

const defaultState = {
  backendUrl: '',
  isLoggedIn: false,
  setIsLoggedIn: () => {},
};

export const AppContext = createContext<AppContextType>(defaultState);

interface AppContextProviderProps {
  children: ReactNode;
}

export const AppContextProvider = ({ children }: AppContextProviderProps) => {
  const [backendUrl] = useState(`${import.meta.env.VITE_APP_BACKEND_URL}/api`);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <AppContext.Provider value={{ backendUrl, isLoggedIn, setIsLoggedIn }}>
      {children}
    </AppContext.Provider>
  );
};


export const useAppContext = () => useContext(AppContext);
