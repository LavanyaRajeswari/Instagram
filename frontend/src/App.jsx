import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import PlaceholderPage from "./pages/PlaceholderPage";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Reels from "./pages/Reels";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/reels" element={<Reels />} />

        <Route
          path="/search"
          element={
            <PlaceholderPage
              title="Search"
              description="Search page is ready for your search UI. Sidebar navigation and create post work here."
            />
          }
        />

        <Route
          path="/explore"
          element={
            <PlaceholderPage
              title="Explore"
              description="Explore page is ready for discovery content. Sidebar navigation and create post work here."
            />
          }
        />

        <Route
          path="/messages"
          element={
            <PlaceholderPage
              title="Messages"
              description="Messages page is ready for chat content. Sidebar navigation and create post work here."
            />
          }
        />

        <Route
          path="/notifications"
          element={
            <PlaceholderPage
              title="Notifications"
              description="Notifications page is ready for activity updates. Sidebar navigation and create post work here."
            />
          }
        />

        <Route
          path="/more"
          element={
            <PlaceholderPage
              title="More"
              description="More options are ready here. Sidebar navigation and create post work here."
            />
          }
        />

        <Route
          path="/also-from-meta"
          element={
            <PlaceholderPage
              title="Also from Meta"
              description="Meta apps and tools are ready here. Sidebar navigation and create post work here."
            />
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
