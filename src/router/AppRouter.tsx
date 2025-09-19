// ABOUTME: Main application router with all route definitions including admin protected routes
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ProtectedAppShell from '@/components/shell/ProtectedAppShell';
import Index from '@/pages/Index';
import CommunityPage from '@/pages/CommunityPage';
import CreatePostPage from '@/pages/CreatePostPage';
import ArchivePage from '@/pages/ArchivePage';
import ReviewDetailPage from '@/pages/ReviewDetailPage';
import ErrorBoundary from '@/components/ErrorBoundary';
import CommunityPostDetail from '@/pages/CommunityPostDetail';
import SavePost from '@/components/community/SavePost';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import SuggestionPage from '@/pages/SuggestionPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import LoginPage from '@/pages/LoginPage';
import LoginModeloPage from '@/pages/LoginModeloPage';
import RegistrationPage from '@/pages/RegistrationPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import CompleteRegistration from '@/pages/CompleteRegistration';
import SolicitarPlanoPage from '@/pages/SolicitarPlanoPage';
import PaymentV2Page from '@/pages/PaymentV2Page';
import PaymentV1Page from '@/pages/PaymentV1Page';
import ProfileCompletionPage from '@/pages/ProfileCompletionPage';
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';
import { OptimizedRouteProtection } from '@/components/routes/OptimizedRouteProtection';
import { AdminDashboard } from '@/pages/AdminDashboard';
import ContentManagement from '@/pages/ContentManagement';
import AdminUserManagement from '@/pages/AdminUserManagement';
import AdminTagManagement from '@/pages/AdminTagManagement';
import AdminLayoutManagement from '@/pages/AdminLayoutManagement';
import AdminAccessControl from '@/pages/AdminAccessControl';
import AdminCommunityManagement from '@/pages/AdminCommunityManagement';
import AdminPaymentV2Management from '@/pages/AdminPaymentV2Management';
import AdminAnalytics from '@/pages/AdminAnalytics';
import EditorPage from '@/pages/EditorPage';
import ReviewManagementPage from '@/pages/ReviewManagementPage';
import DebugSidebar from '@/pages/DebugSidebar';

const router = createBrowserRouter([
  // Standalone Auth Routes (outside ProtectedAppShell)
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/login-modelo',
    element: <LoginModeloPage />,
  },
  {
    path: '/registrar',
    element: <RegistrationPage />,
  },
  {
    path: '/esqueci-senha',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/redefinir-senha',
    element: <ResetPasswordPage />,
  },
  {
    path: '/complete-registration',
    element: <CompleteRegistration />,
  },
  {
    path: '/solicitar-plano',
    element: <SolicitarPlanoPage />,
  },
  {
    path: '/pagar',
    element: <PaymentV2Page />,
  },
  {
    path: '/pagamento',
    element: <PaymentV1Page />,
  },
  {
    path: '/pagamento-v2',
    element: <PaymentV2Page />,
  },
  {
    path: '/completar-perfil',
    element: <ProfileCompletionPage />,
  },
  {
    path: '/pagamento-sucesso',
    element: <PaymentSuccessPage />,
  },
  {
    path: '/',
    element: <ProtectedAppShell />,
    errorElement: (
      <ErrorBoundary
        tier="root"
        context="aplicação completa"
        showDetails={process.env.NODE_ENV === 'development'}
        showHomeButton={false}
        showBackButton={false}
      >
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Erro na Aplicação</h1>
            <p className="text-gray-600">Ocorreu um erro inesperado. Recarregue a página.</p>
          </div>
        </div>
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: 'comunidade',
        element: <CommunityPage />,
      },
      {
        path: 'comunidade/criar',
        element: <CreatePostPage />,
      },
      {
        path: 'comunidade/:postId',
        element: <CommunityPostDetail />,
      },
      {
        path: 'acervo',
        element: <ArchivePage />,
      },
      {
        path: 'reviews/:slug',
        element: <ReviewDetailPage />,
      },
      {
        path: 'perfil/:userId',
        element: <ProfilePage />,
      },
      // Redirect /perfil to current user's profile
      {
        path: 'perfil',
        element: <ProfilePage />,
      },
      {
        path: 'definicoes',
        element: <SettingsPage />,
      },
      // Legacy redirect for old configuracoes path
      {
        path: 'configuracoes',
        element: <SettingsPage />,
      },
      {
        path: 'sugestoes',
        element: <SuggestionPage />,
      },
      {
        path: 'debug-sidebar',
        element: <DebugSidebar />,
      },
      {
        path: 'acesso-negado',
        element: <UnauthorizedPage />,
      },
      // Legacy redirect for old nao-autorizado path
      {
        path: 'nao-autorizado',
        element: <UnauthorizedPage />,
      },

      // Admin Routes - Protected by OptimizedRouteProtection in ProtectedAppShell
      {
        path: '/admin',
        element: <AdminDashboard />,
      },
      {
        path: '/admin/content',
        element: <ContentManagement />,
      },
      {
        path: '/admin/community',
        element: <AdminCommunityManagement />,
      },
      {
        path: '/admin/users',
        element: <AdminUserManagement />,
      },
      {
        path: '/admin/tags',
        element: <AdminTagManagement />,
      },
      {
        path: '/admin/layout',
        element: <AdminLayoutManagement />,
      },
      {
        path: '/admin/access-control',
        element: <AdminAccessControl />,
      },
      {
        path: '/admin/payment-v2',
        element: <AdminPaymentV2Management />,
      },
      {
        path: '/admin/analytics',
        element: <AdminAnalytics />,
      },
      {
        path: '/admin/review/:reviewId',
        element: <ReviewManagementPage />,
      },
    ],
  },
  {
    path: '/salvar-post',
    element: <SavePost />,
  },
  // Editor Routes - Isolated from AppShell for full-width editing
  {
    path: '/editor/:reviewId',
    element: (
      <OptimizedRouteProtection showDebugInfo={false}>
        <EditorPage />
      </OptimizedRouteProtection>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

export default AppRouter;
