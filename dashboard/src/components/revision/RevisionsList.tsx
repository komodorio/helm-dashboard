import { BsArrowDownLeft, BsArrowUpRight } from "react-icons/bs";
import { useNavigate, useParams } from "react-router-dom";
import { compare } from 'compare-versions';
import useCustomSearchParams from "../../hooks/useCustomSearchParams";

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
  const { context, namespace, chart } = useParams();
  const { searchParamsObject: searchParams } = useCustomSearchParams();
  const { tab, mode } = searchParams;
  const changeRelease = (newRevision: number) => {
    navigate({
      pathname: `/installed/revision/${context}/${namespace}/${chart}/${newRevision}`,
      search: `?${tab ? `tab=${tab}` : ""}${mode ? `&mode=${mode}` : ""}`,
    });
  };
  return (
    <>
      {releaseRevisions?.map((release, idx) => {
        const hasMultipleReleases =
          releaseRevisions.length > 1 && idx < releaseRevisions.length - 1;
        const prevRelease = hasMultipleReleases
          ? releaseRevisions[idx + 1]
          : null;
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
            <div className="self-end text-[#707583] text-xs flex flex-wrap gap-1" style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
            }}>
              <span style={{
                display: "flex",
                width: "70px",
                justifyContent: "space-between",
              }}>
              {prevRelease  ? (
                (compare(prevRelease.chart_ver, release.chart_ver, '!=') && <>
                  <span className="line-through">{prevRelease.chart_ver}</span>
                  {compare(prevRelease.chart_ver, release.chart_ver, '>') ? <BsArrowDownLeft /> : <BsArrowUpRight />}
                  <span>{release.chart_ver}</span>
                </>)
              ) : (
                ""
              )}
              </span>
              <span>AGE:{getAge(release.updated)}</span>
            </div>
          </div>
        );
      })}
    </>
  );
}
