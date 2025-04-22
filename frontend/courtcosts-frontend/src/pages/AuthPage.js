import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (isRegister && formData.password !== formData.password2) {
      setError("Пароли не совпадают");
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
        const msg = data?.detail || "Ошибка запроса";
        throw new Error(msg);
      }

      if (isRegister) {
        // Показываем сообщение и через 1.5 сек перенаправляем на login
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
      navigate("/profile");
    } catch (err) {
      setError(err.message);
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
          <button type="submit">
            {isRegister ? "Зарегистрироваться" : "Войти"}
          </button>
        </form>
        <p>
          {isRegister
            ? "Уже зарегистрированы?"
            : "Еще не зарегистрированы?"}{" "}
          <a href={isRegister ? "/login" : "/register"}>
            {isRegister ? "Войти" : "Зарегистрироваться"} здесь
          </a>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
