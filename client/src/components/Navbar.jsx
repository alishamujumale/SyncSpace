import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../api';

const Navbar = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate('/');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <span style={styles.logo} onClick={() => navigate('/dashboard')}>◈ SyncSpace</span>
        {location.pathname !== '/dashboard' && (
          <button onClick={() => navigate('/dashboard')} style={styles.navLink}>Dashboard</button>
        )}
      </div>
      {user && (
        <div style={styles.right}>
          <div style={styles.desktopUser}>
            <img src={user.avatar} alt={user.name} style={styles.avatar} />
            <span style={styles.userName}>{user.name}</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
          </div>
          <button style={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        </div>
      )}
      {menuOpen && (
        <div style={styles.mobileMenu}>
          <div style={styles.mobileUser}>
            <img src={user.avatar} alt={user.name} style={styles.avatar} />
            <span style={styles.userName}>{user.name}</span>
          </div>
          <button onClick={() => { navigate('/dashboard'); setMenuOpen(false); }} style={styles.mobileLink}>Dashboard</button>
          <button onClick={handleLogout} style={styles.mobileLink}>Logout</button>
        </div>
      )}
    </nav>
  );
};

const styles = {
  nav: { position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '54px', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', boxShadow: '0 1px 0 rgba(15,23,42,0.03)' },
  left: { display: 'flex', alignItems: 'center', gap: '20px' },
  logo: { fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', cursor: 'pointer', letterSpacing: '-0.3px' },
  navLink: { backgroundColor: 'transparent', border: 'none', color: '#475569', fontSize: '14px', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' },
  right: { display: 'flex', alignItems: 'center', gap: '12px' },
  desktopUser: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' },
  userName: { fontSize: '14px', color: '#334155', fontWeight: '500' },
  logoutBtn: { backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '5px 12px', borderRadius: '6px', fontSize: '13px', color: '#334155', cursor: 'pointer' },
  hamburger: { display: 'none', backgroundColor: 'transparent', border: 'none', fontSize: '1.3rem', color: '#0f172a', cursor: 'pointer' },
  mobileMenu: { position: 'absolute', top: '54px', right: 0, left: 0, backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 99, boxShadow: '0 10px 25px rgba(15,23,42,0.08)' },
  mobileUser: { display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' },
  mobileLink: { backgroundColor: 'transparent', border: 'none', fontSize: '15px', color: '#334155', cursor: 'pointer', textAlign: 'left', padding: '6px 0' }
};

export default Navbar;