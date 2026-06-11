import { Component, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { CreateCustomerPage } from './pages/CreateCustomerPage';
import { CreatePolicyPage } from './pages/CreatePolicyPage';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 max-w-2xl mx-auto mt-10">
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg space-y-2">
            <h2 className="font-semibold text-lg">Error en la aplicación</h2>
            <p className="text-sm font-mono">{(this.state.error as Error).message}</p>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});

function NavBar() {
  const { pathname } = useLocation();

  const linkClass = (base: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      pathname.startsWith(base)
        ? 'bg-blue-700 text-white'
        : 'text-blue-100 hover:bg-blue-700 hover:text-white'
    }`;

  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex items-center gap-4 shadow">
      <span className="font-bold text-lg mr-4">Seguros App</span>
      <Link to="/customers" className={linkClass('/customers')}>Clientes</Link>
      <Link to="/policies" className={linkClass('/policies')}>Pólizas</Link>
    </nav>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/customers" replace />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/new" element={<CreateCustomerPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/policies" element={<PoliciesPage />} />
            <Route path="/policies/new" element={<CreatePolicyPage />} />
          </Routes>
          </ErrorBoundary>
        </Layout>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
