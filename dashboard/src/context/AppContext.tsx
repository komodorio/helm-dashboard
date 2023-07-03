import { createContext, useState, useContext } from "react";

export interface AppContextData {
  selectedRepo: string;
  setSelectedRepo: (newValue: string) => void;
}

const AppContext = createContext<AppContextData | undefined>(undefined);

export const useAppContext = (): AppContextData => {
    const context = useContext(AppContext);
    if (!context) {
      throw new Error('useAppContext must be used within a AppContextProvider');
    }
    return context;
  };

export const AppContextProvider: React.FC = ({ children }) => {
    const [selectedRepo, setSelectedRepo] = useState('');
  
  
    const contextValue: AppContextData = {
      selectedRepo,
      setSelectedRepo,
    };
  
    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
  };

export default AppContext;
