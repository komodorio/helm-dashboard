import { createContext } from "react";

export interface ErrorAlert {
  title?: string;
  msg: string;
}

export const ErrorModalContext = createContext<{
  shouldShowErrorModal?: ErrorAlert;
  setShowErrorModal: (toggle?: ErrorAlert) => void;
}>({
  shouldShowErrorModal: undefined,
  setShowErrorModal: (toggle?: ErrorAlert) => {},
});
