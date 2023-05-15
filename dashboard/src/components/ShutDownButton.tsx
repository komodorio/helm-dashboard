import { BsPower } from "react-icons/bs";
import { useState } from "react";
import Modal, { ModalAction, ModalButtonStyle } from "./modal/Modal";
import { useShutdownHelmDashboard } from "../API/other";

function ShutDownButton() {
  const { mutate, status } = useShutdownHelmDashboard();
  const onClose = () => {
    console.log("close button clicked");
  };
  const [signOut, setSignOut] = useState(false);

  const handleClick = async () => {
    setSignOut(true);
  };

  const confirmModalActions: ModalAction[] = [
    {
      id: "2",
      text: "Confirm",
      callback: () => {
        mutate();
      },
      variant: ModalButtonStyle.error,
    },
  ];

  return (
    <div className="ShutDownButton">
      {signOut && (
        <Modal actions={status == "success" ? [] : confirmModalActions} title={"Session Ended"} isOpen={true} onClose={onClose}>
          {status == "success" ? <p>
            Helm Dashboard application has been successfully shutdown.
          </p> :
          <p>
          Are you sure you wish to shutdown the Helm Dashboard application?
          </p>
          }
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
