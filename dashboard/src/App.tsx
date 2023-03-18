import "./App.css";
import Body from "./layout/Body";
import Header from "./layout/Header";
import "./index.css";
import Sidebar from "./layout/Sidebar";

function App(): JSX.Element {

  return (
    <div className="app">
      <Header/>
      <div className="card">
        <Sidebar/>
        <Body/>
      </div>
    </div>
  );
}

export default App;
