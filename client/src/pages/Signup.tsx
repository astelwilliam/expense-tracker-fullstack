import { useState } from "react";

import {
  useNavigate,
  Link,
} from "react-router-dom";

import api from "../services/api";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] =
    useState("");

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
        "/auth/signup",
        {
          name,
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
          Signup
        </h1>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          className="w-full p-3 rounded-xl bg-zinc-800 text-white"
          required
          autoComplete="name"
        />

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
          autoComplete="new-password"
        />

        <button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-600 transition p-3 rounded-xl font-bold"
        >
          Signup
        </button>

        <p className="text-zinc-400 text-center">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-500"
          >
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Signup;