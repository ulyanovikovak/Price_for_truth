import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Customized,
  Layer,
} from "recharts";
import "../styles/CalculationDetailsPage.css";

const categoryColors = {
  "Госпошлина": "#8884d8",
  "Экспертиза": "#82ca9d",
  "Почта": "#ffc658",
  "Представительство": "#d08484",
  "Другое": "#a4de6c",
};

const renderGanttBars = ({ xAxisMap, yAxisMap, data }) => {
  const xAxis = xAxisMap[Object.keys(xAxisMap)[0]];
  const yAxis = yAxisMap[Object.keys(yAxisMap)[0]];

  if (!xAxis || !yAxis || !data) return null;

  return (
    <Layer>
      {data.map((entry, index) => {
        const x1 = xAxis.scale(entry.start);
        const x2 = xAxis.scale(entry.end);
        const y = yAxis.scale(entry.name);
        const height = 20;

        if ([x1, x2, y].some((v) => isNaN(v))) return null;

        const barY = y + (yAxis.bandwidth ? (yAxis.bandwidth() - height) / 2 : 0);
        const width = Math.max(x2 - x1, 2);
        const color = categoryColors[entry.category] || "#ccc";

        return (
          <rect
            key={index}
            x={x1}
            y={barY}
            width={width}
            height={height}
            fill={color}
            rx={4}
          />
        );
      })}
    </Layer>
  );
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
      const res = await fetch(`http://localhost:8000/catalog/price/${spendingId}/`);
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

  const ganttData = spendings
    .filter((s) => s.dateStart && s.dateEnd)
    .map((s, i) => {
      const start = new Date(s.dateStart).getTime();
      const end = new Date(s.dateEnd).getTime();
      return {
        name: s.name?.trim() || `Трата ${i + 1}`,
        start,
        end,
        category: s.category || "Другое",
      };
    });

  const minDate = ganttData.length ? Math.min(...ganttData.map((d) => d.start)) : Date.now();
  const maxDate = ganttData.length ? Math.max(...ganttData.map((d) => d.end)) : Date.now() + 86400000;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getDate()} ${date.toLocaleString("ru", { month: "short" })}`;
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

      <h3>Диаграмма трат</h3>
      <div className="gantt-chart-wrapper">
        <ResponsiveContainer width={1400} height={Math.max(300, ganttData.length * 50)}>
          <ComposedChart
            data={ganttData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 200, bottom: 20 }}
          >
            <XAxis
              type="number"
              domain={[minDate, maxDate]}
              tickFormatter={formatDate}
              scale="time"
            />
            <YAxis type="category" dataKey="name" width={180} />
            <Tooltip
              formatter={(value, name, props) => {
                const start = new Date(props.payload.start);
                const end = new Date(props.payload.end);
                return [`${start.toLocaleDateString()} — ${end.toLocaleDateString()}`, "Период"];
              }}
            />
            <Customized component={renderGanttBars} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="gantt-total">Сумма иска: ₽{calculation?.amount}</div>
    </div>
  );
};

export default CalculationDetailsPage;
