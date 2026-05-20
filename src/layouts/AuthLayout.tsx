import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({
  children,
}: AuthLayoutProps) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(to right, #0f2027, #203a43, #2c5364)",
      }}
    >
      {children}
    </div>
  );
};

export default AuthLayout;