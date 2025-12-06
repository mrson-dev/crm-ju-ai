/**
 * Portal Cases - Lista de processos do cliente.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Calendar,
  MapPin,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import portalService, { CASE_STATUSES } from '../../services/portalService';
import { LoadingSpinner } from '../../components/common';

function CaseCard({ caseData }) {
  const statusInfo = CASE_STATUSES[caseData.status] || CASE_STATUSES.novo;

  return (
    <Link
      to={`/portal/cases/${caseData.id}`}
      className="block bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-indigo-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg mb-1">{caseData.title}</h3>
          {caseData.case_number && (
            <p className="text-sm text-gray-500">Processo Nº {caseData.case_number}</p>
          )}
        </div>
        <span className={`text-sm px-3 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
          {statusInfo.label}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{caseData.description}</p>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        {caseData.court && (
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{caseData.court}</span>
          </div>
        )}
        {caseData.created_at && (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Início: {format(new Date(caseData.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-400">
          Atualizado {caseData.updated_at 
            ? format(new Date(caseData.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
            : 'recentemente'}
        </span>
        <ChevronRight className="w-5 h-5 text-indigo-500" />
      </div>
    </Link>
  );
}

export default function PortalCases() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['portal-cases', statusFilter],
    queryFn: () => portalService.getCases(statusFilter || null),
  });

  const filteredCases = cases.filter((c) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        c.title.toLowerCase().includes(search) ||
        c.case_number?.toLowerCase().includes(search) ||
        c.description?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Agrupa por status
  const activeCases = filteredCases.filter((c) => !['concluido', 'arquivado'].includes(c.status));
  const completedCases = filteredCases.filter((c) => c.status === 'concluido');
  const archivedCases = filteredCases.filter((c) => c.status === 'arquivado');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Briefcase className="w-7 h-7 text-indigo-600" />
          Meus Processos
        </h1>
        <p className="text-gray-500 mt-1">
          Acompanhe todos os seus processos jurídicos
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título ou número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        >
          <option value="">Todos os Status</option>
          {Object.entries(CASE_STATUSES).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Briefcase className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="font-medium text-gray-900 text-lg">Nenhum processo encontrado</h3>
          <p className="text-gray-500 mt-1">
            {searchTerm || statusFilter
              ? 'Tente ajustar os filtros'
              : 'Você ainda não possui processos cadastrados'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Processos Ativos */}
          {activeCases.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                Em Andamento ({activeCases.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {activeCases.map((caseData) => (
                  <CaseCard key={caseData.id} caseData={caseData} />
                ))}
              </div>
            </div>
          )}

          {/* Processos Concluídos */}
          {completedCases.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Concluídos ({completedCases.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {completedCases.map((caseData) => (
                  <CaseCard key={caseData.id} caseData={caseData} />
                ))}
              </div>
            </div>
          )}

          {/* Processos Arquivados */}
          {archivedCases.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-gray-500" />
                Arquivados ({archivedCases.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 opacity-75">
                {archivedCases.map((caseData) => (
                  <CaseCard key={caseData.id} caseData={caseData} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
