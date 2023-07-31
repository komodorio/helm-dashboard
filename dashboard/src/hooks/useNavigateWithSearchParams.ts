import { useLocation, useNavigate, NavigateOptions, To } from 'react-router-dom'

const useNavigateWithSearchParams = () => {
    const navigate = useNavigate()
    const { search } = useLocation()
    const navigateWithSearchParams = (url: To, options?: NavigateOptions) => {
        navigate(url + search, options)
    }

    return navigateWithSearchParams
}

export default useNavigateWithSearchParams
