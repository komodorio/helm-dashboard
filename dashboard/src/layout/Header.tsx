import "../App.css";
import LogoHeader from "../assets/logo-header.svg";

export default function Header() {
  return (
    <div className=" h-16 flex items-center gap-10">
      <span className=" h-full flex">
        <img src={LogoHeader} alt="Helm-DashBoard" width={140} height={40} />
      </span>
      <span className="w-0.5 h-3/4 bg-gray-200"/>
      <div className="inline-block">
        <ul className=" flex md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium md:border-0 dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
          <li>
            <a href="#" aria-current="page">
              Installed
            </a>
          </li>
          <li>
            <a href="#">Repository</a>
          </li>
          <li>
            <a href="#">Help</a>
          </li>
          <li>
            <a href="#">Upgrade to v1.2.0</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
