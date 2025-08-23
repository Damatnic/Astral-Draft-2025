/**
 * Standardized navigation components for consistent UX across views
 */

import React from 'react';
import { 
  createNavigationHandler, 
  createBackHandler, 
  NAVIGATION_BUTTON_STYLES,
  generateBreadcrumbs
} from '../../utils/navigationUtils';

interface NavigationButtonProps {
  variant?: keyof typeof NAVIGATION_BUTTON_STYLES;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const NavigationButton: React.FC<NavigationButtonProps> = ({
  variant = 'secondary',
  onClick,
  children,
  disabled = false,
  className = ''
}) => {
  const baseStyle = NAVIGATION_BUTTON_STYLES[variant];
  const disabledStyle = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  const combinedClassName = `${baseStyle} ${disabledStyle} ${className}`.trim();

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={combinedClassName}
    >
      {children}
    </button>
  );
};

interface BackButtonProps {
  dispatch: React.Dispatch<any>;
  currentRoute: string;
  customBackRoute?: string;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  dispatch,
  currentRoute,
  customBackRoute,
  label = 'Back',
  className = ''
}) => {
  const handleBack = createBackHandler(dispatch, currentRoute, customBackRoute);
  
  return (
    <NavigationButton
      variant="back"
      onClick={handleBack}
      className={className}
    >
      ← {label}
    </NavigationButton>
  );
};

interface QuickNavigationProps {
  dispatch: React.Dispatch<any>;
  currentRoute: string;
  showCommonRoutes?: boolean;
  customRoutes?: Array<{ label: string; route: string; variant?: keyof typeof NAVIGATION_BUTTON_STYLES }>;
}

export const QuickNavigation: React.FC<QuickNavigationProps> = ({
  dispatch,
  currentRoute,
  showCommonRoutes = true,
  customRoutes = []
}) => {
  const commonRoutes = showCommonRoutes ? [
    { label: 'Dashboard', route: 'DASHBOARD', variant: 'secondary' as const },
    { label: 'League Hub', route: 'LEAGUE_HUB', variant: 'secondary' as const },
    { label: 'My Team', route: 'TEAM_HUB', variant: 'secondary' as const },
  ] : [];

  const allRoutes = [...commonRoutes, ...customRoutes];

  return (
    <div className="flex flex-wrap gap-2">
      {allRoutes.map(({ label, route, variant = 'secondary' }) => (
        <NavigationButton
          key={route}
          variant={variant}
          onClick={createNavigationHandler(dispatch, route)}
          disabled={currentRoute === route}
        >
          {label}
        </NavigationButton>
      ))}
    </div>
  );
};

interface BreadcrumbNavigationProps {
  currentRoute: string;
  dispatch: React.Dispatch<any>;
  leagueName?: string;
  teamName?: string;
  className?: string;
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  currentRoute,
  dispatch,
  leagueName,
  teamName,
  className = ''
}) => {
  const breadcrumbs = generateBreadcrumbs(currentRoute, leagueName, teamName);

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs for single-level navigation
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={breadcrumb.route}>
          {index > 0 && (
            <span className="text-gray-400 mx-2">/</span>
          )}
          {breadcrumb.isActive ? (
            <span className="text-[var(--text-primary)] font-medium">
              {breadcrumb.label}
            </span>
          ) : (
            <button
              onClick={createNavigationHandler(dispatch, breadcrumb.route)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {breadcrumb.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

interface ViewHeaderProps {
  title: string;
  subtitle?: string;
  dispatch: React.Dispatch<any>;
  currentRoute: string;
  showBackButton?: boolean;
  customBackRoute?: string;
  showBreadcrumbs?: boolean;
  leagueName?: string;
  teamName?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const ViewHeader: React.FC<ViewHeaderProps> = ({
  title,
  subtitle,
  dispatch,
  currentRoute,
  showBackButton = true,
  customBackRoute,
  showBreadcrumbs = false,
  leagueName,
  teamName,
  actions,
  className = ''
}) => {
  return (
    <header className={`flex-shrink-0 mb-6 ${className}`}>
      {showBreadcrumbs && (
        <BreadcrumbNavigation
          currentRoute={currentRoute}
          dispatch={dispatch}
          leagueName={leagueName}
          teamName={teamName}
          className="mb-4"
        />
      )}
      
      <div className="flex justify-between items-start">
        <div className="flex-grow">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-[var(--text-secondary)] tracking-widest mt-2">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-4 ml-4">
          {actions}
          {showBackButton && (
            <BackButton
              dispatch={dispatch}
              currentRoute={currentRoute}
              customBackRoute={customBackRoute}
            />
          )}
        </div>
      </div>
    </header>
  );
};
