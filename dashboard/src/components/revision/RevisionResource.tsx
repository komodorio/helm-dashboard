import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import hljs from "highlight.js";
import { RiExternalLinkLine } from "react-icons/ri";

import {
  StructuredResources,
  useGetResourceDescription,
  useGetResources,
} from "../../API/releases";
import closeIcon from "../../assets/close.png";

import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";

import Button from "../Button";
import Badge, { getBadgeType } from "../Badge";
import Spinner from "../Spinner";
import { Troubleshoot } from "../Troubleshoot";

interface Props {
  isLatest: boolean;
}

export default function RevisionResource({ isLatest }: Props) {
  const { namespace = "", chart = "" } = useParams();
  const { data: resources, isLoading } = useGetResources(namespace, chart);
  const interestingResources = ["STATEFULSET", "DEAMONSET", "DEPLOYMENT"];

  return (
    <table
      cellPadding={6}
      className="border-spacing-y-2 font-semibold border-separate w-full text-xs "
    >
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
            resources
              .sort(function (a, b) {
                return (
                  interestingResources.indexOf(a.kind.toUpperCase()) -
                  interestingResources.indexOf(b.kind.toUpperCase())
                );
              })
              .reverse()
              .map((resource: StructuredResources) => (
                <ResourceRow
                  key={
                    resource.apiVersion + resource.kind + resource.metadata.name
                  }
                  resource={resource}
                  isLatest={isLatest}
                />
              ))
          ) : (
            <tr>
              <div className="bg-white rounded shadow display-none no-charts mt-3 text-sm p-4">
                Looks like you don&apos;t have any resources.{" "}
                <RiExternalLinkLine className="ml-2 text-lg" />
              </div>
            </tr>
          )}
        </tbody>
      )}
    </table>
  );
}

const ResourceRow = ({
  resource,
  isLatest,
}: {
  resource: StructuredResources;
  isLatest: boolean;
}) => {
  const {
    kind,
    metadata: { name },
    status: { conditions },
  } = resource;
  const [isOpen, setIsOpen] = useState(false);
  const toggleDrawer = () => {
    setIsOpen((prevState) => !prevState);
  };
  const { reason = "", status = "", message = "" } = conditions?.[0] || {};

  const badgeType = getBadgeType(status);

  return (
    <>
      <tr className="min-w-[100%] min-h[70px] text-sm py-2">
        <td className="pl-6 rounded text-sm font-normal w-48">{kind}</td>
        <td className="font-bold text-sm w-56">{name}</td>
        <td>{reason ? <Badge type={badgeType}>{reason}</Badge> : null}</td>
        <td className="rounded text-gray-100">
          <div className="flex flex-col space-y-1 justify-start items-start ">
            {message && (
              <div className="text-gray-500 font-thin">{message}</div>
            )}
            {(badgeType === "error" || badgeType === "warning") && (
              <Troubleshoot />
            )}
          </div>
        </td>
        <td className="rounded">
          {isLatest && reason !== "NotFound" ? (
            <div className="flex justify-end items-center mr-36">
              <Button className="px-1 text-xs" onClick={toggleDrawer}>
                Describe
              </Button>
            </div>
          ) : null}
        </td>
      </tr>
      <Drawer
        open={isOpen}
        onClose={toggleDrawer}
        direction="right"
        className="min-w-[85%] "
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

  const { status, reason = "" } = conditions?.[0] || {};
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

  const badgeType = getBadgeType(status);
  return (
    <>
      <div className="flex justify-between px-3 py-4 border-b ">
        <div>
          <div className="flex gap-3">
            <h3 className="font-medium text-xl font-poppins">{name}</h3>
            <Badge type={badgeType}>{reason}</Badge>
          </div>
          <p className="m-0 mt-4 font-inter text-sm font-normal">{kind}</p>
        </div>

        <div className="flex  items-center gap-4 pr-4">
          <a
            href="https://www.komodor.com/helm-dash/?utm_campaign=Helm%20Dashboard%20%7C%20CTA&amp;utm_source=helm-dash&amp;utm_medium=cta&amp;utm_content=helm-dash"
            className="bg-primary text-white p-1.5 text-sm flex items-center rounded"
            target="_blank"
            rel="noreferrer"
          >
            See more details in Komodor
            <RiExternalLinkLine className="ml-2 text-lg" />
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
        <div className="h-full overflow-y-auto ">
          <pre
            className="bg-white rounded p-4 font-medium text-base font-sf-mono"
            style={{ overflow: "unset" }}
            dangerouslySetInnerHTML={{
              __html: yamlFormattedData,
            }}
          />
        </div>
      )}
    </>
  );
};
