import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { useBreadcrumbContext } from '@/contexts/BreadcrumbContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface SmartBreadcrumbProps {
  className?: string;
  showIcons?: boolean;
  showHomeIcon?: boolean;
  maxItems?: number;
}

export const SmartBreadcrumb: React.FC<SmartBreadcrumbProps> = ({
  className,
  showIcons = true,
  showHomeIcon = true,
  maxItems = 5,
}) => {
  const { breadcrumbs } = useBreadcrumbContext();
  const isMobile = useIsMobile();

  if (!breadcrumbs.length) return null;

  // On mobile, show only last 2 items
  const displayBreadcrumbs = isMobile && breadcrumbs.length > 2 
    ? breadcrumbs.slice(-2) 
    : breadcrumbs.length > maxItems 
      ? [...breadcrumbs.slice(0, 1), ...breadcrumbs.slice(-(maxItems - 1))]
      : breadcrumbs;

  const hasEllipsis = breadcrumbs.length > maxItems && !isMobile;

  return (
    <Breadcrumb className={cn('animate-fade-in', className)}>
      <BreadcrumbList className="text-sm">
        {/* Home icon for mobile */}
        {isMobile && showHomeIcon && breadcrumbs.length > 2 && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="flex items-center text-foreground hover:text-primary transition-colors">
                  <Home className="h-4 w-4" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            {breadcrumbs.length > 3 && (
              <>
                <BreadcrumbItem>
                      <span className="text-foreground">...</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              </>
            )}
          </>
        )}

        {/* Ellipsis for desktop when items are truncated */}
        {hasEllipsis && breadcrumbs.length > maxItems && (
          <>
            <BreadcrumbItem>
              <span className="text-foreground">...</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
          </>
        )}

        {displayBreadcrumbs.map((breadcrumb, index) => {
          const isLast = index === displayBreadcrumbs.length - 1;
          const IconComponent = breadcrumb.icon;

          return (
            <React.Fragment key={breadcrumb.href}>
              <BreadcrumbItem>
                {isLast || breadcrumb.isActive ? (
                  <BreadcrumbPage className={cn(
                    'flex items-center gap-2 font-medium text-foreground',
                    breadcrumb.isDisabled && 'opacity-50'
                  )}>
                    {showIcons && IconComponent && (
                      <IconComponent className="h-4 w-4" />
                    )}
                    <span className={cn(
                      'truncate max-w-[120px] sm:max-w-[200px]',
                      isMobile && 'max-w-[80px]'
                    )} title={breadcrumb.label}>
                      {breadcrumb.label}
                    </span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link 
                      to={breadcrumb.href}
                      className={cn(
                        'flex items-center gap-2 text-foreground transition-colors hover:text-primary',
                        breadcrumb.isDisabled && 'opacity-50 pointer-events-none'
                      )}
                    >
                      {showIcons && IconComponent && (
                        <IconComponent className="h-4 w-4" />
                      )}
                      <span className={cn(
                        'truncate max-w-[120px] sm:max-w-[200px]',
                        isMobile && 'max-w-[80px]'
                      )} title={breadcrumb.label}>
                        {breadcrumb.label}
                      </span>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              
              {!isLast && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};