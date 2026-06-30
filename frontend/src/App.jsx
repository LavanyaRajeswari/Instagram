import { useState } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Profile from "./pages/profile/ProfilePage";
import EditProfilePage from "./pages/profile/EditProfilePage";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Reels from "./pages/Reels";
import Search from "./pages/Search";
import Sidebar from "./components/Sidebar";
import CreatePostModal from "./components/CreatePostModal";
import IncomingCallProvider from "./components/IncomingCallProvider";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import SavedPosts from "./pages/SavedPosts";
import ArchivePage from "./pages/ArchivePage";
import MiniMessenger from "./components/MiniMessenger";
import SettingsPage from "./pages/settings/SettingsPage";
import SwitchAccountPage from "./pages/SwitchAccountPage";
import HashtagPage from "./pages/HashtagPage";
import CallPage from "./pages/CallPage";
import PostPage from "./pages/PostPage";
import { getAuthToken } from "./api/config";

function ProtectedRoute({ children }) {
  const location = useLocation();
  if (getAuthToken()) return children;
  return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
}

function GuestRoute({ children }) {
  return getAuthToken() ? <Navigate to="/" replace /> : children;
}

function AppLayout() {
  const [createOpen, setCreateOpen] = useState(false);
  const location = useLocation();

  const hideSidebar =
    location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/add-account" || location.pathname === "/call";
  const hideMiniMessenger = hideSidebar || location.pathname.startsWith("/profile") || location.pathname.startsWith("/messages");

  return (
    <div className="min-h-screen bg-secondary">
      {!hideSidebar && (
        <Sidebar onCreateClick={() => setCreateOpen(true)} />
      )}

      {createOpen && (
        <CreatePostModal
          onClose={() => setCreateOpen(false)}
          onPostCreated={() => setCreateOpen(false)}
        />
      )}
      {!hideMiniMessenger && <MiniMessenger />}
      <IncomingCallProvider />

      <div className={!hideSidebar ? "md:ml-[72px] xl:ml-[244px]" : ""}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
          <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search onCreateClick={() => setCreateOpen(true)} /></ProtectedRoute>} />
          <Route path="/hashtags/:tag" element={<ProtectedRoute><HashtagPage /></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><Search onCreateClick={() => setCreateOpen(true)} /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/post/:postId" element={<ProtectedRoute><PostPage /></ProtectedRoute>} />
          <Route path="/call" element={<ProtectedRoute><CallPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/saved" element={<ProtectedRoute><SavedPosts /></ProtectedRoute>} />
          <Route path="/archive" element={<ProtectedRoute><ArchivePage /></ProtectedRoute>} />
          <Route path="/switch-account" element={<ProtectedRoute><SwitchAccountPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/settings/:section" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          <Route path="/add-account" element={<ProtectedRoute><Register /></ProtectedRoute>} />

          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;