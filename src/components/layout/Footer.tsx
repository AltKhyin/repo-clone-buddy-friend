// ABOUTME: Site footer with brand information, navigation links, and legal information

import React from 'react';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export const Footer = ({ className }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn('bg-background border-t border-border/40 mt-16', className)}>
      {/* DESKTOP: Full Footer Content */}
      <div className="hidden md:block">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Brand & Company Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-foreground font-serif">
                  EVIDENS Reviews
                </h3>
                <p className="text-sm text-muted-foreground mt-2 mb-4">
                  Plataforma de reviews médicos baseados em evidências científicas para profissionais de saúde.
                </p>
                
                {/* Business Info */}
                <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
                  <div className="font-medium text-foreground mb-1">
                    EVIDENS – ENSINO E CONSULTORIA CIENTÍFICA LTDA
                  </div>
                  <div className="font-mono">
                    CNPJ: 38.890.526/0001-67
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation & Contact */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Navegação</h4>
              <nav className="grid grid-cols-2 gap-2">
                <Link 
                  to="/" 
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Início
                </Link>
                <Link 
                  to="/acervo" 
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Acervo
                </Link>
                <Link 
                  to="/comunidade" 
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Comunidade
                </Link>
                <Link 
                  to="/perfil" 
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Perfil
                </Link>
              </nav>
              
              {/* Support Email */}
              <div className="pt-4 border-t border-border/30">
                <a 
                  href="mailto:suporte@igoreckert.com.br"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  📧 suporte@igoreckert.com.br
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Bottom Bar */}
        <Separator className="border-border/30" />
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>© {currentYear} EVIDENS Reviews</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">Desenvolvido para profissionais de saúde</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-xs bg-accent/10 text-accent-foreground px-2 py-1 rounded-full">
                Medicina Baseada em Evidências
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE: Business-Focused Footer */}
      <div className="block md:hidden">
        <div className="px-4 py-8">
          <div className="text-center space-y-4">
            {/* Brand */}
            <div>
              <h3 className="text-base font-bold text-foreground font-serif">
                EVIDENS Reviews
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Reviews médicos baseados em evidências
              </p>
            </div>
            
            {/* Business Info - Compact */}
            <div className="text-xs text-muted-foreground bg-muted/20 rounded-md p-3">
              <div className="font-medium text-foreground">
                EVIDENS – ENSINO E CONSULTORIA CIENTÍFICA LTDA
              </div>
              <div className="font-mono mt-1">
                CNPJ: 38.890.526/0001-67
              </div>
            </div>
            
            {/* Support Contact */}
            <div>
              <a 
                href="mailto:suporte@igoreckert.com.br"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                📧 suporte@igoreckert.com.br
              </a>
            </div>
            
            {/* Copyright */}
            <div className="text-xs text-muted-foreground pt-2 border-t border-border/20">
              © {currentYear} EVIDENS Reviews
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};