import { BsPower } from "react-icons/bs";
import Modal from "./modal/Modal";
import { useShutdownHelmDashboard } from "../API/other";

function ShutDownButton() {
  const { mutate: signOut, status } = useShutdownHelmDashboard();

  const handleClick = () => {
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
        className="mr-5 flex w-full justify-center rounded-sm border border-transparent py-3 hover:rounded-lg hover:border hover:border-gray-500"
      >
        <BsPower className="w-6" />
      </button>
    </div>
  );
}

export default ShutDownButton;
