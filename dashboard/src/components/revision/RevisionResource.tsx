import { useParams } from "react-router-dom";
import { useGetResources } from "../../API/releases";
import { ReleaseRevision } from "../../data/types";

export default function RevisionResource({
  release,
}: {
  release: ReleaseRevision;
}) {
  const { chart_name } = release;
  const { namespace } = useParams();
  const { data: resource } = useGetResources(namespace, chart_name);

  return (
    <div>
      <table className="border-spacing-y-4  font-semibold border-separate w-full text-xs mt-4 ">
        <thead className="bg-zinc-200 font-bold h-8 rounded">
          <tr>
            <td className="pl-6">RESOURCE TYPE</td>
            <td>NAME</td>
            <td>STATUS</td>
            <td>STATUS MESSAGE</td>
          </tr>
        </thead>
        <tbody className="bg-white mt-4 h-8 rounded">
          <tr>
            <td className="pl-6">Deployment</td>
            <td className="font-bold">airflow-web</td>
            <td> status (-;</td>
            <td>Getting status..</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
