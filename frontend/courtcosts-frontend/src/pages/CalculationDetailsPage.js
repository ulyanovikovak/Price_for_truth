import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import "../styles/CalculationDetailsPage.css";

const categoryColors = {
  "Госпошлина": "#8884d8",
  "Экспертиза": "#82ca9d",
  "Почта": "#ffc658",
  "Представительство": "#d08484",
  "Другое": "#a4de6c",
};

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
  const [newSpending, setNewSpending] = useState({
    name: "",
    description: "",
    price: "",
    date: "",
    category: "",
    withInflation: false,
  });
  const [spendingFromCatalog, setSpendingFromCatalog] = useState(null);

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
      const res = await fetch(`http://localhost:8000/price/${spendingId}/`);
      if (!res.ok) throw new Error("Ошибка при получении шаблона");
      const spending = await res.json();

      setNewSpending({
        name: spending.name,
        description: spending.description || "",
        price: spending.price,
        date: new Date().toISOString().slice(0, 10),
        category: spending.category,
        withInflation: spending.withInflation || false,
      });

      setSpendingFromCatalog(spending);
      setShowCreateForm(true);
    } catch (err) {
      console.error(err);
      alert("Не удалось загрузить трату из справочника");
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
        date: "",
        category: "",
        withInflation: false,
      });
    } catch (err) {
      console.error(err);
      alert("Не удалось создать трату");
    }
  };

  const ganttData = spendings.map((s, i) => ({
    name: s.name || `Трата ${i + 1}`,
    start: new Date(s.startDate || calculation.date).getTime(),
    end: new Date(s.endDate || s.date || calculation.date).getTime(),
    category: s.category || "Другое",
    duration: 1,
    adjusted_price: s.adjusted_price,
  }));

  return (
    <div className="calculation-container">
      <div className="navigation-buttons">
        <button onClick={goBackToProfile}>← Назад в профиль</button>
        <button onClick={handleLogout} style={{ marginLeft: "10px" }}>Выйти</button>
      </div>

      <h2 className="gantt-header">Расчёт: {calculation?.name || `#${id}`}</h2>

      <button onClick={() => setShowCatalog(!showCatalog)} className="catalog-toggle">
        {showCatalog ? "Скрыть справочник" : "Открыть справочник"}
      </button>

      {showCatalog && (
        <div className="catalog-dropdown">
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
      )}

      {showCreateForm && (
        <div className="modal">
          <div className="modal-content">
            <h4>Добавить свою трату</h4>
            <input
              type="text"
              placeholder="Название"
              value={newSpending.name}
              onChange={(e) =>
                setNewSpending({ ...newSpending, name: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Описание"
              value={newSpending.description}
              onChange={(e) =>
                setNewSpending({ ...newSpending, description: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Сумма"
              value={newSpending.price}
              onChange={(e) =>
                setNewSpending({ ...newSpending, price: e.target.value })
              }
            />
            <input
              type="date"
              value={newSpending.date}
              onChange={(e) =>
                setNewSpending({ ...newSpending, date: e.target.value })
              }
            />
            <select
                value={newSpending.category}
                onChange={(e) =>
                setNewSpending({ ...newSpending, category: parseInt(e.target.value) })
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
              <input
                type="checkbox"
                checked={newSpending.withInflation}
                onChange={(e) =>
                  setNewSpending({
                    ...newSpending,
                    withInflation: e.target.checked,
                  })
                }
              />
              Учитывать инфляцию
            </label>
            <div className="modal-buttons">
              <button onClick={createSpending} className="save-button">
                Создать
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="cancel-button"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <h3>Диаграмма трат</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={ganttData} layout="vertical">
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={150} />
          <Tooltip formatter={(value, name) => [`₽${value}`, name]} />
          {Object.entries(categoryColors).map(([category, color]) => (
            <Bar
              key={category}
              dataKey={(entry) =>
                entry.category === category ? entry.adjusted_price : 0
              }
              fill={color}
              stackId="1"
              name={category}
            >
              <LabelList
                dataKey="adjusted_price"
                position="right"
                formatter={(v) => `₽${v}`}
              />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>

      <div className="gantt-total">Сумма иска: ₽{calculation?.amount}</div>
    </div>
  );
};

export default CalculationDetailsPage;
