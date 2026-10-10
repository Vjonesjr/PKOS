import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GoalsTab from "@/components/goals/GoalsTab";
import HabitsTab from "@/components/habits/HabitsTab";

export default function Goals() {
  const tab = new URLSearchParams(window.location.search).get("tab") === "habits" ? "habits" : "goals";
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Goals & Habits</h1>
        <p className="mt-1 text-sm text-muted-foreground">Outcomes you're working toward, and the routines that get you there.</p>
      </div>
      <Tabs defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="habits">Habits</TabsTrigger>
        </TabsList>
        <TabsContent value="goals" className="mt-4"><GoalsTab /></TabsContent>
        <TabsContent value="habits" className="mt-4"><HabitsTab /></TabsContent>
      </Tabs>
    </div>
  );
}