import { useState } from "react";
import { ReleaseRevision } from "../../data/types";
import { getAge } from "../../timeUtils";

type RevisionsListProps = {
  releaseRevisions: ReleaseRevision[];
};

export default function RevisionsList({
  releaseRevisions,
}: RevisionsListProps) {
  const [selectedRevision, setSelectedRevision] = useState(1);

  return (
    <>
      {releaseRevisions.map((revision) => (
        <div
          onClick={() => setSelectedRevision(revision.revision)}
          key={revision.revision}
          className={`flex flex-col border rounded-md mx-5 p-2 gap-4 cursor-pointer ${
            revision.revision === selectedRevision ? "border-[#007bff] bg-white" : "border-[#DCDDDF] bg-[#F4F7FA]"
          }`}
        >
          <div className="flex row justify-between">
            <span className="text-[#1FA470] font-semibold">
              ● {revision.status.toUpperCase()}
            </span>
            <span className="font-semibold">#{revision.revision}</span>
          </div>
          <div className="self-end text-[#707583] text-xs">
            AGE:{getAge(revision.updated)}
          </div>
        </div>
      ))}
    </>
  );
}
