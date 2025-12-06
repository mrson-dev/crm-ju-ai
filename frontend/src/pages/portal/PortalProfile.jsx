/**
 * Portal Profile - Perfil do cliente no portal.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import portalService from '../../services/portalService';
import { LoadingSpinner } from '../../components/common';

export default function PortalProfile() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['portal-profile'],
    queryFn: portalService.getProfile,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const clientType = profile?.client_type === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="w-7 h-7 text-indigo-600" />
          Meu Perfil
        </h1>
        <p className="text-gray-500 mt-1">
          Seus dados cadastrais
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Avatar Section */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600">
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{profile?.name}</h2>
              <p className="text-white/80">{clientType}</p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{profile?.email}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefone</p>
                <p className="font-medium text-gray-900">{profile?.phone || 'Não informado'}</p>
              </div>
            </div>

            {/* Type */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo de Cliente</p>
                <p className="font-medium text-gray-900">{clientType}</p>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Para atualizar seus dados cadastrais, entre em contato com seu advogado.
            </p>
          </div>
        </div>
      </div>

      {/* Help Card */}
      <div className="bg-indigo-50 rounded-xl p-6">
        <h3 className="font-semibold text-indigo-900 mb-2">Precisa de ajuda?</h3>
        <p className="text-sm text-indigo-700 mb-4">
          Se você tiver dúvidas sobre o portal ou seus processos, entre em contato com seu advogado através da seção de mensagens.
        </p>
        <a
          href="/portal/messages"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Mail className="w-4 h-4" />
          Enviar Mensagem
        </a>
      </div>
    </div>
  );
}
