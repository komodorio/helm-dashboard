import "./App.css";
import Badge from "./components/Badge";
import Status from "./components/Status";
import Button from "./components/Button";
import RevisionCard from "./components/RevisionCard";
import TabsBar from "./components/TabsBar";
function App() {
  return (
    <div>
      <hr />
      <Badge type="error"> Not Available</Badge>
      <hr />
      <Badge type="success"> Available </Badge>
      <hr />
      <Status isRefreshable={false} statusCode="Deployed" />
      <hr />
      <Button
        onClick={() => {
          return;
        }}
      >
        {" "}
        hello
      </Button>
      <hr />
      <TabsBar 
          tabs={[{name: "hello", component: <div>hello</div>}, {name: "hello2", component: <div>hello2</div>}]} 
          activeTab="hello" setActiveTab={(tab)=>{return;}} 
          setTabContent={(tab)=>{return;}}
        />
      <hr />
      <div className="relative h-64 w-32">
        <RevisionCard
          revisionDate={new Date("August 19, 1975 23:15:30")}
          revision={"8"}
          previousVersion={"1.0.0"}
          currentVersion={"1.0.1"}
          statusCode={"Superseded"}
          isActive="true"
          isRefreshable={true}
          onClick={() => {
            return;
          }}
        />
        <RevisionCard
          revisionDate={new Date("August 19, 2022 23:15:30")}
          revision={"7"}
          previousVersion={"1.0.0"}
          currentVersion={"1.0.1"}
          statusCode={"Failed"}
          isActive="false"
          isRefreshable={false}
          onClick={() => {
            return;
          }}
        />
        <RevisionCard
          revisionDate={new Date("March 3, 2023 23:15:30")}
          revision={"6"}
          previousVersion={"2.1.0"}
          currentVersion={"1.0.1"}
          statusCode={"Deployed"}
          isActive="false"
          isRefreshable={false}
          onClick={() => {
            return;
          }}
        />
      </div>
    </div>
  );
}

export default App;
