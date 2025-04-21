import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProfilePage.css";

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [calculations, setCalculations] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [newCalculation, setNewCalculation] = useState({
      name: "",
      description: "",
      sum: "",
    });
    const [editedProfile, setEditedProfile] = useState({
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
    });
  

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found, redirecting to login");
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
        try {
          const response = await fetch("http://localhost:8000/profile/", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });
          if (!response.ok) throw new Error("Failed to fetch profile");
          const data = await response.json();
          setUser(data);
          setCalculations(data.calculations);
          setEditedProfile({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone_number: data.phone_number || "",
          });
        } catch (err) {
          console.error("Error loading profile:", err);
          navigate("/login");
        }
      };
  
      fetchProfile();
    }, [navigate]);
  
    const updateProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Вы не авторизованы!");
        navigate("/login");
        return;
      }
  
      try {
        const response = await fetch("http://localhost:8000/update-profile/", {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editedProfile),
        });
  
        if (!response.ok) throw new Error("Failed to update profile");
        const updatedUser = await response.json();
        setUser(updatedUser);
        setShowEditForm(false);
      } catch (err) {
        console.error("Error updating profile:", err);
      }
    };

  const logout = async () => {
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refresh_token");
  
    if (!refreshToken) {
      console.error("Ошибка: отсутствует refresh_token.");
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      navigate("/login");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:8000/logout/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
  
      if (!response.ok) {
        console.error("Ошибка выхода:", await response.json());
        return;
      }
  
      console.log("Выход выполнен успешно.");
  
      // Только после успешного запроса удаляем токены
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
  
      // Навигация после завершения запроса
      navigate("/login");
  
    } catch (err) {
      console.error("Ошибка при выходе:", err);
    }
  };
  
  

  const createCalculation = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Вы не авторизованы!");
      navigate("/login");
      return;
    }

    if (!newCalculation.name || !newCalculation.description || !newCalculation.sum) {
      alert("Заполните все поля!");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/calculations/create/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCalculation),
      });

      if (response.status === 403) {
        alert("Ошибка 403: Доступ запрещен. Проверьте авторизацию.");
        return;
      }

      if (!response.ok) throw new Error("Failed to create calculation");
      const createdCalculation = await response.json();
      setCalculations([...calculations, createdCalculation]);
      setShowCreateForm(false);
      setNewCalculation({ name: "", description: "", sum: "" });
    } catch (err) {
      console.error("Error creating calculation:", err);
    }
  };

  const filteredCalculations = calculations.filter((calc) =>
    calc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="profile-container">
      <div className="topbar">
  <div className="topbar-inner">
    <h2 className="topbar-title">Профиль</h2>
    <button onClick={logout} className="logout-button">Выйти</button>
  </div>
</div>

      <div className="profile-header">
        {user ? (
          <>
            <h2>{user.first_name} {user.last_name}</h2>
            <p>Имя пользователя: {user.username}</p>
            <p>Email: {user.email}</p>
            <p>Телефон: {user.phone_number || "Не указан"}</p>
            <button onClick={() => setShowEditForm(true)} className="edit-profile-button">Редактировать</button>
          </>
        ) : (
          <p>Загрузка...</p>
        )}
      </div>

      {showEditForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Редактировать профиль</h3>
            <input type="text" placeholder="Имя" value={editedProfile.first_name} onChange={(e) => setEditedProfile({...editedProfile, first_name: e.target.value})} />
            <input type="text" placeholder="Фамилия" value={editedProfile.last_name} onChange={(e) => setEditedProfile({...editedProfile, last_name: e.target.value})} />
            <input type="email" placeholder="Email" value={editedProfile.email} onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})} />
            <input type="text" placeholder="Телефон" value={editedProfile.phone_number} onChange={(e) => setEditedProfile({...editedProfile, phone_number: e.target.value})} />
            <div className="modal-buttons">
              <button onClick={updateProfile} className="save-button">Сохранить</button>
              <button onClick={() => setShowEditForm(false)} className="cancel-button">Отмена</button>
            </div>
          </div>
        </div>
      )}
      <div className="calculations-section">
        <h3>Ваши расчеты</h3>
        <input
          type="text"
          placeholder="Поиск расчетов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button onClick={() => setShowCreateForm(true)} className="create-button">Создать расчет</button>

        {showCreateForm && (
          <div className="modal">
            <div className="modal-content">
              <h3>Создать новый расчет</h3>
              <input type="text" placeholder="Название" value={newCalculation.name} onChange={(e) => setNewCalculation({...newCalculation, name: e.target.value})} />
              <input type="text" placeholder="Описание" value={newCalculation.description} onChange={(e) => setNewCalculation({...newCalculation, description: e.target.value})} />
              <input type="number" placeholder="Сумма" value={newCalculation.sum} onChange={(e) => setNewCalculation({...newCalculation, sum: e.target.value})} />
              <div className="modal-buttons">
                <button onClick={createCalculation} className="create-button">Создать</button>
                <button onClick={() => setShowCreateForm(false)} className="cancel-button">Отмена</button>
              </div>
            </div>
          </div>
        )}

        <div className="calculations-list">
          {filteredCalculations.length > 0 ? (
            filteredCalculations.map((calc) => (
              // <div key={calc.id} className="calculation-card">
              //   <h4>{calc.name}</h4>
              //   <p>{calc.description}</p>
              //   <p>Сумма: {calc.sum}</p>
              // </div>

              <div
                key={calc.id}
                className="calculation-card"
                onClick={() => navigate(`/calculation/${calc.id}`)}
                style={{ cursor: "pointer" }}
              >
                <h4>{calc.name}</h4>
                <p>{calc.description}</p>
                <p>Сумма: {calc.sum}</p>
              </div>
            ))
          ) : (
            <p>Нет расчетов</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;