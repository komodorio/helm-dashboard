import { createContext, useState, useContext } from "react";

export interface AppContextData {
  selectedCluster: string;
  setSelectedCluster: (newValue: string) => void;
}

const AppContext = createContext<AppContextData | undefined>(undefined);

export const useAppContext = (): AppContextData => {
    const context = useContext(AppContext);
    if (!context) {
      throw new Error('useMyContext must be used within a MyContextProvider');
    }
    return context;
  };

export const AppContextProvider: React.FC = ({ children }) => {
    const [selectedCluster, setSelectedCluster] = useState('');
  
  
    const contextValue: AppContextData = {
      selectedCluster,
      setSelectedCluster,
    };
  
    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
  };

export default AppContext;
