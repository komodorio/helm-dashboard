import { HD_RESOURCE_CONDITION_TYPE } from "../../API/releases";
import { Tooltip } from "flowbite-react";
import { ReleaseHealthStatus } from "../../data/types";

interface Props {
  statusData: ReleaseHealthStatus[];
}

const HealthStatus = ({ statusData }: Props) => {
  const statuses = statusData.flatMap((item) => {
    return item.status?.conditions
      ?.filter((cond) => cond.type === HD_RESOURCE_CONDITION_TYPE)
      .map((cond) => {
        const stableKey = item.metadata?.uid
          ? `${item.metadata.uid}-${item.metadata.namespace ?? "default"}`
          : `${item.kind}-${item.metadata?.namespace ?? "default"}-${item.metadata?.name}`;

        return (
          <Tooltip
            key={stableKey}
            content={`${cond.status} ${item.kind} ${item.metadata?.name}`}
          >
            <span
              className={`inline-block ${
                cond.status === "Healthy"
                  ? "bg-success"
                  : cond.status === "Progressing"
                    ? "bg-warning"
                    : "bg-danger"
              } w-2.5 h-2.5 rounded-xs`}
            ></span>
          </Tooltip>
        );
      });
  });

  if (statuses.length === 0) {
    return <div>No health statuses available</div>;
  }

  return <div className="flex flex-wrap gap-1">{statuses}</div>;
};

export default HealthStatus;
