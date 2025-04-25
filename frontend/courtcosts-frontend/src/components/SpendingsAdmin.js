import React, { useEffect, useState } from 'react';
import { fetchAll, createItem, updateItem, deleteItem } from '../services/admin';
import "../styles/Admin.css";

const SpendingsAdmin = () => {
  const [spendings, setSpendings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    refund: '',
    category: '',
  });
  const [editingId, setEditingId] = useState(null);
  const token = localStorage.getItem('token');
  const [error, setError] = useState(null);


  const load = async () => {
    const data = await fetchAll('spendings', token);
    const cats = await fetchAll('categories', token);
    setSpendings(data);
    setCategories(cats);
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
      price: parseFloat(form.price),
      refund: parseFloat(form.refund),
      category: parseInt(form.category),
    };
    if (editingId) {
      await updateItem('spendings', editingId, data, token);
    } else {
      await createItem('spendings', data, token);
    }
    setForm({ name: '', description: '', price: '', refund: '', category: '' });
    setEditingId(null);
    load();
  };

  const edit = (item) => {
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      refund: item.refund,
      category: item.category,
    });
    setEditingId(item.id);
  };

  const remove = async (id) => {
    try {
      await deleteItem('spendings', id, token);
      await load(); // обновить список
    } catch (err) {
      console.error(err.message);
      setError(err.message);
    }
  };
  

  return (
    <div>
      <h2>Траты</h2>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Название" />
      <input name="description" value={form.description} onChange={handleChange} placeholder="Описание" />
      <input name="price" value={form.price} onChange={handleChange} placeholder="Цена" type="number" />
      <input name="refund" value={form.refund} onChange={handleChange} placeholder="Возврат" type="number" />
      <select name="category" value={form.category} onChange={handleChange}>
        <option value="">-- категория --</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      <button onClick={save}>{editingId ? 'Сохранить' : 'Добавить'}</button>

      <ul>
  {spendings.map((s) => (
    <li key={s.id}>
      <div className="spending-name">{s.name}</div>
      <div className="spending-right">
      <div className="spending-price">
  ({parseFloat(s.price || 0).toFixed(2)} ₽)
</div>
        <div className="action-buttons">
          <button className="edit-button" onClick={() => edit(s)}>Редактировать</button>
          <button className="delete-button" onClick={() => remove(s.id)}>Удалить</button>
        </div>
      </div>
    </li>
  ))}



      </ul>
    </div>
  );
};

export default SpendingsAdmin;
