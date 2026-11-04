import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { BsTrash3, BsArrowRepeat } from "react-icons/bs";
import { useNavigate } from "react-router";

import apiService from "../../API/apiService";
import { useUpdateRepo } from "../../API/repositories";
import { useAppContext } from "../../context/AppContext";
import type { Chart, Repository } from "../../data/types";
import Spinner from "../Spinner";

import ChartViewer from "./ChartViewer";

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
        await apiService.fetchWithDefaults<void>(
          `/api/helm/repositories/${repo}`,
          {
            method: "DELETE",
          }
        );
        await navigate("/repository", { replace: true });
        setSelectedRepo("");
        await queryClient.invalidateQueries({
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
      <div className="display-none no-charts mt-3 rounded-sm bg-white p-4 text-sm shadow-sm">
        Looks like you don&apos;t have any repositories installed. You can add
        one with the &quot;Add Repository&quot; button on the left side bar.
      </div>
    );
  }

  return (
    <div className="custom-shadow flex flex-col gap-3 rounded-md border bg-white p-6">
      <span className="text-xs font-bold text-muted">REPOSITORY</span>
      <div className="flex justify-between">
        <span className="text-3xl font-semibold text-dark">
          {repository?.name}
        </span>

        <div className="flex flex-col">
          <div className="flex flex-row gap-2">
            <button
              onClick={() => {
                update.mutate();
              }}
            >
              <span className="flex h-8 items-center gap-2 rounded-sm border border-gray-300 bg-white px-5 py-1 text-sm font-semibold">
                {update.isPending ? <Spinner size={4} /> : <BsArrowRepeat />}
                Update
              </span>
            </button>
            <button
              onClick={() => {
                void removeRepository();
              }}
            >
              <span className="flex h-8 items-center gap-2 rounded-sm border border-gray-300 bg-white px-5 py-1 text-sm font-semibold">
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
            className="input-box-shadow mt-2 h-8 w-full rounded-sm border border-gray-300 p-2 text-sm focus:border-sky-500 focus:outline-hidden"
          />
        </div>
      </div>
      <span className="-mt-10 self-start rounded-md bg-repository px-3 py-1 text-sm text-dark">
        URL: <span className="font-bold">{repository?.url}</span>
      </span>

      <div className="mt-4 grid grid-cols-10 rounded-md bg-secondary p-2 px-4 text-xs font-bold">
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
        <div className="display-none no-charts mt-3 rounded-sm bg-white p-4 text-sm shadow-sm">
          Looks like you don&apos;t have any repositories installed. You can add
          one with the &quot;Add Repository&quot; button on the left side bar.
        </div>
      )}
    </div>
  );
}

export default RepositoryViewer;
