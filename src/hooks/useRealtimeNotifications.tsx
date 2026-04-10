import { useEffect, useState } from "react";
import { listDocs, subscribeDocs, updateDocById } from "@/integrations/firebase/firestore";
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

    const seen = new Set<string>();
    let initialized = false;
    const unsubscribe = subscribeDocs<FacultyNotification>(
      "faculty_notifications",
      {
        where: [{ field: "faculty_id", op: "==", value: facultyId }],
        orderBy: { field: "created_at", direction: "desc" },
        limit: 50,
      },
      (docs) => {
        setNotifications(docs);
        setUnreadCount(docs.filter((n) => !n.read).length);
        if (!initialized) {
          docs.forEach((n) => seen.add(n.id));
          initialized = true;
          return;
        }
        docs.forEach((n) => {
          if (seen.has(n.id)) return;
          seen.add(n.id);
          toast.info(n.title, {
            description: n.message,
          });
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [facultyId]);

  const loadNotifications = async () => {
    if (!facultyId) return;

    try {
      const data = await listDocs<FacultyNotification>("faculty_notifications", {
        where: [{ field: "faculty_id", op: "==", value: facultyId }],
        orderBy: { field: "created_at", direction: "desc" },
        limit: 50,
      });

      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDocById("faculty_notifications", notificationId, { read: true });

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
      const unread = notifications.filter((n) => !n.read);
      for (const n of unread) {
        await updateDocById("faculty_notifications", n.id, { read: true });
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
