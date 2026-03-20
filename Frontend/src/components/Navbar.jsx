// import { Link } from "react-router-dom";
// import { useState } from "react";
// import "../styles/navbar.css";
// import { logoutUser } from "../services/authService";
// import { useEffect } from "react";
// import { getProfile } from "../services/authService";
// import { useNavigate } from "react-router-dom";

// function Navbar() {

//   const [menuOpen, setMenuOpen] = useState(false);

//   const navigate = useNavigate();

// const [search, setSearch] = useState("");

// const handleSearch = (e) => {

//   if (e.key === "Enter") {

//     navigate(`/products?keyword=${search}`);

//   }

// };

//   const [user, setUser] = useState(null);

// const token = localStorage.getItem("token");

// useEffect(() => {

//   if (token) {

//     fetchProfile();

//   }

// }, []);

// const fetchProfile = async () => {

//   try {

//     const data = await getProfile();

//     setUser(data);

//   } catch {

//     console.log("Not logged in");

//   }

// };

// const handleLogout = () => {

//   logoutUser();

//   window.location.href = "/";

// };

//   return (
//     <nav className="navbar">

//       <div className="container navbar-container">

//         {/* Logo */}
//         <Link to="/" className="logo">
//           PetRonaq
//         </Link>

//         {/* Search */}
//        <input
//   type="text"
//   placeholder="Search products..."
//   className="search"
//   value={search}
//   onChange={(e) => setSearch(e.target.value)}
//   onKeyDown={handleSearch}
// />

//         {/* Desktop Menu */}

//         <div className="nav-links">

//   <Link to="/wishlist">Wishlist</Link>

//   <Link to="/cart">Cart</Link>

//   <Link to="/orders">Orders</Link>

//     {user ? (

//   <>
//     <span className="user-name">
//       Hello, {user.name}
//     </span>

//     <button
//       onClick={handleLogout}
//       className="logout-btn"
//     >
//       Logout
//     </button>
//   </>

// ) : (

//   <>
//     <Link to="/login">Login</Link>
//     <Link to="/register">Register</Link>
//   </>

// )}

// </div>

//         {/* Mobile Menu Button */}
//         <button
//           className="menu-btn"
//           onClick={() => setMenuOpen(!menuOpen)}
//         >
//           ☰
//         </button>

//       </div>

//       {/* Mobile Menu */}

//       {menuOpen && (
//   <div className="mobile-menu">

//     {/* Mobile Search */}
//     <input
//       type="text"
//       placeholder="Search products..."
//       className="mobile-search"
//       value={search}
//       onChange={(e) => setSearch(e.target.value)}
//       onKeyDown={handleSearch}
//     />

//     <Link to="/wishlist">Wishlist</Link>

//     <Link to="/cart">Cart</Link>

//     <Link to="/orders">Orders</Link>

//     {user ? (

//       <button
//         onClick={handleLogout}
//         className="logout-btn"
//       >
//         Logout
//       </button>

//     ) : (

//       <>
//         <Link to="/login">Login</Link>
//         <Link to="/register">Register</Link>
//       </>

//     )}

//   </div>
// )}

//     </nav>
//   );

// }

// export default Navbar;




import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/navbar.css";
import { logoutUser, getProfile } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { FaUser, FaHome, FaShoppingCart, FaHeart, FaBox, FaSearch} from "react-icons/fa";

function Navbar() {

  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [showStickySearch, setShowStickySearch] = useState(false);

  const token = localStorage.getItem("token");

  const accountRoute = token ? "/account" : "/login";

  useEffect(() => {
    if (token) fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      setUser(data);
    } catch {
      console.log("Not logged in");
    }
  };

  useEffect(() => {

const handleScroll = () => {

if(window.scrollY > 120){
setShowStickySearch(true);
}else{
setShowStickySearch(false);
}

};

window.addEventListener("scroll", handleScroll);

return () => window.removeEventListener("scroll", handleScroll);

}, []);

  // const handleSearch = (e) => {
  //   if (e.key === "Enter") {
  //     navigate(`/products?keyword=${search}`);
  //   }
  // };

  const handleSearch = (e) => {
  if (e.key === "Enter") {
    triggerSearch();
  }
};

const triggerSearch = () => {
  if (!search.trim()) return;
  navigate(`/products?keyword=${search}`);
  setSearch(""); 
};

useEffect(() => {

  if (location.pathname === "/") {
    setSearch("");
  }

}, [location.pathname]);

  const handleLogout = () => {
    logoutUser();
    window.location.href = "/";
  };

  return (
    
      <header className="navbar">

{/* MOBILE NAVBAR */}

<div className={`mobile-navbar ${showStickySearch ? "navbar-sticky" : ""}`}>

  <div className="mobile-top">

    <Link to="/" className="logo">
      PetRonaq
    </Link>

    {user ? (
      <span>Hello, {user.name}</span>
    ) : (
      <Link to="/register" className="signup">Sign Up</Link>
    )}

  </div>

  <div className="search-box">
  <input
    type="text"
    placeholder="Search for products..."
    className="mobile-search"
    value={search}
    onChange={(e)=>setSearch(e.target.value)}
    onKeyDown={handleSearch}
  />
    <button className="search-btn" onClick={triggerSearch}>
    <FaSearch/>
  </button>
  </div>

  {/* <div className="mobile-address">
    📍 Deliver to <strong>123 Main St</strong>
  </div> */}

</div>


{/* DESKTOP NAVBAR (keep your current one) */}

<div className="desktop-navbar">

  <Link to="/" className="logo">
    PetRonaq
  </Link>

    <div className="desktop search-box">
  <input
    type="text"
    placeholder="Search for products..."
    className="desktop-search"
    value={search}
    onChange={(e)=>setSearch(e.target.value)}
    onKeyDown={handleSearch}
  />
    <button className="search-btn" onClick={triggerSearch}>
    <FaSearch/>
  </button>
  </div>

  <div className="desktop-links">

    
  <Link to="/">
    <FaHome />
    <span>Home</span>
  </Link>

  <Link to="/cart">
    <FaShoppingCart />
    <span>Cart</span>
  </Link>

  <Link to="/wishlist">
    <FaHeart />
    <span>Wishlist</span>
  </Link>

  <Link to="/orders">
    <FaBox />
    <span>Orders</span>
  </Link>


  </div>

    <div className="desktop-user">

  <Link to={accountRoute} className="profile-icon">
    <FaUser />
  </Link>

  </div>

</div>

</header>

  );
}

export default Navbar;