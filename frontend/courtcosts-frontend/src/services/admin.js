const API_BASE = 'http://localhost:8000/catalog/admin';
const REFRESH_URL = 'http://localhost:8000/token/refresh/';

const headers = (token) => {
  if (!token) throw new Error("Нет токена авторизации");
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const refreshToken = async () => {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) throw new Error("Нет refresh токена");

  const response = await fetch(REFRESH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) throw new Error("Не удалось обновить токен");

  const data = await response.json();
  localStorage.setItem('token', data.access);
  return data.access;
};

const handleResponse = async (res, retryRequest) => {
  if (res.status === 401 && retryRequest) {
    try {
      const newAccess = await refreshToken();
      return retryRequest(newAccess);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      throw new Error("Сессия истекла");
    }
  }

  if (!res.ok) {
    if (res.status === 403) {
      window.location.href = '/login';
    }

    let errorData = {};
    try {
      const contentType = res.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        errorData = await res.json();
      } else {
        const text = await res.text();
        errorData.detail = text || 'Ошибка сервера';
      }
    } catch {
      errorData.detail = 'Ошибка сервера (невалидный ответ)';
    }

    throw new Error(errorData.detail || 'Ошибка запроса');
  }

  // 204 No Content — ничего не возвращаем
  if (res.status === 204) return null;

  // Попробовать распарсить JSON, если Content-Type правильный
  const contentType = res.headers.get("Content-Type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }

  // иначе вернуть текст, если это не JSON
  return res.text();
};



export const fetchAll = async (path, token) => {
  const retry = (newToken) =>
    fetch(`${API_BASE}/${path}/`, { headers: headers(newToken) }).then((res) =>
      handleResponse(res)
    );
  return fetch(`${API_BASE}/${path}/`, { headers: headers(token) }).then((res) =>
    handleResponse(res, retry)
  );
};

export const createItem = async (path, data, token) => {
  const retry = (newToken) =>
    fetch(`${API_BASE}/${path}/`, {
      method: 'POST',
      headers: headers(newToken),
      body: JSON.stringify(data),
    }).then((res) => handleResponse(res));

  return fetch(`${API_BASE}/${path}/`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(data),
  }).then((res) => handleResponse(res, retry));
};

export const updateItem = async (path, id, data, token) => {
  const retry = (newToken) =>
    fetch(`${API_BASE}/${path}/${id}/`, {
      method: 'PATCH',
      headers: headers(newToken),
      body: JSON.stringify(data),
    }).then((res) => handleResponse(res));

  return fetch(`${API_BASE}/${path}/${id}/`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify(data),
  }).then((res) => handleResponse(res, retry));
};

export const deleteItem = async (path, id, token) => {
  const retry = (newToken) =>
    fetch(`${API_BASE}/${path}/${id}/`, {
      method: 'DELETE',
      headers: headers(newToken),
    }).then((res) => handleResponse(res));

  return fetch(`${API_BASE}/${path}/${id}/`, {
    method: 'DELETE',
    headers: headers(token),
  }).then((res) => handleResponse(res, retry));
};
