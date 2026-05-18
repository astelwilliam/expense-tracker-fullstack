import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl shadow-2xl">
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;