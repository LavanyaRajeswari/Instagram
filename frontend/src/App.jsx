import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Profile from "./pages/Profile";
import PlaceholderPage from "./pages/PlaceholderPage";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Reels from "./pages/Reels";
import Search from "./pages/Search";
import Sidebar from "./components/Sidebar";
import CreatePostModal from "./components/CreatePostModal";

function AppLayout() {
  const [createOpen, setCreateOpen] = useState(false);
  const location = useLocation();

  const hideSidebar =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {!hideSidebar && (
        <Sidebar onCreateClick={() => setCreateOpen(true)} />
      )}

      {createOpen && (
        <CreatePostModal onClose={() => setCreateOpen(false)} />
      )}

      <div className={!hideSidebar ? "md:ml-[72px] xl:ml-[244px]" : ""}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/reels" element={<Reels />} />
<Route
  path="/search"
  element={<Search onCreateClick={() => setCreateOpen(true)} />}
/>

          <Route path="/explore" element={<PlaceholderPage title="Explore" />} />
          <Route path="/messages" element={<PlaceholderPage title="Messages" />} />
          <Route path="/notifications" element={<PlaceholderPage title="Notifications" />} />
          <Route path="/more" element={<PlaceholderPage title="More" />} />
          <Route path="/also-from-meta" element={<PlaceholderPage title="Also from Meta" />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;