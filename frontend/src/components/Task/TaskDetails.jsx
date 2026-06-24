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
    const colors = {
      HIGH: 'bg-red-100 text-red-800 border-red-200',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      LOW: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      TODO: 'bg-blue-100 text-blue-800 border-blue-200',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left Column: Task Details */}
        <div className="flex-1 p-6 overflow-y-auto border-r border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h2>
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full border ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition md:hidden"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h4>
              <p className="text-gray-700 whitespace-pre-line bg-gray-55/30 p-4 rounded-xl border border-gray-50">
                {task.description || <span className="text-gray-400 italic">No description provided.</span>}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Due Date</h4>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-sm">{formatDate(task.dueDate)}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Created By</h4>
                <div className="flex items-center gap-2 text-gray-700">
                  <User size={16} className="text-gray-400" />
                  <span className="text-sm">{task.createdBy?.name || 'Unknown'}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Assigned Members</h4>
              <div className="flex flex-wrap gap-2">
                {task.assignments && task.assignments.length > 0 ? (
                  task.assignments.map((assignment) => (
                    <div
                      key={assignment.id || assignment.userId}
                      className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-sm"
                    >
                      <div className="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center text-[10px] font-bold text-purple-800">
                        {assignment.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span>{assignment.user?.name}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-gray-400 italic">No members assigned.</span>
                )}
              </div>
            </div>

            {/* Attachments Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Attachments</h4>
                <label className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                  <Paperclip size={14} />
                  <span>Upload File</span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              {uploading && (
                <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-500"></div>
                  Uploading file...
                </div>
              )}

              <div className="space-y-2">
                {attachments.length > 0 ? (
                  attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl transition group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {isImage(attachment.mimeType) ? (
                          <ImageIcon size={18} className="text-blue-500 shrink-0" />
                        ) : (
                          <FileText size={18} className="text-gray-500 shrink-0" />
                        )}
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-gray-700 truncate">{attachment.filename}</p>
                          <p className="text-xs text-gray-400">{formatFileSize(attachment.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={`${apiBaseUrl}/uploads/${attachment.storedAs}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={attachment.filename}
                          className="p-1.5 bg-white hover:bg-gray-250 text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg shadow-sm transition"
                        >
                          <Download size={14} />
                        </a>
                        {(attachment.userId === user.id || user.role === 'ADMIN') && (
                          <button
                            onClick={() => handleDeleteAttachment(attachment.id)}
                            className="p-1.5 bg-white hover:bg-red-50 text-gray-500 hover:text-red-500 border border-gray-200 rounded-lg shadow-sm transition"
                            title="Delete attachment"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No attachments uploaded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Comments Section */}
        <div className="w-full md:w-[380px] bg-gray-50 p-6 flex flex-col max-h-[50vh] md:max-h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <MessageSquare size={18} className="text-gray-400" />
              <span>Comments</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                {comments.length}
              </span>
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-250 text-gray-400 hover:text-gray-650 transition hidden md:block"
            >
              <X size={20} />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
            {comments.length > 0 ? (
              comments.map((comment) => {
                const canManageComment = comment.user?.id === user.id || user.role === 'ADMIN';
                return (
                  <div key={comment.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-gray-800">{comment.user?.name || 'Unknown User'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">
                          {new Date(comment.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {canManageComment && (
                          <div className="hidden group-hover:flex items-center gap-1 absolute right-2 top-2 bg-white rounded shadow-sm border border-gray-100 px-1 py-0.5">
                            <button
                              onClick={() => { setEditingCommentId(comment.id); setEditCommentContent(comment.content); }}
                              className="p-1 text-gray-400 hover:text-blue-500 transition"
                              title="Edit comment"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-1 text-gray-400 hover:text-red-500 transition"
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
                          className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          rows="2"
                          value={editCommentContent}
                          onChange={(e) => setEditCommentContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-1 mt-1">
                          <button
                            onClick={() => setEditingCommentId(null)}
                            className="p-1 text-gray-500 hover:text-gray-700 bg-gray-100 rounded text-xs px-2"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleEditCommentSubmit(comment.id)}
                            className="p-1 flex items-center gap-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs px-2"
                          >
                            <Check size={12} /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-650 whitespace-pre-wrap">{comment.content}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <MessageSquare size={36} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-400 italic">No comments yet. Start the conversation!</p>
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
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-400 shadow-sm"
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition"
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