import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProfilePage.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [calculations, setCalculations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found, redirecting to login");
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch("http://localhost:8000/profile/", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch profile");
        const data = await response.json();
        setUser(data);
        setCalculations(data.calculations);
      } catch (err) {
        console.error("Error loading profile:", err);
        navigate("/login");
      }
    };

    fetchProfile();
  }, [navigate]);

  const filteredCalculations = calculations.filter((calc) =>
    calc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="profile-container">
      <div className="profile-box">
        {user ? (
          <>
            <h2>Welcome, {user.first_name} {user.last_name}</h2>
            <p>Email: {user.email}</p>
            <p>Phone: {user.phone || "Not provided"}</p>
            <h3>Your Calculations</h3>
            <input
              type="text"
              placeholder="Search calculations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <ul>
              {filteredCalculations.length > 0 ? (
                filteredCalculations.map((calc) => (
                  <li key={calc.id}>{calc.name} - {calc.sum}</li>
                ))
              ) : (
                <p>No calculations found</p>
              )}
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