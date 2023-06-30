import { ReleaseHealthStatus } from "../../data/types";

const items = [
  { id: 1 },
  { id: 2, is: true },
  { id: 3 },
  { id: 4 },
  { id: 5, is: true },
  { id: 6 },
  { id: 7 },
];

interface Props {
  statusData: ReleaseHealthStatus[]
}

const HealthStatus = ({ statusData }: Props) => {
  const a = statusData.map(item => {
    for (let i = 0; i < item.status.conditions.length; i++) {
      const cond = item.status.conditions[i];

      if (cond.type !== "hdHealth") { // it's our custom condition type
          continue
      }

      if (cond.status === "Healthy") {
          //square.addClass("bg-success")
          return (
            <span
              title={cond.status+" "+item.kind+" '"+item.metadata.name+"'"}
              key={item.metadata.name}
              id="tooltip-default"
              className={`inline-block bg-[#00c2ab] w-2 h-2 rounded-sm`}
            ></span>
          )
      } else if (cond.status === "Progressing") {
          //square.addClass("bg-warning")
          return (
            <span
              title={cond.status+" "+item.kind+" '"+item.metadata.name+"'"}
              key={item.metadata.name}
              className={`inline-block bg-[#ffff00] w-2 h-2 rounded-sm`}
            ></span>
          )
      } else {
          //square.addClass("bg-danger")
          return (
            <span
              title={cond.status+" "+item.kind+" '"+item.metadata.name+"'"}
              key={item.metadata.name + cond.status}
              className={`inline-block bg-[#DC3545] w-2 h-2 rounded-sm`}
            ></span>
          )
      }
    }
}).filter((element: any) => element !== undefined );
  
  return (
    <div className="flex flex-wrap gap-1">
      {a}
    </div>
  );
};

export default HealthStatus;
