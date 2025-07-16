import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import logo from "../assets/Logo-main.png";
import sideImage from "../assets/login-side3.webp";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/login", { email, password });
      const { accessToken, refreshToken, role } = res.data;

      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("role", role);
      localStorage.setItem("email", email);

      window.location.href = `http://localhost:5173/${role}?token=${accessToken}&role=${role}`;
    } catch (err) {
      setError(err.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-400 via-white to-white p-6">
      <div className="bg-white shadow-2xl rounded-3xl flex w-full max-w-5xl overflow-hidden">
        {/* Left Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Company Logo" className="h-12" />
          </div>
          <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Sign in</h2>
          <p className="text-sm text-center text-gray-500 mb-6">
            Please login to continue to your account.
          </p>

          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg text-white font-semibold transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Logging in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* Right Side Image */}
        <div className="hidden md:block md:w-1/2">
          <img src={sideImage} alt="Visual" className="h-full w-full object-cover" />
        </div>
      </div>
    </div>
  );
};

export default Login;
