
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../../services/adminService";
import "./AdminLogin.css";
import logo from "../../assets/logo.jpeg"
function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginAdmin(email.trim(), password);

      if (!data.success || !data.token) {
        throw new Error(data.message || "Unable to sign in.");
      }

      // Store login details for this browser session
      sessionStorage.setItem("adminToken", data.token);

      if (data.admin) {
        sessionStorage.setItem("adminUser", JSON.stringify(data.admin));
      }

      navigate("/admin/dashboard");
    } catch (err) {
      if (err.response) {
        setError(
          err.response.data?.message || "Invalid email or password."
        );
      } else if (err.message === "Network Error") {
        setError("Unable to connect to the server. Please try again.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
       <div className="admin-login-brand">
  <img src={logo} alt="O Positive Health logo" className="admin-login-logo" />

  <h2>O POSITIVE HEALTH FOUNDATION</h2>
  <p className="admin-login-tagline">HOPE STARTS HERE</p>
</div>

        <div className="admin-login-heading">
          <span className="admin-login-eyebrow">ADMIN PORTAL</span>
          <h1>Welcome back</h1>
          <p>Sign in to manage healthcare enquiries and requests.</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-form-group">
            <label htmlFor="admin-email">Email address</label>

            <input
              id="admin-email"
              type="email"
              placeholder="Enter your admin email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="admin-password">Password</label>

            <div className="admin-password-wrapper">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="admin-login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-login-submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In to Dashboard"}
            {!loading && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <div className="admin-login-security">
          <span aria-hidden="true">🔒</span>
          <p>Secure access for authorized administrators only.</p>
        </div>

        <footer className="admin-login-footer">
          © {new Date().getFullYear()} O Positive Health
        </footer>
      </section>

      <aside className="admin-login-side">
        <div className="admin-side-content">
          <span className="admin-side-label">CARE THAT CONNECTS</span>

          <h2>
            Every enquiry is
            <br />
            an opportunity
            <br />
            to <span>make a difference.</span>
          </h2>

          <p>
            Coordinate care, respond to requests, and help people navigate
            their healthcare journey with compassion.
          </p>

          <div className="admin-side-bottom">
            <span className="admin-side-dot" />
            Compassionate care. Meaningful impact.
          </div>
        </div>

        <div className="admin-decor-circle admin-decor-circle-one" />
        <div className="admin-decor-circle admin-decor-circle-two" />
      </aside>
    </main>
  );
}

export default AdminLogin;
