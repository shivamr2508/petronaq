import { logoutUser, getProfile } from "../services/authService";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/account.css";

function AccountPage() {

  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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

  return (

    <div className="account-container">

      <h2 className="account-title">
        Hello {user?.name}
      </h2>

      <p className="account-subtitle">
        Welcome to your account
      </p>

      <div className="account-menu">

        <div
          className="account-item"
          onClick={() => navigate("/privacy-policy")}
        >
          Privacy Policy
        </div>

        <div
          className="account-item"
          onClick={() => navigate("/terms")}
        >
          Terms & Conditions
        </div>

        <div
          className="account-item"
          onClick={() => navigate("/contact")}
        >
          Help & Contact Us
        </div>

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