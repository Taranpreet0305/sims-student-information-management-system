import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FacultyNotification {
  id: string;
  faculty_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  metadata: any;
  created_at: string;
}

export function useRealtimeNotifications(facultyId: string | undefined) {
  const [notifications, setNotifications] = useState<FacultyNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!facultyId) return;

    loadNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('faculty-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'faculty_notifications',
          filter: `faculty_id=eq.${facultyId}`,
        },
        (payload) => {
          const newNotification = payload.new as FacultyNotification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          
          // Show toast notification
          toast.info(newNotification.title, {
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [facultyId]);

  const loadNotifications = async () => {
    if (!facultyId) return;

    try {
      const { data } = await supabase
        .from("faculty_notifications")
        .select("*")
        .eq("faculty_id", facultyId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from("faculty_notifications")
        .update({ read: true })
        .eq("id", notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!facultyId) return;

    try {
      await supabase
        .from("faculty_notifications")
        .update({ read: true })
        .eq("faculty_id", facultyId)
        .eq("read", false);

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };
}
