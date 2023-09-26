import { ReactNode, useEffect, useRef, useState } from "react";
import ArrowDownIcon from "../../assets/arrow-down-icon.svg";

export type DropDownItem = {
  id: string;
  text?: string;
  icon?: ReactNode;
  onClick?: () => void;
  isSeparator?: boolean;
  isDisabled?: boolean;
};

export type DropDownProps = {
  items: DropDownItem[];
};

type PopupState = {
  isOpen: boolean;
  X: number;
  Y: number;
};

function DropDown({ items }: DropDownProps) {
  const [popupState, setPopupState] = useState<PopupState>({
    isOpen: false,
    X: 0,
    Y: 0,
  });

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (popupState.isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popupState.isOpen]);

  const handleClickOutside = (event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      setPopupState((prev) => ({
        ...prev,
        isOpen: false,
      }));
    }
  };

  return (
    <>
      <div className="relative flex flex-col items-center">
        <button
          onClick={(e) => {
            setPopupState((prev) => ({
              ...prev,
              isOpen: !prev.isOpen,
              X: e.pageX,
              Y: e.pageY,
            }));
          }}
          className="flex items-center justify-between"
        >
          Help
          <img src={ArrowDownIcon} className="ml-2 w-[10px] h-[10px]" />
        </button>
      </div>
      {popupState.isOpen && (
        <div
          ref={modalRef}
          className={`z-10 flex flex-col py-1 gap-1 bg-white mt-3 absolute rounded border top-[${popupState.Y}] left-[${popupState.X}] border-gray-200`}
        >
          {items.map((item) => (
            <>
              {item.isSeparator ? (
                <div className="bg-gray-300 h-[1px]" />
              ) : (
                <div
                  onClick={() => {
                    item.onClick?.();
                    setPopupState((prev) => ({
                      ...prev,
                      isOpen: false,
                    }));
                  }}
                  className={`cursor-pointer font-normal flex items-center gap-2 py-1 pl-3 pr-7 hover:bg-dropdown ${
                    item.isDisabled
                      ? "cursor-default hover:bg-transparent text-gray-400"
                      : ""
                  }`}
                >
                  {item.icon && <span> {item.icon ?? null}</span>}
                  <span>{item.text}</span>
                </div>
              )}
            </>
          ))}
        </div>
      )}
    </>
  );
}

export default DropDown;
