import { useState } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Profile from "./pages/profile/ProfilePage";
import EditProfilePage from "./pages/profile/EditProfilePage";
import PlaceholderPage from "./pages/PlaceholderPage";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Reels from "./pages/Reels";
import Search from "./pages/Search";
import Sidebar from "./components/Sidebar";
import CreatePostModal from "./components/CreatePostModal";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import SavedPosts from "./pages/SavedPosts";
import MiniMessenger from "./components/MiniMessenger";
import SettingsPage from "./pages/settings/SettingsPage";
import HashtagPage from "./pages/HashtagPage";
import { getAuthToken } from "./api/config";

function ProtectedRoute({ children }) {
  return getAuthToken() ? children : <Navigate to="/login" replace />;
}

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
      {!hideSidebar && <MiniMessenger />}

      <div className={!hideSidebar ? "md:ml-[72px] xl:ml-[244px]" : ""}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
          <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search onCreateClick={() => setCreateOpen(true)} /></ProtectedRoute>} />
          <Route path="/hashtags/:tag" element={<ProtectedRoute><HashtagPage /></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><PlaceholderPage title="Explore" /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/saved" element={<ProtectedRoute><SavedPosts /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/settings/:section" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/settings/apps-and-websites" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/settings/notifications" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/settings/privacy" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/settings/meta-verified" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/settings/supervision" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/settings/login-activity" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/more" element={<ProtectedRoute><PlaceholderPage title="More" /></ProtectedRoute>} />
          <Route path="/also-from-meta" element={<ProtectedRoute><PlaceholderPage title="Also from Meta" /></ProtectedRoute>} />

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
