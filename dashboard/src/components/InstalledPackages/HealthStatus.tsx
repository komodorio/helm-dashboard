const items = [
  { id: 1 },
  { id: 2, is: true },
  { id: 3 },
  { id: 4 },
  { id: 5, is: true },
  { id: 6 },
  { id: 7 },
];

const HealthStatus = () => {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span
          key={item.id}
          className={`inline-block bg-[#00c2ab] w-2 h-2 rounded-sm ${
            item.is ? "bg-[#ff0072]" : ""
          }`}
        ></span>
      ))}
    </div>
  );
};

export default HealthStatus;
