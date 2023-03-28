import RevisionDetails from "../components/RevisionDetails";
import RevisionsList from "../components/RevisionsList";

function Revision() {
  return (
    <div className="flex">
      <div className="flex flex-col gap-2 w-1/6 h-screen bg-[#E8EDF2]">
        <label>Revisions</label>
        <RevisionsList />
      </div>

      <div className="w-full h-screen bg-[#F4F7FA]">
        <RevisionDetails />
      </div>
    </div>
  );
}

export default Revision;
