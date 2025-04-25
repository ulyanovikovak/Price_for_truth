// src/pages/AdminRedirectPage.js
import { useEffect } from 'react';

function AdminRedirectPage() {
  useEffect(() => {
    window.location.href = 'http://localhost:8000/admin/';
  }, []);

  return <div>Перенаправление на админку...</div>;
}

export default AdminRedirectPage;
