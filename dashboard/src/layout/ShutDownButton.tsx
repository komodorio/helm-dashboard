import PowerIcon from "../assets/power-icon.svg";
import { useState } from "react";
import Modal from "../components/modal/Modal";

function ShutDownButton() {

  const onClose= () => {
    console.log("close button clcked")
  }
  const [signOut,setSignOut]=useState(false);

  const handleClick=()=>{
    setSignOut(true);
  }

  return (
    <div className="ShutDownButton">

      {
          signOut && <Modal title={"Session Ended"}
          isOpen={true}
          onClose={onClose}>
            <p>The Helm Dashboard application has been shutdown. You can now close the browser tab.</p>
          </Modal>
      }

      <button
        onClick={handleClick}
        title="Shut down the Helm Dashboard application"
        className="mr-5 p-3 border border-transparent hover:border hover:border-gray-500 rounded"
      >
        <img src={PowerIcon} className="w-[20px] h-[20px]"/>
      </button>
    </div>
    
  );
}

export default ShutDownButton;
