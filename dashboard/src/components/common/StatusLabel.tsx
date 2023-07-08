import { AiOutlineReload } from "react-icons/ai";

type StatusLabelProps = {
  status: string;
  isRollback?: boolean;
};

export enum DeploymentStatus {
  DEPLOYED = "deployed",
  FAILED = "failed",
  PENDING = "pending",
}

export function getStatusColor(status: string) {
  if (status === "deployed") return "#1FA470";
  if (status === "failed") return "#DC143C";
  else return "#9195A1";
}

function StatusLabel({ status, isRollback }: StatusLabelProps) {
  const statusColor = getStatusColor(status);

  return ( 
    <div style={{
      minWidth: "100px",
      display: "flex",
      justifyContent: "space-between",
    }}>
      <span className={`text-[${statusColor}] font-bold text-xs`} style={{
        color: `${statusColor}`,
        fontSize: "0.75rem",
      }}>
        ● {status.toUpperCase()}
      </span>
      {isRollback && <AiOutlineReload size={14} />}
    </div>
  );
}

export default StatusLabel;
