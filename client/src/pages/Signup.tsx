import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getApiError } from "../services/api";
import { saveToken } from "../utils/auth";

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post<{ token: string }>("/auth/signup", { name, email, password });
      if (!response.data.token) throw new Error("Missing token");
      saveToken(response.data.token);
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(getApiError(err, "Signup failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-zinc-900 p-10 rounded-3xl w-full max-w-md space-y-5">
        <h1 className="text-4xl font-bold text-white mb-6">Signup</h1>
        <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="w-full p-3 rounded-xl bg-zinc-800 text-white" required autoComplete="name" />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 rounded-xl bg-zinc-800 text-white" required autoComplete="email" />
        <input type="password" placeholder="Password (at least 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} className="w-full p-3 rounded-xl bg-zinc-800 text-white" required autoComplete="new-password" />
        <button type="submit" disabled={submitting} className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 transition p-3 rounded-xl font-bold">{submitting ? "Creating account..." : "Signup"}</button>
        <p className="text-zinc-400 text-center">Already have an account? <Link to="/login" className="text-blue-500">Login</Link></p>
      </form>
    </div>
  );
}

export default Signup;
