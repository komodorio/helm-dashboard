import { useLocation } from "react-router-dom";
import LogoHeader from "../assets/logo-header.svg";
import DropDown from "../components/common/DropDown";
import WatcherIcon from "../assets/k8s-watcher.svg";
import ShutDownButton from "../components/ShutDownButton";
import { BsPower } from "react-icons/bs";
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
  const handleLogin = () => {
    let url: string = window.location.hostname;
    
    if (window.location.hostname === 'localhost') {
      url = `${window.location.hostname}:${window.location.port}`;
    }
  
    const redirect_uri: string = `http://${url}/callback`;
  
    fetch(`/loginlink?redirect_uri=${redirect_uri}&state=${btoa(`http://${url}`)}`, {
      method: 'GET',
    })
    .then(response => response.text())
    .then(resp => {
      window.location.href = resp.replace(/"/g, '').replace(/"|\\u0026/g, '&');
    })
    .catch(err => {
      console.log(err);
    });
  };
    

  return (
    <div className="h-16 flex items-center justify-between bg-white custom-shadow">
      <div className="h-16 flex items-center gap-6 min-w-fit ">
        <LinkWithSearchParams to={"/installed"} exclude={["tab"]}>
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
                to={"/installed"}
                exclude={["tab"]}
                className={getBtnStyle("installed")}
              >
                Installed
              </LinkWithSearchParams>
            </li>
            <li>
              <LinkWithSearchParams
                to={"/repository"}
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
          </ul>
        </div>
      </div>
      <div className="h-16 flex items-center text-sm ">
        <button onClick={handleLogin}>login</button>

        <span className="w-px h-3/5 bg-gray-200 ml-3" />
        {!clusterMode ? <ShutDownButton /> : null}
      </div>
    </div>
  );
}
