import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export function useSessionPersistence() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Handle session events
        if (event === "SIGNED_IN" && session) {
          // Defer navigation to avoid auth deadlock
          setTimeout(() => {
            const userType = localStorage.getItem("user_type");
            if (userType === "student" && !location.pathname.startsWith("/student")) {
              navigate("/student/dashboard");
            } else if (userType === "faculty" && !location.pathname.startsWith("/faculty")) {
              navigate("/faculty/dashboard");
            }
          }, 0);
        }

        if (event === "SIGNED_OUT") {
          localStorage.removeItem("user_type");
          navigate("/");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Auto-redirect if user is already logged in
      if (session?.user) {
        const userType = localStorage.getItem("user_type");
        const isAuthPage = location.pathname === "/student-auth" || location.pathname === "/faculty-auth";
        const isHomePage = location.pathname === "/";

        if (isAuthPage || isHomePage) {
          if (userType === "student") {
            navigate("/student/dashboard");
          } else if (userType === "faculty") {
            navigate("/faculty/dashboard");
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user_type");
    navigate("/");
  };

  return { user, session, loading, signOut };
}
