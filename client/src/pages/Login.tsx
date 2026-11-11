import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getApiError } from "../services/api";
import { saveToken } from "../utils/auth";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post<{ token: string }>("/auth/login", { email, password });
      if (!response.data.token) throw new Error("Missing token");
      saveToken(response.data.token);
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(getApiError(err, "Login failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-zinc-900 p-10 rounded-3xl w-full max-w-md space-y-5">
        <h1 className="text-4xl font-bold text-white mb-6">Login</h1>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 rounded-xl bg-zinc-800 text-white" required autoComplete="email" />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 rounded-xl bg-zinc-800 text-white" required autoComplete="current-password" />
        <button type="submit" disabled={submitting} className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition p-3 rounded-xl font-bold">{submitting ? "Logging in..." : "Login"}</button>
        <p className="text-zinc-400 text-center">Don’t have an account? <Link to="/signup" className="text-blue-500">Signup</Link></p>
      </form>
    </div>
  );
}

export default Login;
