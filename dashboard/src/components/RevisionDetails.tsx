import React from "react";

function RevisionDetails() {
  return (
    <div className="flex flex-col px-16 pt-5">
      <span className="text-[#1FA470] font-semibold">● DEPLOYED</span>
      <div className="flex justify-between">
        <span className="text-[#3d4048] text-4xl">airFlow</span>
        <div className="flex flex-row items-start">
          <div className="flex flex-col">
            <button>Reconfigure</button>
            <a>check for new version</a>
          </div>
          <button>Uninstall</button>
        </div>
      </div>
      <div>
        <label>Revision #1</label>
        <label>3/26/2023, 2:19:39 PM</label>
      </div>
    </div>
  );
}

export default RevisionDetails;
