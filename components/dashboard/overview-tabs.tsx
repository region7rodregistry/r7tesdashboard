"use client";

import * as React from "react";
import { LayoutDashboard, School } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UnifiedSchoolsDashboard } from "./unified-schools-dashboard";
import type { UnifiedSchool, UnifiedOverview } from "@/lib/schools-unified";

interface OverviewTabsProps {
  /** Server-rendered summary tab (NTTC headline + module grid). */
  summary: React.ReactNode;
  schools: UnifiedSchool[];
  overview: UnifiedOverview;
}

export function OverviewTabs({ summary, schools, overview }: OverviewTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="h-10">
        <TabsTrigger value="overview" className="px-4">
          <LayoutDashboard /> Overview
        </TabsTrigger>
        <TabsTrigger value="schools" className="px-4">
          <School /> Schools
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-8">
        {summary}
      </TabsContent>

      <TabsContent value="schools">
        <UnifiedSchoolsDashboard schools={schools} overview={overview} />
      </TabsContent>
    </Tabs>
  );
}
