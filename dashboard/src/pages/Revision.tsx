import { useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import RevisionDetails from "../components/revision/RevisionDetails";
import RevisionsList from "../components/revision/RevisionsList";
import { Release, ReleaseRevision } from "../data/types";
import { useQuery } from "@tanstack/react-query";
import apiService from "../API/apiService";

const releaseRevisions: ReleaseRevision[] = [
  {
    revision: 1,
    updated: "2023-04-03T15:49:47.3335433+03:00",
    status: "superseded",
    chart: "argo-cd-4.5.3",
    app_version: "2.6.7",
    description: "Install complete",
    chart_name: "argo-cd",
    chart_ver: "4.5.3",
    has_tests: false,
  },
  {
    revision: 2,
    updated: "2023-04-05T08:00:07.7821687+03:00",
    status: "deployed",
    chart: "argo-cd-4.5.3",
    app_version: "2.6.7",
    description: "Upgrade complete",
    chart_name: "argo-cd",
    chart_ver: "4.5.3",
    has_tests: false,
  },
];

const descendingSort = (r1: ReleaseRevision, r2: ReleaseRevision) =>
  r1.revision - r2.revision < 0 ? 1 : -1;

function Revision() {
  const { state: release } = useLocation();
  const { revision = "", ...restParams } = useParams();

  const selectedRevision = revision ? parseInt(revision, 10) : 0;

  const { data: releaseRevisions, refetch: refetchRevisions } = useQuery<
    ReleaseRevision[]
  >({
    queryKey: ["releasesHisotry", restParams],
    queryFn: apiService.getReleasesHistory,
  });
  const sortedReleases = useMemo(
    () => releaseRevisions?.sort(descendingSort),
    [releaseRevisions]
  );

  const selectedRelease = useMemo(() => {
    if (selectedRevision && releaseRevisions) {
      return releaseRevisions.find(
        (r: ReleaseRevision) => r.revision === selectedRevision
      );
    }
    return null;
  }, [releaseRevisions, selectedRevision]);

  if (!releaseRevisions) return <></>;

  return (
    <div className="flex">
      <div className="flex flex-col gap-2 w-1/6 min-h-screen bg-[#E8EDF2] pb-4">
        <label className="mt-5 mx-5 text-sm text-[#3D4048] font-semibold">
          Revisions
        </label>
        <RevisionsList
          releaseRevisions={sortedReleases}
          selectedRevision={selectedRevision}
        />
      </div>

      <div className="w-5/6 min-h-screen bg-[#F4F7FA] pb-4">
        {selectedRelease ? (
          <RevisionDetails
            release={selectedRelease}
            refetchRevisions={refetchRevisions}
          />
        ) : (
          ""
        )}
      </div>
    </div>
  );
}

export default Revision;
