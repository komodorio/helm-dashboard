import { BsTrash3, BsArrowRepeat } from "react-icons/bs";
import { Chart, Repository } from "../../data/types";
import ChartViewer from "./ChartViewer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiService from "../../API/apiService";
import Spinner from "../Spinner";
import { useUpdateRepo } from "../../API/repositories";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

type RepositoryViewerProps = {
  repository: Repository | undefined;
};

function RepositoryViewer({ repository }: RepositoryViewerProps) {
  const [searchValue, setSearchValue] = useState("");
  const [isRemoveLoading, setIsRemove] = useState(false);
  const { setSelectedRepo, selectedRepo } = useAppContext();
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const { data: charts, isLoading } = useQuery<Chart[]>({
    //@ts-ignore
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
    //this is expected
    //eslint-disable-next-line no-alert
    if (confirm("Confirm removing repository?")) {
      try {
        setIsRemove(true);
        const repo = repository?.name || "";
        await apiService.fetchWithDefaults<void>(
          `/api/helm/repositories/${repo}`,
          {
            method: "DELETE",
          }
        );
        navigate("/repository", { replace: true });
        setSelectedRepo("");
        queryClient.invalidateQueries({
          queryKey: ["helm", "repositories"],
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsRemove(false);
      }
    }
  };

  const numOfCharts = (charts as Chart[])?.length;
  const showNoChartsAlert = Boolean(!numOfCharts && numOfCharts === 0);
  const filteredCharts = useMemo(() => {
    return (charts as Chart[])?.filter((ch: Chart) =>
      ch.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [charts, searchValue]);

  if (repository === undefined) {
    return (
      <div className="bg-white rounded shadow display-none no-charts mt-3 text-sm p-4">
        Looks like you don&apos;t have any repositories installed. You can add
        one with the &quot;Add Repository&quot; button on the left side bar.
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 gap-3 bg-white custom-shadow border rounded-md">
      <span className="text-muted font-bold text-xs">REPOSITORY</span>
      <div className="flex justify-between">
        <span className="text-dark text-3xl font-semibold">
          {repository?.name}
        </span>

        <div className="flex flex-col">
          <div className="flex flex-row gap-2">
            <button
              onClick={() => {
                update.mutate();
              }}
            >
              <span className="h-8 flex items-center gap-2 bg-white border border-gray-300 px-5 py-1 text-sm font-semibold rounded">
                {update.isLoading ? <Spinner size={4} /> : <BsArrowRepeat />}
                Update
              </span>
            </button>
            <button
              onClick={() => {
                removeRepository();
              }}
            >
              <span className="h-8 flex items-center gap-2 bg-white border border-gray-300 px-5 py-1 text-sm font-semibold rounded">
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
            className="mt-2  h-8 p-2 text-sm w-full border border-gray-300 focus:outline-none focus:border-sky-500 input-box-shadow rounded"
          />
        </div>
      </div>
      <span className="text-dark text-sm bg-repository px-3 py-1 rounded-md self-start -mt-10">
        URL: <span className="font-bold">{repository?.url}</span>
      </span>

      <div className="bg-secondary grid grid-cols-10 text-xs font-bold p-2 px-4 mt-4 rounded-md">
        <span className="col-span-2">CHART NAME</span>
        <span className="col-span-6">DESCRIPTION</span>
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
          Looks like you don&apos;t have any repositories installed. You can add
          one with the &quot;Add Repository&quot; button on the left side bar.
        </div>
      )}
    </div>
  );
}

export default RepositoryViewer;
