import { useMemo } from "react";
import { useParams } from "react-router-dom";
import RevisionDetails from "../components/revision/RevisionDetails";
import RevisionsList from "../components/revision/RevisionsList";
import { ReleaseRevision } from "../data/types";
import { useQuery } from "@tanstack/react-query";
import apiService from "../API/apiService";
import Spinner from "../components/Spinner";

const descendingSort = (r1: ReleaseRevision, r2: ReleaseRevision) =>
  r1.revision - r2.revision < 0 ? 1 : -1;

function Revision() {
  const { revision = "", ...restParams } = useParams();

  const selectedRevision = revision ? parseInt(revision, 10) : 0;

  const { data: releaseRevisions, isLoading: isLoadingHistory } = useQuery<
    ReleaseRevision[]
  >({
    //eslint-ignore
    //@ts-ignore
    queryKey: ["releasesHistory", restParams],
    queryFn: apiService.getReleasesHistory,
  });

  const latestRevision = useMemo(
    () =>
      Array.isArray(releaseRevisions) &&
      releaseRevisions.reduce((max, revisionData) => {
        return Math.max(max, revisionData.revision);
      }, Number.MIN_SAFE_INTEGER),
    [releaseRevisions]
  );

  const sortedReleases = useMemo(
    () => (releaseRevisions as ReleaseRevision[])?.sort(descendingSort),
    [releaseRevisions]
  );

  const selectedRelease = useMemo(() => {
    if (selectedRevision && releaseRevisions) {
      return (releaseRevisions as ReleaseRevision[]).find(
        (r: ReleaseRevision) => r.revision === selectedRevision
      );
    }
    return null;
  }, [releaseRevisions, selectedRevision]);

  return (
    <div className="flex">
      <div className="flex flex-col gap-2 w-1/6 min-h-screen bg-[#E8EDF2] pb-4">
        <label className="mt-5 mx-5 text-sm text-dark font-semibold">
          Revisions
        </label>
        {isLoadingHistory ? (
          <RevisionSidebarSkeleton />
        ) : (
          <RevisionsList
            releaseRevisions={sortedReleases}
            selectedRevision={selectedRevision}
          />
        )}
      </div>

      <div className="w-5/6 min-h-screen bg-body-background pb-4">
        {isLoadingHistory ? (
          <div className=" p-4">
            <Spinner />
          </div>
        ) : selectedRelease ? (
          <RevisionDetails
            //@ts-ignore
            release={selectedRelease}
            installedRevision={
              //@ts-ignore
              releaseRevisions?.[0] as ReleaseRevision
            }
            isLatest={selectedRelease.revision === latestRevision}
            latestRevision={latestRevision.revision}
          />
        ) : null}
      </div>
    </div>
  );
}

const RevisionSidebarSkeleton = () => {
  return (
    <>
      <div className="border rounded-md mx-5 p-2 gap-4 animate-pulse  h-[74px] w-[88%] bg-gray-100" />
      <div className="border rounded-md mx-5 p-2 gap-4 animate-pulse  h-[74px] w-[88%] bg-gray-100" />
      <div className="border rounded-md mx-5 p-2 gap-4 animate-pulse  h-[74px] w-[88%] bg-gray-100" />
      <div className="border rounded-md mx-5 p-2 gap-4 animate-pulse  h-[74px] w-[88%] bg-gray-100" />
      <div className="border rounded-md mx-5 p-2 gap-4 animate-pulse  h-[74px] w-[88%] bg-gray-100" />
      <div className="border rounded-md mx-5 p-2 gap-4 animate-pulse  h-[74px] w-[88%] bg-gray-100" />
    </>
  );
};

export default Revision;
