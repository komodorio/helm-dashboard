import { useMemo, useState } from "react";
import { useParams } from "react-router";
import hljs from "highlight.js/lib/core";
import yaml from "highlight.js/lib/languages/yaml";
import { RiExternalLinkLine } from "react-icons/ri";

import type { StructuredResources } from "../../API/releases";
import { useGetResourceDescription, useGetResources } from "../../API/releases";
import closeIcon from "../../assets/close.png";

import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";

import Button from "../Button";
import Badge, { getBadgeType } from "../Badge";
import Spinner from "../Spinner";
import { Troubleshoot } from "../Troubleshoot";

hljs.registerLanguage("yaml", yaml);

interface Props {
  isLatest: boolean;
}

export default function RevisionResource({ isLatest }: Props) {
  const { namespace = "", chart = "" } = useParams();
  const { data: resources, isLoading } = useGetResources(namespace, chart);

  return (
    <table
      cellPadding={6}
      className="w-full border-separate border-spacing-y-2 text-xs font-semibold"
    >
      <thead className="h-8 rounded-sm bg-zinc-200 font-bold">
        <tr>
          <td className="rounded-sm pl-6">RESOURCE TYPE</td>
          <td>NAME</td>
          <td>STATUS</td>
          <td>STATUS MESSAGE</td>
          <td className="rounded-sm"></td>
        </tr>
      </thead>
      {isLoading ? (
        <Spinner />
      ) : (
        <tbody className="mt-4 h-8 w-full rounded-sm bg-white">
          {resources?.length ? (
            resources?.map((resource: StructuredResources) => (
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
              <div className="display-none no-charts mt-3 rounded-sm bg-white p-4 text-sm shadow-sm">
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
      <tr className="min-h[70px] min-w-[100%] py-2 text-sm">
        <td className="w-48 rounded-sm pl-6 text-sm font-normal">{kind}</td>
        <td className="w-56 text-sm font-bold">{name}</td>
        <td>{reason ? <Badge type={badgeType}>{reason}</Badge> : null}</td>
        <td className="rounded-sm text-gray-100">
          <div className="flex-start flex flex-col gap-1">
            {message && (
              <div className="font-thin text-gray-500">{message}</div>
            )}
            {(badgeType === "error" || badgeType === "warning") && (
              <Troubleshoot />
            )}
          </div>
        </td>
        <td className="rounded-sm">
          {isLatest && reason !== "NotFound" ? (
            <div className="mr-36 flex items-center justify-end">
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
        className="min-w-[85%]"
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

  const yamlFormattedData = useMemo(
    () => hljs.highlight(data ?? "", { language: "yaml" })?.value,
    [data]
  );

  const badgeType = getBadgeType(status);
  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-between border-b px-3 py-4">
        <div>
          <div className="flex gap-3">
            <h3 className="font-poppins text-xl font-medium">{name}</h3>
            <Badge type={badgeType}>{reason}</Badge>
          </div>
          <p className="m-0 mt-4 font-inter text-sm font-normal">{kind}</p>
        </div>

        <div className="flex items-center gap-4 pr-4">
          <a
            href="https://www.komodor.com/helm-dash/?utm_campaign=Helm%20Dashboard%20%7C%20CTA&amp;utm_source=helm-dash&amp;utm_medium=cta&amp;utm_content=helm-dash"
            className="flex items-center rounded-sm bg-primary p-1.5 text-sm text-white"
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
            <img src={closeIcon} alt="close" className="h-[16px] w-[16px]" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="flex-1 overflow-auto">
          <pre
            className="rounded-sm bg-white p-4 font-sf-mono text-base font-medium whitespace-pre"
            style={{ overflow: "unset" }}
            dangerouslySetInnerHTML={{
              __html: yamlFormattedData,
            }}
          />
        </div>
      )}
    </div>
  );
};
