interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AuthLayout = ({
  children,
  title,
}: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="bg-zinc-900 p-8 rounded-2xl w-full max-w-md shadow-lg">
        {title && (
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            {title}
          </h1>
        )}

        {children}
      </div>
    </div>
  );
};

export default AuthLayout;