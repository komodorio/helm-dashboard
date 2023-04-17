import { useLocation } from "react-router-dom";
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

function Revision() {
  const { state: release } = useLocation();

  const { data: releaseRevisions } = useQuery<ReleaseRevision[]>({
    queryKey: ["releasesHisotry", release],
    queryFn: apiService.getReleasesHistory,
  });

  if (!releaseRevisions) return <></>;

  return (
    <div className="flex">
      <div className="flex flex-col gap-2 w-1/6 h-screen bg-[#E8EDF2]">
        <label className="mt-5 mx-5 text-sm text-[#3D4048] font-semibold">
          Revisions
        </label>
        <RevisionsList releaseRevisions={releaseRevisions} />
      </div>

      <div className="w-full h-screen bg-[#F4F7FA]">
        <RevisionDetails release={releaseRevisions[0]} />
      </div>
    </div>
  );
}

export default Revision;
