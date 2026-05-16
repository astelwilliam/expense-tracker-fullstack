import { Navigate } from "react-router-dom";

import { isAuthenticated } from "../utils/auth";

interface Props {
  children: React.ReactNode;
}

function PublicRoute({
  children,
}: Props) {
  if (isAuthenticated()) {
    return <Navigate to="/" />;
  }

  return children;
}

export default PublicRoute;