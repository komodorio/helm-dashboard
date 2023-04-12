type StatusLabelProps = {
  status: string;
};

function StatusLabel({ status }: StatusLabelProps) {
  function getColor(status: string) {
    if (status === "deployed") return "#1FA470";
    else return "#9195A1";
  }

  return (
    <span className={`text-[${getColor(status)}] font-bold text-xs`}>
      ● {status.toUpperCase()}
    </span>
  );
}

export default StatusLabel;
