import { HD_RESOURCE_CONDITION_TYPE } from "../../API/releases";
import { Tooltip } from "flowbite-react";
import { ReleaseHealthStatus } from "../../data/types";
import { v4 as uuidv4 } from "uuid";

interface Props {
  statusData: ReleaseHealthStatus[];
}

const HealthStatus = ({ statusData }: Props) => {
  const statuses = statusData.map((item) => {
    for (let i = 0; i < item.status.conditions.length; i++) {
      const cond = item.status.conditions[i];

      if (cond.type !== HD_RESOURCE_CONDITION_TYPE) {
        continue;
      }

      return (
        <Tooltip
          key={uuidv4()} // this is not a good practice, we need to fetch some unique id from the backend
          content={`${cond.status} ${item.kind} ${item.metadata.name}`}
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
      );
    }
  });

  return <div className="flex flex-wrap gap-1">{statuses}</div>;
};

export default HealthStatus;
