import { AiOutlineReload } from "react-icons/ai";

type StatusLabelProps = {
  status: string;
  isRollback?: boolean;
};

export enum DeploymentStatus {
  DEPLOYED = "deployed",
  FAILED = "failed",
  PENDING = "pending",
  SUPERSEDED = "superseded",
}

export function getStatusColor(status: string) {
  if (status === DeploymentStatus.DEPLOYED) return "text-deployed";
  if (status === DeploymentStatus.FAILED) return "text-failed";
  if (status === DeploymentStatus.PENDING) return "text-pending";
  else return "text-superseded";
}

function StatusLabel({ status, isRollback }: StatusLabelProps) {
  const statusColor = getStatusColor(status);

  return (
    <div
      style={{
        minWidth: "90px",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <span className={`${statusColor} font-bold text-sm`}>
        ● {status.toUpperCase()}
      </span>
      {isRollback && <AiOutlineReload size={14} />}
    </div>
  );
}

export default StatusLabel;
