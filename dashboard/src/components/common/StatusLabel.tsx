import { AiOutlineReload } from "react-icons/ai";

type StatusLabelProps = {
  status: string;
  isRollback?: boolean;
};

function StatusLabel({ status, isRollback }: StatusLabelProps) {
  function getColor(status: string) {
    if (status === "deployed") return "text-[#1FA470]";
    else return "text-[#9195A1]";
  }

  return (
    <div style={{
      minWidth: "90px",
      display: "flex",
      justifyContent: "space-between",
    }}>
      <span className={`${getColor(status)} font-bold text-xs`}>
        ● {status.toUpperCase()}
      </span>
      {isRollback && <AiOutlineReload size={14}/>}
    </div>
  );
}

export default StatusLabel;
