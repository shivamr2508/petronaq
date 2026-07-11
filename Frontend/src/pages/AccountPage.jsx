import { logoutUser, getProfile } from "../services/authService";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaBook, FaBox, FaShieldAlt, FaFileAlt, FaHeadset, FaShip, FaUndo, FaTools } from "react-icons/fa";
import "../styles/account.css";

function AccountPage() {

  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {

    const fetchUser = async () => {
      try {
        const data = await getProfile();
        setUser(data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchUser();

  }, []);

  const handleLogout = () => {
    logoutUser();
    window.location.href = "/";
  };

  // Helper: returns "account-item active" when the given path matches current route
  const itemClass = (path) =>
    `account-item${location.pathname === path || location.pathname.startsWith(path + "/") ? " active" : ""}`;

  return (

    <div className="account-container">

      <h2 className="account-title">
        Hello {user?.name || "there"}
      </h2>

      <p className="account-subtitle">
        Welcome to your account
      </p>

      <div className="account-menu">

        {/* ── Orders ── */}
        <div
          className={itemClass("/orders")}
          onClick={() => navigate("/orders")}
        >
          <FaBox className="account-item-icon" />
          My Orders
        </div>

        {/* ── Blog — visible to ALL users on mobile/tablet ── */}
        <div
          className={itemClass("/blog")}
          onClick={() => navigate("/blog")}
        >
          <FaBook className="account-item-icon" />
          Blog
        </div>

        {/* ── Admin Panel — only for admin role ── */}
        {user?.role === "admin" && (
          <div
            className={itemClass("/admin")}
            onClick={() => navigate("/admin")}
          >
            <FaTools className="account-item-icon" />
            Admin Panel
          </div>
        )}

        {/* ── Policies ── */}
        <div
          className={itemClass("/privacy-policy")}
          onClick={() => navigate("/privacy-policy")}
        >
          <FaShieldAlt className="account-item-icon" />
          Privacy Policy
        </div>

        <div
          className={itemClass("/terms")}
          onClick={() => navigate("/terms")}
        >
          <FaFileAlt className="account-item-icon" />
          Terms &amp; Conditions
        </div>

        <div
          className={itemClass("/shipping-policy")}
          onClick={() => navigate("/shipping-policy")}
        >
          <FaShip className="account-item-icon" />
          Shipping Policy
        </div>

        <div
          className={itemClass("/return-policy")}
          onClick={() => navigate("/return-policy")}
        >
          <FaUndo className="account-item-icon" />
          Return Policy
        </div>

        <div
          className={itemClass("/contact")}
          onClick={() => navigate("/contact")}
        >
          <FaHeadset className="account-item-icon" />
          Help &amp; Contact Us
        </div>

        {/* ── Logout ── */}
        <div
          className="account-item logout"
          onClick={handleLogout}
        >
          Logout
        </div>

      </div>

    </div>

  );

}

export default AccountPage;