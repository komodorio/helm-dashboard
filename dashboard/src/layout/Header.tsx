import { NavLink } from "react-router-dom";
import LogoHeader from "../assets/logo-header.svg";
import DropDown from "../components/common/DropDown";
import WatcherIcon from "../assets/k8s-watcher.svg";
import ShutDownButton from "./ShutDownButton";

const lastRelease = "v1.2.0";

export default function Header() {
import "../App.css"
import SignOutpopup from "./SignOutPopup";
import PowerSettingsNewOutlinedIcon from '@mui/icons-material/PowerSettingsNewOutlined';
import { useState } from "react";
function Header():JSX.Element {

  const [signOut,setSignOut]=useState(false);

  const handleClick=()=>{
    setSignOut(true);
  }

  return (
    <header className="app-header">
    <div className="header-left">
      <div className="logo">
        <img src="" alt='Helm-DashBoard'/>
      </div>
      <div className="vertical-seperator">
        |
      </div>
      <div className="h-16 flex items-center gap-5 ">
        
        <div className="flex p-1 gap-2 border bottom-gray-200 rounded">
          <img src={WatcherIcon} width={40} height={40} />
          <div className="flex flex-col">
            <a
              href="https://komodor.com/helm-dash/"
              className="text-[#0d6efd] font-bold"
            >
              Upgrade your HELM experience - Free
            </a>
            <label className="text-[#707583]">Auth & RBAC, k8s events, troubleshooting and more</label>
          </div>
        </div>
        <div className="vertical-seperator">
          |
        </div>
        <div className="signout-btn">
          <button>Signout</button>
        </div>
    </div>
  );
}
