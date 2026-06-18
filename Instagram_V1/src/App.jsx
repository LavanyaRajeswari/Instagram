import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
