import { NavLink, useSearchParams } from "react-router-dom"

const LinkWithSearchParams = ({to, ...props}) => {
    const [searchParams]  = useSearchParams();
    return (
        <NavLink to={`${to}?${searchParams.toString()}`} {...props} />
    )
}

export default LinkWithSearchParams;