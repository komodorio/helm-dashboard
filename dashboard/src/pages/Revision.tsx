import { useMemo } from "react";
import { useParams } from "react-router-dom";
import RevisionDetails from "../components/revision/RevisionDetails";
import RevisionsList from "../components/revision/RevisionsList";
import { ReleaseRevision } from "../data/types";
import { useQuery } from "@tanstack/react-query";
import apiService from "../API/apiService";

const descendingSort = (r1: ReleaseRevision, r2: ReleaseRevision) =>
  r1.revision - r2.revision < 0 ? 1 : -1;

function Revision() {
  const { revision = "", ...restParams } = useParams();

  const selectedRevision = revision ? parseInt(revision, 10) : 0;

  const { data: releaseRevisions, refetch: refetchRevisions } = useQuery<
    ReleaseRevision[]
  >({
    queryKey: ["releasesHistory", restParams],
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
