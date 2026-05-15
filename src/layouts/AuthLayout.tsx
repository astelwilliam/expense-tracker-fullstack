import { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
}

function AuthLayout({
  title,
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          {title}
        </h1>

        {children}
      </div>
    </div>
  );
}

export default AuthLayout;