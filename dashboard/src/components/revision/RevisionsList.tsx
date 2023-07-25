import { BsArrowDownRight, BsArrowUpRight } from "react-icons/bs";
import { useParams } from "react-router-dom";
import { compare } from "compare-versions";

import { ReleaseRevision } from "../../data/types";
import { getAge } from "../../timeUtils";
import StatusLabel from "../common/StatusLabel";
import useNavigateWithSearchParams from "../../hooks/useNavigateWithSearchParams";

type RevisionsListProps = {
  releaseRevisions: ReleaseRevision[];
  selectedRevision: number;
};

export default function RevisionsList({
  releaseRevisions,
  selectedRevision,
}: RevisionsListProps) {
  const navigate = useNavigateWithSearchParams();
  const { context, namespace, chart } = useParams();
  const changeRelease = (newRevision: number) => {
    navigate(
      `/${context}/${namespace}/${chart}/installed/revision/${newRevision}`
    );
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
                ? "border-border-dark-blue bg-white"
                : "border-light-grey bg-body-background"
            }`}
          >
            <div className="flex row justify-between">
              <StatusLabel
                status={release.status}
                isRollback={release.description.startsWith("Rollback to ")}
              />
              <span className="font-bold">#{release.revision}</span>
            </div>
            <div
              className="self-end text-muted text-xs flex flex-wrap gap-1"
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                {prevRelease
                  ? compare(prevRelease.chart_ver, release.chart_ver, "!=") && (
                      <>
                        <span className="line-through">
                          {prevRelease.chart_ver}
                        </span>
                        {compare(
                          prevRelease.chart_ver,
                          release.chart_ver,
                          ">"
                        ) ? (
                          <BsArrowDownRight />
                        ) : (
                          <BsArrowUpRight />
                        )}
                        <span>{release.chart_ver}</span>
                      </>
                    )
                  : ""}
              </div>
              <span>AGE:{getAge(release, releaseRevisions[idx - 1])}</span>
            </div>
          </div>
        );
      })}
    </>
  );
}
