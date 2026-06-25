import React, { useState, useEffect } from 'react';
import { X, User, Calendar, MessageSquare, Paperclip, Send, Download, FileText, Image as ImageIcon, Edit2, Trash2, Check } from 'lucide-react';
import { getComments, createComment, updateComment, deleteComment, getAttachments, uploadAttachment, deleteAttachment } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TaskDetails = ({ task, onClose }) => {
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  const { token, user } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchComments();
    fetchAttachments();
  }, [task.id]);

  const fetchComments = async () => {
    try {
      const response = await getComments(token, task.id);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const fetchAttachments = async () => {
    try {
      const response = await getAttachments(token, task.id);
      setAttachments(response.data.attachments || []);
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const response = await createComment(token, task.id, newComment);
      // Access the comment object from the API response envelope
      setComments((prev) => [response.data.comment, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await deleteComment(token, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleEditCommentSubmit = async (commentId) => {
    if (!editCommentContent.trim()) return;
    try {
      const response = await updateComment(token, commentId, editCommentContent);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? response.data.comment : c))
      );
      setEditingCommentId(null);
      setEditCommentContent('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;
    try {
      await deleteAttachment(token, attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await uploadAttachment(token, task.id, file);
      // Access the attachment object from the API response envelope
      setAttachments((prev) => [response.data.attachment, ...prev]);
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const map = {
      HIGH: 'ed-badge-high', High: 'ed-badge-high',
      MEDIUM: 'ed-badge-medium', Medium: 'ed-badge-medium',
      LOW: 'ed-badge-low', Low: 'ed-badge-low',
    };
    return `ed-badge ${map[priority] || 'ed-badge-low'}`;
  };

  const getStatusColor = (status) => {
    const map = {
      TODO: 'ed-badge-todo', 'To Do': 'ed-badge-todo',
      IN_PROGRESS: 'ed-badge-progress', 'In Progress': 'ed-badge-progress',
      COMPLETED: 'ed-badge-done', 'Completed': 'ed-badge-done',
    };
    return `ed-badge ${map[status] || 'ed-badge-todo'}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (mimeType) => {
    return mimeType.startsWith('image/');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(24,29,38,0.45)' }}>
      <div
        className="w-full max-w-5xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden"
        style={{ background: 'var(--color-canvas)', borderRadius: 'var(--rounded-lg)', boxShadow: 'var(--shadow-lg)' }}
      >

        {/* Left Column: Task Details */}
        <div className="flex-1 p-6 overflow-y-auto ed-scroll" style={{ borderRight: '1px solid var(--color-hairline)' }}>
          <div className="flex justify-between items-start mb-5">
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 10, lineHeight: 1.3 }}>{task.title}</h2>
              <div className="flex flex-wrap gap-2">
                <span className={getPriorityColor(task.priority)}>{task.priority}</span>
                <span className={getStatusColor(task.status)}>{task.status.replace('_', ' ')}</span>
              </div>
            </div>
            <button onClick={onClose} className="md:hidden" style={{ color: 'var(--color-faint)' }}>
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="ed-section-label">Description</h4>
              <p
                className="whitespace-pre-line p-4"
                style={{ color: 'var(--color-body)', fontSize: 14, lineHeight: 1.6, background: 'var(--color-surface-soft)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}
              >
                {task.description || <span style={{ color: 'var(--color-faint)', fontStyle: 'italic' }}>No description provided.</span>}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="ed-section-label">Due Date</h4>
                <div className="flex items-center gap-2" style={{ color: 'var(--color-body)' }}>
                  <Calendar size={16} style={{ color: 'var(--color-faint)' }} />
                  <span style={{ fontSize: 14 }}>{formatDate(task.dueDate)}</span>
                </div>
              </div>

              <div>
                <h4 className="ed-section-label">Created By</h4>
                <div className="flex items-center gap-2" style={{ color: 'var(--color-body)' }}>
                  <User size={16} style={{ color: 'var(--color-faint)' }} />
                  <span style={{ fontSize: 14 }}>{task.createdBy?.name || 'Unknown'}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="ed-section-label">Assigned Members</h4>
              <div className="flex flex-wrap gap-2">
                {task.assignments && task.assignments.length > 0 ? (
                  task.assignments.map((assignment) => (
                    <div
                      key={assignment.id || assignment.userId}
                      className="flex items-center gap-1.5 px-2.5 py-1"
                      style={{ background: 'var(--color-surface-soft)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-full)', fontSize: 13, color: 'var(--color-body)' }}
                    >
                      <div
                        className="w-5 h-5 flex items-center justify-center"
                        style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: '50%', fontSize: 10, fontWeight: 600 }}
                      >
                        {assignment.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span>{assignment.user?.name}</span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: 14, color: 'var(--color-faint)', fontStyle: 'italic' }}>No members assigned.</span>
                )}
              </div>
            </div>

            {/* Attachments Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="ed-section-label" style={{ marginBottom: 0 }}>Attachments</h4>
                <label className="flex items-center gap-1 cursor-pointer" style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-link)' }}>
                  <Paperclip size={14} />
                  <span>Upload File</span>
                  <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                </label>
              </div>

              {uploading && (
                <div className="mb-2 flex items-center gap-2" style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  <div className="ed-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  Uploading file...
                </div>
              )}

              <div className="space-y-2">
                {attachments.length > 0 ? (
                  attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="ed-notif flex items-center justify-between p-3 group"
                      style={{ background: 'var(--color-surface-soft)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)' }}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {isImage(attachment.mimeType) ? (
                          <ImageIcon size={18} className="shrink-0" style={{ color: 'var(--color-info)' }} />
                        ) : (
                          <FileText size={18} className="shrink-0" style={{ color: 'var(--color-muted)' }} />
                        )}
                        <div className="overflow-hidden">
                          <p className="truncate" style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)' }}>{attachment.filename}</p>
                          <p style={{ fontSize: 12, color: 'var(--color-faint)' }}>{formatFileSize(attachment.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={`${apiBaseUrl}/uploads/${attachment.storedAs}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={attachment.filename}
                          className="ed-btn ed-btn-secondary ed-btn-icon"
                          style={{ width: 32, height: 32 }}
                        >
                          <Download size={14} />
                        </a>
                        {(attachment.userId === user.id || user.role === 'ADMIN') && (
                          <button
                            onClick={() => handleDeleteAttachment(attachment.id)}
                            className="ed-btn ed-btn-danger ed-btn-icon"
                            style={{ width: 32, height: 32 }}
                            title="Delete attachment"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--color-faint)', fontStyle: 'italic' }}>No attachments uploaded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Comments Section */}
        <div
          className="w-full md:w-[380px] p-5 flex flex-col max-h-[50vh] md:max-h-full"
          style={{ background: 'var(--color-surface-soft)' }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="flex items-center gap-2" style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-ink)' }}>
              <MessageSquare size={18} style={{ color: 'var(--color-muted)' }} />
              <span>Comments</span>
              <span
                style={{ fontSize: 11, fontWeight: 600, padding: '1px 8px', background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', color: 'var(--color-muted)', borderRadius: 'var(--rounded-full)' }}
              >
                {comments.length}
              </span>
            </h3>
            <button onClick={onClose} className="hidden md:block" style={{ color: 'var(--color-faint)' }}>
              <X size={20} />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto ed-scroll space-y-2.5 mb-4 pr-1">
            {comments.length > 0 ? (
              comments.map((comment) => {
                const canManageComment = comment.user?.id === user.id || user.role === 'ADMIN';
                return (
                  <div
                    key={comment.id}
                    className="p-3 relative group"
                    style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-md)', boxShadow: 'var(--shadow-sm)' }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink)' }}>{comment.user?.name || 'Unknown User'}</span>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 10, color: 'var(--color-faint)' }}>
                          {new Date(comment.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {canManageComment && (
                          <div
                            className="hidden group-hover:flex items-center gap-1 absolute right-2 top-2 px-1 py-0.5"
                            style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-sm)', boxShadow: 'var(--shadow-sm)' }}
                          >
                            <button
                              onClick={() => { setEditingCommentId(comment.id); setEditCommentContent(comment.content); }}
                              className="p-1"
                              style={{ color: 'var(--color-muted)' }}
                              title="Edit comment"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-1"
                              style={{ color: 'var(--color-danger)' }}
                              title="Delete comment"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {editingCommentId === comment.id ? (
                      <div className="mt-2">
                        <textarea
                          className="ed-textarea"
                          style={{ minHeight: 56, fontSize: 13 }}
                          rows="2"
                          value={editCommentContent}
                          onChange={(e) => setEditCommentContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => setEditingCommentId(null)} className="ed-btn ed-btn-ghost ed-btn-sm">
                            Cancel
                          </button>
                          <button onClick={() => handleEditCommentSubmit(comment.id)} className="ed-btn ed-btn-primary ed-btn-sm">
                            <Check size={12} /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap" style={{ fontSize: 13.5, color: 'var(--color-body)', lineHeight: 1.5 }}>{comment.content}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <MessageSquare size={34} style={{ color: 'var(--color-hairline-strong)', marginBottom: 8 }} />
                <p style={{ fontSize: 14, color: 'var(--color-faint)', fontStyle: 'italic' }}>No comments yet. Start the conversation!</p>
              </div>
            )}
          </div>

          {/* Comment input form */}
          <form onSubmit={handleAddComment} className="relative mt-auto">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={loading}
              className="ed-input"
              style={{ paddingRight: 44, height: 44 }}
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="ed-btn ed-btn-primary absolute right-1.5 top-1/2 -translate-y-1/2"
              style={{ width: 32, height: 32, padding: 0, borderRadius: 'var(--rounded-sm)' }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default TaskDetails;