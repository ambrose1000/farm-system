import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo / Brand */}
        <div className="navbar-brand">
          <Link to="/dashboard">🐄 Farm Manager</Link>
        </div>

        {/* Navigation Links */}
        <ul className="navbar-links">
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/livestocktable">Livestock</Link></li>
          <li><Link to="/profile">Profile</Link></li>
          <li><Link to="/login">Logout</Link></li>
        </ul>
      </div>
    </nav>
  );
}
