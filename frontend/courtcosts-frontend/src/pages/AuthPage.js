import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/AuthPage.css";

const AuthPage = ({ isRegister }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (!name) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (isRegister && formData.password !== formData.password2) {
      setError("Пароли не совпадают");
      setLoading(false);
      return;
    }

    try {
      const url = isRegister
        ? "http://localhost:8000/register/"
        : "http://localhost:8000/login/";
      const payload = isRegister
        ? {
            username: formData.username,
            email: formData.email,
            password: formData.password,
          }
        : {
            email: formData.email,
            password: formData.password,
          };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data?.detail || "Ошибка регистрации";
        throw new Error(msg);
      }

      if (isRegister) {
        setSuccessMessage("Регистрация выполнена успешно");
        setTimeout(() => {
          setSuccessMessage(null);
          navigate("/login");
        }, 1500);
        return;
      }

      // Вход
      if (!data.access) {
        throw new Error("Ошибка входа: токен не получен");
      }

      localStorage.setItem("token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      const userData = parseJwt(data.access);
      if (userData?.is_staff) {
        navigate("/admin");
      } else {
        navigate("/profile");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isRegister ? "Регистрация" : "Вход"}</h2>
        {error && <p className="error">{error}</p>}
        {successMessage && <p className="success">{successMessage}</p>}
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <input
              type="text"
              name="username"
              placeholder="Username"
              onChange={handleChange}
              required
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Почта"
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Пароль"
            onChange={handleChange}
            required
          />
          {isRegister && (
            <input
              type="password"
              name="password2"
              placeholder="Повторите пароль"
              onChange={handleChange}
              required
            />
          )}
          <button type="submit" disabled={loading}>
            {loading ? "Загрузка..." : isRegister ? "Зарегистрироваться" : "Войти"}
          </button>
        </form>
        <p>
          {isRegister ? "Уже зарегистрированы?" : "Еще не зарегистрированы?"}{" "}
          <Link to={isRegister ? "/login" : "/register"}>
            {isRegister ? "Войти" : "Зарегистрироваться"} здесь
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
