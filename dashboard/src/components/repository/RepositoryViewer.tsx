import axios from "axios";
import { BsTrash3, BsArrowRepeat } from "react-icons/bs";
import { Chart } from "../../data/types";
import ChartViewer from "./ChartViewer";

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
      <span className="text-[#3d4048] text-sm bg-[#D6EFFE] px-3 py-1 rounded-md self-start">
        URL:{" "}
        <span className="font-bold">https://charts.bitnami.com/bitnami</span>
      </span>

      <div className="bg-[#ECEFF2] grid grid-cols-5 text-xs font-bold p-2 px-4 rounded-md">
        <span className="col-span-1">CHART NAME</span>
        <span className="col-span-2">DESCRIPTION</span>
        <span className="col-span-1">VERSION</span>
        <span className="col-span-1"></span>
      </div>

      {charts.map((chart) => (
        <ChartViewer key={chart.id} chart={chart} />
      ))}
    </div>
  );
}

export default RepositoryViewer;
