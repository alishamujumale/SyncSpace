import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getDocument, getComments, addComment, deleteComment } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const DocumentPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState([]);
  const socketRef = useRef(null);
  const saveTimerRef = useRef(null);
  const versionTimerRef = useRef(null);

  useEffect(() => {
    fetchDocument();
    fetchComments();
  }, [id]);

  useEffect(() => {
    if (!document || !user) return;

    // Connect socket
    socketRef.current = io('http://localhost:5000', {
      withCredentials: true
    });

    // Join document room
    socketRef.current.emit('join-document', {
      documentId: id,
      user
    });

    // Receive changes from other users
    socketRef.current.on('receive-changes', (newContent) => {
      setContent(newContent);
    });

    // Receive active users list
    socketRef.current.on('active-users', (users) => {
      setActiveUsers(users);
    });

    // Save a version every 2 minutes
    versionTimerRef.current = setInterval(() => {
      socketRef.current.emit('save-version', {
        documentId: id,
        content,
        userId: user._id
      });
    }, 120000);

    return () => {
      socketRef.current.disconnect();
      clearInterval(versionTimerRef.current);
      clearTimeout(saveTimerRef.current);
    };
  }, [document, user]);

  const fetchDocument = async () => {
    try {
      const res = await getDocument(id);
      setDocument(res.data.document);
      setContent(res.data.document.content);
      setTitle(res.data.document.title);
    } catch (error) {
      console.error('Failed to fetch document:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await getComments(id);
      setComments(res.data.comments);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleContentChange = useCallback((e) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Broadcast to other users instantly
    if (socketRef.current) {
      socketRef.current.emit('document-change', {
        documentId: id,
        content: newContent
      });
    }

    // Auto save to MongoDB after 1 second of no typing
    clearTimeout(saveTimerRef.current);
    setSaving(true);
    saveTimerRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('save-document', {
          documentId: id,
          content: newContent,
          title
        });
      }
      setSaving(false);
    }, 1000);
  }, [id, title]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await addComment(id, newComment);
      setComments([...comments, res.data.comment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  if (loading) return <div style={styles.loading}>Loading document...</div>;
  if (!document) return <div style={styles.loading}>Document not found</div>;

  return (
    <div>
      <Navbar />
      <div style={styles.container}>

        {/* Editor Section */}
        <div style={styles.editorSection}>

          {/* Active users */}
          <div style={styles.activeUsers}>
            {activeUsers.map((u, i) => (
              <img
                key={i}
                src={u.avatar}
                alt={u.name}
                title={u.name}
                style={styles.activeAvatar}
              />
            ))}
            {activeUsers.length > 0 && (
              <span style={styles.activeLabel}>
                {activeUsers.length} editing
              </span>
            )}
          </div>

          <input
            style={styles.titleInput}
            value={title}
            onChange={handleTitleChange}
            placeholder="Document title..."
          />

          <div style={styles.savingIndicator}>
            {saving ? '💾 Saving...' : '✅ Saved'}
          </div>

          <textarea
            style={styles.editor}
            value={content}
            onChange={handleContentChange}
            placeholder="Start typing... changes sync in real time!"
          />

          {/* Share link */}
          <div style={styles.shareBox}>
            <span style={styles.shareLabel}>Share link:</span>
            <code style={styles.shareLink}>
              {`http://localhost:3000/doc/${id}`}
            </code>
            <button
              style={styles.copyBtn}
              onClick={() => navigator.clipboard.writeText(
                `http://localhost:3000/doc/${id}`
              )}
            >
              Copy
            </button>
          </div>
        </div>

        {/* Comment Section */}
        <div style={styles.commentSection}>
          <h3 style={styles.commentHeading}>💬 Comments</h3>
          <div style={styles.commentList}>
            {comments.length === 0 ? (
              <p style={styles.noComments}>No comments yet</p>
            ) : (
              comments.map(comment => (
                <div key={comment._id} style={styles.commentCard}>
                  <div style={styles.commentHeader}>
                    <img
                      src={comment.author.avatar}
                      alt={comment.author.name}
                      style={styles.avatar}
                    />
                    <span style={styles.commentAuthor}>
                      {comment.author.name}
                    </span>
                  </div>
                  <p style={styles.commentText}>{comment.text}</p>
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    style={styles.deleteBtn}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
          <div style={styles.addComment}>
            <textarea
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <button onClick={handleAddComment} style={styles.commentBtn}>
              Add Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1.2rem',
    color: '#888'
  },
  container: {
    display: 'flex',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px'
  },
  editorSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  activeUsers: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  activeAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '2px solid #4285f4',
    objectFit: 'cover'
  },
  activeLabel: {
    fontSize: '0.85rem',
    color: '#4285f4',
    fontWeight: 'bold'
  },
  titleInput: {
    fontSize: '1.6rem',
    fontWeight: 'bold',
    border: 'none',
    borderBottom: '2px solid #eee',
    padding: '8px 0',
    outline: 'none',
    color: '#1a1a2e'
  },
  savingIndicator: {
    fontSize: '0.85rem',
    color: '#888'
  },
  editor: {
    flex: 1,
    minHeight: '500px',
    padding: '16px',
    fontSize: '1rem',
    border: '1px solid #eee',
    borderRadius: '8px',
    resize: 'vertical',
    outline: 'none',
    lineHeight: '1.6'
  },
  shareBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f8f9fa',
    padding: '10px 14px',
    borderRadius: '8px'
  },
  shareLabel: {
    fontSize: '0.85rem',
    color: '#666'
  },
  shareLink: {
    fontSize: '0.85rem',
    color: '#4285f4',
    flex: 1
  },
  copyBtn: {
    backgroundColor: '#4285f4',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem'
  },
  commentSection: {
    width: '300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  commentHeading: {
    fontSize: '1.2rem',
    color: '#1a1a2e'
  },
  commentList: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  noComments: {
    color: '#aaa',
    fontSize: '0.9rem'
  },
  commentCard: {
    backgroundColor: 'white',
    padding: '12px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  commentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px'
  },
  avatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%'
  },
  commentAuthor: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#1a1a2e'
  },
  commentText: {
    fontSize: '0.9rem',
    color: '#444'
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    color: '#ff4d4d',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    padding: '0'
  },
  addComment: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  commentInput: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '0.9rem',
    resize: 'none',
    minHeight: '80px'
  },
  commentBtn: {
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    padding: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  }
};

export default DocumentPage;