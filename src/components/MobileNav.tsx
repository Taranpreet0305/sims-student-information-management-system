import { useLocation, Link } from "react-router-dom";
import { Home, Calendar, FileText, Bell, Vote, Menu, Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/components/ThemeProvider";
import { useState } from "react";

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
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Show first 3 items + menu button
  const visibleItems = items.slice(0, 3);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50 lg:hidden safe-area-bottom shadow-lg">
      <div className="flex items-center justify-around px-2 py-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl transition-all ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md scale-105" 
                  : "text-muted-foreground hover:bg-muted/50 active:scale-95"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
        
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 h-auto rounded-xl text-muted-foreground hover:bg-muted/50"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span className="text-[10px] font-medium">Theme</span>
        </Button>

        {/* More Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 h-auto rounded-xl text-muted-foreground hover:bg-muted/50"
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium">More</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
            <div className="grid grid-cols-4 gap-3 pb-4">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl transition-all ${
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "bg-muted/50 text-muted-foreground hover:bg-muted active:scale-95"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-medium text-center leading-tight">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
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
