import { useMemo } from "react";
import { useParams } from "react-router";

import { type ContainerImage, useGetImages } from "../../API/releases";
import Spinner from "../Spinner";

export default function RevisionImages() {
  const { namespace = "", chart = "" } = useParams();
  const { data: images, isLoading } = useGetImages(namespace, chart);

  const grouped = useMemo(() => {
    if (!images) return [];
    const map = new Map<string, ContainerImage[]>();
    for (const img of images) {
      const list = map.get(img.image) ?? [];
      list.push(img);
      map.set(img.image, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [images]);

  if (isLoading) return <Spinner />;

  if (!grouped.length) {
    return (
      <div className="mt-3 rounded-sm bg-white p-4 text-sm shadow-sm">
        No container images found in this release.
      </div>
    );
  }

  return (
    <table
      cellPadding={6}
      className="w-full border-separate border-spacing-y-2 text-xs font-semibold"
    >
      <thead className="h-8 rounded-sm bg-zinc-200 font-bold">
        <tr>
          <td className="rounded-sm pl-6">IMAGE</td>
          <td>RESOURCE</td>
          <td className="rounded-sm">CONTAINER</td>
        </tr>
      </thead>
      <tbody className="mt-4 h-8 w-full rounded-sm bg-white">
        {grouped.map(([image, resources]) =>
          resources.map((r, i) => (
            <tr
              key={r.kind + r.resource + r.container}
              className="min-h[70px] min-w-[100%] py-2 text-sm"
            >
              {i === 0 ? (
                <td
                  className="w-1/2 rounded-sm pl-6 font-mono text-xs font-normal"
                  rowSpan={resources.length}
                >
                  {image}
                </td>
              ) : null}
              <td className="text-sm font-normal">
                {r.kind}/{r.resource}
              </td>
              <td className="rounded-sm text-sm font-normal text-gray-500">
                {r.container}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
