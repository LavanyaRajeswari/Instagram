import { Link } from "react-router-dom";
import {
  FiHome,
  FiSearch,
  FiCompass,
  FiFilm,
  FiMessageCircle,
  FiHeart,
  FiPlusSquare,
  FiUser,
  FiMenu,
  FiInstagram,
} from "react-icons/fi";

function Sidebar({ onCreateClick }) {
  return (
    <>
      <aside className="sidebar">
        <div className="brand">
          <FiInstagram className="brand-icon" />
          <h1 className="instagram-logo">Instagram</h1>
        </div>

        <nav className="nav-links">
          <Link to="/"><FiHome /> <span>Home</span></Link>
          <a><FiSearch /> <span>Search</span></a>
          <a><FiCompass /> <span>Explore</span></a>
          <a><FiFilm /> <span>Reels</span></a>
          <a><FiMessageCircle /> <span>Messages</span></a>
          <a><FiHeart /> <span>Notifications</span></a>

          <button onClick={onCreateClick} className="nav-button">
            <FiPlusSquare /> <span>Create</span>
          </button>

          <Link to="/profile"><FiUser /> <span>Profile</span></Link>
        </nav>

        <div className="more"><FiMenu /> <span>More</span></div>
      </aside>

      <nav className="bottom-nav">
        <Link to="/"><FiHome /></Link>
        <button onClick={onCreateClick}><FiPlusSquare /></button>
        <Link to="/profile"><FiUser /></Link>
      </nav>
    </>
  );
}

export default Sidebar;