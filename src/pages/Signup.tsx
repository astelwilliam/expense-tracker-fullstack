import { useState } from "react";

import AuthLayout from "../layouts/AuthLayout";

function Signup() {
  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  return (
    <AuthLayout title="Create Account">
      <div className="space-y-5">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          className="w-full bg-zinc-800 text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-white transition"
        />

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
          Create Account
        </button>
      </div>
    </AuthLayout>
  );
}

export default Signup;