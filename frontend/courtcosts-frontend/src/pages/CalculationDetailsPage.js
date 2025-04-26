import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/CalculationDetailsPage.css";
import GanttChart from "../components/GanttChart";


import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.vfs;


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
  const [isEditingCalc, setIsEditingCalc] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);



  const [editedCalculation, setEditedCalculation] = useState({
    name: "",
    description: "",
    sum: "",
  });


  const [newSpending, setNewSpending] = useState({
    name: "",
    description: "",
    price: "",
    dateStart: "",
    dateEnd: "",
    category: "",
    withInflation: false,
    refund: "",
  });

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);
  

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
  
    fetch(`http://localhost:8000/calculation/${id}/details/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setCalculation(data.calculation);
        setEditedCalculation({
          name: data.calculation.name || "",
          description: data.calculation.description || "",
          sum: data.calculation.sum || "",
        });
        setSpendings(data.spendings);
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage("Ошибка загрузки расчёта. Возможно, вы не авторизованы.");
        navigate("/login");
      });
  }, [id, navigate]);
  

  useEffect(() => {
    if (showCatalog) {
      if (categories.length === 0) {
        fetch("http://localhost:8000/catalog/categories/")
          .then((res) => res.json())
          .then((data) => setCategories(data.category));
      }
  
      // Загружаем все траты (если ещё не загружено или сброшено)
      fetch("http://localhost:8000/catalog/price/")
        .then((res) => res.json())
        .then((data) => setCategorySpendings(data.consumption));
    }
  }, [showCatalog]);
  

  const handleCategoryClick = (categoryId) => {
    setSelectedCategoryId(categoryId);
    fetch(`http://localhost:8000/catalog/categories/${categoryId}/`)
      .then((res) => res.json())
      .then(setCategorySpendings);
  };

  const fetchWithRefresh = async (url, options = {}) => {
    let token = localStorage.getItem("token");
    const refresh = localStorage.getItem("refresh_token");
  
    if (!token || !refresh) {
      throw new Error("Missing token or refresh_token");
    }
  
    const makeRequest = async (accessToken) => {
      const finalOptions = {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${accessToken}`,
        },
      };
      return fetch(url, finalOptions);
    };
  
    let response = await makeRequest(token);
  
    if (response.status === 401) {
      // Пытаемся обновить токен
      const refreshResponse = await fetch("http://localhost:8000/token/refresh/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh }),
      });
  
      if (!refreshResponse.ok) {
        throw new Error("Failed to refresh token");
      }
  
      const data = await refreshResponse.json();
      localStorage.setItem("token", data.access);
      response = await makeRequest(data.access);
    }
  
    return response;
  };
  

  const validateSpending = (spending) => {
    const { name, price, refund, dateStart, dateEnd, category } = spending;
  
    if (!name || name.trim() === "") return "Название обязательно";
    if (!price || isNaN(price) || parseFloat(price) < 0) return "Сумма должна быть числом ≥ 0";
    if (refund === "" || isNaN(refund) || parseFloat(refund) < 0) return "Возврат должен быть числом ≥ 0";
    if (!dateStart || !dateEnd) return "Обе даты обязательны";
    if (new Date(dateStart) > new Date(dateEnd)) return "Дата начала должна быть раньше или равна дате конца";
    if (!category) return "Выберите категорию";
  
    return null;
  };

  const handleSpendingTemplateClick = async (spendingId) => {
    try {
        const token = localStorage.getItem("token");
        const res = await fetchWithRefresh(`http://localhost:8000/catalog/price/${spendingId}/`, {
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
        refund: spending.refund || "",
        price: spending.price,
        dateStart: today,
        dateEnd: today,
        category: spending.category,
        withInflation: spending.withInflation || false,
      });

      setShowCreateForm(true);
    } catch (err) {
      console.error(err);
      setErrorMessage("Не удалось загрузить трату из справочника");
    }
  };


  const ErrorToast = ({ message, onClose }) => {
    if (!message) return null;
  
    return (
      <div className="error-toast">
        <div className="error-message">
          {message}
          <button onClick={onClose}>✖</button>
        </div>
      </div>
    );
  };

  const toggleCatalog = () => {
    if (showCatalog) {
      setSearchQuery(""); // очищаем поиск
      setSelectedCategoryId(null); // сбрасываем выбранную категорию, если нужно
    }
    setShowCatalog(!showCatalog);
  };
  
  

  
  const handleSpendingClick = async (taskId) => {
    const spending = spendings.find((s) => String(s.id) === taskId);
  if (!spending) return
  
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
      const res = await fetchWithRefresh(`http://localhost:8000/spendings/${spending.id}/`, {
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
      setErrorMessage("Не удалось загрузить трату");
    }
  };
  

  const updateSpending = async () => {
    const error = validateSpending(editingSpending);
    if (error) {
      setErrorMessage(error);
      return;
    }
  
    const token = localStorage.getItem("token");
    if (!token || !editingSpending?.id) return;
  
    try {
      const res = await fetchWithRefresh(`http://localhost:8000/spendings/${editingSpending.id}/`, {
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
      setErrorMessage("Не удалось обновить трату");
    }
  };
  

  const deleteSpending = async () => {
    const token = localStorage.getItem("token");
    if (!token || !editingSpending?.id) return;

    try {
      const res = await fetchWithRefresh(`http://localhost:8000/spendings/${editingSpending.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error();
      setSpendings(spendings.filter((s) => s.id !== editingSpending.id));
      setEditingSpending(null);
    } catch {
      setErrorMessage("Не удалось удалить трату");
    }
  };

  const createSpending = async () => {
    const error = validateSpending(newSpending);
    if (error) {
      setErrorMessage(error);
      return;
    }
  
    const token = localStorage.getItem("token");
    if (!token) return setErrorMessage("Вы не авторизованы");
  
    const payload = {
      ...newSpending,
      calculation: id,
    };
  
    try {
      const res = await fetchWithRefresh("http://localhost:8000/spending/create/", {
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
        refund: "",
      });
    } catch (err) {
      console.error(err);
      setErrorMessage("Не удалось создать трату");
    }
  };
  

  const totalSpending = spendings.reduce((acc, s) => acc + parseFloat(s.adjusted_price || s.price || 0), 0);




  
  const generatePDFWithPdfMake = async () => {
    // если категории не загружены — загружаем
    if (categories.length === 0) {
      try {
        const res = await fetch("http://localhost:8000/catalog/categories/");
        const data = await res.json();
        setCategories(data.category);
        // ждём установки и повторяем вызов
        setTimeout(generatePDFWithPdfMake, 100); // повторный вызов с задержкой
        return;
      } catch (err) {
        setErrorMessage("Не удалось загрузить категории для отчёта");
        return;
      }
    }
  
    const tableBody = [
      ["Дата начала", "Категория", "Название траты", "Сумма", "Сумма возврата"],
      ...spendings.map((s) => {
        const price = parseFloat(s.adjusted_price || s.price || 0);

        const refund = parseFloat(s.refund || 0);
        const categoryName = categories.find((c) => c.id === s.category)?.name || "—";
        const refundableAmount = price * (refund / 100);
        const startDate = s.dateStart || "—";
    
        return [
          startDate,
          categoryName,
          s.name || "—",
          `${price.toFixed(2)} ₽`,
          `${refundableAmount.toFixed(2)} ₽`,
        ];
      }),
      [
        { text: "Итого", colSpan: 3, alignment: "right", bold: true },
        {}, {}, 
        `${totalSpending.toFixed(2)} ₽`,
        {
          text: `${spendings.reduce((acc, s) => {
            const p = parseFloat(s.price || 0);
            const r = parseFloat(s.refund || 0);
            return acc + p * (r / 100);
          }, 0).toFixed(2)} ₽`,
          bold: true,
        },
      ],
    ];
    
    
    
  
    const docDefinition = {
      content: [
        {
          text: `Отчёт по расчёту: ${calculation?.name || `#${id}`}`,
          fontSize: 16,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ["auto", "auto", "auto", "auto", "auto"],

            body: tableBody,
          },
        },
      ],
      defaultStyle: {
        font: "Roboto",
      },
    };
  
    pdfMake.createPdf(docDefinition).download(`расчет_${id}_отчет.pdf`);
  };
  
  const updateCalculation = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
  
    try {
      const res = await fetchWithRefresh(`http://localhost:8000/calculations/${id}/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedCalculation),
      });
  
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setCalculation(updated);
      setIsEditingCalc(false);
    } catch (err) {
      setErrorMessage("Не удалось обновить расчёт");
    }
  };
  
  const deleteCalculation = () => {
    setShowDeleteConfirmation(true);
  };
  
  

  const confirmDeleteCalculation = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
  
    try {
      const res = await fetchWithRefresh(`http://localhost:8000/calculations/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!res.ok) throw new Error();
      navigate("/profile");
    } catch (err) {
      setErrorMessage("Не удалось удалить расчёт");
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
          <button onClick={toggleCatalog} className="catalog-toggle">

            {showCatalog ? "Скрыть справочник" : "Открыть справочник"}
          </button>
        </div>
      </div>

      {showCatalog && (
        <div className="catalog-overlay" onClick={() => {
          setShowCatalog(false);
          setSearchQuery("");
          setSelectedCategoryId(null);
        }}>
        
          <div className="catalog-modal" onClick={(e) => e.stopPropagation()}>
          <input
  type="text"
  placeholder="Поиск по тратам..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="spending-search-input"
/>


            <h4>Категории:</h4>
            <ul className="category-list">
  <li
    key="all"
    onClick={() => {
      setSelectedCategoryId("all");
      fetch("http://localhost:8000/catalog/price/")
        .then((res) => res.json())
        .then((data) => {
          setCategorySpendings(data.consumption);
        });
    }}
    className={selectedCategoryId === "all" ? "active" : ""}
  >
    Все расходы
  </li>
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
                    {categorySpendings
  .filter((s) =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  .map((s) => (
    <li key={s.id} onClick={() => handleSpendingTemplateClick(s.id)}>
      <span className="spending-name">{s.name || "Без названия"}</span>
      <span className="spending-price">₽{s.adjusted_price || s.price}</span>
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

<div className="calc-header-row">
  <div className="gantt-header">
    <div className="gantt-title-wrapper">
      <h2 className="gantt-title">Расчёт: {calculation?.name || `#${id}`}</h2>
      <div className="calc-buttons-inline">
        <button onClick={() => setIsEditingCalc(true)} className="edit-btn">✏️ Редактировать</button>
        <button onClick={deleteCalculation} className="delete-btn">🗑️ Удалить</button>
      </div>
    </div>
    {calculation?.description && (
      <p className="calculation-description">{calculation.description}</p>
    )}
  </div>
</div>








      {showCreateForm && (
        <div className="modal">
          <div className="modal-content">
          <h4>Добавить свою трату</h4>
<label>
  Название:
  <input type="text" placeholder="Например, госпошлина" value={newSpending.name} onChange={(e) => setNewSpending({ ...newSpending, name: e.target.value })} />
</label>
<label>
  Описание:
  <input type="text" placeholder="Доп. детали траты" value={newSpending.description} onChange={(e) => setNewSpending({ ...newSpending, description: e.target.value })} />
</label>
<label>
  Сумма:
  <input type="number" placeholder="₽" value={newSpending.price} onChange={(e) => setNewSpending({ ...newSpending, price: e.target.value })} />
</label>
<label>
  Возврат (%):
  <input type="number" placeholder="0" value={newSpending.refund} onChange={(e) => setNewSpending({ ...newSpending, refund: e.target.value })} />
</label>
<div className="date-range">
  <label>
    Начало:
    <input type="date" value={newSpending.dateStart} onChange={(e) => setNewSpending({ ...newSpending, dateStart: e.target.value })} />
  </label>
  <div className="date-separator"></div>
  <label>
    Примерный конец:
    <input type="date" value={newSpending.dateEnd} onChange={(e) => setNewSpending({ ...newSpending, dateEnd: e.target.value })} />
  </label>
</div>
<label>
  Категория:
  <select value={newSpending.category} onChange={(e) => setNewSpending({ ...newSpending, category: parseInt(e.target.value) })}>
    <option value="">Выберите категорию</option>
    {categories.map((c) => (
      <option key={c.id} value={c.id}>{c.name}</option>
    ))}
  </select>
</label>
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
<label>
  Название:
  <input type="text" value={editingSpending.name} onChange={(e) => setEditingSpending({ ...editingSpending, name: e.target.value })} />
</label>
<label>
  Описание:
  <input type="text" value={editingSpending.description} onChange={(e) => setEditingSpending({ ...editingSpending, description: e.target.value })} />
</label>
<label>
  Сумма:
  <input type="number" value={editingSpending.price} onChange={(e) => setEditingSpending({ ...editingSpending, price: e.target.value })} />
</label>
<label>
  Возврат (%):
  <input type="number" value={editingSpending.refund} onChange={(e) => setEditingSpending({ ...editingSpending, refund: e.target.value })} />
</label>
<div className="date-range">
  <label>
    Начало:
    <input type="date" value={editingSpending.dateStart} onChange={(e) => setEditingSpending({ ...editingSpending, dateStart: e.target.value })} />
  </label>
<div className="date-separator"></div>  
  <label>
    Конец:
    <input type="date" value={editingSpending.dateEnd} onChange={(e) => setEditingSpending({ ...editingSpending, dateEnd: e.target.value })} />
  </label>
</div>
<label>
  Категория:
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
</label>
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

<div className="gantt-title-wrapper">
  <h3 className="gantt-title">Диаграмма трат</h3>
  <button onClick={generatePDFWithPdfMake} className="catalog-toggle">
    Скачать PDF-отчёт
  </button>
</div>


<GanttChart spendings={spendings} onSpendingClick={handleSpendingClick} />



<div className="gantt-total">
  Сумма иска: ₽{Number(calculation?.sum).toLocaleString("ru-RU", { minimumFractionDigits: 2 })}
</div>

<div className="gantt-total">
  Сумма расходов: ₽{totalSpending.toLocaleString("ru-RU", { minimumFractionDigits: 2 })}
</div>
<div className="gantt-total">
Можно вернуть: ₽{spendings.reduce((acc, s) => {
  const price = parseFloat(s.adjusted_price || s.price || 0);
  const refund = parseFloat(s.refund || 0);
  return acc + price * (refund / 100);
}, 0).toLocaleString("ru-RU", { minimumFractionDigits: 2 })}

</div>

{showDeleteConfirmation && (
  <div className="modal">
    <div className="modal-content">
      <h4>Удалить расчёт?</h4>
      <p>Вы уверены, что хотите удалить этот расчёт? Это действие необратимо.</p>
      <div className="modal-buttons">
        <button onClick={confirmDeleteCalculation} className="delete-button">Удалить</button>
        <button onClick={() => setShowDeleteConfirmation(false)} className="cancel-button">Отмена</button>
      </div>
    </div>
  </div>
)}



{isEditingCalc && (
        <div className="modal">
          <div className="modal-content">
            <h4>Редактировать расчёт</h4>
<label>
  Название:
  <input type="text" placeholder="Название расчёта" value={editedCalculation.name} onChange={(e) => setEditedCalculation({ ...editedCalculation, name: e.target.value })} />
</label>
<label>
  Описание:
  <input type="text" placeholder="Описание" value={editedCalculation.description} onChange={(e) => setEditedCalculation({ ...editedCalculation, description: e.target.value })} />
</label>
<label>
  Сумма иска:
  <input type="number" placeholder="₽" value={editedCalculation.sum} onChange={(e) => setEditedCalculation({ ...editedCalculation, sum: e.target.value })} />
</label>

            <div className="modal-buttons">
              <button onClick={updateCalculation} className="save-button">Сохранить</button>
              <button onClick={() => setIsEditingCalc(false)} className="cancel-button">Отмена</button>
            </div>
          </div>
        </div>
      )}

<ErrorToast message={errorMessage} onClose={() => setErrorMessage("")} />


    </div>
  );
};

export default CalculationDetailsPage;
