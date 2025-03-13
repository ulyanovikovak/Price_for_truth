import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProfilePage.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [calculations, setCalculations] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch("/profile/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch profile");
        const data = await response.json();
        setUser(data);
        setCalculations(data.calculations);
      } catch (err) {
        console.error(err);
        navigate("/login");
      }
    };

    fetchProfile();
  }, [navigate]);

  return (
    <div className="profile-container">
      <div className="profile-box">
        {user ? (
          <>
            <h2>Welcome, {user.first_name} {user.last_name}</h2>
            <p>Email: {user.email}</p>
            <p>Phone: {user.phone}</p>
            <h3>Your Calculations</h3>
            <ul>
              {calculations.map((calc) => (
                <li key={calc.id}>{calc.name} - {calc.sum}</li>
              ))}
            </ul>
            <button onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}>Logout</button>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
