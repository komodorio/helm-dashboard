import {
  type NavigateOptions,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const useNavigateWithSearchParams = () => {
  const navigate = useNavigate();
  const { clusterMode } = useAppContext();
  const { context } = useParams();

  const { search } = useLocation();
  const navigateWithSearchParams = (
    url: string,
    ...restArgs: NavigateOptions[]
  ) => {
    let prefixedUrl = url;

    if (!clusterMode) {
      prefixedUrl = `/${context}${url}`;
    }
    navigate(`${prefixedUrl}${search}`, ...restArgs);
  };

  return navigateWithSearchParams;
};

export default useNavigateWithSearchParams;
