import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

function TestComponent() {
  return (
    <BrowserRouter>
      <div>
        <h1>CRM Jurídico</h1>
        <p>Sistema de gestão jurídica</p>
      </div>
    </BrowserRouter>
  );
}

describe('Setup de Testes', () => {
  it('deve renderizar componente de teste', () => {
    render(<TestComponent />);
    expect(screen.getByText('CRM Jurídico')).toBeInTheDocument();
  });

  it('deve ter configuração do jsdom funcionando', () => {
    expect(document.body).toBeDefined();
    expect(window).toBeDefined();
  });
});
