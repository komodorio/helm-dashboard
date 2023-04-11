import { ReleaseRevision } from "../../data/types";
import { getAge } from "../../timeUtils";

type RevisionsListProps = {
  releaseRevisions: ReleaseRevision[];
};

export default function RevisionsList({ releaseRevisions }: RevisionsListProps) {
  return (
    <>
      {releaseRevisions.map((revision) => (
        <div
          key={revision.revision}
          className="flex flex-col border border-[#007bff] bg-white rounded-md mx-5 p-2 gap-4"
        >
          <div className="flex row justify-between">
            <span className="text-[#1FA470] font-semibold">● {revision.status.toUpperCase()}</span>
            <span className="font-semibold">#{revision.revision}</span>
          </div>
          <div className="self-end text-[#707583] text-xs">AGE:{getAge(revision.updated)}</div>
        </div>
      ))}
    </>
  );
}
