import axios from "axios";
import { BsTrash3, BsArrowRepeat } from "react-icons/bs";
import { Chart, Repository } from "../../data/types";
import ChartViewer from "./ChartViewer";
import { useQuery } from "@tanstack/react-query";
import apiService from "../../API/apiService";
import Spinner from "../Spinner";

type RepositoryViewerProps = {
  repository: Repository | undefined;
};

function RepositoryViewer({ repository }: RepositoryViewerProps) {
  const { data: charts, isLoading } = useQuery<Chart[]>({
    queryKey: ["charts", repository],
    queryFn: apiService.getRepositoryCharts,
  });

  const update = async () => {
    try {
      const url = `/api/helm/repositories/${repository?.name}`;
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

  const numOfCharts = charts?.length;
  const showNoChartsAlert = Boolean(!numOfCharts && numOfCharts == 0);

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
      {isLoading ? (
        <Spinner />
      ) : (
        charts?.map((chart: Chart) => (
          <ChartViewer key={chart.name} chart={chart} />
        ))
      )}

      {showNoChartsAlert && (
        <div className="bg-white rounded shadow display-none no-charts mt-3 text-sm p-4">
          Looks like you don't have any repositories installed. You can add one
          with the "Add Repository" button on the left side bar.
        </div>
      )}
    </div>
  );
}

export default RepositoryViewer;
