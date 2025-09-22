export default function Header({ onLogout }) {
  return (
    <header className="header">
      <div className="header-left">
        <img src="/logo.png" alt="Farm Logo" className="header-logo" />
        <h1 className="header-title">My Farm System</h1>
      </div>
      <div className="header-right">
        <button className="btn-logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
