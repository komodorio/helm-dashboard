import { uniqueId } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import hljs from "highlight.js";
import { marked } from "marked";

import {
  StructuredResources,
  useGetResourceDescription,
  useGetResources,
} from "../../API/releases";
import closeIcon from "../../assets/close.png";

import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";

import Button from "../Button";
import Badge from "../Badge";
import Spinner from "../Spinner";
export default function RevisionResource() {
  const { namespace = "", chart = "" } = useParams();
  const { data: resources, isLoading } = useGetResources(namespace, chart);

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
        {isLoading ? (
          <Spinner />
        ) : (
          <tbody className="bg-white mt-4 h-8 rounded w-full">
            {resources?.length ? (
              resources.map((resource: StructuredResources) => (
                <ResourceRow resource={resource} />
              ))
            ) : (
              <tr>
                <div className="bg-white rounded shadow display-none no-charts mt-3 text-sm p-4">
                  Looks like you don't have any resources.
                </div>
              </tr>
            )}
          </tbody>
        )}
      </table>
    </div>
  );
}

const ResourceRow = ({ resource }: { resource: StructuredResources }) => {
  const {
    kind,
    metadata: { name },
    status: { conditions },
  } = resource;
  const [isOpen, setIsOpen] = useState(false);
  const toggleDrawer = () => {
    setIsOpen((prevState) => !prevState);
  };
  const { reason = "", status = "" } = conditions?.[0] || {};
  const cellClassnames = "py-2";

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
            <Button onClick={toggleDrawer} className="bg-white">
              Describe
            </Button>
          </div>
        </td>
      </tr>
      <Drawer
        open={isOpen}
        onClose={toggleDrawer}
        direction="right"
        className="min-w-[60%] max-w-[80%]"
      >
        {isOpen ? (
          <DescribeResource
            resource={resource}
            closeDrawer={() => {
              setIsOpen(false);
            }}
          />
        ) : null}
      </Drawer>
    </>
  );
};

const DescribeResource = ({
  resource,
  closeDrawer,
}: {
  resource: StructuredResources;
  closeDrawer: () => void;
}) => {
  const {
    kind,
    metadata: { name },
    status: { conditions },
  } = resource;

  const { reason = "" } = conditions?.[0] || {};
  const successStatus = reason.toLowerCase() === "exists" || "available";
  const { namespace = "", chart = "" } = useParams();
  const { data, isLoading } = useGetResourceDescription(
    resource.kind,
    namespace,
    chart
  );
  const [yamlFormattedData, setYamlFormattedData] = useState("");

  useEffect(() => {
    if (data) {
      const val = hljs.highlight(data, { language: "yaml" }).value;
      setYamlFormattedData(val);
    }
  }, [data]);

  return (
    <>
      <div className="flex justify-between px-3 py-4 border-b">
        <div>
          <div className="flex gap-3">
            <h3 className="font-medium text-xl">{name}</h3>
            <Badge type={successStatus ? "success" : "error"}>{reason}</Badge>
          </div>
          <p className="m-0 mt-4">{kind}</p>
        </div>

        <div className="flex  items-center gap-4 pr-4">
          <a
            href="https://www.komodor.com/helm-dash/?utm_campaign=Helm%20Dashboard%20%7C%20CTA&amp;utm_source=helm-dash&amp;utm_medium=cta&amp;utm_content=helm-dash"
            className="bg-blue-600 text-white p-3 text-md flex items-center rounded"
            target="_blank"
          >
            See more details in Komodor
          </a>
          <button
            type="button"
            className="h-fit"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
            onClick={closeDrawer}
          >
            <img src={closeIcon} alt="close" className="w-[16px] h-[16px]" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="h-full overflow-y-auto">
          <pre
            className="bg-white rounded p-4 font-medium text-md w-full"
            style={{ overflow: "unset" }}
            dangerouslySetInnerHTML={{
              __html: marked(yamlFormattedData),
            }}
          />
        </div>
      )}
    </>
  );
};
