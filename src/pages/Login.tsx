import { useState } from "react";

import AuthLayout from "../layouts/AuthLayout";

function Login() {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  return (
    <AuthLayout title="Login">
      <div className="space-y-5">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full bg-zinc-800 text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-white transition"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full bg-zinc-800 text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-white transition"
        />

        <button
          className="w-full bg-white text-black p-4 rounded-xl font-semibold hover:bg-zinc-200 active:scale-95 transition"
        >
          Login
        </button>
      </div>
    </AuthLayout>
  );
}

export default Login;