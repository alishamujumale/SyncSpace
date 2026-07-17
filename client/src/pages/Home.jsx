import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api';

const Home = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const authError = query.get('error');

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (user) return <Navigate to="/dashboard" />;

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <span style={styles.logo}>◈ SyncSpace</span>
        <button style={styles.signInBtn} onClick={() => window.location.href = `${API_BASE_URL}/auth/google`}>
          Sign in →
        </button>
      </nav>

      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.badge}>✦ AI-Powered Workspace</div>
        <h1 style={styles.title}>Your team's<br /><span style={styles.gradient}>second brain</span></h1>
        <p style={styles.subtitle}>Plan projects with AI, collaborate in real-time,<br />manage tasks — all in one workspace.</p>
        <div style={styles.heroBtns}>
          <button style={styles.ctaBtn} onClick={() => window.location.href = `${API_BASE_URL}/auth/google`}>
            Get started free →
          </button>
        </div>
        {authError && (
          <div style={styles.errorBox}>
            {authError === 'auth_failed' ? 'Authentication failed. Please try again.' : 'Server error during login. Check OAuth configuration.'}
          </div>
        )}
        {/* Glow */}
        <div style={styles.glow} />
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        {[['AI-Generated', 'Project Plans'], ['Real-time', 'Collaboration'], ['Zero', 'Setup Required']].map(([num, label], i) => (
          <div key={i} style={styles.statItem}>
            <span style={styles.statNum}>{num}</span>
            <span style={styles.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={styles.featuresSection}>
        <p style={styles.featuresLabel}>EVERYTHING YOUR TEAM NEEDS</p>
        <h2 style={styles.featuresTitle}>Built for modern teams</h2>
        <div style={styles.grid}>
          {[
            { icon: '🤖', title: 'AI Planning', desc: 'Generate full project plans, tasks, timelines and roles from a single idea.', color: '#a78bfa' },
            { icon: '⚡', title: 'Real-time Sync', desc: 'Every change syncs instantly across your entire team. No refresh needed.', color: '#34d399' },
            { icon: '📋', title: 'Task Boards', desc: 'Kanban-style boards with filters, deadlines, priorities and assignments.', color: '#60a5fa' },
            { icon: '💬', title: 'Team Chat', desc: 'Built-in real-time chat with typing indicators keeps your team aligned.', color: '#f472b6' },
            { icon: '📝', title: 'Rich Docs', desc: 'Collaborative rich text editor with formatting, highlights and code blocks.', color: '#fbbf24' },
            { icon: '🔗', title: 'Easy Sharing', desc: 'Share workspaces and docs instantly with invite codes or direct links.', color: '#fb923c' }
          ].map((f, i) => (
            <div key={i} style={styles.featureCard}>
              <div style={{ ...styles.featureIconBox, backgroundColor: f.color + '20', border: `1px solid ${f.color}30` }}>
                <span style={styles.featureIcon}>{f.icon}</span>
              </div>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div style={styles.ctaBanner}>
        <h2 style={styles.ctaBannerTitle}>Ready to build something?</h2>
        <p style={styles.ctaBannerSub}>Join your team on SyncSpace today.</p>
        <button style={styles.ctaBtn} onClick={() => window.location.href = `${API_BASE_URL}/auth/google`}>
          Get started free →
        </button>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <span>◈ SyncSpace — Built with MERN + AI</span>
      </footer>
    </div>
  );
};

const styles = {
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc', color: '#64748b' },
  page: { minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #f3f6fb 100%)', color: '#0f172a', overflowX: 'hidden' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', height: '60px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)' },
  logo: { fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.3px' },
  signInBtn: { backgroundColor: '#fff', color: '#334155', border: '1px solid #cbd5e1', padding: '8px 18px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' },
  hero: { textAlign: 'center', padding: '120px 24px 80px', maxWidth: '760px', margin: '0 auto', position: 'relative' },
  badge: { display: 'inline-block', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '20px', padding: '5px 16px', fontSize: '13px', color: '#4f46e5', marginBottom: '28px', letterSpacing: '0.3px' },
  title: { fontSize: 'clamp(2.8rem, 7vw, 5rem)', fontWeight: '800', color: '#0f172a', lineHeight: '1.1', marginBottom: '24px', letterSpacing: '-2px' },
  gradient: { background: 'linear-gradient(135deg, #4f46e5, #2563eb, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  subtitle: { fontSize: '1.1rem', color: '#475569', lineHeight: '1.8', marginBottom: '40px' },
  heroBtns: { display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' },
  ctaBtn: { background: 'linear-gradient(135deg, #4f46e5, #2563eb)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '10px', fontSize: '1rem', cursor: 'pointer', fontWeight: '600', letterSpacing: '-0.2px' },
  demoBtn: { backgroundColor: '#fff', color: '#334155', border: '1px solid #cbd5e1', padding: '14px 28px', borderRadius: '10px', fontSize: '1rem', cursor: 'pointer' },
  errorBox: { marginTop: '20px', padding: '14px 18px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '12px', border: '1px solid #fca5a5', maxWidth: '620px', marginLeft: 'auto', marginRight: 'auto', fontSize: '0.95rem' },
  glow: { position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(79,70,229,0.16) 0%, transparent 70%)', pointerEvents: 'none', zIndex: -1 },
  stats: { display: 'flex', justifyContent: 'center', gap: '60px', padding: '40px 24px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', backgroundColor: 'rgba(255,255,255,0.7)' },
  statItem: { textAlign: 'center' },
  statNum: { display: 'block', fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px' },
  statLabel: { fontSize: '13px', color: '#64748b' },
  featuresSection: { maxWidth: '1000px', margin: '0 auto', padding: '80px 24px' },
  featuresLabel: { fontSize: '11px', color: '#64748b', letterSpacing: '2px', textAlign: 'center', marginBottom: '12px' },
  featuresTitle: { fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: '700', color: '#0f172a', textAlign: 'center', marginBottom: '48px', letterSpacing: '-0.5px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  featureCard: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: '0 8px 20px rgba(15,23,42,0.04)' },
  featureIconBox: { width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' },
  featureIcon: { fontSize: '1.3rem' },
  featureTitle: { fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' },
  featureDesc: { fontSize: '13px', color: '#64748b', lineHeight: '1.7' },
  ctaBanner: { margin: '0 24px 80px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '60px 24px', textAlign: 'center', maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto', boxShadow: '0 16px 35px rgba(15,23,42,0.06)' },
  ctaBannerTitle: { fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: '700', color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.5px' },
  ctaBannerSub: { color: '#64748b', marginBottom: '32px', fontSize: '15px' },
  footer: { textAlign: 'center', padding: '24px', borderTop: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b' }
};

export default Home;