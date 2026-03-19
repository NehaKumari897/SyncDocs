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

const LINES_PER_PAGE = 30;

const Editor = () => {
  const { docId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pages, setPages] = useState(['']);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);
  const typingTimeout = useRef(null);
  const textareaRefs = useRef([]);

  const splitIntoPages = (text) => {
    const lines = text.split('\n');
    const result = [];
    for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
      result.push(lines.slice(i, i + LINES_PER_PAGE).join('\n'));
    }
    return result.length > 0 ? result : [''];
  };

  const getFullContent = (pagesArr) => pagesArr.join('\n');

  useEffect(() => {
    const loadDoc = async () => {
      try {
        const { data } = await API.get(`/documents/${docId}`);
        setPages(splitIntoPages(data.content || ''));
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
      setPages(splitIntoPages(newContent));
    });

    socketRef.current.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    return () => socketRef.current.disconnect();
  }, [docId, navigate]);

  const handleChange = (e, pageIndex) => {
    const newPageContent = e.target.value;
    const newLines = newPageContent.split('\n');

    let newPages = [...pages];

    if (newLines.length > LINES_PER_PAGE) {
      // Overflow — push extra lines to next page
      const currentPageLines = newLines.slice(0, LINES_PER_PAGE);
      const overflowLines = newLines.slice(LINES_PER_PAGE);
      newPages[pageIndex] = currentPageLines.join('\n');

      if (pageIndex + 1 < newPages.length) {
        newPages[pageIndex + 1] = overflowLines.join('\n') + '\n' + newPages[pageIndex + 1];
      } else {
        newPages.push(overflowLines.join('\n'));
      }

      // Focus next page
      setTimeout(() => {
        if (textareaRefs.current[pageIndex + 1]) {
          textareaRefs.current[pageIndex + 1].focus();
          textareaRefs.current[pageIndex + 1].setSelectionRange(
            overflowLines.join('\n').length,
            overflowLines.join('\n').length
          );
        }
      }, 0);
    } else {
      newPages[pageIndex] = newPageContent;
    }

    // Remove empty last pages
    while (newPages.length > 1 && newPages[newPages.length - 1].trim() === '') {
      newPages.pop();
    }

    setPages(newPages);

    const fullContent = getFullContent(newPages);
    socketRef.current.emit('send-changes', { docId, content: fullContent });

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => saveDocument(fullContent), 2000);
  };

  const saveDocument = async (fullContent) => {
    setSaving(true);
    try {
      await API.put(`/documents/${docId}`, {
        content: fullContent,
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

  const fullContent = getFullContent(pages);

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
            onBlur={() => saveDocument(fullContent)}
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
                <div style={{ ...styles.avatar, background: getColor(u.name) }} title={u.name}>
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

      {/* Pages */}
      <div style={styles.editorContainer}>
        {pages.map((pageContent, index) => (
          <div key={index} style={styles.page}>
            <textarea
              ref={(el) => (textareaRefs.current[index] = el)}
              style={styles.editor}
              value={pageContent}
              onChange={(e) => handleChange(e, index)}
              placeholder={index === 0 ? 'Start writing here...' : ''}
              spellCheck={true}
            />
            <div style={styles.pageNumber}>Page {index + 1}</div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={styles.bottomBar}>
        <span>{fullContent.length} characters</span>
        <span>{fullContent.split(/\s+/).filter(Boolean).length} words</span>
        <span style={{ color: onlineUsers.length > 1 ? '#22c55e' : '#1a1a2e' }}>
          {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online
        </span>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex', flexDirection: 'column',
    height: '100vh', background: '#e8eaed',
  },
  navbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 24px', background: 'white',
    borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  logo: { fontSize: '20px', fontWeight: '700', color: 'blue' },
  titleInput: {
    border: 'none', fontSize: '16px', fontWeight: '600',
    color: '#1a1a2e', outline: 'none', padding: '4px 8px',
    borderRadius: '4px', background: 'transparent', minWidth: '200px',
  },
  navRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  saveStatus: { fontSize: '13px', color: '#4ae781' },
  onlineUsers: { display: 'flex', gap: '8px', alignItems: 'center' },
  avatar: {
    width: '32px', height: '32px', borderRadius: '50%',
    color: 'white', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '13px', fontWeight: '700',
  },
  userName: { fontSize: '14px', color: '#405c83', fontWeight: '500' },
  logoutBtn: {
    padding: '6px 16px', background: '#fee2e2', color: '#ef4444',
    border: 'none', borderRadius: '6px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '600',
  },
  editorContainer: {
    flex: 1, padding: '32px 0',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', background: '#e8eaed',
    overflowY: 'auto', gap: '24px',
  },
  page: {
    width: '816px',
    height: '1056px',
    background: 'white',
    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
    borderRadius: '2px',
    position: 'relative',
    padding: '72px 80px',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  editor: {
    width: '100%',
    height: '100%',
    padding: '0',
    fontSize: '16px',
    lineHeight: '1.8',
    border: 'none',
    background: 'transparent',
    resize: 'none',
    outline: 'none',
    fontFamily: 'Georgia, serif',
    boxSizing: 'border-box',
    color: '#1a1a2e',
    overflow: 'hidden',
  },
  pageNumber: {
    position: 'absolute',
    bottom: '24px', right: '40px',
    fontSize: '12px', color: '#94a3b8',
  },
  bottomBar: {
    display: 'flex', gap: '24px', padding: '8px 32px',
    background: 'white', borderTop: '1px solid #e2e8f0',
    fontSize: '13px', color: '#1a1a2e', fontWeight: '600',
  },
};

export default Editor;