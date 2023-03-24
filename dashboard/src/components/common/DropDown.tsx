import React, { useState } from "react";
import ArrowDownIcon from "../../assets/arrow-down-icon.svg";

export type DropDownItem = {
  id: string;
  text: string;
  icon: string;
};

export type DropDownProps = {
  items: DropDownItem[];
};

function DropDown({ items }: DropDownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative flex flex-col items-center">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between"
      >
        Help
        <img src={ArrowDownIcon} className="ml-2 w-[10px] h-[10px]" />
        {isOpen && (
          <div className="bg-white absolute top-20 rounded border border-gray-200">
            {items.map((item) => (
              <div>
                <h3>{item.text}</h3>
              </div>
            ))}
          </div>
        )}
      </button>
    </div>
  );
}

export default DropDown;
