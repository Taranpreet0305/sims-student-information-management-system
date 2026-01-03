import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StudentNotification {
  id: string;
  title: string;
  message: string;
  type: 'notice' | 'marks' | 'placement' | 'attendance';
  read: boolean;
  created_at: string;
}

// Simple in-memory notification store for students
const notificationStore: StudentNotification[] = [];
let notificationListeners: ((notifications: StudentNotification[]) => void)[] = [];

const notifyListeners = () => {
  notificationListeners.forEach(listener => listener([...notificationStore]));
};

export function useStudentNotifications(enrollmentNumber: string | undefined) {
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);

  useEffect(() => {
    // Register listener
    notificationListeners.push(setNotifications);
    setNotifications([...notificationStore]);

    return () => {
      notificationListeners = notificationListeners.filter(l => l !== setNotifications);
    };
  }, []);

  useEffect(() => {
    if (!enrollmentNumber) return;

    // Subscribe to new notices
    const noticesChannel = supabase
      .channel('student-notices')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotice = payload.new as any;
          const notification: StudentNotification = {
            id: newNotice.id,
            title: newNotice.title,
            message: newNotice.message,
            type: 'notice',
            read: false,
            created_at: newNotice.created_at,
          };
          notificationStore.unshift(notification);
          notifyListeners();
          
          toast.info("📢 New Notice", {
            description: newNotice.title,
            duration: 5000,
          });
        }
      )
      .subscribe();

    // Subscribe to new marks
    const marksChannel = supabase
      .channel('student-marks-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'student_marks',
          filter: `enrollment_number=eq.${enrollmentNumber}`,
        },
        (payload) => {
          const newMark = payload.new as any;
          const notification: StudentNotification = {
            id: newMark.id,
            title: "New Marks Updated",
            message: `Your marks for ${newMark.subject} have been uploaded`,
            type: 'marks',
            read: false,
            created_at: newMark.created_at,
          };
          notificationStore.unshift(notification);
          notifyListeners();
          
          toast.success("📝 Marks Updated", {
            description: `Your ${newMark.subject} marks are now available`,
            duration: 5000,
          });
        }
      )
      .subscribe();

    // Subscribe to new placements
    const placementsChannel = supabase
      .channel('student-placements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'placements',
        },
        (payload) => {
          const newPlacement = payload.new as any;
          const notification: StudentNotification = {
            id: newPlacement.id,
            title: "New Placement Opportunity",
            message: `${newPlacement.company_name} - ${newPlacement.title}`,
            type: 'placement',
            read: false,
            created_at: newPlacement.created_at,
          };
          notificationStore.unshift(notification);
          notifyListeners();
          
          toast.success("💼 New Placement", {
            description: `${newPlacement.company_name} is hiring!`,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(noticesChannel);
      supabase.removeChannel(marksChannel);
      supabase.removeChannel(placementsChannel);
    };
  }, [enrollmentNumber]);

  const markAsRead = useCallback((id: string) => {
    const idx = notificationStore.findIndex(n => n.id === id);
    if (idx !== -1) {
      notificationStore[idx].read = true;
      notifyListeners();
    }
  }, []);

  const clearAll = useCallback(() => {
    notificationStore.length = 0;
    notifyListeners();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markAsRead, clearAll };
}
