import React, { useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';

interface NotificationIconProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

export const NotificationIcon: React.FC<NotificationIconProps> = ({
  className,
  variant = 'ghost',
  size = 'default'
}) => {
  const { unreadCount, isLoading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  return (
    <div className="relative">
      <Button
        variant={variant}
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          'relative transition-all duration-200',
          buttonSizeClasses[size],
          unreadCount > 0 && 'text-blue-500 hover:text-blue-600',
          className
        )}
        title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        {unreadCount > 0 ? (
          <BellRing className={cn(sizeClasses[size], 'animate-pulse')} />
        ) : (
          <Bell className={sizeClasses[size]} />
        )}

        {/* Notification Badge */}
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className={cn(
              'absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold',
              'animate-pulse bg-red-500 hover:bg-red-600',
              size === 'sm' && 'h-4 w-4 text-[10px] -top-0.5 -right-0.5',
              size === 'lg' && 'h-6 w-6 text-sm -top-2 -right-2'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-50" />
          </div>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 top-full mt-2 z-50">
            <NotificationDropdown onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};