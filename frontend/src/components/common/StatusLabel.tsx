import { AiOutlineReload } from "react-icons/ai";

type StatusLabelProps = {
  status: string;
  isRollback?: boolean;
};

export enum DeploymentStatus {
  DEPLOYED = "deployed",
  FAILED = "failed",
  PENDING = "pending-install",
  SUPERSEDED = "superseded",
}

export function getStatusColor(status: DeploymentStatus) {
  if (status === DeploymentStatus.DEPLOYED) return "text-deployed";
  if (status === DeploymentStatus.FAILED) return "text-failed";
  if (status === DeploymentStatus.PENDING) return "text-pending";
  else return "text-superseded";
}

function StatusLabel({ status, isRollback }: StatusLabelProps) {
  const statusColor = getStatusColor(status as DeploymentStatus);

  return (
    <div
      style={{
        minWidth: "100px",
        display: "flex",
        fontSize: "14px",
        justifyContent: "space-between",
      }}
    >
      <span className={`${statusColor} font-bold text-xs`}>
        ● {status.toUpperCase()}
      </span>
      {isRollback && <AiOutlineReload size={14} />}
    </div>
  );
}

export default StatusLabel;
