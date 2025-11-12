"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeClosed, EyeOff, EyeOffIcon } from "lucide-react";

type Role = "professor" | "teaching assistant" | "grader";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<Role>("professor");
  const [emailLocal, setEmailLocal] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const email = `${emailLocal}@vt.edu`;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: call your register API
    // payload example:
    // { firstName, lastName, role, email, password }
    console.log({ firstName, lastName, role, email, password });
  };

  return (
    <div className="min-h-dvh bg-light-maroon/30 flex items-center justify-center p-6">
      <motion.main
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-xl"
      >
        <div className="surface-card p-6 md:p-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-primary">
              Create your account
            </h1>
            <p className="text-sm text-subtle-maroon mt-1">
              Join with your VT email to get started
            </p>
          </header>

          <form
            onSubmit={onSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium mb-1 text-primary">
                First name
              </label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-field"
                placeholder="First"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium mb-1 text-primary">
                Last name
              </label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input-field"
                 style={{ backgroundColor: '#fff' }}
                placeholder="Last"
              />
            </div>

            {/* Role */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-1 text-primary">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="input-field"
              >
                <option value="professor">Professor</option>
                <option value="teaching assistant">Teaching Assistant</option>
                <option value="grader">Grader</option>
              </select>
            </div>

            {/* Email (local part + fixed domain) */}
            <div className="md:col-span-1">
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
            {password ?  <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-12 transform -translate-y-1/2 text-subtle-maroon hover:text-primary transition"
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button> : <div></div>}
            </div>

            {/* Submit */}
            <div className="md:col-span-2 mt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ y: -1 }}
                className="button-primary w-full"
                type="submit"
              >
                Create account
              </motion.button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            Have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:text-primary-hover underline underline-offset-4"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Decorative glow */}
        {/* <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-4 text-center text-xs text-subtle-maroon"
        >
          By creating an account, you agree to our terms and policies.
        </motion.div> */}
      </motion.main>
    </div>
  );
}
