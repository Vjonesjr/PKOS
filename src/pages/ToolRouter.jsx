import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { TOOL_FIELDS, DEVICE_FIELDS } from "@/lib/routerFields";
import RecordList from "@/components/router/RecordList";
import TaskRouter from "@/components/router/TaskRouter";

export default function ToolRouter() {
  const { workspace, isSeeding } = useWorkspace();
  const [tools, setTools] = useState([]);
  const [devices, setDevices] = useState([]);

  const load = useCallback(async () => {
    if (isSeeding) return;
    const [t, d] = await Promise.all([
      base44.entities.Tool.filter({ workspace }, "name", 200),
      base44.entities.Device.filter({ workspace }, "name", 100),
    ]);
    setTools(t); setDevices(d);
  }, [workspace, isSeeding]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight pk-grad-text">AI + Tool + Device Router</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick the right AI, tool and machine for each task — based on what you've saved.</p>
      </div>
      <Tabs defaultValue="router">
        <TabsList>
          <TabsTrigger value="router">Task Router</TabsTrigger>
          <TabsTrigger value="tools">AI & Tools ({tools.length})</TabsTrigger>
          <TabsTrigger value="devices">Devices ({devices.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="router" className="mt-5"><TaskRouter workspace={workspace} tools={tools} devices={devices} /></TabsContent>
        <TabsContent value="tools" className="mt-5">
          <RecordList entity={base44.entities.Tool} fields={TOOL_FIELDS} noun="Tool" records={tools} workspace={workspace} onChange={load}
            subtitle={(r) => [r.provider, r.category, r.deployment].filter(Boolean).join(" · ")} />
        </TabsContent>
        <TabsContent value="devices" className="mt-5">
          <RecordList entity={base44.entities.Device} fields={DEVICE_FIELDS} noun="Device" records={devices} workspace={workspace} onChange={load}
            subtitle={(r) => [r.device_type, r.operating_system, r.ram && `${r.ram} RAM`].filter(Boolean).join(" · ")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}