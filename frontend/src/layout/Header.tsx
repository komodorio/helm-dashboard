import { useLocation, useParams } from "react-router-dom";
import LogoHeader from "../assets/logo-header.svg";
import DropDown from "../components/common/DropDown";
import WatcherIcon from "../assets/k8s-watcher.svg";
import ShutDownButton from "../components/ShutDownButton";
import {
  BsSlack,
  BsGithub,
  BsArrowRepeat,
  BsBraces,
  BsBoxArrowUpRight,
} from "react-icons/bs";
import { useGetApplicationStatus } from "../API/other";
import LinkWithSearchParams from "../components/LinkWithSearchParams";
import apiService from "../API/apiService";
import { useAppContext } from "../context/AppContext";

export default function Header() {
  const { clusterMode, setClusterMode } = useAppContext();
  const { data: statusData } = useGetApplicationStatus({
    onSuccess: (data) => {
      setClusterMode(data.ClusterMode);
    },
  });
  const { context } = useParams();
  const location = useLocation();

  const openSupportChat = () => {
    window.open("https://app.slack.com/client/T03Q4H8PCRW", "_blank");
  };

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

  const openAPI = () => {
    window.open("/#/docs", "_blank");
  };

  const getBtnStyle = (identifier: string) =>
    `text-md py-2.5 px-5 ${
      location.pathname.includes(`/${identifier}`)
        ? " text-primary rounded-sm bg-header-install"
        : ""
    }`;

  return (
    <div className="h-16 flex items-center justify-between bg-white custom-shadow">
      <div className="h-16 flex items-center gap-6 min-w-fit ">
        <LinkWithSearchParams to={`/${context}/installed`} exclude={["tab"]}>
          <img
            src={LogoHeader}
            alt="helm dashboard logo"
            className="ml-3 w-48 min-w-[80px]"
          />
        </LinkWithSearchParams>
        <span className="ml-3 w-px h-3/5 bg-gray-200" />
        <div className="inline-block w-full">
          <ul className="w-full items-center flex md:flex-row md:justify-between md:mt-0 md:text-sm md:font-normal md:border-0 ">
            <li>
              <LinkWithSearchParams
                to={`/${context}/installed`}
                exclude={["tab"]}
                className={getBtnStyle("installed")}
              >
                Installed
              </LinkWithSearchParams>
            </li>
            <li>
              <LinkWithSearchParams
                to={`/${context}/repository`}
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
                    id: "1",
                    text: "Support chat",
                    icon: <BsSlack />,
                    onClick: openSupportChat,
                  },
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
                    onClick: resetCache,
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
            {statusData?.LatestVer ? (
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
      <div className="h-16 flex items-center text-sm ">
        <div className="flex p-1 gap-2 border bottom-gray-200 rounded min-w-max">
          <img src={WatcherIcon} width={40} height={40} />
          <div className="flex flex-col">
            <a
              href="https://komodor.com/helm-dash/"
              className="text-link-color font-bold"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex font-bold items-center gap-2 min-w-[25%] ">
                Upgrade your HELM experience - Free
                <BsBoxArrowUpRight className="w-[14px] h-[14px]" />
              </div>
            </a>
            <label className="text-muted">
              Auth & RBAC, k8s events, troubleshooting and more
            </label>
          </div>
        </div>

        <span className="w-px h-3/5 bg-gray-200 ml-3" />
        {!clusterMode ? <ShutDownButton /> : null}
      </div>
    </div>
  );
}
