import React, { createContext, useState, ReactNode, useContext } from 'react';

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
  const [backendUrl] = useState('http://localhost:5000/api');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <AppContext.Provider value={{ backendUrl, isLoggedIn, setIsLoggedIn }}>
      {children}
    </AppContext.Provider>
  );
};


export const useAppContext = () => useContext(AppContext);
