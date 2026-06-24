import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../api/api";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { UserPlus, Eye, EyeOff, Gavel } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading("Verifying credentials..."); // Changed text to sound more official
    try {
      const res = await auth.register(formData);
      toast.dismiss(loadingToast);
      if (res.token && res.user) {
        toast.success("Access Granted.");
        navigate("/login");
      } else {
        toast.error(res.message || "Registration denied.");
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || "System error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-gray-100 px-4 py-12 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background Texture/Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800 via-[#0a0a0a] to-black opacity-80"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-[#111] border border-neutral-800 shadow-2xl shadow-black/50 p-8 md:p-10 rounded-md"
      >
        {/* Header Section */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-neutral-900 border border-neutral-700 text-amber-500"
          >
            <Gavel size={24} />
          </motion.div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-white">
            Join the Debate
          </h1>
          <p className="text-neutral-400 mt-2 text-sm tracking-wide">
            Create your profile for <span className="text-amber-500 font-serif italic">AI Debate Judge</span>
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Username */}
          <div className="space-y-1">
            <label
              htmlFor="username"
              className="block text-xs uppercase tracking-wider font-semibold text-neutral-500"
            >
              Identity / Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              placeholder="Mohd Hammad Ansari"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded text-gray-200 placeholder-neutral-600 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600/50 transition-all duration-200"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-wider font-semibold text-neutral-500"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="hammadansari@gmail.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded text-gray-200 placeholder-neutral-600 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600/50 transition-all duration-200"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-wider font-semibold text-neutral-500"
            >
              Secure Key
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded text-gray-200 placeholder-neutral-600 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600/50 transition-all duration-200 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-neutral-500 hover:text-amber-500 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded font-medium tracking-wide transition-all duration-300 ${
              loading
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700"
                : "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/20 hover:shadow-amber-900/40"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2 text-sm">Processing...</span>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Initialize Account</span>
              </>
            )}
          </motion.button>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-neutral-800"></div>
            <span className="flex-shrink-0 mx-4 text-xs text-neutral-600 uppercase tracking-widest">Or</span>
            <div className="flex-grow border-t border-neutral-800"></div>
          </div>

          <div className="text-center text-sm text-neutral-500">
            <span>Already a member? </span>
            <Link
              to="/login"
              className="text-amber-500 hover:text-amber-400 font-medium transition-colors underline decoration-transparent hover:decoration-amber-500/50 underline-offset-4"
            >
              Enter Chambers
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}