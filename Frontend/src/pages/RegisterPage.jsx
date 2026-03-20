// import { useState } from "react";
// import { registerUser } from "../services/authService";
// import { GoogleLogin } from "@react-oauth/google";
// import axios from "axios";
// import "../styles/auth.css";

// function RegisterPage(){

// const [name,setName] = useState("");
// const [email,setEmail] = useState("");
// const [password,setPassword] = useState("");
// const [gender,setGender] = useState("");

// const handleRegister = async (e)=>{

// e.preventDefault();

// try{

// await registerUser(name,email,password,gender);

// alert("Account created");

// window.location.href="/";

// }catch{

// alert("Signup failed");

// }

// };

// const handleGoogleSuccess = async (credentialResponse)=>{

// try{

// const res = await axios.post(
// "http://localhost:5000/api/auth/google-login",
// { token: credentialResponse.credential }
// );

// localStorage.setItem("token",res.data.token);

// window.location.href="/";

// }catch{

// alert("Google signup failed");

// }

// };


import { useState } from "react";
import { registerUser } from "../services/authService";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import "../styles/auth.css";

// ✅ toast helpers
import { showLoading, updateSuccess, updateError } from "../utils/toast";

function RegisterPage(){

const [name,setName] = useState("");
const [email,setEmail] = useState("");
const [password,setPassword] = useState("");
const [gender,setGender] = useState("");

const handleRegister = async (e)=>{

e.preventDefault();

// 🔥 loading toast
const t = showLoading("Creating account...");

try{

await registerUser(name,email,password,gender);

// ✅ success
updateSuccess("Account created successfully", t);

setTimeout(()=>{
window.location.href="/";
},1200);

}catch{

// ❌ error
updateError("Signup failed. Try again.", t);

}

};

const handleGoogleSuccess = async (credentialResponse)=>{

// 🔥 loading toast
const t = showLoading("Signing up with Google...");

try{

const res = await axios.post(
"http://localhost:5000/api/auth/google-login",
{ token: credentialResponse.credential }
);

localStorage.setItem("token",res.data.token);

// ✅ success
updateSuccess("Account created successfully", t);

setTimeout(()=>{
window.location.href="/";
},1200);

}catch{

// ❌ error
updateError("Google signup failed", t);

}

};

  return(

<div className="auth-page">

<div className="auth-card">

<img
src="/Heropet1.png"
alt="pets"
className="auth-pets"
/>

<h2 className="auth-title">Sign Up</h2>
<p className="auth-subtitle">Create your account</p>

<form onSubmit={handleRegister}>

<input
type="text"
placeholder="Name"
onChange={(e)=>setName(e.target.value)}
required
/>

<input
type="email"
placeholder="Email"
onChange={(e)=>setEmail(e.target.value)}
required
/>

<select
className="auth-select"
onChange={(e)=>setGender(e.target.value)}
>

<option value="">Gender</option>
<option>Male</option>
<option>Female</option>
<option>Other</option>

</select>

<input
type="password"
placeholder="Password"
onChange={(e)=>setPassword(e.target.value)}
required
/>

<button className="login-btn">
Create Account
</button>

</form>

<div className="divider">
<span>OR</span>
</div>

<div className="google-container">

{/* <GoogleLogin
onSuccess={handleGoogleSuccess}
onError={()=>alert("Google signup failed")}
/> */}

<div className="google-btn-wrapper">
  <GoogleLogin
    onSuccess={handleGoogleSuccess}
    onError={() => alert("Google login failed")}
    theme="outline"
    size="large"
    text="signin_with"
    shape="rectangular"
  />
</div>
</div>

<p className="auth-link">

Already have an account?
<a href="/login"> Login</a>

</p>

</div>

</div>

);

}

export default RegisterPage;