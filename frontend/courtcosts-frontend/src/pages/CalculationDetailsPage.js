import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/CalculationDetailsPage.css";
import GanttChart from "../components/GanttChart";

const CalculationDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [calculation, setCalculation] = useState(null);
  const [spendings, setSpendings] = useState([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [categorySpendings, setCategorySpendings] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSpending, setEditingSpending] = useState(null);

  const [newSpending, setNewSpending] = useState({
    name: "",
    description: "",
    price: "",
    dateStart: "",
    dateEnd: "",
    category: "",
    withInflation: false,
  });

  useEffect(() => {
    fetch(`http://localhost:8000/calculation/${id}/details/`)
      .then((res) => res.json())
      .then((data) => {
        setCalculation(data.calculation);
        setSpendings(data.spendings);
      });
  }, [id]);

  useEffect(() => {
    if (showCatalog && categories.length === 0) {
      fetch("http://localhost:8000/catalog/categories/")
        .then((res) => res.json())
        .then((data) => {
          setCategories(data.category);
        });
    }
  }, [showCatalog, categories]);

  const handleCategoryClick = (categoryId) => {
    setSelectedCategoryId(categoryId);
    fetch(`http://localhost:8000/catalog/categories/${categoryId}/`)
      .then((res) => res.json())
      .then(setCategorySpendings);
  };

  const handleSpendingTemplateClick = async (spendingId) => {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8000/spendings/${spending.id}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
      if (!res.ok) throw new Error("Ошибка при получении шаблона");
      const spending = await res.json();

      const today = new Date().toISOString().slice(0, 10);
      setNewSpending({
        name: spending.name,
        description: spending.description || "",
        price: spending.price,
        dateStart: today,
        dateEnd: today,
        category: spending.category,
        withInflation: spending.withInflation || false,
      });

      setShowCreateForm(true);
    } catch (err) {
      console.error(err);
      alert("Не удалось загрузить трату из справочника");
    }
  };

  const handleSpendingClick = async (taskId) => {
    const spending = spendings[parseInt(taskId)];
    if (!spending) return;
  
    const token = localStorage.getItem("token");
    if (!token) return;
  
    try {
      // Гарантируем, что категории загружены
      if (categories.length === 0) {
        const catRes = await fetch("http://localhost:8000/catalog/categories/");
        const catData = await catRes.json();
        setCategories(catData.category);
      }
  
      // Загружаем трату
      const res = await fetch(`http://localhost:8000/spendings/${spending.id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!res.ok) throw new Error();
      const data = await res.json();
  
      // Приводим category к числу, чтобы совпало с value
      if (typeof data.category === "string") {
        data.category = parseInt(data.category);
      }
  
      setEditingSpending(data);
    } catch (err) {
      console.error(err);
      alert("Не удалось загрузить трату");
    }
  };
  

  const updateSpending = async () => {
    const token = localStorage.getItem("token");
    if (!token || !editingSpending?.id) return;

    try {
      const res = await fetch(`http://localhost:8000/spendings/${editingSpending.id}/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingSpending),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSpendings(spendings.map((s) => (s.id === updated.id ? updated : s)));
      setEditingSpending(null);
    } catch {
      alert("Не удалось обновить трату");
    }
  };

  const deleteSpending = async () => {
    const token = localStorage.getItem("token");
    if (!token || !editingSpending?.id) return;

    try {
      const res = await fetch(`http://localhost:8000/spendings/${editingSpending.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error();
      setSpendings(spendings.filter((s) => s.id !== editingSpending.id));
      setEditingSpending(null);
    } catch {
      alert("Не удалось удалить трату");
    }
  };

  const createSpending = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Вы не авторизованы");

    const payload = {
      ...newSpending,
      calculation: id,
    };

    try {
      const res = await fetch("http://localhost:8000/spending/create/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Ошибка при создании");
      const created = await res.json();
      setSpendings([...spendings, created]);
      setShowCreateForm(false);
      setNewSpending({
        name: "",
        description: "",
        price: "",
        dateStart: "",
        dateEnd: "",
        category: "",
        withInflation: false,
      });
    } catch (err) {
      console.error(err);
      alert("Не удалось создать трату");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  const goBackToProfile = () => {
    navigate("/profile");
  };

  return (
    <div className="calculation-container">
      <div className="top-bar">
        <div className="navigation-buttons">
          <button onClick={goBackToProfile}>← Назад в профиль</button>
          <button onClick={handleLogout}>Выйти</button>
        </div>

        <div className="catalog-wrapper">
          <button onClick={() => setShowCatalog(!showCatalog)} className="catalog-toggle">
            {showCatalog ? "Скрыть справочник" : "Открыть справочник"}
          </button>
        </div>
      </div>

      {showCatalog && (
        <div className="catalog-overlay" onClick={() => setShowCatalog(false)}>
          <div className="catalog-modal" onClick={(e) => e.stopPropagation()}>
            <h4>Категории:</h4>
            <ul className="category-list">
              {categories.map((cat) => (
                <li
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={selectedCategoryId === cat.id ? "active" : ""}
                >
                  {cat.name}
                </li>
              ))}
            </ul>

            <button className="create-spending-button" onClick={() => setShowCreateForm(true)}>
              ➕ Своя трата
            </button>

            {selectedCategoryId && (
              <div className="category-spendings">
                <h5>Траты по категории:</h5>
                {categorySpendings.length > 0 ? (
                  <ul>
                    {categorySpendings.map((s) => (
                      <li
                        key={s.id}
                        onClick={() => handleSpendingTemplateClick(s.id)}
                        style={{ cursor: "pointer" }}
                      >
                        {s.name || "Без названия"} — ₽{s.adjusted_price || s.price}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Нет данных по этой категории.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <h2 className="gantt-header">Расчёт: {calculation?.name || `#${id}`}</h2>

      {showCreateForm && (
        <div className="modal">
          <div className="modal-content">
            <h4>Добавить свою трату</h4>
            <input type="text" placeholder="Название" value={newSpending.name} onChange={(e) => setNewSpending({ ...newSpending, name: e.target.value })} />
            <input type="text" placeholder="Описание" value={newSpending.description} onChange={(e) => setNewSpending({ ...newSpending, description: e.target.value })} />
            <input type="number" placeholder="Сумма" value={newSpending.price} onChange={(e) => setNewSpending({ ...newSpending, price: e.target.value })} />
            <div className="date-range">
              <input type="date" value={newSpending.dateStart} onChange={(e) => setNewSpending({ ...newSpending, dateStart: e.target.value })} />
              <span>—</span>
              <input type="date" value={newSpending.dateEnd} onChange={(e) => setNewSpending({ ...newSpending, dateEnd: e.target.value })} />
            </div>
            <select value={newSpending.category} onChange={(e) => setNewSpending({ ...newSpending, category: parseInt(e.target.value) })}>
              <option value="">Выберите категорию</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <label>
              <input type="checkbox" checked={newSpending.withInflation} onChange={(e) => setNewSpending({ ...newSpending, withInflation: e.target.checked })} />
              Учитывать инфляцию
            </label>
            <div className="modal-buttons">
              <button onClick={createSpending} className="save-button">Создать</button>
              <button onClick={() => setShowCreateForm(false)} className="cancel-button">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {editingSpending && (
        <div className="modal">
          <div className="modal-content">
            <h4>Редактировать трату</h4>
            <input type="text" value={editingSpending.name} onChange={(e) => setEditingSpending({ ...editingSpending, name: e.target.value })} />
            <input type="text" value={editingSpending.description} onChange={(e) => setEditingSpending({ ...editingSpending, description: e.target.value })} />
            <input type="number" value={editingSpending.price} onChange={(e) => setEditingSpending({ ...editingSpending, price: e.target.value })} />
            <div className="date-range">
              <input type="date" value={editingSpending.dateStart} onChange={(e) => setEditingSpending({ ...editingSpending, dateStart: e.target.value })} />
              <span>—</span>
              <input type="date" value={editingSpending.dateEnd} onChange={(e) => setEditingSpending({ ...editingSpending, dateEnd: e.target.value })} />
            </div>
            <select
                value={editingSpending.category ?? ""}
                onChange={(e) =>
                    setEditingSpending({
                    ...editingSpending,
                    category: parseInt(e.target.value),
                    })
                }
                >
                <option value="">Выберите категорию</option>
                {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                    {c.name}
                    </option>
                ))}
                </select>

            <label>
              <input type="checkbox" checked={editingSpending.withInflation} onChange={(e) => setEditingSpending({ ...editingSpending, withInflation: e.target.checked })} />
              Учитывать инфляцию
            </label>
            <div className="modal-buttons">
              <button onClick={updateSpending} className="save-button">Сохранить</button>
              <button onClick={deleteSpending} className="cancel-button">Удалить</button>
              <button onClick={() => setEditingSpending(null)} className="cancel-button">Отмена</button>
            </div>
          </div>
        </div>
      )}

      <h3>Диаграмма трат</h3>
      <GanttChart spendings={spendings} onSpendingClick={handleSpendingClick} />
      <div className="gantt-total">Сумма иска: ₽{calculation?.amount}</div>
    </div>
  );
};

export default CalculationDetailsPage;
