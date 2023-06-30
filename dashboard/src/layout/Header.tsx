import { NavLink } from "react-router-dom";
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

export default function Header() {
  const { data: statusData } = useGetApplicationStatus();

  const openSupportChat = () => {
    window.open("https://app.slack.com/client/T03Q4H8PCRW", "_blank");
  };

  const openProjectPage = () => {
    window.open("https://github.com/komodorio/helm-dashboard", "_blank");
  };

  const resetCache = async () => {
    try {
      await fetch("/api/cache", { method: "DELETE" });
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };

  const openAPI = () => {
    window.open("/static/api-docs.html", "_blank");
  };

  return (
    <div className="h-16 flex items-center justify-between bg-white min-w-[1000px]">
      <div className="h-16 flex items-center gap-6 ">
        <NavLink to="/">
          <img
            src={LogoHeader}
            alt="Helm-DashBoard"
            className="ml-3 w-[140px] "
          />
        </NavLink>
        <span className="w-[1px] h-3/4 bg-gray-200" />
        <div className="inline-block w-full">
          <ul className="w-full items-center flex md:flex-row space-x-2 xl:space-x-4 2xl:space-x-8 md:justify-between md:mt-0 md:text-sm md:font-normal md:border-0 ">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? "p-2 text-[#1347FF]  bg-[#EBEFFF]" : "p-2"
                }
              >
                Installed
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/repository"
                end={false}
                className={({ isActive }) =>
                  isActive ? "p-2 text-[#1347FF] bg-[#EBEFFF]" : "p-2"
                }
              >
                Repository
              </NavLink>
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
            <li>
              <a
                href="https://github.com/komodorio/helm-dashboard/releases"
                className="text-upgrade-color"
                target="_blank"
                rel="noopener noreferrer"
              >
                Upgrade to {statusData?.LatestVer}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="h-16 flex items-center gap-5 ">
        <div className="flex p-1 gap-2 border bottom-gray-200 rounded">
          <img src={WatcherIcon} width={40} height={40} />
          <div className="flex flex-col">
            <a
              href="https://komodor.com/helm-dash/"
              className="text-[#0d6efd] font-bold"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex items-center gap-2 min-w-[25%]">
                Upgrade your HELM experience - Free
                <BsBoxArrowUpRight className="w-[14px] h-[14px]" />
              </div>
            </a>
            <label className="text-[#707583]">
              Auth & RBAC, k8s events, troubleshooting and more
            </label>
          </div>
        </div>

        <span className="w-[1px] h-3/4 bg-gray-200" />
        <ShutDownButton />
      </div>
    </div>
  );
}
