import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AuthPage.css";

const AuthPage = ({ isRegister }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", email: "", password: "", password2: "" });
  const [error, setError] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isRegister && formData.password !== formData.password2) {
      setError("Passwords do not match");
      return;
    }

    try {
      const url = isRegister ? "http://localhost:8000/register/" : "http://localhost:8000/login/";
      const payload = isRegister
        ? { username: formData.username, email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Server response:", data); // Debug API response

      if (!response.ok || !data.access) {
        throw new Error("Authentication failed");
      }

      localStorage.setItem("token", data.access);
      console.log("Token saved:", localStorage.getItem("token")); // Debug token save

      navigate("/profile");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isRegister ? "Register" : "Login"}</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
        {isRegister && <input type="text" name="username" placeholder="Username" onChange={handleChange} required />}
          <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
          {isRegister && <input type="password" name="password2" placeholder="Confirm Password" onChange={handleChange} required />}
          <button type="submit">{isRegister ? "Register" : "Login"}</button>
        </form>
        <p>
          {isRegister ? "Already have an account?" : "Don't have an account?"} 
          <a href={isRegister ? "/login" : "/register"}>{isRegister ? "Login" : "Register"} here</a>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
