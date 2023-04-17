import { BsPower } from "react-icons/bs";
import { useState } from "react";
import Modal from "./modal/Modal";
import axios from "axios";


 function ShutDownButton () {
  const onClose = () => {
    console.clear();
    console.log("close button clicked"); 
    setSignOut(false);
  };
  const [signOut, setSignOut] = useState(false);
  const handleClick = async () => {
    console.clear();
    console.log("open message click ");
    setSignOut(true);
    await axios 
      .delete("/")
      .then(() => {
        window.close();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <div className="ShutDownButton">
      {signOut && (
        <Modal title={"Session Ended"} isOpen={true} onClose={onClose}>
          <p>
            The Helm Dashboard application has been shutdown. You can now close
            the browser tab.
          </p>
        </Modal>
      )}

      <button
        onClick={handleClick}
        title="Shut down the Helm Dashboard application"
        className="mr-5 py-3 px-2 border border-transparent hover:border hover:border-gray-500 rounded"
      >
        <BsPower />
      </button>
    </div>
  );
}

export default ShutDownButton;
