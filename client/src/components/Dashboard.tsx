import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  AlertTriangle,
  BarChart3,
  PieChart,
  UserPlus,
  Upload,
  Download,
  Plus,
  Clock
} from "lucide-react";

interface AnalyticsData {
  totalLeads: number;
  conversionRate: number;
  pipelineValue: number;
  activeProjects: number;
  leadsByStatus: { status: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
}

export default function Dashboard() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="backdrop-blur-sm bg-slate-800/30 border-slate-700/50 animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-700/30 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Active Pipeline",
      value: analytics?.totalLeads || 1,
      subtitle: `$${analytics?.pipelineValue?.toLocaleString() || '0'} value`,
      icon: TrendingUp,
      color: "from-blue-600 to-blue-800",
      bgColor: "bg-slate-800/50"
    },
    {
      title: "Total Revenue",
      value: `$${0}`,
      subtitle: "Move deals to 'Closed - Won' to track revenue",
      icon: DollarSign,
      color: "from-green-600 to-green-800", 
      bgColor: "bg-green-900/20"
    },
    {
      title: "Conversion Rate",
      value: `${analytics?.conversionRate || 0.0}%`,
      subtitle: "0W / 0L", 
      description: "Close some deals to see conversion rate",
      icon: Percent,
      color: "from-purple-600 to-purple-800",
      bgColor: "bg-purple-900/20"
    },
    {
      title: "Tasks & Alerts",
      value: 2,
      subtitle: "Active agents",
      icon: AlertTriangle,
      color: "from-orange-600 to-orange-800",
      bgColor: "bg-orange-900/20"
    }
  ];

  const leadsByStatus = [
    { status: "New", count: 0 },
    { status: "Contacted", count: 1 },  
    { status: "Qualified", count: 0 },
    { status: "Proposal", count: 0 },
    { status: "Closed - Won", count: 0 },
    { status: "Closed - Lost", count: 0 }
  ];

  const leadSources = [
    { source: "Website", count: 1, color: "bg-blue-500" },
    { source: "Referral", count: 0, color: "bg-green-500" },
    { source: "Cold Call", count: 0, color: "bg-orange-500" },
    { source: "Advertisement", count: 0, color: "bg-red-500" },
    { source: "Other", count: 0, color: "bg-gray-500" }
  ];

  const quickActionStats = [
    { label: "Hot Leads", count: 0, color: "bg-red-600/20 text-red-400" },
    { label: "Overdue", count: 0, color: "bg-yellow-600/20 text-yellow-400" },
    { label: "New", count: 0, color: "bg-blue-600/20 text-blue-400" },
    { label: "Pipeline", count: 0, color: "bg-green-600/20 text-green-400" }
  ];

  const recentActivities = [
    {
      title: "Lead updated: Sarah Johnson",
      time: "2 minutes ago",
      type: "lead"
    },
    {
      title: "New interaction logged",
      time: "1 hour ago", 
      type: "interaction"
    },
    {
      title: "Pipeline status changed",
      time: "3 hours ago",
      type: "status"
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-400" data-testid="dashboard-title">
          Admin Dashboard
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
          Track your leads, monitor performance, and manage your sales pipeline with enterprise-level insights.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <Card key={index} className={`${stat.bgColor} border-slate-700/50 backdrop-blur-sm`}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <p className="text-slate-400 text-xs sm:text-sm font-medium">{stat.title}</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-white mb-1" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {stat.value}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-400">
                      {stat.subtitle}
                    </p>
                    {stat.description && (
                      <p className="text-xs text-slate-500 mt-1">
                        {stat.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lead Status Distribution */}
        <Card className="lg:col-span-4 bg-slate-800/30 border-slate-700/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Lead Status Distribution</h3>
            </div>
            <div className="space-y-4">
              {leadsByStatus.map((item, index) => {
                const maxCount = Math.max(...leadsByStatus.map(l => l.count)) || 1;
                const width = (item.count / maxCount) * 100;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{item.status}</span>
                      <span className="text-slate-400">{item.count}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full">
                      <div 
                        className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card className="lg:col-span-4 bg-slate-800/30 border-slate-700/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="h-5 w-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Lead Sources</h3>
            </div>
            
            <div className="text-center mb-6">
              <h4 className="text-slate-300 font-medium mb-4">Leads by Source</h4>
              {/* Pie Chart Placeholder */}
              <div className="w-48 h-48 mx-auto bg-slate-700/30 rounded-full flex items-center justify-center relative">
                <div className="w-40 h-40 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-32 h-32 bg-slate-800 rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {leadSources.map((source, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-3 h-3 ${source.color} rounded-sm`}></div>
                  <span className="text-sm text-slate-300 flex-1">{source.source}</span>
                  <span className="text-sm text-slate-400">{source.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-4 bg-slate-800/30 border-slate-700/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
              <button className="text-slate-400 text-sm hover:text-slate-300">
                More
              </button>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white justify-center"
                data-testid="button-add-lead"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  data-testid="button-import"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button 
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  data-testid="button-export"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            {/* Status Counters */}
            <div className="grid grid-cols-2 gap-3">
              {quickActionStats.map((stat, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${stat.color} text-center`}
                  data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="text-xl font-bold">{stat.count}</div>
                  <div className="text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-slate-800/30 border-slate-700/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          </div>
          
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-slate-800/20 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-200">{activity.title}</p>
                    <p className="text-xs text-slate-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p>No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}