import { uniqueId } from "lodash";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { StructuredResources, useGetResources } from "../../API/releases";

// import component 👇
import Drawer from "react-modern-drawer";

//import styles 👇
import "react-modern-drawer/dist/index.css";

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
  const [isOpen, setIsOpen] = useState(false);
  const toggleDrawer = () => {
    setIsOpen((prevState) => !prevState);
  };
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
        className="bla bla bla"
      >
        <div className="offcanvas-header border-bottom p-4">
          <div>
            <h5 id="describeModalLabel">
              my-release-mysql
              <span className="badge me-2 fw-normal bg-success text-dark bg-opacity-50 ms-3 small">
                Exists
              </span>
            </h5>
            <p className="m-0 mt-4">StatefulSet</p>
          </div>
          <div>
            <a
              href="https://www.komodor.com/helm-dash/?utm_campaign=Helm%20Dashboard%20%7C%20CTA&amp;utm_source=helm-dash&amp;utm_medium=cta&amp;utm_content=helm-dash"
              className="btn btn-primary btn-sm me-2"
              target="_blank"
            >
              See more details in Komodor{" "}
              <i className="bi-box-arrow-up-right"></i>
            </a>
            <button
              type="button"
              className="btn-close text-reset"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            ></button>
          </div>
        </div>
      </Drawer>
    </>
  );
};
