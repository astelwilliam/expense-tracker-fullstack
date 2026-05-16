import { useState } from "react";

import {
  useNavigate,
  Link,
} from "react-router-dom";

import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      const response = await api.post(
        "/auth/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem(
        "token",
        response.data.token
      );

      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 p-10 rounded-3xl w-full max-w-md space-y-5"
      >
        <h1 className="text-4xl font-bold text-white mb-6">
          Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full p-3 rounded-xl bg-zinc-800 text-white"
          required
          autoComplete="email"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full p-3 rounded-xl bg-zinc-800 text-white"
          required
          autoComplete="current-password"
        />

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 transition p-3 rounded-xl font-bold"
        >
          Login
        </button>

        <p className="text-zinc-400 text-center">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="text-blue-500"
          >
            Signup
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;