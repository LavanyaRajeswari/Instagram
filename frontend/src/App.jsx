import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import PlaceholderPage from "./pages/PlaceholderPage";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Reels from "./pages/Reels";
import Search from "./pages/Search";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/reels" element={<Reels />} />

        <Route path="/search" element={<Search />} />

        <Route
          path="/explore"
          element={<PlaceholderPage title="Explore" />}
        />

        <Route
          path="/messages"
          element={<PlaceholderPage title="Messages" />}
        />

        <Route
          path="/notifications"
          element={<PlaceholderPage title="Notifications" />}
        />

        <Route
          path="/more"
          element={<PlaceholderPage title="More" />}
        />

        <Route
          path="/also-from-meta"
          element={<PlaceholderPage title="Also from Meta" />}
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
