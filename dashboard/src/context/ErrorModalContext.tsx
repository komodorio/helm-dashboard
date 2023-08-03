/* eslint-disable @typescript-eslint/no-unused-vars */
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
  // in this case we allow Unexpected empty method
  //eslint-disable-next-line @typescript-eslint/no-empty-function
  setShowErrorModal: (toggle?: ErrorAlert) => {},
});
