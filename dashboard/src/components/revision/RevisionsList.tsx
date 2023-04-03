import React from "react";

const revisions = [
  { id: "1", chartName: "1", chartRevision: "1", date: new Date() },
  { id: "2", chartName: "1", chartRevision: "2", date: new Date() },
];

export default function RevisionsList() {
  return (
    <>
      {revisions.map((revision) => (
        <div
          key={revision.id}
          className="flex flex-col border border-[#007bff] bg-white rounded-md mx-5 p-2 gap-4"
        >
          <div className="flex row justify-between">
            <span className="text-[#1FA470] font-semibold">● DEPLOYED</span>
            <span className="font-semibold">#{revision.chartRevision}</span>
          </div>
          <div className="self-end text-[#707583] text-xs">AGE:2d</div>
        </div>
      ))}
    </>
  );
}
