import { BsPower } from "react-icons/bs";
import { useState } from "react";
import Modal from "./modal/Modal";
import axios from "axios";

function ShutDownButton() {
  const onClose = () => {
    console.log("close button clicked");
  };
  const [signOut, setSignOut] = useState(false);

  const handleClick = async () => {
    await axios
      .delete("/")
      .then(() => {
        setSignOut(true);
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
