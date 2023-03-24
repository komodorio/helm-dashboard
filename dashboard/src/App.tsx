import Header from "./layout/Header";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import Installed from "./pages/Installed";
import NotFound from "./pages/NotFound";
import Repository from "./pages/Repository";
import Sidebar from "./layout/Sidebar";

export default function App() {
  return (
    <div>
      <BrowserRouter>
        <Header />
        <div className="bg-body-background h-screen">
          <div className="bg-no-repeat bg-[url('./assets/body-background.svg')] h-screen">
            <Routes>
              <Route path="/" element={<Sidebar/>}/>
              <Route path="/installed" element={<Installed />} />
              <Route path="/repository" element={<Repository />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
        
      </BrowserRouter>
    </div>
  );
}
