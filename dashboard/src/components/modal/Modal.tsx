import { useState, useEffect, PropsWithChildren, ReactNode } from "react";

export enum ModalButtonStyle {
  default,
  info,
  error,
  success,
}

export type ModalAction = {
  callback: () => void;
  text: string;
  variant?: ModalButtonStyle;
  className?: string;
};

type ModalProps = {
  title?: string | ReactNode;
  isOpen: boolean;
  onClose: () => void;
  actions?: ModalAction[];
} & PropsWithChildren;

const Modal = ({ title, isOpen, onClose, children, actions }: ModalProps) => {
  const [isVisible, setIsVisible] = useState<boolean>(isOpen);

  const colorVariants = new Map<ModalButtonStyle, string>([
    [
      ModalButtonStyle.default,
      "text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600",
    ],
    [
      ModalButtonStyle.info,
      "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
    ],
    [
      ModalButtonStyle.success,
      "text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800",
    ],
    [
      ModalButtonStyle.error,
      "text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800",
    ],
  ]);

  useEffect(() => {
    setIsVisible(isOpen);
  }, [isOpen]);

  const getClassName = (action: ModalAction) => {
    if (action.className) return action.className;

    return action.variant
      ? colorVariants.get(action.variant)
      : colorVariants.get(ModalButtonStyle.default);
  };

  return isVisible ? (
    <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
      {title && (
        <div className="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
            data-modal-hide="staticModal"
            onClick={onClose}
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              ></path>
            </svg>
          </button>
        </div>
      )}
      <div
        className="p-6 space-y-6 overflow-y-auto"
        style={{ maxHeight: "500px" }}
      >
        {children}
      </div>
      <div className="flex justify-end p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600">
        {actions?.map((action) => (
          <button
            type="button"
            className={getClassName(action)}
            onClick={action.callback}
          >
            {action.text}
          </button>
        ))}
      </div>
    </div>
  ) : null;
};

export default Modal;
