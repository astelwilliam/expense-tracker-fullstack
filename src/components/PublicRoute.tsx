import React from "react";
import {
  Navigate,
} from "react-router-dom";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({
  children,
}: PublicRouteProps) => {
  const token =
    localStorage.getItem("token");

  if (token) {
    return (
      <Navigate to="/dashboard" />
    );
  }

  return <>{children}</>;
};

export default PublicRoute;