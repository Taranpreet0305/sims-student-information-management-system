import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { clearSession, getLastActivity, getSession, updateLastActivity, type Session, type SessionUser } from "@/integrations/firebase/session";

// Session storage keys for persistence
const SESSION_KEYS = {
  USER_TYPE: "user_type",
  SESSION_CHECKED: "session_checked",
  LAST_ACTIVITY: "last_activity",
} as const;

// Session timeout (7 days in milliseconds)
const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000;

export function useSessionPersistence() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Update last activity timestamp
  // Check if session is still valid based on last activity
  const isSessionValid = useCallback(() => {
    const lastActivity = getLastActivity();
    if (!lastActivity) return true;

    const timeSinceActivity = Date.now() - lastActivity;
    return timeSinceActivity < SESSION_TIMEOUT;
  }, []);

  // Handle navigation based on user type
  const handleNavigation = useCallback((userType: string | null, currentPath: string) => {
    const isAuthPage = currentPath === "/student-auth" || currentPath === "/faculty-auth";
    const isHomePage = currentPath === "/";
    
    if (isAuthPage || isHomePage) {
      if (userType === "student") {
        navigate("/student/dashboard", { replace: true });
      } else if (userType === "faculty") {
        navigate("/faculty/dashboard", { replace: true });
      }
    }
  }, [navigate]);

  useEffect(() => {
    let mounted = true;

    // Check for existing session
    const initializeSession = async () => {
      try {
        const existingSession = getSession();
        if (!mounted) return;

        setSession(existingSession);
        setUser(existingSession?.user ?? null);

        // Auto-redirect if user is already logged in and session is valid
        if (existingSession?.user && isSessionValid()) {
          updateLastActivity();
          const userType = localStorage.getItem(SESSION_KEYS.USER_TYPE);
          handleNavigation(userType, location.pathname);
        } else if (existingSession?.user && !isSessionValid()) {
          clearSession();
        }

        setLoading(false);
        setInitialized(true);
        localStorage.setItem(SESSION_KEYS.SESSION_CHECKED, "true");
      } catch (error) {
        console.error("Session initialization error:", error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeSession();

    // Set up activity tracking
    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"];
    const handleActivity = () => {
      if (session) {
        updateLastActivity();
      }
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      mounted = false;
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [navigate, location.pathname, updateLastActivity, isSessionValid, handleNavigation]);

  const signOut = async () => {
    try {
      clearSession();
      localStorage.removeItem(SESSION_KEYS.USER_TYPE);
      localStorage.removeItem(SESSION_KEYS.LAST_ACTIVITY);
      localStorage.removeItem(SESSION_KEYS.SESSION_CHECKED);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return { user, session, loading, signOut, initialized };
}
