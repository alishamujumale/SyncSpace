import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_BASE_URL, getRoom, getMessages, getRoomTasks, createTask, updateTask, deleteTask, generatePlan, askAI, summarizeChat } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const RoomPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', deadline: '', assignedTo: '' });
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [roomRes, msgRes, taskRes] = await Promise.all([getRoom(id), getMessages(id), getRoomTasks(id)]);
      setRoom(roomRes.data.room);
      setMessages(msgRes.data.messages);
      setTasks(taskRes.data.tasks);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!room || !user) return;
    socketRef.current = io(API_BASE_URL, { withCredentials: true });
    socketRef.current.emit('join-room', { roomId: id, user });
    socketRef.current.emit('join-taskboard', { roomId: id });
    socketRef.current.on('receive-message', msg => setMessages(prev => [...prev, msg]));
    socketRef.current.on('user-typing', ({ name }) => setTyping(`${name} is typing...`));
    socketRef.current.on('user-stopped-typing', () => setTyping(''));
    socketRef.current.on('task-added', task => setTasks(prev => [task, ...prev]));
    socketRef.current.on('task-changed', updated => setTasks(prev => prev.map(t => t._id === updated._id ? updated : t)));
    socketRef.current.on('task-removed', taskId => setTasks(prev => prev.filter(t => t._id !== taskId)));
    return () => socketRef.current.disconnect();
  }, [room, user, id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    socketRef.current.emit('send-message', { roomId: id, text: newMessage, sender: user });
    socketRef.current.emit('stop-typing', { roomId: id });
    setNewMessage('');
  };

  const handleTyping = e => {
    setNewMessage(e.target.value);
    socketRef.current.emit('typing', { roomId: id, user });
    clearTimeout(window.typingTimer);
    window.typingTimer = setTimeout(() => socketRef.current.emit('stop-typing', { roomId: id }), 1000);
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) return;
    try {
      const res = await createTask({ ...taskForm, roomId: id, assignedTo: taskForm.assignedTo || null });
      setTasks(prev => [res.data.task, ...prev]);
      socketRef.current.emit('task-created', { roomId: id, task: res.data.task });
      setTaskForm({ title: '', description: '', priority: 'medium', deadline: '', assignedTo: '' });
      setShowTaskForm(false);
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (task, status) => {
    try {
      const res = await updateTask(task._id, { ...task, status });
      setTasks(prev => prev.map(t => t._id === task._id ? res.data.task : t));
      socketRef.current.emit('task-updated', { roomId: id, task: res.data.task });
    } catch (err) { console.error(err); }
  };

  const handleDeleteTask = async taskId => {
    try {
      await deleteTask(taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      socketRef.current.emit('task-deleted', { roomId: id, taskId });
    } catch (err) { console.error(err); }
  };

  const handleAI = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true); setAiResponse('');
    try {
      if (aiInput.startsWith('/generate-plan')) {
        const idea = aiInput.replace('/generate-plan', '').trim();
        const res = await generatePlan(idea, id);
        const plan = res.data.plan;
        setAiResponse(`✅ Plan: ${plan.projectName}\n\n${plan.summary}\n\n🗓 ${plan.timeline}\n👥 Roles: ${plan.suggestedRoles?.join(', ')}\n\n✅ ${res.data.tasks.length} tasks created!`);
        const taskRes = await getRoomTasks(id);
        setTasks(taskRes.data.tasks);
      } else if (aiInput.startsWith('/summarize')) {
        const res = await summarizeChat(id);
        setAiResponse(`📝 Summary:\n\n${res.data.summary}`);
      } else {
        const res = await askAI(aiInput, id);
        setAiResponse(res.data.answer);
      }
    } catch (err) { setAiResponse('❌ ' + err.message); }
    finally { setAiLoading(false); setAiInput(''); }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed';
    return t.status === filter;
  });

  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  const priorityConfig = {
    high: { bg: '#ef444420', color: '#ef4444', label: 'High' },
    medium: { bg: '#f59e0b20', color: '#f59e0b', label: 'Medium' },
    low: { bg: '#10b98120', color: '#10b981', label: 'Low' }
  };

  const columns = [
    { label: 'Pending', status: 'pending', color: '#f59e0b', count: pending },
    { label: 'In Progress', status: 'in-progress', color: '#60a5fa', count: inProgress },
    { label: 'Completed', status: 'completed', color: '#10b981', count: completed }
  ];

  if (loading) return (
    <div style={styles.loadingPage}>
      <div style={styles.spinner} />
      <p style={styles.loadingText}>Loading workspace...</p>
    </div>
  );
  if (!room) return <div style={styles.loadingPage}>Room not found</div>;

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.layout}>

        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.roomHeader}>
            <div style={styles.roomIcon}>{room.name.charAt(0).toUpperCase()}</div>
            <div>
              <h2 style={styles.roomName}>{room.name}</h2>
              {room.description && <p style={styles.roomDesc}>{room.description}</p>}
            </div>
          </div>

          {/* Progress */}
          <div style={styles.progressBox}>
            <div style={styles.progressTop}>
              <span style={styles.progressLabel}>Progress</span>
              <span style={styles.progressPct}>{progress}%</span>
            </div>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
            <div style={styles.statsRow}>
              <div style={styles.statChip}>
                <span style={{ ...styles.statDot, backgroundColor: '#f59e0b' }} />
                <span style={styles.statText}>{pending} pending</span>
              </div>
              <div style={styles.statChip}>
                <span style={{ ...styles.statDot, backgroundColor: '#60a5fa' }} />
                <span style={styles.statText}>{inProgress} active</span>
              </div>
              <div style={styles.statChip}>
                <span style={{ ...styles.statDot, backgroundColor: '#10b981' }} />
                <span style={styles.statText}>{completed} done</span>
              </div>
            </div>
          </div>

          {/* Invite */}
          <div style={styles.inviteBox}>
            <p style={styles.sectionLabel}>INVITE CODE</p>
            <div style={styles.inviteRow}>
              <code style={styles.inviteCode}>{room.inviteCode}</code>
              <button style={styles.copyBtn} onClick={() => navigator.clipboard.writeText(room.inviteCode)}>Copy</button>
            </div>
          </div>

          {/* Members */}
          <div style={styles.membersBox}>
            <p style={styles.sectionLabel}>MEMBERS</p>
            {room.members.map((m, i) => (
              <div key={i} style={styles.memberRow}>
                <img src={m.avatar} alt={m.name} style={styles.memberAvatar} />
                <span style={styles.memberName}>{m.name}</span>
                {room.leader._id === m._id && <span style={styles.leaderBadge}>Leader</span>}
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={styles.tabList}>
            {[['tasks', '📋', 'Tasks'], ['chat', '💬', 'Chat'], ['ai', '🤖', 'AI Assistant']].map(([key, icon, label]) => (
              <button key={key}
                style={{ ...styles.tabBtn, ...(activeTab === key ? styles.tabActive : {}) }}
                onClick={() => setActiveTab(key)}>
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main style={styles.main}>

          {/* TASKS */}
          {activeTab === 'tasks' && (
            <div>
              <div style={styles.mainHeader}>
                <h2 style={styles.mainTitle}>Tasks</h2>
                <div style={styles.mainActions}>
                  <div style={styles.filterRow}>
                    {[['all', 'All'], ['pending', 'Pending'], ['in-progress', 'Active'], ['completed', 'Done'], ['overdue', '🔴 Overdue']].map(([val, label]) => (
                      <button key={val}
                        style={{ ...styles.filterBtn, ...(filter === val ? styles.filterActive : {}) }}
                        onClick={() => setFilter(val)}>{label}
                      </button>
                    ))}
                  </div>
                  <button style={styles.solidBtn} onClick={() => setShowTaskForm(!showTaskForm)}>+ Task</button>
                </div>
              </div>

              {showTaskForm && (
                <div style={styles.formBox}>
                  <p style={styles.formTitle}>New Task</p>
                  <input style={styles.input} placeholder="Task title *" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
                  <textarea style={styles.textarea} placeholder="Description (optional)" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
                  <div style={styles.formRow}>
                    <select style={styles.select} value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                      <option value="low">🟢 Low priority</option>
                      <option value="medium">🟡 Medium priority</option>
                      <option value="high">🔴 High priority</option>
                    </select>
                    <input type="date" style={styles.input} value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} />
                  </div>
                  <select style={styles.select} value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                    <option value="">Assign to...</option>
                    {room.members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                  <div style={styles.formRow}>
                    <button style={styles.solidBtn} onClick={handleCreateTask}>Create Task</button>
                    <button style={styles.outlineBtn} onClick={() => setShowTaskForm(false)}>Cancel</button>
                  </div>
                </div>
              )}

              <div style={styles.kanban}>
                {columns.map(col => (
                  <div key={col.status} style={styles.column}>
                    <div style={styles.columnHead}>
                      <div style={{ ...styles.columnDot, backgroundColor: col.color }} />
                      <span style={styles.columnLabel}>{col.label}</span>
                      <span style={styles.columnCount}>{col.count}</span>
                    </div>
                    {filteredTasks.filter(t => t.status === col.status).length === 0 && (
                      <div style={styles.emptyColumn}>No tasks</div>
                    )}
                    {filteredTasks.filter(t => t.status === col.status).map(task => (
                      <div key={task._id} style={styles.taskCard}>
                        <div style={styles.taskTop}>
                          <span style={styles.taskTitle}>{task.title}</span>
                          <span style={{ ...styles.priorityTag, backgroundColor: priorityConfig[task.priority]?.bg, color: priorityConfig[task.priority]?.color }}>
                            {priorityConfig[task.priority]?.label}
                          </span>
                        </div>
                        {task.description && <p style={styles.taskDesc}>{task.description}</p>}
                        {task.assignedTo && (
                          <div style={styles.assignedRow}>
                            <img src={task.assignedTo.avatar} alt={task.assignedTo.name} style={styles.assignedAvatar} />
                            <span style={styles.assignedName}>{task.assignedTo.name}</span>
                          </div>
                        )}
                        {task.deadline && (
                          <p style={{ ...styles.deadline, color: new Date(task.deadline) < new Date() && task.status !== 'completed' ? '#ef4444' : '#555' }}>
                            📅 {new Date(task.deadline).toLocaleDateString()}
                          </p>
                        )}
                        <div style={styles.taskBtns}>
                          {task.status !== 'in-progress' && <button style={styles.taskBtn} onClick={() => handleStatusChange(task, 'in-progress')}>▶ Start</button>}
                          {task.status !== 'completed' && <button style={{ ...styles.taskBtn, color: '#10b981', borderColor: '#10b98130' }} onClick={() => handleStatusChange(task, 'completed')}>✓ Done</button>}
                          {task.status !== 'pending' && <button style={{ ...styles.taskBtn, color: '#f59e0b', borderColor: '#f59e0b30' }} onClick={() => handleStatusChange(task, 'pending')}>↩ Reopen</button>}
                          <button style={{ ...styles.taskBtn, color: '#ef4444', borderColor: '#ef444430' }} onClick={() => handleDeleteTask(task._id)}>🗑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHAT */}
          {activeTab === 'chat' && (
            <div style={styles.chatWrap}>
              <h2 style={styles.mainTitle}>Team Chat</h2>
              <div style={styles.msgList}>
                {messages.length === 0 && <p style={styles.noMessages}>No messages yet. Say hi! 👋</p>}
                {messages.map((msg, i) => {
                  const isMe = msg.sender._id === user._id;
                  return (
                    <div key={i} style={{ ...styles.msgRow, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      {!isMe && <img src={msg.sender.avatar} alt={msg.sender.name} style={styles.msgAvatar} />}
                      <div style={{ ...styles.bubble, background: isMe ? 'linear-gradient(135deg, #a78bfa, #60a5fa)' : '#1a1a1a', border: isMe ? 'none' : '1px solid #2a2a2a' }}>
                        {!isMe && <div style={styles.bubbleSender}>{msg.sender.name}</div>}
                        <div style={styles.bubbleText}>{msg.text}</div>
                        <div style={styles.bubbleTime}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      {isMe && <img src={msg.sender.avatar} alt={msg.sender.name} style={styles.msgAvatar} />}
                    </div>
                  );
                })}
                {typing && <p style={styles.typing}>{typing}</p>}
                <div ref={messagesEndRef} />
              </div>
              <div style={styles.chatInputRow}>
                <input style={styles.chatInput} placeholder="Type a message... (Enter to send)" value={newMessage} onChange={handleTyping} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                <button style={styles.solidBtn} onClick={handleSendMessage}>Send</button>
              </div>
            </div>
          )}

          {/* AI */}
          {activeTab === 'ai' && (
            <div>
              <h2 style={styles.mainTitle}>AI Assistant</h2>
              <p style={styles.aiSubtitle}>Powered by Llama 3.3 — Generate plans, answer questions, summarize chats.</p>

              <div style={styles.cmdGrid}>
                {[
                  { cmd: '/generate-plan Build a food delivery app', label: '🚀 Generate Plan', desc: 'Create full project plan from an idea' },
                  { cmd: '/summarize', label: '📝 Summarize Chat', desc: 'Get key points from team discussion' },
                  { cmd: 'What tasks are pending?', label: '📋 Task Status', desc: 'Get overview of current tasks' },
                  { cmd: 'Who is overloaded?', label: '👥 Team Load', desc: 'Check workload distribution' }
                ].map((item, i) => (
                  <button key={i} style={styles.cmdCard} onClick={() => setAiInput(item.cmd)}>
                    <span style={styles.cmdLabel}>{item.label}</span>
                    <span style={styles.cmdDesc}>{item.desc}</span>
                  </button>
                ))}
              </div>

              <div style={styles.aiInputRow}>
                <input style={styles.input} placeholder="Ask anything or use /generate-plan, /summarize..." value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAI()} />
                <button style={{ ...styles.solidBtn, opacity: aiLoading ? 0.6 : 1 }} onClick={handleAI} disabled={aiLoading}>
                  {aiLoading ? '...' : 'Ask AI'}
                </button>
              </div>

              {aiResponse && (
                <div style={styles.aiResponse}>
                  <div style={styles.aiResponseHeader}>
                    <span style={styles.aiResponseIcon}>🤖</span>
                    <span style={styles.aiResponseTitle}>AI Response</span>
                  </div>
                  <pre style={styles.aiText}>{aiResponse}</pre>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #f3f6fb 100%)' },
  loadingPage: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #f3f6fb 100%)', gap: '16px' },
  spinner: { width: '32px', height: '32px', border: '2px solid #e2e8f0', borderTop: '2px solid #4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: '#64748b', fontSize: '14px' },
  layout: { display: 'flex', height: 'calc(100vh - 54px)', overflow: 'hidden' },
  sidebar: { width: '260px', minWidth: '260px', borderRight: '1px solid #e2e8f0', backgroundColor: '#ffffff', overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: 'inset -1px 0 0 #f1f5f9' },
  roomHeader: { display: 'flex', gap: '12px', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' },
  roomIcon: { width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5, #2563eb)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1rem', flexShrink: 0 },
  roomName: { fontSize: '14px', fontWeight: '700', color: '#0f172a' },
  roomDesc: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
  progressBox: { backgroundColor: '#f8fafc', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' },
  progressTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  progressLabel: { fontSize: '12px', color: '#64748b', fontWeight: '500' },
  progressPct: { fontSize: '12px', color: '#4f46e5', fontWeight: '600' },
  progressTrack: { height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #4f46e5, #2563eb)', borderRadius: '2px', transition: 'width 0.4s' },
  statsRow: { display: 'flex', flexDirection: 'column', gap: '6px' },
  statChip: { display: 'flex', alignItems: 'center', gap: '8px' },
  statDot: { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 },
  statText: { fontSize: '12px', color: '#64748b' },
  inviteBox: { borderTop: '1px solid #e2e8f0', paddingTop: '16px' },
  sectionLabel: { fontSize: '10px', color: '#64748b', letterSpacing: '1.5px', marginBottom: '10px', fontWeight: '600' },
  inviteRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  inviteCode: { flex: 1, fontSize: '13px', fontWeight: '700', color: '#4f46e5', backgroundColor: '#fff', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' },
  copyBtn: { backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', color: '#334155', cursor: 'pointer' },
  membersBox: { borderTop: '1px solid #e2e8f0', paddingTop: '16px' },
  memberRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
  memberAvatar: { width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' },
  memberName: { fontSize: '13px', color: '#334155', flex: 1 },
  leaderBadge: { fontSize: '10px', color: '#4f46e5', backgroundColor: '#eef2ff', padding: '2px 7px', borderRadius: '4px', border: '1px solid #c7d2fe' },
  tabList: { display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', padding: '9px 12px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', fontSize: '14px', color: '#64748b', cursor: 'pointer' },
  tabActive: { backgroundColor: '#eef2ff', color: '#4338ca', fontWeight: '500' },
  main: { flex: 1, overflowY: 'auto', padding: '28px 32px', backgroundColor: '#f8fafc' },
  mainHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  mainTitle: { fontSize: '1.3rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.3px', marginBottom: '4px' },
  mainActions: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  filterRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  filterBtn: { backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', color: '#64748b', cursor: 'pointer' },
  filterActive: { backgroundColor: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' },
  solidBtn: { background: 'linear-gradient(135deg, #4f46e5, #2563eb)', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' },
  outlineBtn: { backgroundColor: '#fff', color: '#334155', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' },
  formBox: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 10px 25px rgba(15,23,42,0.04)' },
  formTitle: { fontWeight: '600', color: '#0f172a', fontSize: '15px' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a', width: '100%', boxSizing: 'border-box' },
  textarea: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a', minHeight: '80px', resize: 'vertical', width: '100%' },
  select: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#f8fafc', color: '#0f172a', flex: 1 },
  formRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  kanban: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' },
  column: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 8px 18px rgba(15,23,42,0.03)' },
  columnHead: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
  columnDot: { width: '8px', height: '8px', borderRadius: '50%' },
  columnLabel: { flex: 1, fontSize: '13px', fontWeight: '600', color: '#0f172a' },
  columnCount: { fontSize: '12px', color: '#64748b', backgroundColor: '#f8fafc', padding: '2px 8px', borderRadius: '10px' },
  emptyColumn: { textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px' },
  taskCard: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '10px' },
  taskTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' },
  taskTitle: { fontSize: '13px', fontWeight: '600', color: '#0f172a', flex: 1, lineHeight: '1.4' },
  priorityTag: { fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: '500', whiteSpace: 'nowrap', flexShrink: 0 },
  taskDesc: { fontSize: '12px', color: '#64748b', marginBottom: '10px', lineHeight: '1.5' },
  assignedRow: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' },
  assignedAvatar: { width: '18px', height: '18px', borderRadius: '50%' },
  assignedName: { fontSize: '12px', color: '#334155' },
  deadline: { fontSize: '11px', marginBottom: '10px', color: '#64748b' },
  taskBtns: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  taskBtn: { backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', color: '#2563eb', cursor: 'pointer' },
  chatWrap: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' },
  msgList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '16px' },
  noMessages: { textAlign: 'center', color: '#64748b', fontSize: '14px', marginTop: '60px' },
  msgRow: { display: 'flex', alignItems: 'flex-end', gap: '8px' },
  msgAvatar: { width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' },
  bubble: { maxWidth: '65%', padding: '10px 14px', borderRadius: '12px', boxShadow: '0 6px 14px rgba(15,23,42,0.05)' },
  bubbleSender: { fontSize: '11px', fontWeight: '600', marginBottom: '4px', color: '#64748b' },
  bubbleText: { fontSize: '14px', color: '#0f172a', lineHeight: '1.5' },
  bubbleTime: { fontSize: '10px', color: '#64748b', marginTop: '6px', textAlign: 'right' },
  typing: { fontSize: '12px', color: '#64748b', fontStyle: 'italic', paddingLeft: '8px' },
  chatInputRow: { display: 'flex', gap: '10px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' },
  chatInput: { flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', color: '#0f172a' },
  aiSubtitle: { fontSize: '13px', color: '#64748b', marginBottom: '20px' },
  cmdGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' },
  cmdCard: { display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', boxShadow: '0 8px 18px rgba(15,23,42,0.03)' },
  cmdLabel: { fontSize: '13px', fontWeight: '600', color: '#0f172a' },
  cmdDesc: { fontSize: '12px', color: '#64748b' },
  aiInputRow: { display: 'flex', gap: '10px', marginBottom: '16px' },
  aiResponse: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 10px 25px rgba(15,23,42,0.04)' },
  aiResponseHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' },
  aiResponseIcon: { fontSize: '1.1rem' },
  aiResponseTitle: { fontSize: '13px', fontWeight: '600', color: '#4f46e5' },
  aiText: { whiteSpace: 'pre-wrap', fontSize: '14px', color: '#334155', fontFamily: 'inherit', margin: 0, lineHeight: '1.8' }
};

export default RoomPage;