import { useContext } from "react";
import { ErrorModalContext } from "../context/ErrorModalContext";

function useAlertError() {
  const { setShowErrorModal, shouldShowErrorModal } =
    useContext(ErrorModalContext);
  return { setShowErrorModal, shouldShowErrorModal };
}

export default useAlertError;
