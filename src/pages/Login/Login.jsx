import { useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../../services/api";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await API.post("/api/auth/login", formData);

      // ─── FIX: Store token BOTH separately AND inside user object ───
      localStorage.setItem("token", res.data.token);

      // ✅ IMPORTANT: Include token inside the user object so
      //    the Axios interceptor AND useVoiceInterview hook
      //    can find it via: JSON.parse(user).token
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...res.data.user,
          token: res.data.token,
        })
      );

      alert("Login Successful");

      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center">Welcome Back</h1>
        <p className="text-center text-gray-500 mt-2">Login to continue</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full mt-2 px-4 py-3 border rounded-lg"
            />
          </div>

          <div>
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full mt-2 px-4 py-3 border rounded-lg"
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
          >
            {loading ? "Logging In..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;