import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Table, 
  Columns, 
  Package, 
  Settings, 
  ShieldCheck 
} from "lucide-react";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: string;
}

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, roles: ["admin", "agent", "engineer"] },
  { id: "leads-table", label: "Leads", icon: Table, roles: ["admin", "agent", "engineer"] },
  { id: "kanban", label: "Pipeline", icon: Columns, roles: ["admin", "agent", "engineer"] },
  { id: "products", label: "Products", icon: Package, roles: ["admin", "agent"] },
  { id: "engineering", label: "Engineering", icon: Settings, roles: ["admin", "engineer"] },
  { id: "admin", label: "Admin", icon: ShieldCheck, roles: ["admin"] },
];

export default function TabNavigation({ activeTab, onTabChange, userRole }: TabNavigationProps) {
  const availableTabs = tabs.filter(tab => tab.roles.includes(userRole));
  


  return (
    <nav className="bg-slate-800/30 border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto scrollbar-hide">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-300"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
