import { PropsWithChildren, ReactNode } from "react";
import ReactDom from "react-dom";
import Spinner from "../Spinner";

export enum ModalButtonStyle {
  default,
  info,
  error,
  success,
  disabled,
}

export interface ModalAction {
  id: string;
  callback: () => void;
  text?: string;
  variant?: ModalButtonStyle;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export interface ModalProps extends PropsWithChildren {
  title?: string | ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  containerClassNames?: string;
  actions?: ModalAction[];
  bottomContent?: ReactNode;
}

const Modal = ({
  title,
  isOpen,
  onClose,
  children,
  actions,
  containerClassNames,
  bottomContent,
}: ModalProps) => {
  const colorVariants = new Map<ModalButtonStyle, string>([
    [
      ModalButtonStyle.default,
      "text-base font-semibold text-gray-500 bg-white hover:bg-gray-100 disabled:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 font-medium px-5 py-1 hover:text-gray-900 focus:z-10 ",
    ],
    [
      ModalButtonStyle.info,
      "font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-blue-700/80 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-base px-3 py-1.5 text-center ",
    ],
    [
      ModalButtonStyle.success,
      "font-semibold text-white bg-green-700 hover:bg-green-800 disabled:bg-green-700/80 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-base px-3 py-1.5 text-center ",
    ],
    [
      ModalButtonStyle.error,
      "font-semibold text-white bg-red-700 hover:bg-red-800 disabled:bg-red-700/80 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-base px-3 py-1.5 text-center ",
    ],
    [
      ModalButtonStyle.disabled,
      "font-semibold text-gray-500 bg-gray-200 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-base font-medium px-3 py-1.5 hover:text-gray-900 focus:z-10 ",
    ],
  ]);

  const getClassName = (action: ModalAction) => {
    if (action.className) return action.className;

    return action.variant
      ? colorVariants.get(action.variant)
      : colorVariants.get(ModalButtonStyle.default);
  };

  const getTitle = (title: string | ReactNode) => {
    if (typeof title === "string")
      return <h3 className="text-xl font-medium text-grey">{title}</h3>;
    else return title;
  };

  return ReactDom.createPortal(
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity ">
          <div className="flex justify-center">
            <div
              style={{
                maxHeight: "95vh",
                overflow: "hidden",
              }}
              className={`relative rounded-lg shadow  m-7 w-2/5 max-w-[1300px] ${
                !containerClassNames ||
                (containerClassNames && !containerClassNames.includes("bg-"))
                  ? "bg-white"
                  : ""
              } ${containerClassNames ?? ""}`}
            >
              {title && (
                <div className="flex items-start justify-between p-4 border-b rounded-t ">
                  {getTitle(title)}
                  {onClose ? (
                    <button
                      type="button"
                      className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                      data-modal-hide="staticModal"
                      onClick={() => onClose()}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </button>
                  ) : null}
                </div>
              )}
              <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh_-_200px)]">
                {children}
              </div>
              {bottomContent ? (
                <div className="p-5 text-sm">{bottomContent}</div>
              ) : (
                <div className="flex justify-end p-6 space-x-2 border-t border-gray-200 rounded-b ">
                  {actions?.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      className={
                        action.isLoading
                          ? `flex items-center font-bold justify-around space-x-1 ${getClassName(
                              action
                            )}`
                          : `${getClassName(action)} `
                      }
                      onClick={action.callback}
                      disabled={action.disabled || action.isLoading}
                    >
                      {action.isLoading ? <Spinner size={4} /> : null}
                      {action.text ?? "Confirm"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>,
    document.getElementById("portal")!
  );
};

export default Modal;
