import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./styles/theme.css";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")).render(
   <GoogleOAuthProvider clientId="204535016544-buqlh7p8lfmaua80n8mfhbs2ke61dr68.apps.googleusercontent.com">

    <BrowserRouter>
      <App />
    </BrowserRouter>

  </GoogleOAuthProvider>
);