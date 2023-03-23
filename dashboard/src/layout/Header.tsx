import { Link } from "react-router-dom";
import "../App.css";
import LogoHeader from "../assets/logo-header.svg";
import DropDown from "../components/common/DropDown";

const lastRelease = "v1.2.0";

export default function Header() {
  return (
    <div className="h-16 flex items-center gap-10 justify-between">
      <div className="h-16 flex items-center gap-10 ">
        <span className=" h-full flex">
          <Link to="/">
            <img
              src={LogoHeader}
              alt="Helm-DashBoard"
              width={140}
              height={40}
            />
          </Link>
        </span>
        <span className="w-[1px] h-3/4 bg-gray-200" />
        <div className="inline-block">
          <ul className=" flex md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium md:border-0 dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
            <li>
              <Link to="/">Installed</Link>
            </li>
            <li>
              <Link to="/Repository">Repository</Link>
            </li>
            <li>
              <DropDown
                items={[
                  { id: "1", text: "Support chat", icon: "1" },
                  { id: "2", text: "Project Page", icon: "2" },
                  { id: "2", text: "Reset Cache", icon: "2" },
                ]}
              ></DropDown>
            </li>
            <li>
              <a
                href="https://github.com/komodorio/helm-dashboard/releases"
                className="text-upgrade-color"
              >
                Upgrade to {lastRelease}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="h-16 flex items-center gap-10 ">
        <div>
          Helm experience 
        </div>

        <span className="w-[1px] h-3/4 bg-gray-200" />
        <div>shut down</div>
      </div>
    </div>
  );
}
