import { useLocation, Link } from "react-router-dom";
import { Home, Calendar, FileText, Bell, Briefcase, Vote, BookOpen, MessageSquare } from "lucide-react";

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface MobileNavProps {
  items: NavItem[];
}

export function MobileNav({ items }: MobileNavProps) {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t lg:hidden safe-area-bottom">
      <div className="grid grid-cols-4 gap-0.5 px-1 py-1.5">
        {items.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-md transition-all ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-muted/50 active:scale-95"
              }`}
            >
              <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
              <span className="text-[10px] sm:text-xs font-medium truncate w-full text-center leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Student Navigation Items
export const studentNavItems: NavItem[] = [
  { path: "/student/dashboard", icon: Home, label: "Home" },
  { path: "/student/attendance", icon: Calendar, label: "Attendance" },
  { path: "/student/marks", icon: FileText, label: "Marks" },
  { path: "/student/notices", icon: Bell, label: "Notices" },
];

// Faculty Navigation Items
export const facultyNavItems: NavItem[] = [
  { path: "/faculty/dashboard", icon: Home, label: "Home" },
  { path: "/faculty/approve-students", icon: Vote, label: "Approve" },
  { path: "/faculty/add-attendance", icon: Calendar, label: "Attendance" },
  { path: "/faculty/notices", icon: Bell, label: "Notices" },
];
