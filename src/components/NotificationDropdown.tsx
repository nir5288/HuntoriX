import { Bell, Check, Mail, UserPlus, AlertCircle, Briefcase, CheckCircle, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

export const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, markAsUnread } = useNotifications();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_message':
        return <Mail className="h-4 w-4 text-[hsl(var(--accent-mint))]" />;
      case 'application_received':
        return <UserPlus className="h-4 w-4 text-[hsl(var(--accent-lilac))]" />;
      case 'job_invitation':
        return <Briefcase className="h-4 w-4 text-[hsl(var(--accent-pink))]" />;
      case 'status_change':
        return <AlertCircle className="h-4 w-4 text-[hsl(var(--warning))]" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const handleNotificationClick = async (notification: Notification, markRead: boolean = true) => {
    if (markRead && !notification.is_read) {
      await markAsRead(notification.id);
    }
    
    const payload = notification.payload as any;
    
    switch (notification.type) {
      case 'new_message':
        if (payload.job_id && payload.from_user) {
          navigate(`/messages?job=${payload.job_id}&with=${payload.from_user}`);
        } else {
          navigate('/messages');
        }
        break;
      case 'application_received':
        if (payload.job_id) {
          navigate(`/jobs/${payload.job_id}`);
        }
        break;
      case 'job_invitation':
        if (payload.job_id) {
          navigate(`/jobs/${payload.job_id}`);
        }
        break;
      case 'status_change':
        if (payload.job_id) {
          navigate(`/jobs/${payload.job_id}`);
        }
        break;
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleMarkAsUnread = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await markAsUnread(notificationId);
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-80 bg-background z-[60]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-1 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
            <div className="py-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 cursor-pointer group relative hover:bg-accent/30 ${
                    !notification.is_read ? 'bg-accent/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1 pr-10 min-w-0">
                    <p className={`text-sm ${!notification.is_read ? 'font-semibold' : ''}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {!notification.is_read ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleMarkAsRead(e, notification.id)}
                            className="h-7 w-7"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleMarkAsUnread(e, notification.id)}
                            className="h-7 w-7"
                          >
                            <Circle className="h-4 w-4" />
                          </Button>
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        {!notification.is_read ? 'Mark as read' : 'Mark as unread'}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};