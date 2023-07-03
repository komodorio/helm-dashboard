import { NavLink, useLocation, useSearchParams } from "react-router-dom"

const LinkWithSearchParams = ({to, ...props}) => {
    const {search} = useLocation();
    return (
        <NavLink to={`${to}${search}`} {...props} />
    )
}

export default LinkWithSearchParams;