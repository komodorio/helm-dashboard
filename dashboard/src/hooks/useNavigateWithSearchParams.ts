import { useLocation, useNavigate } from "react-router-dom"

const useNavigateWithSearchParams = () => {
    const navigate = useNavigate();
    const {search} = useLocation();
    const navigateWithSearchParams = (url : string, ...restArgs) => {
        navigate(url +  search, ...restArgs)
    }

    return navigateWithSearchParams;
}

export default useNavigateWithSearchParams;