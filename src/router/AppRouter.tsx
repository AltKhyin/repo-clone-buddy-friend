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
import RegistrationPage from '@/pages/RegistrationPage';
import { UniversalRouteProtection } from '@/components/routes/UniversalRouteProtection';
import { AdminDashboard } from '@/pages/AdminDashboard';
import ContentManagement from '@/pages/ContentManagement';
import AdminUserManagement from '@/pages/AdminUserManagement';
import AdminTagManagement from '@/pages/AdminTagManagement';
import AdminLayoutManagement from '@/pages/AdminLayoutManagement';
import AdminAnalytics from '@/pages/AdminAnalytics';
import AdminAccessControl from '@/pages/AdminAccessControl';
import AdminCommunityManagement from '@/pages/AdminCommunityManagement';
import EditorPage from '@/pages/EditorPage';
import ReviewManagementPage from '@/pages/ReviewManagementPage';
import { AdminProtectedRoute } from '@/components/routes/AdminProtectedRoute';
import DebugSidebar from '@/pages/DebugSidebar';

const router = createBrowserRouter([
  // Standalone Auth Routes (outside ProtectedAppShell)
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/registrar',
    element: <RegistrationPage />,
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

      // Admin Routes - Flattened structure, each page standalone
      {
        path: '/admin',
        element: (
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        ),
      },
      {
        path: '/admin/content',
        element: (
          <AdminProtectedRoute>
            <ContentManagement />
          </AdminProtectedRoute>
        ),
      },
      {
        path: '/admin/community',
        element: (
          <AdminProtectedRoute>
            <AdminCommunityManagement />
          </AdminProtectedRoute>
        ),
      },
      {
        path: '/admin/users',
        element: (
          <AdminProtectedRoute>
            <AdminUserManagement />
          </AdminProtectedRoute>
        ),
      },
      {
        path: '/admin/tags',
        element: (
          <AdminProtectedRoute>
            <AdminTagManagement />
          </AdminProtectedRoute>
        ),
      },
      {
        path: '/admin/layout',
        element: (
          <AdminProtectedRoute>
            <AdminLayoutManagement />
          </AdminProtectedRoute>
        ),
      },
      {
        path: '/admin/analytics',
        element: (
          <AdminProtectedRoute>
            <AdminAnalytics />
          </AdminProtectedRoute>
        ),
      },
      {
        path: '/admin/access-control',
        element: (
          <AdminProtectedRoute>
            <AdminAccessControl />
          </AdminProtectedRoute>
        ),
      },
      {
        path: '/admin/review/:reviewId',
        element: (
          <AdminProtectedRoute>
            <ReviewManagementPage />
          </AdminProtectedRoute>
        ),
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
      <UniversalRouteProtection showDebugInfo={false}>
        <EditorPage />
      </UniversalRouteProtection>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

export default AppRouter;
