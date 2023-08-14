import { useState } from "react";
import useAlertError from "./useAlertError";
import useNavigateWithSearchParams from "./useNavigateWithSearchParams";

function useInstallModal() {
  const navigate = useNavigateWithSearchParams();
  const { setShowErrorModal } = useAlertError();
  const [userValues, setUserValues] = useState("");
  const [installError, setInstallError] = useState("");

  return {
    navigate,
    setShowErrorModal,
    userValues,
    setUserValues,
    installError,
    setInstallError,
  };
}

export default useInstallModal;
