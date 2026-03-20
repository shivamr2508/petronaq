import { useState } from "react";
import { loginUser } from "../services/authService";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import "../styles/auth.css";

import { showSuccess, showError, showLoading, updateSuccess, updateError } from "../utils/toast";

function LoginPage() {

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleLogin = async (e)=>{
    e.preventDefault();
      const t = showLoading("Logging in..."); // ✅ ADD THIS

    try{
      await loginUser(email,password);
        updateSuccess("Login successful", t);
         setTimeout(()=>{
        window.location.href="/";
      }, 800);
    }catch{
      updateError("Invalid credentials", t);
    }
  };

  const handleGoogleSuccess = async (credentialResponse)=>{
     const t = showLoading("Signing in with Google...");
    try{

      const res = await axios.post(
        "/api/auth/google-login",
        { token: credentialResponse.credential }
      );

      localStorage.setItem("token",res.data.token);

        // ✅ success
      updateSuccess("Login successful", t);

      setTimeout(()=>{
        window.location.href="/";
      }, 800);

    }catch{
      updateError("Google login failed", t);
    }
  };

 return (

<div className="auth-page">

<div className="auth-card">

<img
src="/Heropet1.png"
alt="pets"
className="auth-pets"
/>

{/* <h1 className="brand">PetRonaq</h1> */}

{/* <h2 className="welcome">Welcome Back!</h2> */}

<h2 className="auth-title">Login</h2>
<p className="auth-subtitle">Login to your account</p>


<form onSubmit={handleLogin}>

<input
type="email"
placeholder="Email or Phone"
onChange={(e)=>setEmail(e.target.value)}
required
/>

<input
type="password"
placeholder="Password"
onChange={(e)=>setPassword(e.target.value)}
required
/>

<button className="login-btn">
Login
</button>

</form>

<div className="divider">
<span>OR</span>
</div>

<div className="google-container">

{/* <GoogleLogin
onSuccess={handleGoogleSuccess}
onError={()=>alert("Google login failed")}
/> */}

<div className="google-btn-wrapper">
  <GoogleLogin
    onSuccess={handleGoogleSuccess}
    onError={() => alert("Google login failed")}
    theme="outline"
    size="large"
    text="continue_with"
    shape="rectangular"
  />
</div>

</div>

<p className="auth-link">
Don't have an account? <a href="/register">Sign Up</a>
</p>

</div>

</div>

)
}

export default LoginPage;