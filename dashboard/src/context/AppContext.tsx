import { createContext, useState, useContext } from "react";

export interface AppContextData {
  selectedRepo: string;
  setSelectedRepo: (newValue: string) => void;
  clusterMode: boolean;
  setClusterMode: (newValue: boolean) => void;
}

const AppContext = createContext<AppContextData | undefined>(undefined);

export const useAppContext = (): AppContextData => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within a AppContextProvider");
  }
  return context;
};

export const AppContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedRepo, setSelectedRepo] = useState("");
  const [clusterMode, setClusterMode] = useState(false);

  const contextValue: AppContextData = {
    selectedRepo,
    setSelectedRepo,
    clusterMode,
    setClusterMode,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

export default AppContext;
