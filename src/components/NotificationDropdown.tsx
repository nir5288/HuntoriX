import { Bell, Check, Mail, UserPlus, AlertCircle, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

export const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_message':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'new_application':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'job_invitation':
        return <Briefcase className="h-4 w-4 text-purple-500" />;
      case 'status_change':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const payload = notification.payload as any;
    
    switch (notification.type) {
      case 'new_message':
        return `New message from ${payload.sender_name || 'someone'}`;
      case 'new_application':
        return `${payload.headhunter_name || 'A headhunter'} applied to "${payload.job_title}"`;
      case 'job_invitation':
        return `${payload.employer_name || 'An employer'} invited you to "${payload.job_title}"`;
      case 'status_change':
        return payload.message || 'Application status changed';
      default:
        return 'New notification';
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    
    const payload = notification.payload as any;
    
    switch (notification.type) {
      case 'new_message':
        if (payload.job_id && payload.sender_id) {
          navigate(`/messages?job=${payload.job_id}&with=${payload.sender_id}`);
        } else {
          navigate('/messages');
        }
        break;
      case 'new_application':
        if (payload.job_id) {
          navigate(`/job/${payload.job_id}`);
        }
        break;
      case 'job_invitation':
        if (payload.job_id) {
          navigate(`/job/${payload.job_id}`);
        }
        break;
      case 'status_change':
        if (payload.job_id) {
          navigate(`/job/${payload.job_id}`);
        }
        break;
    }
  };

  return (
    <DropdownMenu>
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
      <DropdownMenuContent align="end" className="w-80 bg-background">
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
          <ScrollArea className="max-h-96">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start gap-3 p-3 cursor-pointer ${
                  !notification.is_read ? 'bg-accent/50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className={`text-sm ${!notification.is_read ? 'font-semibold' : ''}`}>
                    {getNotificationText(notification)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
