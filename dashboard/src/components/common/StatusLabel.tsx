type StatusLabelProps = {
  status: string;
};

function StatusLabel({ status }: StatusLabelProps) {
  function getColor(status: string) {
    if (status === "deployed") return "text-[#1FA470]";
    else return "text-[#9195A1]";
  }

  return (
    <span className={`${getColor(status)} font-bold text-xs`}>
      ● {status.toUpperCase()}
    </span>
  );
}

export default StatusLabel;
