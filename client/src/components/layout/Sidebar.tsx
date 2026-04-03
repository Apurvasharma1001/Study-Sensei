import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Calendar, 
  BrainCircuit, 
  GraduationCap, 
  BarChart3, 
  Settings,
  LogOut,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Planner", icon: Calendar, href: "/planner" },
  { label: "AI Tutor", icon: BrainCircuit, href: "/tutor" },
  { label: "Quizzes", icon: GraduationCap, href: "/quizzes" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { logout, logoutMutation, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Signed out",
        description: "Your session has been cleared.",
      });
      setLocation("/login");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: getErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <BookOpen className="w-5 h-5" />
          </div>
          <h1 className="font-heading font-bold text-lg text-sidebar-foreground tracking-tight">
            Study Sensei
          </h1>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a 
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group",
                    isActive 
                      ? "bg-sidebar-accent text-primary font-medium shadow-sm" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon 
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                    )} 
                  />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-sidebar-border">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground w-full transition-colors">
          <Settings className="w-5 h-5" />
          Settings
        </button>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-sidebar-border">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xs">
            {user?.avatarInitials ?? "SS"}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-sidebar-foreground">
              {user?.name ?? "Study Sensei"}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.email ?? "Signed in"}
            </p>
          </div>
          <button
            aria-label="Log out"
            className="text-muted-foreground hover:text-destructive cursor-pointer disabled:opacity-50"
            disabled={logoutMutation.isPending}
            onClick={() => void handleLogout()}
            type="button"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
