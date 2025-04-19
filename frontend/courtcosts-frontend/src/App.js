import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import CalculationDetailsPage from "./pages/CalculationDetailsPage"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthPage isRegister={false} />} />
        <Route path="/register" element={<AuthPage isRegister={true} />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/calculation/:id" element={<CalculationDetailsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
