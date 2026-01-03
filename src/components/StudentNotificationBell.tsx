import { Bell, FileText, Briefcase, Calendar, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudentNotifications, StudentNotification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

interface StudentNotificationBellProps {
  enrollmentNumber: string;
}

const getIcon = (type: StudentNotification['type']) => {
  switch (type) {
    case 'notice':
      return <Bell className="h-4 w-4 text-blue-500" />;
    case 'marks':
      return <FileText className="h-4 w-4 text-green-500" />;
    case 'placement':
      return <Briefcase className="h-4 w-4 text-purple-500" />;
    case 'attendance':
      return <Calendar className="h-4 w-4 text-orange-500" />;
    default:
      return <BookOpen className="h-4 w-4 text-muted-foreground" />;
  }
};

export function StudentNotificationBell({ enrollmentNumber }: StudentNotificationBellProps) {
  const { notifications, unreadCount, markAsRead, clearAll } = useStudentNotifications(enrollmentNumber);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[10px] sm:text-xs animate-pulse"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs h-7"
            >
              Clear all
            </Button>
          )}
        </div>
        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">You'll be notified of new updates</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 20).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 cursor-pointer hover:bg-accent/50 transition-colors ${
                    !notification.read ? "bg-accent/30" : ""
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-1 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
