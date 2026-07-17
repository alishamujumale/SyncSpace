import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRooms, createRoom, joinRoom, deleteRoom } from '../api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      const res = await getRooms();
      setRooms(res.data.rooms);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    try {
      const res = await createRoom({ name: roomName, description: roomDesc });
      navigate(`/room/${res.data.room._id}`);
    } catch (err) { console.error(err); }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    try {
      const res = await joinRoom(inviteCode.trim().toUpperCase());
      navigate(`/room/${res.data.room._id}`);
    } catch (err) { alert('Invalid invite code'); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this room?')) return;
    try {
      await deleteRoom(id);
      setRooms(rooms.filter(r => r._id !== id));
    } catch (err) { console.error(err); }
  };

  const roomColors = ['#a78bfa', '#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#fb923c'];

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.heading}>Good day, {user?.name?.split(' ')[0]} 👋</h1>
            <p style={styles.sub}>Your workspaces — {rooms.length} room{rooms.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={styles.headerBtns}>
            <button style={styles.outlineBtn} onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }}>
              Join room
            </button>
            <button style={styles.solidBtn} onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }}>
              + New room
            </button>
          </div>
        </div>

        {/* Create form */}
        {showCreate && (
          <div style={styles.formBox}>
            <p style={styles.formTitle}>Create a workspace</p>
            <input style={styles.input} placeholder="Room name *" value={roomName} onChange={e => setRoomName(e.target.value)} />
            <input style={styles.input} placeholder="Description (optional)" value={roomDesc} onChange={e => setRoomDesc(e.target.value)} />
            <div style={styles.formRow}>
              <button style={styles.solidBtn} onClick={handleCreate}>Create</button>
              <button style={styles.outlineBtn} onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Join form */}
        {showJoin && (
          <div style={styles.formBox}>
            <p style={styles.formTitle}>Join a workspace</p>
            <input style={styles.input} placeholder="Invite code (e.g. AB12CD34)" value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
            <div style={styles.formRow}>
              <button style={styles.solidBtn} onClick={handleJoin}>Join</button>
              <button style={styles.outlineBtn} onClick={() => setShowJoin(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Rooms */}
        {loading ? (
          <div style={styles.emptyBox}>
            <div style={styles.spinner} />
          </div>
        ) : rooms.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={styles.emptyIcon}>◈</p>
            <p style={styles.emptyTitle}>No workspaces yet</p>
            <p style={styles.emptySub}>Create or join a room to get started</p>
            <button style={styles.solidBtn} onClick={() => setShowCreate(true)}>+ Create your first room</button>
          </div>
        ) : (
          <div style={styles.grid}>
            {rooms.map((room, idx) => {
              const color = roomColors[idx % roomColors.length];
              return (
                <div key={room._id} style={styles.card} onClick={() => navigate(`/room/${room._id}`)}>
                  <div style={styles.cardTop}>
                    <div style={{ ...styles.cardIcon, backgroundColor: color + '20', border: `1px solid ${color}40`, color }}>
                      {room.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={styles.cardInfo}>
                      <h3 style={styles.cardTitle}>{room.name}</h3>
                      {room.description && <p style={styles.cardDesc}>{room.description}</p>}
                    </div>
                  </div>
                  <div style={styles.cardFooter}>
                    <div style={styles.avatarStack}>
                      {room.members.slice(0, 4).map((m, i) => (
                        <img key={i} src={m.avatar} alt={m.name} title={m.name}
                          style={{ ...styles.memberAvatar, marginLeft: i > 0 ? '-8px' : 0, borderColor: '#141414' }} />
                      ))}
                      <span style={styles.memberCount}>{room.members.length} member{room.members.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={styles.cardActions}>
                      {room.leader._id === user?._id && (
                        <button onClick={e => handleDelete(e, room._id)} style={styles.deleteBtn}>Delete</button>
                      )}
                      <span style={styles.arrowBtn}>→</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #f3f6fb 100%)' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
  heading: { fontSize: '1.8rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.5px' },
  sub: { color: '#64748b', fontSize: '14px' },
  headerBtns: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  solidBtn: { background: 'linear-gradient(135deg, #4f46e5, #2563eb)', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' },
  outlineBtn: { backgroundColor: '#fff', color: '#334155', border: '1px solid #cbd5e1', padding: '9px 18px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' },
  formBox: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 10px 25px rgba(15,23,42,0.05)' },
  formTitle: { fontWeight: '600', color: '#0f172a', fontSize: '15px' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a', width: '100%', boxSizing: 'border-box' },
  formRow: { display: 'flex', gap: '10px' },
  emptyBox: { textAlign: 'center', marginTop: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  spinner: { width: '32px', height: '32px', border: '2px solid #e2e8f0', borderTop: '2px solid #4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  emptyIcon: { fontSize: '2.5rem', color: '#94a3b8' },
  emptyTitle: { fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' },
  emptySub: { color: '#64748b', fontSize: '14px', marginBottom: '8px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  card: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.2s', boxShadow: '0 10px 25px rgba(15,23,42,0.04)' },
  cardTop: { display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' },
  cardIcon: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.1rem', flexShrink: 0 },
  cardInfo: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' },
  cardDesc: { fontSize: '13px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  avatarStack: { display: 'flex', alignItems: 'center' },
  memberAvatar: { width: '24px', height: '24px', borderRadius: '50%', border: '2px solid', objectFit: 'cover' },
  memberCount: { fontSize: '12px', color: '#64748b', marginLeft: '10px' },
  cardActions: { display: 'flex', alignItems: 'center', gap: '8px' },
  deleteBtn: { backgroundColor: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' },
  arrowBtn: { color: '#94a3b8', fontSize: '16px' }
};

export default Dashboard;