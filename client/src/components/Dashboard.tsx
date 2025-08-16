import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Percent, 
  DollarSign, 
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  UserPlus,
  Handshake,
  Phone
} from "lucide-react";

export default function Dashboard() {
  const { data: analytics, isLoading } = useQuery({
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
      title: "Total Leads",
      value: analytics?.totalLeads || 0,
      change: "+12% this month",
      trend: "up" as const,
      icon: Users,
      color: "from-indigo-500 to-purple-600"
    },
    {
      title: "Conversion Rate",
      value: `${analytics?.conversionRate || 0}%`,
      change: "+3.2% this month",
      trend: "up" as const,
      icon: Percent,
      color: "from-emerald-500 to-teal-600"
    },
    {
      title: "Pipeline Value",
      value: `$${analytics?.pipelineValue?.toLocaleString() || 0}`,
      change: "-2.1% this month",
      trend: "down" as const,
      icon: DollarSign,
      color: "from-amber-500 to-orange-600"
    },
    {
      title: "Active Projects",
      value: analytics?.activeProjects || 0,
      change: "+5 new projects",
      trend: "up" as const,
      icon: Activity,
      color: "from-purple-500 to-pink-600"
    }
  ];

  const recentActivities = [
    {
      icon: UserPlus,
      iconColor: "indigo",
      title: "New lead added: TechCorp Solutions",
      time: "2 minutes ago • by Sarah Johnson"
    },
    {
      icon: Handshake,
      iconColor: "emerald",
      title: "Deal closed: $12,000 AI Chatbot Project",
      time: "1 hour ago • by Mike Chen"
    },
    {
      icon: Phone,
      iconColor: "purple",
      title: "Follow-up call completed with RetailPlus Inc",
      time: "3 hours ago • by Alex Rivera"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? TrendingUp : stat.trend === "down" ? TrendingDown : Minus;
          const trendColor = stat.trend === "up" ? "text-emerald-400" : stat.trend === "down" ? "text-amber-400" : "text-indigo-400";
          
          return (
            <Card key={index} className="backdrop-blur-sm bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {stat.value}
                    </p>
                    <p className={`text-xs mt-1 flex items-center space-x-1 ${trendColor}`}>
                      <TrendIcon className="h-3 w-3" />
                      <span>{stat.change}</span>
                    </p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pipeline Chart */}
        <Card className="backdrop-blur-sm bg-slate-800/30 border-slate-700/50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Lead Pipeline Distribution</h3>
            <div className="h-64 flex items-center justify-center bg-slate-800/20 rounded-lg">
              <div className="text-center">
                <Activity className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Pipeline Distribution Chart</p>
                <p className="text-xs text-slate-500 mt-2">Chart.js Doughnut Chart Implementation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card className="backdrop-blur-sm bg-slate-800/30 border-slate-700/50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
            <div className="h-64 flex items-center justify-center bg-slate-800/20 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Revenue Trend Chart</p>
                <p className="text-xs text-slate-500 mt-2">Recharts Line Chart Implementation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="backdrop-blur-sm bg-slate-800/30 border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Recent Activities</h3>
            <button className="text-indigo-400 hover:text-indigo-300 text-sm" data-testid="button-view-all">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              const iconColorMap = {
                indigo: "bg-indigo-500/20 text-indigo-400",
                emerald: "bg-emerald-500/20 text-emerald-400",
                purple: "bg-purple-500/20 text-purple-400"
              };
              
              return (
                <div key={index} className="flex items-center space-x-4 p-4 bg-slate-800/20 rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColorMap[activity.iconColor as keyof typeof iconColorMap]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-slate-400">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
