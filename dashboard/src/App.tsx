import Header from "./layout/Header";
import { HashRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import Installed from "./pages/Installed";
import NotFound from "./pages/NotFound";
import RepositoryPage from "./pages/Repository";
import Revision from "./pages/Revision";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorModal from "./components/modal/ErrorModal";
import { useState } from "react";
import { ErrorAlert, ErrorModalContext } from "./context/ErrorModalContext";
import GlobalErrorModal from "./components/modal/GlobalErrorModal";

const queryClient = new QueryClient();

export default function App() {
  const [shouldShowErrorModal, setShowErrorModal] = useState<ErrorAlert | undefined>(undefined);
  const value = { shouldShowErrorModal, setShowErrorModal };
  
  console.log(shouldShowErrorModal)
  return (
    <div>
    <ErrorModalContext.Provider value={value}>
        <QueryClientProvider client={queryClient}>
          <HashRouter>
            <Header />
            <div className="bg-body-background h-screen">
              <div className="bg-no-repeat bg-[url('./assets/body-background.svg')] h-screen max-h-full overflow-y-auto ">
                <Routes>
                  <Route path="/" element={<Installed />} />
                  <Route
                    path="/revision/:context/:namespace/:chart/:revision/:tab"
                    element={<Revision />}
                  />
                  <Route path="/repository" element={<RepositoryPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </div>
            <GlobalErrorModal isOpen={!!shouldShowErrorModal} onClose={() => setShowErrorModal(undefined)} titleText={shouldShowErrorModal?.title  || ""} contentText={shouldShowErrorModal?.msg || ""}/>
          </HashRouter>
        </QueryClientProvider>
      </ErrorModalContext.Provider>
    </div>
  );
}
