import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const getColor = (name) => {
  const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];
  let hash = 0;
  for (let i = 0; i < name?.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const Editor = () => {
  const { docId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    const loadDoc = async () => {
      try {
        const { data } = await API.get(`/documents/${docId}`);
        setContent(data.content);
        setTitle(data.title);
      } catch {
        toast.error('Document not found');
        navigate('/dashboard');
      }
    };
    loadDoc();

    socketRef.current = io('http://192.168.1.5:8000', {
      auth: { token: localStorage.getItem('token') },
    });

    socketRef.current.emit('join-document', { docId, userName: user?.name });

    socketRef.current.on('receive-changes', (newContent) => {
      setContent(newContent);
    });

    socketRef.current.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [docId, navigate]);

  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);

    socketRef.current.emit('send-changes', { docId, content: newContent });

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => saveDocument(newContent), 2000);
  };

  const saveDocument = async (currentContent) => {
    setSaving(true);
    try {
      await API.put(`/documents/${docId}`, {
        content: currentContent || content,
        title,
      });
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <div style={styles.navLeft}>
          <span style={styles.logo}>CollabDocs</span>
          <input
            style={styles.titleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => saveDocument()}
            placeholder="Document title..."
          />
        </div>
        <div style={styles.navRight}>
          <span style={styles.saveStatus}>
            {saving ? 'Saving...' : 'Saved'}
          </span>
         <div style={styles.onlineUsers}>
  {onlineUsers.map((u, i) => (
    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      <div
        style={{
          ...styles.avatar,
          background: getColor(u.name),
        }}
      >
        {u.name?.[0]?.toUpperCase()}
      </div>
      <span style={{ fontSize: '10px', color: '#475569', fontWeight: '600' }}>
        {u.name?.split(' ')[0]}
      </span>
    </div>
  ))}
</div>
          <span style={styles.userName}>{user?.name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Editor */}
      <div style={styles.editorContainer}>
        <textarea
          style={styles.editor}
          value={content}
          onChange={handleChange}
          placeholder="Start writing your document here... Changes will sync in real-time with all collaborators!"
          spellCheck={true}
        />
      </div>

      {/* Bottom bar */}
      <div style={styles.bottomBar}>
        <span>{content.length} characters</span>
        <span>{content.split(/\s+/).filter(Boolean).length} words</span>
        <span style={{ color: onlineUsers.length > 1 ? '#22c55e' : '#1a1a2e' }}>
          {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online
        </span>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc' },
  navbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 24px', background: 'white',
    borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  logo: { fontSize: '20px', fontWeight: '700', color: 'blue' },
  titleInput: {
    border: 'none', fontSize: '16px', fontWeight: '600',
    color: '#1a1a2e', outline: 'none', padding: '4px 8px',
    borderRadius: '4px', background: 'transparent',
    minWidth: '200px',
  },
  navRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  saveStatus: { fontSize: '13px', color: '#4ae781' },
  onlineUsers: { display: 'flex', gap: '8px', alignItems: 'center' },
  avatar: {
    width: '32px', height: '32px', borderRadius: '50%',
    color: 'white', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '13px', fontWeight: '700',
    cursor: 'pointer',
  },
  userName: { fontSize: '14px', color: '#405c83', fontWeight: '500' },
  logoutBtn: {
    padding: '6px 16px', background: '#fee2e2', color: '#ef4444',
    border: 'none', borderRadius: '6px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '600',
  },
  editorContainer: { flex: 1, padding: '32px', display: 'flex', justifyContent: 'center' },
  editor: {
    width: '100%', maxWidth: '860px', height: '100%',
    padding: '40px', fontSize: '16px', lineHeight: '1.8',
    border: '1px solid #a8b3c3', borderRadius: '12px',
    background: 'white', resize: 'none', outline: 'none',
    fontFamily: 'Georgia, serif', boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  },
  bottomBar: {
    display: 'flex', gap: '24px', padding: '8px 32px',
    background: 'white', borderTop: '1px solid #e2e8f0',
    fontSize: '13px', color: '#1a1a2e', fontWeight: '600',
  },
};

export default Editor;