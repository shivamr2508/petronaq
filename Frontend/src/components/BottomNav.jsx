import { Link, useLocation } from "react-router-dom";
import { FaHome, FaShoppingCart, FaHeart, FaBox, FaUser } from "react-icons/fa";
import "../styles/bottomNav.css";

function BottomNav() {

  const location = useLocation();

  const token = localStorage.getItem("token");

  const accountRoute = token ? "/account" : "/login";

  return (

    <nav className="bottom-nav">

      <Link
        to="/"
        className={location.pathname === "/" ? "active" : ""}
      >
        <FaHome />
        <span>Home</span>
      </Link>

      <Link
        to="/cart"
        className={location.pathname === "/cart" ? "active" : ""}
      >
        <FaShoppingCart />
        <span>Cart</span>
      </Link>

      <Link
        to="/wishlist"
        className={location.pathname === "/wishlist" ? "active" : ""}
      >
        <FaHeart />
        <span>Wishlist</span>
      </Link>

      <Link
        to="/orders"
        className={location.pathname === "/orders" ? "active" : ""}
      >
        <FaBox />
        <span>Orders</span>
      </Link>

      <Link
        to={accountRoute}
        className={location.pathname === "/account" ? "active" : ""}
      >
        <FaUser />
        <span>Account</span>
      </Link>

    </nav>

  );

}

export default BottomNav;