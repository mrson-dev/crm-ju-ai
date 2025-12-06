/**
 * Portal Messages - Sistema de mensagens do portal do cliente.
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  MessageSquare,
  Send,
  Inbox,
  Mail,
  MailOpen,
  Clock,
  CheckCircle,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import portalService from '../../services/portalService';
import { LoadingSpinner, Modal, StandaloneToast } from '../../components/common';

function MessageCard({ message, onClick, isSelected }) {
  const isUnread = !message.read_at && !message.is_from_client;
  const isFromMe = message.is_from_client;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 ${isUnread ? 'text-indigo-600' : 'text-gray-400'}`}>
          {isUnread ? <Mail className="w-5 h-5" /> : <MailOpen className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`font-medium ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
              {isFromMe ? 'Você' : 'Advogado'}
            </span>
            <span className="text-xs text-gray-400">
              {format(new Date(message.created_at), "dd/MM HH:mm", { locale: ptBR })}
            </span>
          </div>
          <p className={`text-sm ${isUnread ? 'font-medium text-gray-900' : 'text-gray-600'} truncate`}>
            {message.subject}
          </p>
          <p className="text-xs text-gray-400 truncate mt-1">{message.content}</p>
        </div>
        {isUnread && (
          <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2" />
        )}
      </div>
    </button>
  );
}

function MessageDetail({ message, onMarkRead }) {
  const isFromMe = message.is_from_client

  // Marca como lida se for do advogado
  useEffect(() => {
    if (!message.read_at && !isFromMe) {
      onMarkRead(message.id)
    }
  }, [message.id, message.read_at, isFromMe, onMarkRead])

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm ${isFromMe ? 'text-indigo-600' : 'text-green-600'} font-medium`}>
            {isFromMe ? 'Enviada por você' : 'Recebida do advogado'}
          </span>
          <span className="text-sm text-gray-400">
            {format(new Date(message.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">{message.subject}</h2>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        <p className="text-gray-700 whitespace-pre-wrap">{message.content}</p>
      </div>
      {message.read_at && !isFromMe && (
        <div className="p-4 bg-gray-50 text-sm text-gray-500 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Lida em {format(new Date(message.read_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </div>
      )}
    </div>
  );
}

function NewMessageModal({ isOpen, onClose, onSend, caseId }) {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await onSend(subject, content, caseId);
      setSubject('');
      setContent('');
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Mensagem" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Assunto da mensagem"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Escreva sua mensagem..."
            required
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={sending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {sending ? (
              <LoadingSpinner />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function PortalMessages() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialCaseId = searchParams.get('case');
  
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(!!initialCaseId);
  const [toast, setToast] = useState(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['portal-messages'],
    queryFn: () => portalService.getMessages(),
  });

  const markReadMutation = useMutation({
    mutationFn: portalService.markMessageRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-messages'] });
      queryClient.invalidateQueries({ queryKey: ['portal-dashboard'] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ subject, content, caseId }) =>
      portalService.sendMessage(subject, content, caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-messages'] });
      setToast({ type: 'success', message: 'Mensagem enviada com sucesso!' });
    },
    onError: () => {
      setToast({ type: 'error', message: 'Erro ao enviar mensagem' });
    },
  });

  const handleSendMessage = async (subject, content, caseId) => {
    await sendMessageMutation.mutateAsync({ subject, content, caseId });
  };

  const unreadCount = messages.filter((m) => !m.read_at && !m.is_from_client).length;

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-indigo-600" />
            Mensagens
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-sm rounded-full">
                {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">
            Comunique-se com seu advogado
          </p>
        </div>
        <button
          onClick={() => setIsNewMessageOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Mensagem
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <Inbox className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="font-medium text-gray-900 text-lg">Nenhuma mensagem</h3>
            <p className="text-sm mb-4">Você ainda não possui mensagens</p>
            <button
              onClick={() => setIsNewMessageOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Enviar primeira mensagem
            </button>
          </div>
        ) : (
          <>
            {/* Messages List */}
            <div className="w-full md:w-1/3 border-r border-gray-100 overflow-y-auto">
              {messages.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  isSelected={selectedMessage?.id === message.id}
                  onClick={() => setSelectedMessage(message)}
                />
              ))}
            </div>

            {/* Message Detail */}
            <div className="hidden md:flex flex-1 flex-col">
              {selectedMessage ? (
                <MessageDetail
                  message={selectedMessage}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <Mail className="w-16 h-16 text-gray-300 mb-4" />
                  <p>Selecione uma mensagem para visualizar</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* New Message Modal */}
      <NewMessageModal
        isOpen={isNewMessageOpen}
        onClose={() => setIsNewMessageOpen(false)}
        onSend={handleSendMessage}
        caseId={initialCaseId}
      />

      {/* Toast */}
      {toast && (
        <StandaloneToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
