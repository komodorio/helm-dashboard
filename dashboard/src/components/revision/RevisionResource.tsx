import { uniqueId } from "lodash";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { StructuredResources, useGetResources } from "../../API/releases";

import Button from "../Button";
import Badge from "../Badge";
export default function RevisionResource() {
  const { namespace = "", chart = "" } = useParams();
  const { data: resources } = useGetResources(namespace, chart);

  return (
    <div>
      <table className="border-spacing-y-4  font-semibold border-separate w-full text-xs mt-4 ">
        <thead className="bg-zinc-200 font-bold h-8 rounded">
          <tr>
            <td className="pl-6 rounded">RESOURCE TYPE</td>
            <td>NAME</td>
            <td>STATUS</td>
            <td>STATUS MESSAGE</td>
            <td className="rounded"></td>
          </tr>
        </thead>
        <tbody className="bg-white mt-4 h-8 rounded w-full">
          {resources?.map((resource: StructuredResources) => (
            <ResourceRow resource={resource} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ResourceRow = ({ resource }: { resource: StructuredResources }) => {
  console.log(resource);
  const {
    kind,
    metadata: { name },
    status: { conditions },
  } = resource;
  const { reason = "", status = "" } = conditions?.[0] || {};
  const cellClassnames = "py-2";
  const rowId = useMemo(() => uniqueId(), []);

  const successStatus = reason.toLowerCase() === "exists" || "available";
  return (
    <>
      <tr className="min-w-[100%] min-h[70px]">
        <td className={"pl-6 rounded " + cellClassnames}>{kind}</td>
        <td className={"font-bold" + cellClassnames}>{name}</td>
        <td className={cellClassnames}>
          <Badge type={successStatus ? "success" : "error"}>{reason}</Badge>
        </td>
        <td className={"rounded " + cellClassnames}>
          {successStatus ? status : ""}
        </td>
        <td className={"rounded " + cellClassnames}>
          <div className="flex justify-end items-center pr-4">
            <Button className="bg-white">Describe</Button>
          </div>
        </td>
      </tr>
    </>
  );
};
