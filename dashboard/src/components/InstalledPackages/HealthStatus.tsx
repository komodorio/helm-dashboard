import { HD_RESOURCE_CONDITION_TYPE } from "../../API/releases";
import { Tooltip } from "flowbite-react";
import { ReleaseHealthStatus } from "../../data/types";

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
        <Tooltip content={`${cond.status} ${item.kind} ${item.metadata.name}`}>
          <span
            key={item.metadata.name}
            className={`inline-block ${
              cond.status === "Healthy"
                ? "bg-[#00c2ab]"
                : cond.status === "Progressing"
                ? "bg-[#ffff00]"
                : "bg-[#DC3545]"
            } w-2 h-2 rounded-sm`}
          ></span>
        </Tooltip>
      );
    }
  });

  return <div className="flex flex-wrap gap-1">{statuses}</div>;
};

export default HealthStatus;
