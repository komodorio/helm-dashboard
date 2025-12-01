import { useLocation } from "react-router";
import LogoHeader from "../assets/logo-header.svg";
import DropDown from "../components/common/DropDown";
import WatcherIcon from "../assets/k8s-watcher.svg";
import ShutDownButton from "../components/ShutDownButton";
import {
  BsArrowRepeat,
  BsBoxArrowUpRight,
  BsBraces,
  BsGithub,
} from "react-icons/bs";
import { useGetApplicationStatus } from "../API/other";
import LinkWithSearchParams from "../components/LinkWithSearchParams";
import apiService from "../API/apiService";
import { useAppContext } from "../context/AppContext";
import { useEffect, useEffectEvent } from "react";

export default function Header() {
  const { clusterMode, setClusterMode } = useAppContext();
  const { data: statusData, isSuccess } = useGetApplicationStatus();

  const onSuccess = useEffectEvent(() => {
    setClusterMode(!!statusData?.ClusterMode);
  });

  useEffect(() => {
    if (isSuccess && statusData) {
      onSuccess();
    }
  }, [isSuccess, statusData]);

  const location = useLocation();

  const openProjectPage = () => {
    window.open("https://github.com/komodorio/helm-dashboard", "_blank");
  };

  const resetCache = async () => {
    try {
      await apiService.fetchWithDefaults("/api/cache", {
        method: "DELETE",
      });
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };

  const handleResetCache = () => {
    void resetCache();
  };

  const openAPI = () => {
    window.open("/#/docs", "_blank");
  };

  const getBtnStyle = (identifier: string) =>
    `text-md py-2.5 px-5 ${
      location.pathname.includes(`/${identifier}`)
        ? " text-primary rounded-xs bg-header-install"
        : ""
    }`;

  return (
    <div className="custom-shadow flex h-16 items-center justify-between bg-white">
      <div className="flex h-16 min-w-fit items-center gap-6">
        <LinkWithSearchParams to={"/installed"} exclude={["tab"]}>
          <img
            src={LogoHeader}
            alt="helm dashboard logo"
            className="ml-3 w-48 min-w-[80px]"
          />
        </LinkWithSearchParams>
        <span className="ml-3 h-3/5 w-px bg-gray-200" />
        <div className="inline-block w-full">
          <ul className="flex w-full items-center md:mt-0 md:flex-row md:justify-between md:border-0 md:text-sm md:font-normal">
            <li>
              <LinkWithSearchParams
                to={"installed"}
                exclude={["tab"]}
                className={getBtnStyle("installed")}
              >
                Installed
              </LinkWithSearchParams>
            </li>
            <li>
              <LinkWithSearchParams
                to={"repository"}
                exclude={["tab"]}
                end={false}
                className={getBtnStyle("repository")}
              >
                Repository
              </LinkWithSearchParams>
            </li>
            <li>
              <DropDown
                items={[
                  {
                    id: "2",
                    text: "Project Page",
                    icon: <BsGithub />,
                    onClick: openProjectPage,
                  },
                  { id: "3", isSeparator: true },
                  {
                    id: "4",
                    text: "Reset Cache",
                    icon: <BsArrowRepeat />,
                    onClick: handleResetCache,
                  },
                  {
                    id: "5",
                    text: "REST API",
                    icon: <BsBraces />,
                    onClick: openAPI,
                  },
                  { id: "6", isSeparator: true },
                  {
                    id: "7",
                    text: `version ${statusData?.CurVer}`,
                    isDisabled: true,
                  },
                ]}
              />
            </li>
            {"v" + statusData?.CurVer !== statusData?.LatestVer ? (
              <li className="min-w-[130px]">
                <a
                  href="https://github.com/komodorio/helm-dashboard/releases"
                  className="text-upgrade-color"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Upgrade to {statusData?.LatestVer}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="flex h-16 items-center text-sm">
        <div className="bottom-gray-200 flex min-w-max gap-2 rounded-sm border p-1">
          <img src={WatcherIcon} width={40} height={40} />
          <div className="flex flex-col">
            <a
              href="https://komodor.com/helm-dash/"
              className="font-bold text-link-color"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex min-w-[25%] items-center gap-2 font-bold">
                Upgrade your HELM experience - Free
                <BsBoxArrowUpRight className="h-[14px] w-[14px]" />
              </div>
            </a>
            <label className="text-muted">
              Auth & RBAC, k8s events, troubleshooting and more
            </label>
          </div>
        </div>

        <span className="ml-3 h-3/5 w-px bg-gray-200" />
        {!clusterMode ? <ShutDownButton /> : null}
      </div>
    </div>
  );
}
