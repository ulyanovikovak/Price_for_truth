import React, { useEffect, useState } from 'react';
import { fetchAll, createItem, updateItem, deleteItem } from '../services/admin';
import "../styles/Admin.css";

const InflationAdmin = () => {
  const [inflations, setInflations] = useState([]);
  const [form, setForm] = useState({
    year: '',
    percent: '',
    description: '',
  });
  const [editingId, setEditingId] = useState(null);
  const token = localStorage.getItem('token');

  const load = async () => {
    const data = await fetchAll('inflations', token);
    setInflations(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const save = async () => {
    const data = {
      ...form,
      year: parseInt(form.year),
      percent: parseFloat(form.percent),
    };
    if (editingId) {
      await updateItem('inflations', editingId, data, token);
    } else {
      await createItem('inflations', data, token);
    }
    setForm({ year: '', percent: '', description: '' });
    setEditingId(null);
    load();
  };

  const edit = (item) => {
    setForm({
      year: item.year,
      percent: item.percent,
      description: item.description || '',
    });
    setEditingId(item.id);
  };

  const remove = async (id) => {
    await deleteItem('inflations', id, token);
    load();
  };

  return (
    <div>
      <h2>Инфляция</h2>
      <input name="year" value={form.year} onChange={handleChange} placeholder="Год" type="number" />
      <input name="percent" value={form.percent} onChange={handleChange} placeholder="Процент" type="number" />
      <input name="description" value={form.description} onChange={handleChange} placeholder="Описание" />
      <button onClick={save}>{editingId ? 'Сохранить' : 'Добавить'}</button>

      <ul>
        {inflations.map((inf) => (
          <li key={inf.id}>
          <div>
            <strong>{inf.year}</strong> — {inf.percent}%
          </div>
          <div className="action-buttons">
            <button className="edit-button" onClick={() => edit(inf)}>Редактировать</button>
            <button className="delete-button" onClick={() => remove(inf.id)}>Удалить</button>
          </div>
        </li>
        
        ))}
      </ul>
    </div>
  );
};

export default InflationAdmin;
