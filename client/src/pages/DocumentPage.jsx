import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getDocument, getComments, addComment, deleteComment } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import RichEditor from '../components/RichEditor';

const DocumentPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState([]);
  const [showComments, setShowComments] = useState(true);
  const socketRef = useRef(null);
  const saveTimerRef = useRef(null);

  const fetchDocument = useCallback(async () => {
    try {
      const res = await getDocument(id);
      setDocument(res.data.document);
      setContent(res.data.document.content);
      setTitle(res.data.document.title);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await getComments(id);
      setComments(res.data.comments);
    } catch (error) { console.error(error); }
  }, [id]);

  useEffect(() => { fetchDocument(); fetchComments(); }, [fetchDocument, fetchComments]);

  useEffect(() => {
    if (!document || !user) return;
    socketRef.current = io('http://localhost:5000', { withCredentials: true });
    socketRef.current.emit('join-document', { documentId: id, user });
    socketRef.current.on('receive-changes', (newContent) => setContent(newContent));
    socketRef.current.on('active-users', (users) => setActiveUsers(users));
    return () => {
      socketRef.current.disconnect();
      clearTimeout(saveTimerRef.current);
    };
  }, [document, user, id]);

  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
    if (socketRef.current) {
      socketRef.current.emit('document-change', { documentId: id, content: newContent });
    }
    clearTimeout(saveTimerRef.current);
    setSaving(true);
    saveTimerRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('save-document', { documentId: id, content: newContent, title });
      }
      setSaving(false);
    }, 1000);
  }, [id, title]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await addComment(id, newComment);
      setComments([...comments, res.data.comment]);
      setNewComment('');
    } catch (error) { console.error(error); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (error) { console.error(error); }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!document) return <div style={styles.loading}>Document not found</div>;

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>

        {/* Editor area */}
        <div style={styles.editorArea}>

          {/* Top bar */}
          <div style={styles.topBar}>
            <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
            <div style={styles.topRight}>
              {activeUsers.map((u, i) => (
                <img key={i} src={u.avatar} alt={u.name} title={u.name} style={styles.activeAvatar} />
              ))}
              <span style={styles.savingText}>{saving ? '💾 Saving...' : '✅ Saved'}</span>
              <button style={styles.shareBtn} onClick={() => navigator.clipboard.writeText(window.location.href)}>
                Copy Link
              </button>
              <button style={styles.commentToggle} onClick={() => setShowComments(!showComments)}>
                💬 {comments.length}
              </button>
            </div>
          </div>

          {/* Title */}
          <input
            style={styles.titleInput}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Untitled"
          />

          {/* Rich Editor */}
          <RichEditor content={content} onChange={handleContentChange} />
        </div>

        {/* Comments panel */}
        {showComments && (
          <div style={styles.commentPanel}>
            <h3 style={styles.commentTitle}>Comments</h3>
            <div style={styles.commentList}>
              {comments.length === 0
                ? <p style={styles.noComments}>No comments yet</p>
                : comments.map(c => (
                  <div key={c._id} style={styles.commentCard}>
                    <div style={styles.commentHeader}>
                      <img src={c.author.avatar} alt={c.author.name} style={styles.commentAvatar} />
                      <span style={styles.commentAuthor}>{c.author.name}</span>
                    </div>
                    <p style={styles.commentText}>{c.text}</p>
                    <button onClick={() => handleDeleteComment(c._id)} style={styles.deleteBtn}>Delete</button>
                  </div>
                ))
              }
            </div>
            <textarea
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <button onClick={handleAddComment} style={styles.addCommentBtn}>Add Comment</button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: { backgroundColor: '#f7f7f5', minHeight: '100vh' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#888' },
  container: { display: 'flex', gap: '24px', maxWidth: '1200px', margin: '0 auto', padding: '24px', flexWrap: 'wrap' },
  editorArea: { flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' },
  backBtn: { backgroundColor: 'transparent', border: '1px solid #e8e8e6', padding: '6px 14px', borderRadius: '6px', color: '#37352f', fontSize: '13px' },
  topRight: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  activeAvatar: { width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #37352f', objectFit: 'cover' },
  savingText: { fontSize: '13px', color: '#888' },
  shareBtn: { backgroundColor: 'transparent', border: '1px solid #e8e8e6', padding: '6px 14px', borderRadius: '6px', color: '#37352f', fontSize: '13px' },
  commentToggle: { backgroundColor: '#37352f', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '13px' },
  titleInput: { fontSize: '2rem', fontWeight: '700', border: 'none', backgroundColor: 'transparent', color: '#37352f', outline: 'none', width: '100%' },
  commentPanel: { width: '280px', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '12px', '@media(max-width:768px)': { width: '100%' } },
  commentTitle: { fontSize: '1rem', fontWeight: '600', color: '#37352f' },
  commentList: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' },
  noComments: { fontSize: '13px', color: '#b7b3ae' },
  commentCard: { backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e8e8e6' },
  commentHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
  commentAvatar: { width: '22px', height: '22px', borderRadius: '50%' },
  commentAuthor: { fontSize: '13px', fontWeight: '600', color: '#37352f' },
  commentText: { fontSize: '13px', color: '#555', marginBottom: '6px' },
  deleteBtn: { backgroundColor: 'transparent', border: 'none', color: '#e53935', fontSize: '12px', cursor: 'pointer' },
  commentInput: { padding: '10px', borderRadius: '8px', border: '1px solid #e8e8e6', fontSize: '13px', resize: 'none', minHeight: '80px', width: '100%' },
  addCommentBtn: { backgroundColor: '#37352f', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '13px', width: '100%' }
};

export default DocumentPage;