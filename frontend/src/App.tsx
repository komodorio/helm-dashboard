import Header from "./layout/Header";
import { HashRouter, Outlet, Route, Routes, useParams } from "react-router";
import Installed from "./pages/Installed";
import RepositoryPage from "./pages/Repository";
import Revision from "./pages/Revision";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FC } from "react";
import { useState, lazy } from "react";
import type { ErrorAlert } from "./context/ErrorModalContext";
import { ErrorModalContext } from "./context/ErrorModalContext";
import GlobalErrorModal from "./components/modal/GlobalErrorModal";
import { AppContextProvider } from "./context/AppContext";
import apiService from "./API/apiService";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "./components/ErrorFallback";

const DocsPage = lazy(() => import("./pages/DocsPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const PageLayout = () => {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex-1 bg-body-background bg-[url('./assets/body-background.svg')] bg-no-repeat">
        <Outlet />
      </div>
    </div>
  );
};

const SyncContext: FC = () => {
  const { context } = useParams();
  if (context) {
    apiService.setCluster(decodeURIComponent(context));
  }

  return <Outlet />;
};

export default function App() {
  const [shouldShowErrorModal, setShowErrorModal] = useState<
    ErrorAlert | undefined
  >(undefined);
  const value = { shouldShowErrorModal, setShowErrorModal };

  return (
    <AppContextProvider>
      <ErrorModalContext.Provider value={value}>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <HashRouter>
              <Routes>
                <Route path="docs/*" element={<DocsPage />} />
                <Route path="*" element={<PageLayout />}>
                  <Route path=":context?/*" element={<SyncContext />}>
                    <Route
                      path="repository/:selectedRepo?/*"
                      element={<RepositoryPage />}
                    />
                    <Route path="installed/?" element={<Installed />} />
                    <Route
                      path=":namespace/:chart/installed/revision/:revision"
                      element={<Revision />}
                    />
                    <Route path="*" element={<Installed />} />
                  </Route>
                </Route>
              </Routes>
            </HashRouter>
          </ErrorBoundary>
          <GlobalErrorModal
            isOpen={!!shouldShowErrorModal}
            onClose={() => setShowErrorModal(undefined)}
            titleText={shouldShowErrorModal?.title || ""}
            contentText={shouldShowErrorModal?.msg || ""}
          />
        </QueryClientProvider>
      </ErrorModalContext.Provider>
    </AppContextProvider>
  );
}
