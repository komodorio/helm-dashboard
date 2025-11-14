import { HD_RESOURCE_CONDITION_TYPE } from "../../API/releases";
import { Tooltip } from "flowbite-react";
import { ReleaseHealthStatus } from "../../data/types";
import { v4 as uuidv4 } from "uuid";

interface Props {
  statusData: ReleaseHealthStatus[];
}

const HealthStatus = ({ statusData }: Props) => {
  const statuses = statusData.flatMap((item) => {
    return item.status?.conditions
      ?.filter((cond) => cond.type === HD_RESOURCE_CONDITION_TYPE)
      .map((cond) => (
        <Tooltip
          key={item.metadata?.name}  // Use unique property as the key
          content={`${cond.status} ${item.kind} ${item.metadata?.name}`}
        >
          <span
            className={`inline-block ${
              cond.status === "Healthy"
                ? "bg-success"
                : cond.status === "Progressing"
                ? "bg-warning"
                : "bg-danger"
            } w-2.5 h-2.5 rounded-sm`}
          ></span>
        </Tooltip>
      ));
  });

  if (statuses.length === 0) {
    return <div>No health statuses available</div>;
  }

  return <div className="flex flex-wrap gap-1">{statuses}</div>;
};

export default HealthStatus;
