import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
<<<<<<< HEAD:frontend/src/App.jsx
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";

import "./styles/instagram.css";
=======
import Login from "./pages/Login";

// Seeding the current user to ensure smooth login-free exploration in the preview
if (!localStorage.getItem("currentUser")) {
  localStorage.setItem(
    "currentUser",
    JSON.stringify({
      id: 1,
      username: "lavanya",
      fullName: "Lavanya",
      bio: "Living life, coding React, designing components 🌸✨",
      profilePicture: "https://i.pravatar.cc/150?img=5",
    })
  );
}
>>>>>>> postInteractions:Instagram_V1/src/App.jsx

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
