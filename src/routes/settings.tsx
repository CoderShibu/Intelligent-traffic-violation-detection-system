import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useVigilens } from "@/lib/mock/store";
import { VIOLATION_TYPES } from "@/lib/mock/violationTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Vigilens" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const fineConfig = useVigilens(s => s.fineConfig);
  const updateFine = useVigilens(s => s.updateFine);
  const cameras = useVigilens(s => s.cameras);
  const addCamera = useVigilens(s => s.addCamera);
  const removeCamera = useVigilens(s => s.removeCamera);
  const updateCamera = useVigilens(s => s.updateCamera);
  const demoMode = useVigilens(s => s.demoMode);
  const setDemoMode = useVigilens(s => s.setDemoMode);
  const notify = useVigilens(s => s.notify);
  const setNotify = useVigilens(s => s.setNotify);

  const [newCam, setNewCam] = useState({ name: "", area: "" });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-lg font-semibold">Settings</h1>

      <Section title="Fine Configuration" description="Default fine amounts applied per violation type. Changes affect new violations only.">
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Violation Type</th>
                <th className="p-3 text-left">Default</th>
                <th className="p-3 text-right">Current Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="row-zebra">
              {VIOLATION_TYPES.map(t => (
                <tr key={t.key} className="border-b border-border/40">
                  <td className="p-3 flex items-center gap-2"><t.icon className={`h-4 w-4 ${t.color}`} />{t.label}</td>
                  <td className="p-3 text-xs text-muted-foreground">{formatINR(t.defaultFine)}</td>
                  <td className="p-3 text-right">
                    <Input
                      type="number"
                      value={fineConfig[t.key]}
                      onChange={e => updateFine(t.key, Number(e.target.value) || 0)}
                      className="w-32 ml-auto text-right font-mono bg-background/60"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => toast.success("Fine configuration saved")}><Save className="h-4 w-4 mr-1.5" />Save Changes</Button>
        </div>
      </Section>

      <Section title="Camera Zones" description="Manage active camera locations across the city.">
        <div className="space-y-2">
          {cameras.map(c => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-2">
              <div className="font-mono text-xs text-muted-foreground w-20">{c.id}</div>
              <Input value={c.name} onChange={e => updateCamera(c.id, { name: e.target.value })} className="flex-1 bg-background/60" />
              <Input value={c.area} onChange={e => updateCamera(c.id, { area: e.target.value })} className="w-40 bg-background/60" />
              <Button size="icon" variant="ghost" onClick={() => { removeCamera(c.id); toast.success(`Removed ${c.id}`); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Input placeholder="Camera name" value={newCam.name} onChange={e => setNewCam(s => ({ ...s, name: e.target.value }))} className="bg-background/60" />
          <Input placeholder="Area" value={newCam.area} onChange={e => setNewCam(s => ({ ...s, area: e.target.value }))} className="bg-background/60 w-40" />
          <Button onClick={() => {
            if (!newCam.name || !newCam.area) return;
            addCamera({ name: newCam.name, area: newCam.area, x: 50, y: 50, lat: 12.97, lng: 77.59 });
            setNewCam({ name: "", area: "" });
            toast.success("Camera zone added");
          }}>
            <Plus className="h-4 w-4 mr-1.5" /> Add
          </Button>
        </div>
      </Section>

      <Section title="Admin Profile" description="Your account information.">
        <div className="rounded-lg border border-border bg-background/40 p-4 grid sm:grid-cols-2 gap-4">
          <Field label="Name" value="Admin Kumar" />
          <Field label="Role" value="Traffic Authority" />
          <Field label="Email" value="admin.kumar@vigilens.gov.in" />
          <Field label="Badge ID" value="VG-AUTH-0042" />
        </div>
      </Section>

      <Section title="Notifications" description="Choose how you receive alerts.">
        <div className="rounded-lg border border-border bg-background/40 divide-y divide-border">
          {(["email", "sms", "push"] as const).map(k => (
            <div key={k} className="flex items-center justify-between p-3">
              <div>
                <div className="text-sm capitalize">{k} alerts</div>
                <div className="text-xs text-muted-foreground">Real-time notifications for critical events</div>
              </div>
              <Switch checked={notify[k]} onCheckedChange={(v) => setNotify(k, v)} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="System Mode" description="Demo mode uses simulated data. Live mode requires camera infrastructure.">
        <div className="rounded-lg border border-border bg-background/40 p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">{demoMode ? "Demo Mode (active)" : "Live Mode"}</div>
            <div className="text-xs text-muted-foreground">{demoMode ? "Mock data is being displayed" : "Connected to live camera feeds"}</div>
          </div>
          <Switch checked={demoMode} onCheckedChange={setDemoMode} />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
