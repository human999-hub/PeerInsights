"use client";

import { useState, FormEvent} from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useLoginUser } from "../lib/queries";
import { useRouter } from "next/navigation";
import AuthGraphic from "@/components/AuthGraphic";


type Role = "instructor" | "ta";

export default function LoginPage() {
  const [role, setRole] = useState<Role>("instructor");
  const [emailLocal, setEmailLocal] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const email = `${emailLocal}@vt.edu`;

  const router = useRouter();
  const { mutate: login, isPending, error: mutationError } = useLoginUser();
 
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!emailLocal.trim()) {
      setFormError("Please enter your VT PID.");
      return;
    }

    login(
      {
        email,
        password,
        role, // "instructor" | "ta"
      },
      {
        onSuccess: (data) => {
          // TODO: store token somewhere (cookie / localStorage)
          localStorage.setItem("peerinsights_token", data.token);
          localStorage.setItem("peerinsights_user", JSON.stringify(data.user));
          router.push("/classes"); // 🔁 change to your dashboard route
        },
        onError: (err) => {
          setFormError(err.message || "Login failed");
        },
      }
    );
  };

  const displayError = formError || mutationError?.message;

  return (
    <div className="min-h-dvh bg-light-maroon/30 flex gap-5 items-center justify-center p-6">
      {/* <h1 className="text-3xl font-bold text-primary">PeerInsights</h1>
       */}
      <AuthGraphic />
      <motion.main
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="surface-card p-6 md:p-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-primary">
              Welcome back
            </h1>
            <p className="text-sm text-subtle-maroon mt-1">
              Log in to continue to your dashboard
            </p>
          </header>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Role */}
            <div>
              <label className="block text-sm font-medium mb-1 text-primary">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="input-field"
              >
                <option value="instructor">Instructor</option>
                <option value="ta">Teaching Assistant</option>
              </select>
            </div>

            {/* Email (local part + fixed domain) */}
            <div>
              <label className="block text-sm font-medium mb-1 text-primary">
                Email ID
              </label>
              <div className="flex items-center gap-2">
                <input
                  required
                  value={emailLocal}
                  onChange={(e) => setEmailLocal(e.target.value.trim())}
                  placeholder="abc123"
                  className="input-field"
                />
                <span className="px-3 py-2 rounded-xl bg-light-maroon/60 border border-light-maroon/30 text-sm">
                  @vt.edu
                </span>
              </div>
            </div>

            {/* Password */}
            <div className="relative">
              <label className="block text-sm font-medium mb-1 text-primary">
                Password
              </label>
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="••••••••"
              />
              {password ? (
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-12 transform -translate-y-1/2 text-subtle-maroon hover:text-primary transition"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              ) : (
                <div />
              )}
            </div>

            {/* Error */}
            {displayError && (
              <p className="text-sm text-red-600 mt-1">{displayError}</p>
            )}

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={!isPending ? { y: -1 } : {}}
              className="button-primary w-full mt-2 disabled:opacity-60"
              type="submit"
              disabled={isPending}
            >
              {isPending ? "Logging in..." : "Login"}
            </motion.button>
          </form>

          <div className="mt-6 text-center text-sm">
            New here?{" "}
            <Link
              href="/register"
              className="text-primary hover:text-primary-hover underline underline-offset-4"
            >
              Register
            </Link>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
