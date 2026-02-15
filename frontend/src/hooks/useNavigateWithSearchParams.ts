import {
  type NavigateOptions,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";

import { useAppContext } from "../context/AppContext";

const useNavigateWithSearchParams = () => {
  const navigate = useNavigate();
  const { clusterMode } = useAppContext();
  const { context } = useParams();

  const { search } = useLocation();
  return async (url: string, ...restArgs: NavigateOptions[]) => {
    let prefixedUrl = url;

    if (!clusterMode) {
      prefixedUrl = `/${encodeURIComponent(context ?? "")}${url}`;
    }
    await navigate(`${prefixedUrl}${search}`, ...restArgs);
  };
};

export default useNavigateWithSearchParams;
