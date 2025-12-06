/**
 * Portal Dashboard - Dashboard do Portal do Cliente.
 * 
 * Mostra resumo dos casos, mensagens não lidas e acesso rápido.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  ChevronRight,
  Archive,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import portalService, { CASE_STATUSES } from '../../services/portalService';
import { LoadingSpinner } from '../../components/common';

function StatCard({ title, value, icon: Icon, color, link }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  const content = (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }
  return content;
}

function CaseCard({ caseData }) {
  const statusInfo = CASE_STATUSES[caseData.status] || CASE_STATUSES.novo;

  return (
    <Link
      to={`/portal/cases/${caseData.id}`}
      className="block bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-indigo-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <h3 className="font-medium text-gray-900 truncate">{caseData.title}</h3>
          </div>
          {caseData.case_number && (
            <p className="text-sm text-gray-500 mb-2">Nº {caseData.case_number}</p>
          )}
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
              {statusInfo.label}
            </span>
            {caseData.updated_at && (
              <span className="text-xs text-gray-400">
                Atualizado {format(new Date(caseData.updated_at), "dd/MM", { locale: ptBR })}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </Link>
  );
}

export default function PortalDashboard() {
  const clientData = portalService.getClientData();

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['portal-dashboard'],
    queryFn: portalService.getDashboard,
  });

  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['portal-cases'],
    queryFn: () => portalService.getCases(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['portal-messages'],
    queryFn: () => portalService.getMessages(null, true),
  });

  if (dashboardLoading || casesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  const activeCases = cases.filter((c) => !['concluido', 'arquivado'].includes(c.status));
  const completedCases = cases.filter((c) => c.status === 'concluido');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {clientData?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Acompanhe o andamento dos seus processos
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Processos"
          value={dashboard?.total_cases || 0}
          icon={Briefcase}
          color="blue"
          link="/portal/cases"
        />
        <StatCard
          title="Em Andamento"
          value={dashboard?.cases_by_status?.em_andamento || 0}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Concluídos"
          value={dashboard?.cases_by_status?.concluido || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Mensagens Não Lidas"
          value={dashboard?.unread_messages || 0}
          icon={MessageSquare}
          color={dashboard?.unread_messages > 0 ? 'red' : 'purple'}
          link="/portal/messages"
        />
      </div>

      {/* Processos Ativos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Processos Ativos
          </h2>
          <Link
            to="/portal/cases"
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Ver todos
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="divide-y divide-gray-100">
          {activeCases.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>Nenhum processo ativo no momento</p>
            </div>
          ) : (
            activeCases.slice(0, 5).map((caseData) => (
              <div key={caseData.id} className="p-4">
                <CaseCard caseData={caseData} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mensagens Não Lidas */}
      {messages.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-red-500" />
              Mensagens Não Lidas
            </h2>
            <Link
              to="/portal/messages"
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Ver todas
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {messages.slice(0, 3).map((message) => (
              <Link
                key={message.id}
                to={`/portal/messages?id=${message.id}`}
                className="block p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{message.subject}</p>
                    <p className="text-sm text-gray-500 truncate">{message.content}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {format(new Date(message.created_at), "dd/MM", { locale: ptBR })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/portal/cases"
          className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
        >
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Briefcase className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="font-medium text-indigo-900">Meus Processos</p>
            <p className="text-sm text-indigo-600">Ver todos os casos</p>
          </div>
        </Link>

        <Link
          to="/portal/messages"
          className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
        >
          <div className="p-3 bg-purple-100 rounded-lg">
            <MessageSquare className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-purple-900">Mensagens</p>
            <p className="text-sm text-purple-600">Fale com seu advogado</p>
          </div>
        </Link>

        <Link
          to="/portal/profile"
          className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
        >
          <div className="p-3 bg-green-100 rounded-lg">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-900">Meu Perfil</p>
            <p className="text-sm text-green-600">Dados cadastrais</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
