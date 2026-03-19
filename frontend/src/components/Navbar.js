import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <Link to="/dashboard" style={styles.logo}> SyncDocs</Link>
      <div style={styles.right}>
        {user && <span style={styles.name}>Hi, {user.name} </span>}
        <button style={styles.btn} onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 32px', background: '#4663e5',
    borderBottom: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  logo: { fontSize: '22px', fontWeight: '800', color: 'white', textDecoration: 'none' },
  right: { display: 'flex', alignItems: 'center', gap: '16px' },
  name: { color: 'white', fontSize: '14px', fontWeight: '500' },
  btn: {
    padding: '8px 18px', background: 'white', color: '#4f46e5',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
  },
};

export default Navbar;
