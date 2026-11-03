
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // SEND OTP
  const sendOTP = async () => {
    const email = formData.email.trim();

    if (!email) {
      alert("Please enter your email address first.");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/api/auth/send-otp", {
        email,
      });

      alert(res.data?.message || "OTP request completed.");
      setOtpSent(true);
      setOtp("");
      setVerified(false);
    } catch (error) {
      console.error("SEND OTP ERROR:", error);

      alert(
        error.response?.data?.message ||
          "OTP send failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // VERIFY OTP
  const verifyOTP = async () => {
    const email = formData.email.trim();

    if (!email) {
      alert("Please enter your email address first.");
      return;
    }

    if (!otp.trim()) {
      alert("Please enter the OTP.");
      return;
    }

    try {
      setVerifying(true);

      const res = await API.post("/api/auth/verify-otp", {
        email,
        otp: otp.trim(),
      });

      alert(res.data?.message || "Email verification successful.");
      setVerified(true);
    } catch (error) {
      console.error("VERIFY OTP ERROR:", error);

      alert(
        error.response?.data?.message ||
          "OTP verification failed. Please check the OTP."
      );
    } finally {
      setVerifying(false);
    }
  };

  // CREATE ACCOUNT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!verified) {
      alert("Please verify your email first.");
      return;
    }

    if (!formData.name.trim()) {
      alert("Please enter your full name.");
      return;
    }

    if (!formData.password) {
      alert("Please enter a password.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      console.log("REGISTER REQUEST:", {
        name: payload.name,
        email: payload.email,
      });

      const res = await API.post("/api/auth/signup", payload);

      alert(res.data?.message || "Account created successfully.");
      navigate("/login");
    } catch (error) {
      console.error("REGISTER ERROR:", error);

      alert(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center">
          Create Account
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Verify email to continue
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4"
        >
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            autoComplete="name"
            required
            className="w-full px-4 py-3 border rounded-lg"
          />

          <div className="flex gap-2">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
              disabled={verified}
              className="min-w-0 flex-1 px-4 py-3 border rounded-lg disabled:bg-gray-100"
            />

            <button
              type="button"
              onClick={sendOTP}
              disabled={loading || otpSent || verified}
              className="bg-green-600 text-white px-3 rounded-lg disabled:opacity-60"
            >
              {loading
                ? "Sending..."
                : otpSent
                  ? "Sent"
                  : "Send OTP"}
            </button>
          </div>

          {otpSent && !verified && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  className="min-w-0 flex-1 px-4 py-3 border rounded-lg"
                />

                <button
                  type="button"
                  onClick={verifyOTP}
                  disabled={verifying || !otp.trim()}
                  className="bg-blue-600 text-white px-3 rounded-lg disabled:opacity-60"
                >
                  {verifying ? "Verifying..." : "Verify"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                }}
                disabled={loading}
                className="text-sm text-blue-600 underline disabled:opacity-60"
              >
                Change email or resend OTP
              </button>
            </div>
          )}

          {verified && (
            <p className="text-sm text-green-700">
              Email verified successfully.
            </p>
          )}

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
            className="w-full px-4 py-3 border rounded-lg"
          />

          <button
            type="submit"
            disabled={loading || !verified}
            className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
