import { useQuery } from "@tanstack/react-query";
import { useMemo, Suspense, lazy } from "react";
import { useParams } from "react-router";

import apiService from "../API/apiService";
import RevisionsList from "../components/revision/RevisionsList";
import Spinner from "../components/Spinner";
import type { ReleaseRevision } from "../data/types";

const RevisionDetails = lazy(
  () => import("../components/revision/RevisionDetails")
);

const descendingSort = (r1: ReleaseRevision, r2: ReleaseRevision) =>
  r1.revision - r2.revision < 0 ? 1 : -1;

function Revision() {
  const { revision = "", ...restParams } = useParams();

  const selectedRevision = revision ? parseInt(revision, 10) : 0;

  const { data: releaseRevisions = [], isLoading: isLoadingHistory } = useQuery(
    {
      queryKey: ["releasesHistory", restParams],
      queryFn: apiService.getReleasesHistory,
      select: (data) => data?.sort(descendingSort),
    }
  );

  const latestRevision = useMemo(
    () =>
      releaseRevisions.reduce((max, revisionData) => {
        return Math.max(max, revisionData.revision);
      }, Number.MIN_SAFE_INTEGER),
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

  return (
    <div className="flex">
      <div className="flex min-h-screen w-1/6 flex-col gap-2 bg-[#E8EDF2] pb-4">
        <label className="mx-5 mt-5 text-sm font-semibold text-dark">
          Revisions
        </label>
        {isLoadingHistory ? (
          <RevisionSidebarSkeleton />
        ) : (
          <RevisionsList
            releaseRevisions={releaseRevisions}
            selectedRevision={selectedRevision}
          />
        )}
      </div>

      <div className="min-h-screen w-5/6 bg-body-background pb-4">
        {isLoadingHistory ? (
          <div className="p-4">
            <Spinner />
          </div>
        ) : selectedRelease ? (
          <Suspense fallback={<Spinner />}>
            <RevisionDetails
              release={selectedRelease} // TODO fix it
              installedRevision={releaseRevisions?.[0]}
              isLatest={selectedRelease.revision === latestRevision}
              latestRevision={latestRevision}
            />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}

const RevisionSidebarSkeleton = () => {
  return Array.from({ length: 6 }).map((_, i) => (
    <div
      key={i}
      className="mx-5 h-[74px] w-[88%] animate-pulse gap-4 rounded-md border border-gray-200 bg-gray-100 p-2"
    />
  ));
};

export default Revision;
