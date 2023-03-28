import RevisionDetails from "../components/RevisionDetails";
import RevisionsList from "../components/RevisionsList";
import { Chart } from "../data/types";

const chart: Chart = {
  name: "1",
};

function Revision() {
  return (
    <div className="flex">
      <div className="flex flex-col gap-2 w-1/6 h-screen bg-[#E8EDF2]">
        <label className="mt-5 mx-5 text-sm text-[#3D4048] font-semibold">
          Revisions
        </label>
        <RevisionsList />
      </div>

      <div className="w-full h-screen bg-[#F4F7FA]">
        <RevisionDetails chart={chart} />
      </div>
    </div>
  );
}

export default Revision;
