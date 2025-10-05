import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, TrendingUp, Zap, Award, Crown } from "lucide-react";

const MOCK_LEADERBOARD = [
  { id: 1, name: "Sarah Chen", avatar: "/placeholder.svg", score: 1450, placements: 12, trend: [80, 120, 145] },
  { id: 2, name: "Michael Rodriguez", avatar: "/placeholder.svg", score: 1320, placements: 10, trend: [70, 110, 132] },
  { id: 3, name: "Emma Thompson", avatar: "/placeholder.svg", score: 1180, placements: 9, trend: [65, 95, 118] },
  { id: 4, name: "David Kim", avatar: "/placeholder.svg", score: 1050, placements: 8, trend: [60, 85, 105] },
  { id: 5, name: "Lisa Wang", avatar: "/placeholder.svg", score: 980, placements: 7, trend: [55, 78, 98] },
  { id: 6, name: "James Foster", avatar: "/placeholder.svg", score: 920, placements: 6, trend: [50, 72, 92] },
  { id: 7, name: "Sofia Martinez", avatar: "/placeholder.svg", score: 860, placements: 6, trend: [48, 68, 86] },
  { id: 8, name: "Ryan O'Connor", avatar: "/placeholder.svg", score: 810, placements: 5, trend: [45, 65, 81] },
  { id: 9, name: "Priya Patel", avatar: "/placeholder.svg", score: 780, placements: 5, trend: [42, 62, 78] },
  { id: 10, name: "Alex Johnson", avatar: "/placeholder.svg", score: 740, placements: 4, trend: [40, 58, 74] },
];

const YOUR_RANK = {
  rank: 15,
  name: "You",
  score: 620,
  placements: 4,
  trend: [35, 52, 62],
};

export default function HuntRank() {
  const [activeTab, setActiveTab] = useState("weekly");

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Trophy className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-6 w-6 text-amber-700" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            HuntRank
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Compete. Perform. Win rewards.
          </p>
          <Badge variant="secondary" className="text-sm px-4 py-2">
            <Award className="h-4 w-4 mr-2 inline" />
            Season Reward: +5% Commission Boost
          </Badge>
        </div>

        {/* Your Rank Card */}
        <Card className="p-6 mb-8 border-2 border-primary bg-gradient-to-r from-primary/5 to-purple-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary">#{YOUR_RANK.rank}</div>
              <div>
                <p className="text-lg font-semibold">Your Current Rank</p>
                <p className="text-sm text-muted-foreground">{YOUR_RANK.score} points · {YOUR_RANK.placements} placements</p>
              </div>
            </div>
            <div className="flex gap-1">
              {YOUR_RANK.trend.map((height, i) => (
                <div
                  key={i}
                  className="w-2 bg-primary rounded-t"
                  style={{ height: `${height / 2}px` }}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            <div className="space-y-4">
              {MOCK_LEADERBOARD.map((hunter, index) => (
                <Card
                  key={hunter.id}
                  className={`p-6 transition-all hover:shadow-lg ${
                    index < 3 ? "border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-3 min-w-[80px]">
                        {getRankIcon(index + 1)}
                        <div className="text-2xl font-bold text-muted-foreground">
                          #{index + 1}
                        </div>
                      </div>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={hunter.avatar} />
                        <AvatarFallback>{hunter.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{hunter.name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Zap className="h-4 w-4" />
                            {hunter.score} pts
                          </span>
                          <span>{hunter.placements} placements</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        {hunter.trend.map((height, i) => (
                          <div
                            key={i}
                            className="w-2 bg-primary/60 rounded-t transition-all hover:bg-primary"
                            style={{ height: `${height / 2}px` }}
                          />
                        ))}
                      </div>
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  {index < 3 && (
                    <div className="mt-4 pt-4 border-t">
                      <Badge variant="secondary" className="mr-2">
                        💎 Featured Headhunter
                      </Badge>
                      <Badge variant="secondary">
                        🚀 Priority Visibility
                      </Badge>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="monthly">
            <div className="space-y-4">
              {MOCK_LEADERBOARD.map((hunter, index) => (
                <Card
                  key={hunter.id}
                  className={`p-6 transition-all hover:shadow-lg ${
                    index < 3 ? "border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-3 min-w-[80px]">
                        {getRankIcon(index + 1)}
                        <div className="text-2xl font-bold text-muted-foreground">
                          #{index + 1}
                        </div>
                      </div>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={hunter.avatar} />
                        <AvatarFallback>{hunter.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{hunter.name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Zap className="h-4 w-4" />
                            {hunter.score * 3} pts
                          </span>
                          <span>{hunter.placements * 3} placements</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        {hunter.trend.map((height, i) => (
                          <div
                            key={i}
                            className="w-2 bg-primary/60 rounded-t transition-all hover:bg-primary"
                            style={{ height: `${height / 2}px` }}
                          />
                        ))}
                      </div>
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Points System Info */}
        <Card className="mt-12 p-8 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <h2 className="text-2xl font-bold mb-6 text-center">Points System</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">+10</div>
              <p className="text-sm text-muted-foreground">Qualified Candidate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">+30</div>
              <p className="text-sm text-muted-foreground">Interview Scheduled</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">+100</div>
              <p className="text-sm text-muted-foreground">Successful Placement</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">+5</div>
              <p className="text-sm text-muted-foreground">Fast Response</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
