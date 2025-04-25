import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CategoriesAdmin from '../components/CategoriesAdmin';
import SpendingsAdmin from '../components/SpendingsAdmin';
import InflationAdmin from '../components/InflationAdmin';
import "../styles/Admin.css";

const AdminPage = () => {
  const [tab, setTab] = useState('categories');
  const navigate = useNavigate();

  const logout = async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) return;

    try {
      await fetch("http://localhost:8000/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh }),
      });
    } catch (err) {
      console.error("Logout failed", err);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  return (
    <div className="admin-panel">
      <div className="admin-topbar">
        <h1>Администратор</h1>
        <button className="logout-button" onClick={logout}>Выйти</button>
      </div>

      <h2>Редактирование справочников</h2>
      <div className="tabs">
        <button onClick={() => setTab('categories')}>Категории</button>
        <button onClick={() => setTab('spendings')}>Траты</button>
        <button onClick={() => setTab('inflation')}>Инфляция</button>
      </div>

      <div className="tab-content">
        {tab === 'categories' && <CategoriesAdmin />}
        {tab === 'spendings' && <SpendingsAdmin />}
        {tab === 'inflation' && <InflationAdmin />}
      </div>
    </div>
  );
};

export default AdminPage;
