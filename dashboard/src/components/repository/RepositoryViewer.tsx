import axios from "axios";
import { BsTrash3, BsArrowRepeat } from "react-icons/bs";
import { Chart } from "../../data/types";

const charts: Partial<Chart>[] = [
  {
    id: "1",
    name: "airflow",
    description:
      "Apache Airflow is a tool to express and execute workflows as directed acyclic graphs (DAGs). It includes utilities to schedule tasks, monitor task progress and handle task dependencies.",
    version: "14.0.17",
  },
  {
    id: "2",
    name: "apache",
    description:
      "Apache HTTP Server is an open-source HTTP server. The goal of this project is to provide a secure, efficient and extensible server that provides HTTP services in sync with the current HTTP standards.",
    version: "9.2.23",
  },
];

function RepositoryViewer() {
  const update = async () => {
    try {
      const repository = ""; // todo: take from real data
      const url = `/api/helm/repositories/${repository}`;
      await axios.post(url);
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };

  const removeRepository = async () => {
    if (confirm("Confirm removing repository?")) {
      try {
        const repo = ""; // todo: take from real data
        const url = `/api/helm/repositories/${repo}`;
        await axios.delete(url);
        window.location.reload();
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="flex flex-col px-16 pt-5 gap-3 bg-white drop-shadow-lg">
      <span className="text-[#707583] font-bold text-xs">REPOSITORY</span>
      <div className="flex justify-between">
        <span className="text-[#3d4048] text-4xl">airFlow</span>
        <div className="flex flex-row gap-3">
          <button onClick={update}>
            <span className="flex items-center gap-2 bg-white border border-gray-300 px-5 py-1 text-sm font-semibold">
              <BsArrowRepeat />
              Update
            </span>
          </button>
          <button onClick={removeRepository}>
            <span className="flex items-center gap-2 bg-white border border-gray-300 px-5 py-1 text-sm font-semibold">
              <BsTrash3 />
              Remove
            </span>
          </button>
        </div>
      </div>

      <div className="bg-[#ECEFF2] grid grid-cols-4 text-xs font-bold p-2 px-4 rounded-md">
        <span className="col-span-1">CHART NAME</span>
        <span className="col-span-2">DESCRIPTION</span>
        <span className="col-span-1">VERSION</span>
      </div>

      {charts.map((chart) => (
        <div key={chart.id} className="grid grid-cols-4 hover:bg-[#f4f7fa] p-4">
          <span className="col-span-1 font-semibold flex flex-row items-center gap-1">
            <img src="https://bitnami.com/assets/stacks/airflow/img/airflow-stack-220x234.png"
            className="h-4"/>
            {chart.name}
            </span>
          <span className="col-span-2 text-sm">{chart.description}</span>
          <span className="col-span-1">{chart.version}</span>
        </div>
      ))}
    </div>
  );
}

export default RepositoryViewer;
