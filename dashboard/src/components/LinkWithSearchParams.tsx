import { NavLink, useLocation } from "react-router-dom";

const LinkWithSearchParams = ({
  to,
  ...props
}: {
  to: string;
  end?: boolean;
  className?: string;
  children: React.ReactNode;
}) => {
  const { search } = useLocation();
  return <NavLink to={`${to}${search}`} {...props} />;
};

export default LinkWithSearchParams;
