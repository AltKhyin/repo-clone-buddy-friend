
// ABOUTME: Main application router with all route definitions including admin protected routes
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import AppShell from "@/components/shell/AppShell";
import Index from "@/pages/Index";
import CommunityPage from "@/pages/CommunityPage";
import ArchivePage from "@/pages/ArchivePage";
import ReviewDetailPage from "@/pages/ReviewDetailPage";
import ErrorBoundary from "@/components/ErrorBoundary";
import CommunityPostDetail from "@/pages/CommunityPostDetail";
import SavePost from "@/components/community/SavePost";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import SuggestionPage from "@/pages/SuggestionPage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import LoginPage from "@/pages/LoginPage";
import { AdminProtectedRoute } from '@/components/routes/AdminProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDashboard } from '@/pages/AdminDashboard';
import ContentManagement from '@/pages/ContentManagement';
import AdminUserManagement from '@/pages/AdminUserManagement';
import AdminTagManagement from '@/pages/AdminTagManagement';
import AdminLayoutManagement from '@/pages/AdminLayoutManagement';
import AdminAnalytics from '@/pages/AdminAnalytics';

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
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
        path: "comunidade",
        element: <CommunityPage />,
      },
      {
        path: "comunidade/:postId",
        element: <CommunityPostDetail />,
      },
      {
        path: "acervo",
        element: <ArchivePage />,
      },
      {
        path: "reviews/:reviewSlug",
        element: <ReviewDetailPage />,
      },
      {
        path: "perfil/:userId",
        element: <ProfilePage />,
      },
      // Redirect /perfil to current user's profile
      {
        path: "perfil",
        element: <ProfilePage />,
      },
      {
        path: "definicoes",
        element: <SettingsPage />,
      },
      // Legacy redirect for old configuracoes path
      {
        path: "configuracoes",
        element: <SettingsPage />,
      },
      {
        path: "sugestoes",
        element: <SuggestionPage />,
      },
      {
        path: "acesso-negado",
        element: <UnauthorizedPage />,
      },
      // Legacy redirect for old nao-autorizado path
      {
        path: "nao-autorizado",
        element: <UnauthorizedPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      
      // Admin Routes - English maintained for internal tools
      {
        path: "/admin",
        element: (
          <AdminProtectedRoute requiredRoles={['admin', 'editor']}>
            <AdminLayout />
          </AdminProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <AdminDashboard />,
          },
          {
            path: "content",
            element: <ContentManagement />,
          },
          {
            path: "users",
            element: <AdminUserManagement />,
          },
          {
            path: "tags",
            element: <AdminTagManagement />,
          },
          {
            path: "layout",
            element: <AdminLayoutManagement />,
          },
          {
            path: "analytics",
            element: <AdminAnalytics />,
          },
        ],
      },
    ],
  },
  {
    path: "/salvar-post",
    element: <SavePost />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

export default AppRouter;
