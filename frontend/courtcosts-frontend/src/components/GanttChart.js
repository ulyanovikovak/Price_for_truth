import React, { useEffect, useState } from "react";
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

const GanttChart = ({ spendings }) => {
  const [categoryMap, setCategoryMap] = useState({});

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
      });
  }, []);

  const tasks = spendings
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

  // Диапазон отображения — текущий год + 2 года вперёд
  const today = new Date();
  const startDate = new Date(today.getFullYear(), 0, 1); // Январь текущего года
  const endDate = new Date(today.getFullYear() + 3, 0, 1); // Январь через два года

  if (Object.keys(categoryMap).length === 0) return <div>Загрузка категорий...</div>;

  return (
    <div className="gantt-wrapper">
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
