import React, { useEffect, useRef, useState } from "react";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import "../styles/Gantt.css";
import { ru } from "date-fns/locale";

// Генерация уникального цвета из строки
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 50%, 65%)`;
};

// Кастомный tooltip-компонент
const CustomTooltipContent = ({ task }) => {
  if (!task?.start || !task?.end) return null;

  const start = task.start.toLocaleDateString("ru-RU");
  const end = task.end.toLocaleDateString("ru-RU");
  const duration = Math.ceil((+task.end - +task.start) / (1000 * 60 * 60 * 24));

  return (
    <div className="custom-tooltip">
      <b>{task.name}</b>: {start} - {end}
      <div>Длительность: {duration} дн.</div>
      <div>Стоимость: {Number(task.price).toFixed(2)} ₽</div>
    </div>
  );
};

const GanttChart = ({ spendings, onSpendingClick }) => {
  const [categoryMap, setCategoryMap] = useState({});
  const [sortBy, setSortBy] = useState("dateStart");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const sortOptions = [
    { value: "dateStart", label: "По дате начала" },
    { value: "name", label: "По названию" },
    { value: "category", label: "По категории" },
    { value: "price", label: "По сумме траты" },
  ];

  useEffect(() => {
    fetch("http://localhost:8000/catalog/categories/")
      .then((res) => res.json())
      .then((data) => {
        const map = {};
        for (const cat of data.category) {
          map[cat.id] = {
            name: cat.name,
            color: stringToColor(cat.name),
          };
        }
        setCategoryMap(map);
        setSelectedCategories(data.category.map((c) => c.id));
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSpendings = spendings.filter((s) =>
    selectedCategories.includes(s.category)
  );

  const sortedSpendings = [...filteredSpendings].sort((a, b) => {
    if (sortBy === "dateStart") return new Date(a.dateStart) - new Date(b.dateStart);
    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
    if (sortBy === "category")
      return (categoryMap[a.category]?.name || "").localeCompare(
        categoryMap[b.category]?.name || ""
      );
    if (sortBy === "price") return (a.price || 0) - (b.price || 0);
    return 0;
  });

  const tasks = sortedSpendings
    .map((s, i) => {
      const start = new Date(s.dateStart);
      const end = new Date(s.dateEnd);
      if (!s.dateStart || !s.dateEnd || isNaN(start.getTime()) || isNaN(end.getTime())) {
        return null;
      }

      const categoryInfo = categoryMap[s.category] || { name: "Другое", color: "#ccc" };

      return {
        id: `${i}`,
        name: `${s.name?.trim() || `Трата ${i + 1}`} (${categoryInfo.name})`,
        start,
        end,
        type: "task",
        progress: 100,
        isDisabled: true,
        price: s.price,
        styles: {
          backgroundColor: categoryInfo.color,
          backgroundSelectedColor: categoryInfo.color,
          progressColor: categoryInfo.color,
          progressSelectedColor: categoryInfo.color,
        },
      };
    })
    .filter((t) => t && t.start && t.end);

  const today = new Date();
  const startDate = new Date(today.getFullYear(), 0, 1);
  const endDate = new Date(today.getFullYear() + 3, 0, 1);

  if (Object.keys(categoryMap).length === 0) return <div>Загрузка категорий...</div>;

  return (
    <div className="gantt-wrapper">
      <div className="sort-bar">
        <label htmlFor="sortBy">Сортировать:</label>
        <select
          id="sortBy"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="category-filter" ref={dropdownRef}>
          <div
            className="category-filter-toggle"
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            Категории ({selectedCategories.length})
            <span className="arrow">{dropdownOpen ? "▲" : "▼"}</span>
          </div>
          {dropdownOpen && (
            <div className="category-dropdown">
              <div className="category-actions">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCategories(Object.keys(categoryMap).map((id) => Number(id)))
                  }
                >
                  Выбрать все
                </button>
                <button type="button" onClick={() => setSelectedCategories([])}>
                  Очистить
                </button>
              </div>
              {Object.entries(categoryMap).map(([id, { name }]) => (
                <label key={id} className="category-option">
                  <input
                    type="checkbox"
                    value={id}
                    checked={selectedCategories.includes(Number(id))}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setSelectedCategories((prev) =>
                        e.target.checked
                          ? [...prev, value]
                          : prev.filter((catId) => catId !== value)
                      );
                    }}
                  />
                  {name}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="gantt-inner">
        {tasks.length > 0 ? (
          <Gantt
            tasks={tasks}
            viewMode={ViewMode.Month}
            listCellWidth="155px"
            TooltipContent={CustomTooltipContent}
            locale={ru}
            startDate={startDate}
            endDate={endDate}
            onSelect={(task) => onSpendingClick && onSpendingClick(task.id)}
          />
        ) : (
          <div style={{ padding: "1rem", fontSize: "16px" }}>
            Нет данных для отображения
          </div>
        )}
      </div>
    </div>
  );
};

export default GanttChart;
