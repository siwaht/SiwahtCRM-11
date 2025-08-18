import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import TabNavigation from "@/components/TabNavigation";
import Dashboard from "@/components/Dashboard";
import LeadsTable from "@/components/LeadsTable";
import KanbanBoard from "@/components/KanbanBoard";
import ProductCatalog from "@/components/ProductCatalog";
import EngineeringDashboard from "@/components/EngineeringDashboard";
import AdminPanel from "@/components/AdminPanel";

type TabType = "dashboard" | "leads-table" | "kanban" | "products" | "engineering" | "admin";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const { user } = useAuth();

  if (!user) return null;


  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "leads-table":
        return <LeadsTable />;
      case "kanban":
        return <KanbanBoard />;
      case "products":
        return <ProductCatalog />;
      case "engineering":
        return <EngineeringDashboard />;
      case "admin":
        return <AdminPanel />;
      default:
        return <Dashboard />;
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} userRole={(user as any).user?.role || user.role} />
      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        {renderTabContent()}
      </main>
    </div>
  );
}
