import { useEffect, useState } from "react";
import { formatISTTime } from "@/lib/format";
import { Bell, Shield } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";

const TITLES: Record<string, string> = {
  "/": "Command Dashboard",
  "/violations": "Violations Management",
  "/vehicles": "Vehicle Search & Profile",
  "/payments": "Payment Module",
  "/analytics": "Analytics & Insights",
  "/settings": "Settings",
};

export function TopNav() {
  const [now, setNow] = useState(() => new Date());
  const path = useRouterState({ select: r => r.location.pathname });
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const title = TITLES[path] ?? "Vigilens";

  return (
    <header className="h-14 border-b border-border bg-background/70 backdrop-blur-md flex items-center px-4 md:px-6 gap-4 sticky top-0 z-30">
      <div className="md:hidden flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold tracking-wide">VIGILENS</span>
      </div>
      <div className="hidden md:block">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Live</div>
        <div className="text-sm font-semibold -mt-0.5">{title}</div>
      </div>

      <div className="hidden lg:flex items-center gap-2 ml-4 px-3 py-1.5 rounded-full bg-card border border-border">
        <span className="dot bg-success pulse-dot text-success" />
        <span className="text-xs text-muted-foreground">System Active</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-card border border-border font-mono text-xs tabular-nums">
          <span className="text-muted-foreground">IST</span>
          <span className="text-foreground">{formatISTTime(now)}</span>
        </div>
        <Link to="/violations" className="relative p-2 rounded-md hover:bg-card text-muted-foreground hover:text-foreground transition">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-warning" />
        </Link>
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xs font-semibold">AK</div>
          <div className="hidden md:block leading-tight">
            <div className="text-xs font-medium">Admin Kumar</div>
            <div className="text-[10px] text-muted-foreground">Traffic Authority</div>
          </div>
        </div>
      </div>
    </header>
  );
}
