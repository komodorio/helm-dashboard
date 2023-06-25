import { BsArrowUpRight } from "react-icons/bs";
import { useNavigate, useParams } from "react-router-dom";
import { ReleaseRevision } from "../../data/types";
import { getAge } from "../../timeUtils";
import StatusLabel from "../common/StatusLabel";

type RevisionsListProps = {
  releaseRevisions: ReleaseRevision[];
  selectedRevision: number;
};


export default function RevisionsList({
  releaseRevisions,
  selectedRevision,
}: RevisionsListProps) {

  const navigate = useNavigate();
  const {context, namespace, chart, tab} = useParams();
  const changeRelease = (newRevision : number) => {
    navigate(`/revision/${context}/${namespace}/${chart}/${newRevision}/${tab}`)
  }
  return (
    <>
      {releaseRevisions?.map((release, idx) => {
        const hasMultipleReleases = releaseRevisions.length > 1 && idx < releaseRevisions.length - 1;
        const prevRelease = hasMultipleReleases ? releaseRevisions[idx + 1] : null;
        return (
          <div
            onClick={() => changeRelease(release.revision)}
            key={release.revision}
            className={`flex flex-col border rounded-md mx-5 p-2 gap-4 cursor-pointer ${
              release.revision === selectedRevision
                ? "border-[#007bff] bg-white"
                : "border-[#DCDDDF] bg-[#F4F7FA]"
            }`}
          >
            <div className="flex row justify-between">
              <StatusLabel status={release.status} />
              <span className="font-semibold">#{release.revision}</span>
            </div>
            <div className="self-end text-[#707583] text-xs flex flex-wrap gap-1">
              {prevRelease ? (
                <>
                  <span className="line-through">{prevRelease.chart_ver}</span>
                  <BsArrowUpRight />
                  <span>{release.chart_ver}</span>
                </> 
            ) :'' }
              <span>AGE:{getAge(release.updated)}</span>
            </div>
          </div>
       );
              })}
    </>
  );
}
