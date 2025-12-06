/**
 * Portal Private Route - Proteção de rotas do Portal do Cliente.
 * 
 * Verifica autenticação via token do portal (não Firebase).
 */

import { Navigate, useLocation } from 'react-router-dom';
import portalService from '@/services/portalService';
import { LoadingSpinner } from './common';

export default function PortalPrivateRoute({ children }) {
  const location = useLocation();
  const isAuthenticated = portalService.isAuthenticated();

  // Se não está autenticado, redireciona para login do portal
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/portal/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  return children;
}
