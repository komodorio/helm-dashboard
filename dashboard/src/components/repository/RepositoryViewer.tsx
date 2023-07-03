import { BsTrash3, BsArrowRepeat } from "react-icons/bs";
import { Chart, Repository } from "../../data/types";
import ChartViewer from "./ChartViewer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiService from "../../API/apiService";
import Spinner from "../Spinner";
import { useUpdateRepo } from "../../API/repositories";
import { callApi } from "../../API/releases";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

type RepositoryViewerProps = {
  repository: Repository | undefined;
};

function RepositoryViewer({ repository }: RepositoryViewerProps) {
  const [searchValue, setSearchValue] = useState("");
  const [isRemoveLoading, setIsRemove] = useState(false);
  const { context } = useParams();
  const { setSelectedRepo, selectedRepo } = useAppContext();
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const { data: charts, isLoading } = useQuery<Chart[]>({
    queryKey: ["charts", repository?.name || ""],
    queryFn: apiService.getRepositoryCharts,
    refetchOnWindowFocus: false,
    enabled: !!repository?.name,
  });

  useEffect(() => {
    setSearchValue("");
  }, [repository, selectedRepo]);

  const update = useUpdateRepo(repository?.name || "", {
    retry: false,
    onSuccess: () => {
      window.location.reload();
    },
  });

  const removeRepository = async () => {
    if (confirm("Confirm removing repository?")) {
      try {
        setIsRemove(true);
        const repo = repository?.name || "";
        await callApi<void>(`/api/helm/repositories/${repo}`, {
          method: "DELETE",
        });
        navigate(`/repository/${context}`, { replace: true });
        setSelectedRepo("");
        queryClient.invalidateQueries({ queryKey: ["helm", "repositories"] });
      } catch (error) {
        console.error(error);
      } finally {
        setIsRemove(false);
      }
    }
  };

  const numOfCharts = charts?.length;
  const showNoChartsAlert = Boolean(!numOfCharts && numOfCharts == 0);
  const filteredCharts = useMemo(() => {
    return charts?.filter((ch: Chart) =>
      ch.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [searchValue]);

  if (repository == undefined) {
    return (
      <div className="bg-white rounded shadow display-none no-charts mt-3 text-sm p-4">
        Looks like you don't have any repositories installed. You can add one
        with the "Add Repository" button on the left side bar.
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 gap-3 bg-white drop-shadow-lg">
      <span className="text-[#707583] font-bold text-xs">REPOSITORY</span>
      <div className="flex justify-between">
        <span className="text-[#3d4048] text-4xl font-semibold">
          {repository?.name}
        </span>

        <div className="flex flex-col">
          <div className="flex flex-row gap-2">
            <button
              onClick={() => {
                update.mutate();
              }}
            >
              <span className="h-8 flex items-center gap-2 bg-white border border-gray-300 px-5 py-1 text-sm font-semibold">
                {update.isLoading ? <Spinner size={4} /> : <BsArrowRepeat />}
                Update
              </span>
            </button>
            <button
              onClick={() => {
                removeRepository();
              }}
            >
              <span className="h-8 flex items-center gap-2 bg-white border border-gray-300 px-5 py-1 text-sm font-semibold">
                {isRemoveLoading ? <Spinner size={4} /> : <BsTrash3 />}
                Remove
              </span>
            </button>
          </div>
          <input
            onChange={(e) => setSearchValue(e.target.value)}
            value={searchValue}
            type="text"
            placeholder="Filter..."
            className="mt-2  h-8 p-2 text-sm w-full border border-gray-300 focus:outline-none focus:border-sky-500 input-box-shadow"
          />
        </div>
      </div>
      <span className="text-[#3d4048] text-sm bg-[#D6EFFE] px-3 py-1 rounded-md self-start">
        URL: <span className="font-bold">{repository?.url}</span>
      </span>

      <div className="bg-[#ECEFF2] grid grid-cols-6 text-xs font-bold p-2 px-4 mt-4 rounded-md">
        <span className="col-span-1">CHART NAME</span>
        <span className="col-span-3">DESCRIPTION</span>
        <span className="col-span-1 text-center">VERSION</span>
        <span className="col-span-1 text-center"></span>
      </div>
      {isLoading ? (
        <Spinner />
      ) : (
        (filteredCharts || charts)?.map((chart: Chart) => (
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
