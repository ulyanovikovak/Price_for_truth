import React, { useEffect, useState } from "react";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import "../styles/Gantt.css";

// Генерация уникального цвета из строки
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 50%, 65%)`;
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
    .filter((s) => s.dateStart && s.dateEnd)
    .map((s, i) => {
      const start = new Date(s.dateStart);
      const end = new Date(s.dateEnd);
      if (isNaN(start) || isNaN(end)) return null;

      const categoryInfo = categoryMap[s.category] || { name: "Другое", color: "#ccc" };

      return {
        id: `${i}`,
        name: `${s.name?.trim() || `Трата ${i + 1}`} (${categoryInfo.name})`,
        start,
        end,
        type: "task",
        progress: 100,
        isDisabled: true,
        styles: {
          backgroundColor: categoryInfo.color,
          backgroundSelectedColor: categoryInfo.color,
          progressColor: categoryInfo.color,
          progressSelectedColor: categoryInfo.color,
        },
      };
    })
    .filter(Boolean);

  if (Object.keys(categoryMap).length === 0) return <div>Загрузка категорий...</div>;

  return (
    <div className="gantt-wrapper">
      <div className="gantt-inner">
        <Gantt tasks={tasks} viewMode={ViewMode.Month} listCellWidth="155px" />
      </div>
    </div>
  );
};

export default GanttChart;
