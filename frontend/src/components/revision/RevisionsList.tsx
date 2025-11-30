import { BsArrowDownRight, BsArrowUpRight } from "react-icons/bs";
import { useParams } from "react-router";
import { compare } from "compare-versions";

import { ReleaseRevision } from "../../data/types";
import { getAge } from "../../timeUtils";
import StatusLabel from "../common/StatusLabel";
import useNavigateWithSearchParams from "../../hooks/useNavigateWithSearchParams";
import { DateTime } from "luxon";

type RevisionsListProps = {
  releaseRevisions: ReleaseRevision[];
  selectedRevision: number;
};

export default function RevisionsList({
  releaseRevisions,
  selectedRevision,
}: RevisionsListProps) {
  const navigate = useNavigateWithSearchParams();
  const { namespace, chart } = useParams();

  const changeRelease = (newRevision: number) => {
    navigate(`/${namespace}/${chart}/installed/revision/${newRevision}`);
  };

  return (
    <>
      {releaseRevisions?.map((release, idx) => {
        const hasMultipleReleases =
          releaseRevisions.length > 1 && idx < releaseRevisions.length - 1;
        const prevRelease = hasMultipleReleases
          ? releaseRevisions[idx + 1]
          : null;
        const isRollback = release.description.startsWith("Rollback to ");
        return (
          <div
            title={
              isRollback ? `Rollback to ${Number(release.revision) - 1}` : ""
            }
            onClick={() => changeRelease(release.revision)}
            key={release.revision}
            className={`mx-5 flex cursor-pointer flex-col gap-4 rounded-md border border-gray-200 p-2 ${
              release.revision === selectedRevision
                ? "border-revision-dark bg-white"
                : "border-revision-light bg-body-background"
            }`}
          >
            <div className="row flex flex-wrap justify-between">
              <StatusLabel status={release.status} isRollback={isRollback} />
              <span className="font-bold">#{release.revision}</span>
            </div>
            <div
              className="flex flex-wrap gap-1 self-end text-xs text-muted"
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
              <span title={DateTime.fromISO(release.updated).toString()}>
                AGE:{getAge(release, releaseRevisions[idx - 1])}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}
