import { NavLink, useLocation, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

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
  const { context } = useParams();
  const { clusterMode } = useAppContext();

  const params = new URLSearchParams(search);
  // For state we don't want to keep while navigating
  props.exclude?.forEach((key) => {
    params.delete(key);
  });

  let prefixedUrl = to;

  if (!clusterMode) {
    prefixedUrl = `/${context}${to}`;
  }

  return (
    <NavLink
      data-cy="navigation-link"
      to={`${prefixedUrl}/?${params.toString()}`}
      {...props}
    />
  );
};

export default LinkWithSearchParams;
