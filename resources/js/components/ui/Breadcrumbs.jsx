import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';

const BreadcrumbItem = ({ href, children, active = false }) => {
  if (active) {
    return (
      <span className="text-sm font-medium text-foreground">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'text-sm text-muted-foreground hover:text-foreground transition-colors'
      )}
    >
      {children}
    </Link>
  );
};

const Breadcrumbs = ({ items, className }) => {
  return (
    <nav className={cn('flex items-center space-x-1 text-sm', className)}>
      <BreadcrumbItem href="/dashboard">
        <Home className="h-4 w-4" />
      </BreadcrumbItem>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <BreadcrumbItem
            href={item.href}
            active={index === items.length - 1}
          >
            {item.label}
          </BreadcrumbItem>
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
