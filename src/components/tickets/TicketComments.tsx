import { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/formatters';
import type { TicketComment } from '../../types';

interface TicketCommentsProps {
  comments: TicketComment[];
  onAddComment: (content: string, isInternal: boolean) => Promise<void>;
}

export function TicketComments({ comments, onAddComment }: TicketCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const { profile } = useAuth();

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    try {
      await onAddComment(newComment.trim(), isInternal);
      setNewComment('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Nenhum comentario ainda
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-xl ${
                comment.is_internal
                  ? 'bg-yellow-500/5 border border-yellow-500/20'
                  : 'bg-gray-800/50 border border-gray-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-netvision-600/30 flex items-center justify-center text-netvision-400 text-xs font-bold">
                    {comment.author?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <span className="text-sm font-medium text-gray-200">
                    {comment.author?.full_name || 'Usuario'}
                  </span>
                  {comment.is_internal && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                      Interno
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap ml-8">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-800 pt-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input resize-none h-20"
          placeholder="Digite seu comentario... (Ctrl+Enter para enviar)"
          disabled={sending}
        />
        <div className="flex items-center justify-between mt-2">
          {(profile?.role === 'admin' || profile?.role === 'analyst') && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-netvision-500 focus:ring-netvision-500"
              />
              <span className="text-xs text-gray-400">Comentario intero (so visivel para equipe TI)</span>
            </label>
          )}
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim() || sending}
            className="btn-primary btn-sm flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
