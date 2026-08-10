import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ShieldAlert, Search, CreditCard, BarChart3, Settings, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/",          label: "Dashboard",     icon: LayoutDashboard },
  { to: "/violations",label: "Violations",    icon: ShieldAlert },
  { to: "/vehicles",  label: "Vehicle Search",icon: Search },
  { to: "/payments",  label: "Payments",      icon: CreditCard },
  { to: "/analytics", label: "Analytics",     icon: BarChart3 },
  { to: "/settings",  label: "Settings",      icon: Settings },
] as const;

export function Sidebar() {
  const path = useRouterState({ select: r => r.location.pathname });
  return (
    <aside className="hidden md:flex w-60 flex-col bg-sidebar border-r border-sidebar-border shrink-0">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="relative h-8 w-8 rounded-md bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-lg shadow-primary/30">
          <Eye className="h-4 w-4 text-white" />
          <div className="absolute inset-0 rounded-md ring-1 ring-white/20" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-wide text-sidebar-foreground">VIGILENS</div>
          <div className="text-[10px] text-muted-foreground tracking-widest">TRAFFIC INTEL</div>
        </div>
      </div>
      <nav className="p-2 space-y-1 flex-1">
        {ITEMS.map(it => {
          const active = it.to === "/" ? path === "/" : path.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                active
                  ? "bg-primary/15 text-primary border border-primary/30 shadow-[inset_0_0_20px_rgba(59,130,246,0.15)]"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{it.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary pulse-dot text-primary" />}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <div className="rounded-md bg-card/70 border border-border p-3 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="dot bg-success pulse-dot text-success" />
            <span className="font-medium">System Online</span>
          </div>
          <div className="text-muted-foreground">12 cameras streaming · AI v2.4</div>
        </div>
      </div>
    </aside>
  );
}
