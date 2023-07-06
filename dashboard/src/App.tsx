import Header from "./layout/Header";
import { HashRouter, Outlet, Route, Routes, useLocation, useMatch, useParams } from "react-router-dom";
import "./index.css";
import Installed from "./pages/Installed";
import RepositoryPage from "./pages/Repository";
import Revision from "./pages/Revision";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useContext, useEffect, useState } from "react";
import { ErrorAlert, ErrorModalContext } from "./context/ErrorModalContext";
import GlobalErrorModal from "./components/modal/GlobalErrorModal";
import { AppContextProvider, useAppContext } from "./context/AppContext";
import apiService from "./API/apiService";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const PageLayout = () => {
  return (
    <>
      <Header />
      <div className="bg-body-background min-h-screen min-w-screen">
        <div className="bg-no-repeat bg-[url('./assets/body-background.svg')] min-h-screen max-h-full">
          <Outlet />
        </div>
      </div>
    </>
  );
};

const SyncContext: React.FC = () => {
  const { context } = useParams();
  if (context) {
    apiService.setCluster(context);
  }

  return <Outlet />;
}

export default function App() {
  const [shouldShowErrorModal, setShowErrorModal] = useState<
    ErrorAlert | undefined
  >(undefined);
  const value = { shouldShowErrorModal, setShowErrorModal };

  return (
    <div>
      <AppContextProvider>
        <ErrorModalContext.Provider value={value}>
          <QueryClientProvider client={queryClient}>
            <HashRouter>
                <Routes>
                  <Route path="*" element={<PageLayout />} >
                    <Route path=":context/*" element={<SyncContext />} >
                      <Route
                        path="installed/?"
                        element={<Installed />}
                      />
                      <Route
                        path=":namespace/:chart/installed/revision/:revision"
                        element={
                          <Revision />
                        }
                      />
                      <Route
                        path="repository/"
                        element={
                          <RepositoryPage />
                        }
                      />
                      <Route
                        path="repository/:selectedRepo?"
                        element={
                          <RepositoryPage />
                        }
                      />
                      <Route
                        path="*"
                        element={
                          <Installed />
                        }
                      />
                    </Route>
                    <Route
                      path="*"
                      element={
                        <Installed />
                      }
                    />
                  </Route>
                </Routes>
              <GlobalErrorModal
                isOpen={!!shouldShowErrorModal}
                onClose={() => setShowErrorModal(undefined)}
                titleText={shouldShowErrorModal?.title || ""}
                contentText={shouldShowErrorModal?.msg || ""}
              />
            </HashRouter>
          </QueryClientProvider>
        </ErrorModalContext.Provider>
      </AppContextProvider>
    </div>
  );
}
