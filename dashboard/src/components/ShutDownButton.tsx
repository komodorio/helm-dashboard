import { BsPower } from "react-icons/bs";

import Modal from "./modal/Modal";
import { useShutdownHelmDashboard } from "../API/other";

function ShutDownButton() {
  const { mutate: signOut, status } = useShutdownHelmDashboard();

  const handleClick = async () => {
    signOut();
  };

  return (
    <div className="w-full">
      <Modal title="Session Ended" isOpen={status === "success"}>
        <p>
          The Helm Dashboard application has been shut down. You can now close
          the browser tab.
        </p>
      </Modal>

      <button
        onClick={handleClick}
        title="Shut down the Helm Dashboard application"
        className="flex justify-center w-full mr-5 py-3 border border-transparent hover:border hover:border-gray-500 rounded hover:rounded-lg"
      >
        <BsPower className="w-6" />
      </button>
    </div>
  );
}

export default ShutDownButton;
