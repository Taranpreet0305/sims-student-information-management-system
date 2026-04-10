import { useEffect, useState, useCallback } from "react";
import { subscribeDocs } from "@/integrations/firebase/firestore";
import { toast } from "sonner";

export interface StudentNotification {
  id: string;
  title: string;
  message: string;
  type: "notice" | "marks" | "placement" | "attendance";
  read: boolean;
  created_at: string;
}

// Simple in-memory notification store for students
const notificationStore: StudentNotification[] = [];
let notificationListeners: ((notifications: StudentNotification[]) => void)[] = [];

const notifyListeners = () => {
  notificationListeners.forEach((listener) => listener([...notificationStore]));
};

export function useStudentNotifications(enrollmentNumber: string | undefined) {
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);

  useEffect(() => {
    // Register listener
    notificationListeners.push(setNotifications);
    setNotifications([...notificationStore]);

    return () => {
      notificationListeners = notificationListeners.filter((l) => l !== setNotifications);
    };
  }, []);

  useEffect(() => {
    if (!enrollmentNumber) return;

    const seenNotices = new Set<string>();
    const seenMarks = new Set<string>();
    const seenPlacements = new Set<string>();
    let initializedNotices = false;
    let initializedMarks = false;
    let initializedPlacements = false;

    const unsubscribeNotices = subscribeDocs<any>(
      "notifications",
      { orderBy: { field: "created_at", direction: "desc" }, limit: 50 },
      (docs) => {
        if (!initializedNotices) {
          docs.forEach((d) => seenNotices.add(d.id));
          initializedNotices = true;
          return;
        }
        docs.forEach((newNotice) => {
          if (seenNotices.has(newNotice.id)) return;
          seenNotices.add(newNotice.id);
          const notification: StudentNotification = {
            id: newNotice.id,
            title: newNotice.title,
            message: newNotice.message,
            type: "notice",
            read: false,
            created_at: newNotice.created_at,
          };
          notificationStore.unshift(notification);
          notifyListeners();

          toast.info("New Notice", {
            description: newNotice.title,
            duration: 5000,
          });
        });
      }
    );

    const unsubscribeMarks = subscribeDocs<any>(
      "student_marks",
      {
        where: [{ field: "enrollment_number", op: "==", value: enrollmentNumber }],
        orderBy: { field: "created_at", direction: "desc" },
        limit: 50,
      },
      (docs) => {
        if (!initializedMarks) {
          docs.forEach((d) => seenMarks.add(d.id));
          initializedMarks = true;
          return;
        }
        docs.forEach((newMark) => {
          if (seenMarks.has(newMark.id)) return;
          seenMarks.add(newMark.id);
          const notification: StudentNotification = {
            id: newMark.id,
            title: "New Marks Updated",
            message: `Your marks for ${newMark.subject} have been uploaded`,
            type: "marks",
            read: false,
            created_at: newMark.created_at,
          };
          notificationStore.unshift(notification);
          notifyListeners();

          toast.success("Marks Updated", {
            description: `Your ${newMark.subject} marks are now available`,
            duration: 5000,
          });
        });
      }
    );

    const unsubscribePlacements = subscribeDocs<any>(
      "placements",
      { orderBy: { field: "created_at", direction: "desc" }, limit: 50 },
      (docs) => {
        if (!initializedPlacements) {
          docs.forEach((d) => seenPlacements.add(d.id));
          initializedPlacements = true;
          return;
        }
        docs.forEach((newPlacement) => {
          if (seenPlacements.has(newPlacement.id)) return;
          seenPlacements.add(newPlacement.id);
          const notification: StudentNotification = {
            id: newPlacement.id,
            title: "New Placement Opportunity",
            message: `${newPlacement.company_name} - ${newPlacement.title}`,
            type: "placement",
            read: false,
            created_at: newPlacement.created_at,
          };
          notificationStore.unshift(notification);
          notifyListeners();

          toast.success("New Placement", {
            description: `${newPlacement.company_name} is hiring!`,
            duration: 5000,
          });
        });
      }
    );

    return () => {
      unsubscribeNotices();
      unsubscribeMarks();
      unsubscribePlacements();
    };
  }, [enrollmentNumber]);

  const markAsRead = useCallback((id: string) => {
    const idx = notificationStore.findIndex((n) => n.id === id);
    if (idx !== -1) {
      notificationStore[idx].read = true;
      notifyListeners();
    }
  }, []);

  const clearAll = useCallback(() => {
    notificationStore.length = 0;
    notifyListeners();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markAsRead, clearAll };
}
