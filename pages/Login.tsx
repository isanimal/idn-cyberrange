import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Lock, User, AlertCircle, Sun, Moon } from "lucide-react";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError("Invalid credentials.");
      }
    } catch (err) {
      setError("System error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-idn-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm transition-all"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="mb-8 text-center flex flex-col items-center">
        <div className="w-24 h-24 flex items-center justify-center mb-4">
          {/* reference logos from the public/assets folder using root-relative paths */}
          <img
            src="/assets/IDN.png"
            alt="IDN Logo"
            className="w-full h-auto object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          ID-Networkers
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-widest mt-2">
          IT Expert Factory
        </p>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-8">
        <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
            Welcome Back
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Please sign in to access your lab environment.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 border border-red-100 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-2.5 text-slate-400"
                size={18}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 dark:text-slate-200 focus:border-idn-500 focus:ring-1 focus:ring-idn-500 outline-none transition-all"
                placeholder="student@idn.id"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-2.5 text-slate-400"
                size={18}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 dark:text-slate-200 focus:border-idn-500 focus:ring-1 focus:ring-idn-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-idn-500 hover:bg-idn-600 text-white font-bold py-3 rounded-lg transition-all shadow-md shadow-idn-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Authenticating..." : "Sign In"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} ID-Networkers. All rights
            reserved.
          </p>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-600 font-mono">
        <p>Demo: admin@example.com / admin</p>
      </div>
    </div>
  );
};

export default Login;
