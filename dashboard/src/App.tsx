import Header from "./layout/Header";
import { HashRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import Installed from "./pages/Installed";
import RepositoryPage from "./pages/Repository";
import Revision from "./pages/Revision";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorAlert, ErrorModalContext } from "./context/ErrorModalContext";
import GlobalErrorModal from "./components/modal/GlobalErrorModal";
import { AppContextProvider } from "./context/AppContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      <div className="bg-body-background min-h-screen min-w-screen">
        <div className="bg-no-repeat bg-[url('./assets/body-background.svg')] min-h-screen max-h-full">
          {children}
        </div>
      </div>
    </>
  );
};

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
                <Route
                  path="/installed/:context?"
                  element={
                    <PageLayout>
                      <Installed />
                    </PageLayout>
                  }
                />
                <Route
                  path="/installed/revision/:context/:namespace/:chart/:revision"
                  element={
                    <PageLayout>
                      <Revision />
                    </PageLayout>
                  }
                />
                <Route
                  path="/repository/:context"
                  element={
                    <PageLayout>
                      <RepositoryPage />
                    </PageLayout>
                  }
                />
                <Route
                  path="/repository/:context/:selectedRepo?"
                  element={
                    <PageLayout>
                      <RepositoryPage />
                    </PageLayout>
                  }
                />
                <Route
                  path="*"
                  element={
                    <PageLayout>
                      <Installed />
                    </PageLayout>
                  }
                />
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
