import { NavLink, useLocation } from "react-router-dom";

const LinkWithSearchParams = ({
  to,
  ...props
}: {
  to: string;
  end?: boolean;
  exclude?: string[];
  className?: string;
  children: React.ReactNode;
}) => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);

  // For state we don't want to keep while navigating
  props.exclude?.forEach((key) => {
    params.delete(key);
  });

  return <NavLink to={`${to}/?${params.toString()}`} {...props} />;
};

export default LinkWithSearchParams;
