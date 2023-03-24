import PowerIcon from "../assets/power-icon.svg";

function ShutDownButton() {
  return (
    <button
      onClick={() => console.log("shutdown")}
      title="Shut down the Helm Dashboard application"
      className="mr-5 p-3 border border-transparent hover:border hover:border-gray-500 rounded"
    >
      <img src={PowerIcon} className="w-[20px] h-[20px]"/>
    </button>
  );
}

export default ShutDownButton;
