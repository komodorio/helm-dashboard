import Header from "./layout/Header";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import Installed from "./pages/Installed";
import NotFound from "./pages/NotFound";
import Repository from "./pages/Repository";

export default function App() {
  return (
    <div>
      <BrowserRouter>
        <Header />
        <div className="bg-body-background h-screen">
          <div className="bg-[url('./assets/body-background.svg')] h-screen">
            <Routes>
              <Route path="/" element={<Installed />} />
              <Route path="/repository" element={<Repository />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </div>
  );
}
