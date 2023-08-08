import { NavigateOptions, useLocation, useNavigate } from "react-router-dom";

const useNavigateWithSearchParams = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const navigateWithSearchParams = (url: string, ...restArgs: NavigateOptions[]) => {
    navigate(url + search, ...restArgs);
  };

  return navigateWithSearchParams;
};

export default useNavigateWithSearchParams;
