/**
 * Portal Case Detail - Detalhes de um processo para o cliente.
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  ArrowLeft,
  Calendar,
  MapPin,
  FileText,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import portalService, { CASE_STATUSES } from '../../services/portalService';
import { LoadingSpinner } from '../../components/common';

function TimelineItem({ event, isLast }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 bg-indigo-500 rounded-full" />
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-2" />}
      </div>
      <div className="flex-1 pb-6">
        <p className="font-medium text-gray-900">{event.title || event.description}</p>
        <p className="text-sm text-gray-500 mt-1">
          {event.date && format(new Date(event.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
        {event.details && (
          <p className="text-sm text-gray-600 mt-2">{event.details}</p>
        )}
      </div>
    </div>
  );
}

function DocumentCard({ document }) {
  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('image')) return '🖼️';
    if (type?.includes('word') || type?.includes('doc')) return '📝';
    return '📎';
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getFileIcon(document.file_type)}</span>
        <div>
          <p className="font-medium text-gray-900">{document.name}</p>
          {document.description && (
            <p className="text-sm text-gray-500">{document.description}</p>
          )}
        </div>
      </div>
      {document.download_url && (
        <a
          href={document.download_url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Baixar documento"
        >
          <Download className="w-5 h-5" />
        </a>
      )}
    </div>
  );
}

export default function PortalCaseDetail() {
  const { id } = useParams();

  const { data: caseData, isLoading: caseLoading } = useQuery({
    queryKey: ['portal-case', id],
    queryFn: () => portalService.getCase(id),
  });

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['portal-case-documents', id],
    queryFn: () => portalService.getCaseDocuments(id),
    enabled: !!id,
  });

  if (caseLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="font-medium text-gray-900 text-lg">Processo não encontrado</h3>
        <Link
          to="/portal/cases"
          className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para processos
        </Link>
      </div>
    );
  }

  const statusInfo = CASE_STATUSES[caseData.status] || CASE_STATUSES.novo;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/portal/cases"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para processos
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{caseData.title}</h1>
              {caseData.case_number && (
                <p className="text-gray-500">Processo Nº {caseData.case_number}</p>
              )}
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
            {statusInfo.label}
          </span>
        </div>

        <p className="text-gray-600 mb-6">{caseData.description}</p>

        <div className="flex flex-wrap gap-6 text-sm text-gray-500">
          {caseData.court && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{caseData.court}</span>
            </div>
          )}
          {caseData.created_at && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Iniciado em {format(new Date(caseData.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          )}
          {caseData.updated_at && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Atualizado {format(new Date(caseData.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Andamento do Processo
          </h2>

          {caseData.timeline && caseData.timeline.length > 0 ? (
            <div className="space-y-0">
              {caseData.timeline.map((event, index) => (
                <TimelineItem
                  key={index}
                  event={event}
                  isLast={index === caseData.timeline.length - 1}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>Nenhuma movimentação registrada</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Documentos */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              Documentos
            </h2>

            {docsLoading ? (
              <div className="py-4 text-center">
                <LoadingSpinner />
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">Nenhum documento disponível</p>
              </div>
            )}
          </div>

          {/* Ação - Enviar Mensagem */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Tem alguma dúvida?
            </h3>
            <p className="text-sm text-white/80 mb-4">
              Entre em contato com seu advogado sobre este processo.
            </p>
            <Link
              to={`/portal/messages?case=${id}`}
              className="block w-full py-2 bg-white text-indigo-600 rounded-lg font-medium text-center hover:bg-indigo-50 transition-colors"
            >
              Enviar Mensagem
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
