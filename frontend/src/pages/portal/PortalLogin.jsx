/**
 * Portal Login - Tela de login para o Portal do Cliente.
 * 
 * Autenticação via código enviado por email.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Mail, KeyRound, ArrowRight, Loader2 } from 'lucide-react';
import portalService from '../../services/portalService';

export default function PortalLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' ou 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState(''); // Código de desenvolvimento

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await portalService.requestAccess(email);
      
      // Em desenvolvimento, mostra o código
      if (result._dev_code) {
        setDevCode(result._dev_code);
      }
      
      setStep('code');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao solicitar acesso');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await portalService.verifyCode(email, code);
      navigate('/portal');
    } catch (err) {
      setError(err.response?.data?.detail || 'Código inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Scale className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">Portal do Cliente</h1>
          <p className="text-white/80 mt-2">
            Acompanhe seus processos de forma simples e segura
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 'email' ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Acesse sua conta
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Digite seu email cadastrado para receber um código de acesso
              </p>

              <form onSubmit={handleRequestAccess}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Solicitar Código
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Digite o código
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Enviamos um código de 6 dígitos para <strong>{email}</strong>
              </p>

              {/* Código de desenvolvimento */}
              {devCode && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm font-medium">
                    🔧 Modo Desenvolvimento
                  </p>
                  <p className="text-yellow-700 text-lg font-mono mt-1">
                    Código: <strong>{devCode}</strong>
                  </p>
                </div>
              )}

              <form onSubmit={handleVerifyCode}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código de Acesso
                  </label>
                  <div className="relative">
                    <KeyRound className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl tracking-widest font-mono"
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Acessar Portal
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setError('');
                    setDevCode('');
                  }}
                  className="w-full mt-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  ← Voltar e usar outro email
                </button>
              </form>
            </>
          )}
        </div>

        {/* Link para advogados */}
        <div className="text-center mt-6">
          <a
            href="/login"
            className="text-white/80 hover:text-white text-sm underline"
          >
            É advogado? Acesse aqui
          </a>
        </div>
      </div>
    </div>
  );
}
