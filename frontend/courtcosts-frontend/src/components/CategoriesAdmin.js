import React, { useEffect, useState } from 'react';
import { fetchAll, createItem, updateItem, deleteItem } from '../services/admin';
import "../styles/Admin.css";

const CategoriesAdmin = () => {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

  const load = async () => {
    try {
      const data = await fetchAll('categories', token);
      setItems(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      if (editingId) {
        await updateItem('categories', editingId, { name }, token);
      } else {
        await createItem('categories', { name }, token);
      }
      setName('');
      setEditingId(null);
      await load();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const edit = (item) => {
    setName(item.name);
    setEditingId(item.id);
  };

  const remove = async (id) => {
    try {
      await deleteItem('categories', id, token);
      await load();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Категории</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название"
      />
      <button onClick={save}>{editingId ? 'Сохранить' : 'Добавить'}</button>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      <ul>
      {Array.isArray(items) ? (
  items.map((cat) => (
    <li key={cat.id}>
      <div>{cat.name}</div>
      <div className="action-buttons">
        <button className="edit-button" onClick={() => edit(cat)}>Редактировать</button>
        <button className="delete-button" onClick={() => remove(cat.id)}>Удалить</button>
      </div>
    </li>
  ))
) : (
  <li>Нет данных</li>
)}

      </ul>
    </div>
  );
};

export default CategoriesAdmin;
