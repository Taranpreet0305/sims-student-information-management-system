import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

// Session storage keys for persistence
const SESSION_KEYS = {
  USER_TYPE: "user_type",
  SESSION_CHECKED: "session_checked",
  LAST_ACTIVITY: "last_activity",
} as const;

// Session timeout (7 days in milliseconds)
const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000;

export function useSessionPersistence() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Update last activity timestamp
  const updateLastActivity = useCallback(() => {
    localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, Date.now().toString());
  }, []);

  // Check if session is still valid based on last activity
  const isSessionValid = useCallback(() => {
    const lastActivity = localStorage.getItem(SESSION_KEYS.LAST_ACTIVITY);
    if (!lastActivity) return true;
    
    const timeSinceActivity = Date.now() - parseInt(lastActivity, 10);
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

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Handle session events
        if (event === "SIGNED_IN" && currentSession) {
          updateLastActivity();
          // Defer navigation to avoid auth deadlock
          setTimeout(() => {
            if (!mounted) return;
            const userType = localStorage.getItem(SESSION_KEYS.USER_TYPE);
            if (userType === "student" && !location.pathname.startsWith("/student")) {
              navigate("/student/dashboard", { replace: true });
            } else if (userType === "faculty" && !location.pathname.startsWith("/faculty")) {
              navigate("/faculty/dashboard", { replace: true });
            }
          }, 0);
        }

        if (event === "SIGNED_OUT") {
          localStorage.removeItem(SESSION_KEYS.USER_TYPE);
          localStorage.removeItem(SESSION_KEYS.LAST_ACTIVITY);
          localStorage.removeItem(SESSION_KEYS.SESSION_CHECKED);
          navigate("/", { replace: true });
        }

        if (event === "TOKEN_REFRESHED") {
          updateLastActivity();
        }
      }
    );

    // THEN check for existing session
    const initializeSession = async () => {
      try {
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session retrieval error:", error);
          setLoading(false);
          setInitialized(true);
          return;
        }

        if (!mounted) return;

        setSession(existingSession);
        setUser(existingSession?.user ?? null);

        // Auto-redirect if user is already logged in and session is valid
        if (existingSession?.user && isSessionValid()) {
          updateLastActivity();
          const userType = localStorage.getItem(SESSION_KEYS.USER_TYPE);
          handleNavigation(userType, location.pathname);
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
      subscription.unsubscribe();
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [navigate, location.pathname, updateLastActivity, isSessionValid, handleNavigation]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
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
