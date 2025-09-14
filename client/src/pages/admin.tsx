import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Crown, Calendar, TestTube, Database, Users } from "lucide-react";
import { Link } from "wouter";

export default function Admin() {
  const { toast } = useToast();
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [testUserId, setTestUserId] = useState("");
  const [rollCount, setRollCount] = useState("5");

  const { data: baseChars } = useQuery({
    queryKey: ['/api/characters/base'],
  });

  const { data: cotd } = useQuery({
    queryKey: ['/api/cotd'],
  });

  const { data: healthCheck } = useQuery({
    queryKey: ['/api/health'],
  });

  // Set Character of the Day mutation
  const setCOTDMutation = useMutation({
    mutationFn: async (data: { date: string; characterId: string }) => {
      const response = await apiRequest('POST', '/api/admin/cotd', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cotd'] });
      toast({
        title: "Success",
        description: "Character of the Day updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to update Character of the Day",
        variant: "destructive",
      });
    },
  });

  // Test roll generation mutation
  const testRollMutation = useMutation({
    mutationFn: async (data: { userId: string; count: number }) => {
      const response = await apiRequest('POST', '/api/test/roll', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test Roll Generated",
        description: `Generated ${data.length} character candidates`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate test roll",
        variant: "destructive",
      });
    },
  });

  const handleSetCOTD = () => {
    if (!selectedCharacter) {
      toast({
        title: "Error",
        description: "Please select a character",
        variant: "destructive",
      });
      return;
    }

    setCOTDMutation.mutate({
      date: selectedDate,
      characterId: selectedCharacter,
    });
  };

  const handleTestRoll = () => {
    if (!testUserId) {
      toast({
        title: "Error", 
        description: "Please enter a user ID",
        variant: "destructive",
      });
      return;
    }

    testRollMutation.mutate({
      userId: testUserId,
      count: parseInt(rollCount, 10),
    });
  };

  const isOnline = healthCheck?.status === 'healthy';

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="admin-page">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/" data-testid="button-back">
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-primary">Admin Panel</h1>
                <p className="text-muted-foreground">Manage the Kyuukei Discord Bot</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-secondary' : 'bg-destructive'}`}></div>
              <span className="text-sm text-muted-foreground">
                Bot {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="cotd" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cotd" data-testid="tab-cotd">
              <Calendar size={16} className="mr-2" />
              COTD
            </TabsTrigger>
            <TabsTrigger value="testing" data-testid="tab-testing">
              <TestTube size={16} className="mr-2" />
              Testing
            </TabsTrigger>
            <TabsTrigger value="database" data-testid="tab-database">
              <Database size={16} className="mr-2" />
              Database
            </TabsTrigger>
            <TabsTrigger value="monitoring" data-testid="tab-monitoring">
              <Users size={16} className="mr-2" />
              Monitoring
            </TabsTrigger>
          </TabsList>

          {/* Character of the Day Management */}
          <TabsContent value="cotd" className="space-y-6">
            <Card data-testid="card-cotd-management">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="text-accent" size={20} />
                  Character of the Day Management
                </CardTitle>
                <CardDescription>
                  Set which character receives the +10pp rolling bonus
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current COTD */}
                {cotd && (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-4" data-testid="current-cotd">
                    <h3 className="font-semibold mb-2">Current Character of the Day</h3>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-accent text-accent-foreground">
                        {cotd.character?.name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Date: {cotd.date}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {cotd.character?.description}
                    </p>
                  </div>
                )}

                {/* Set New COTD */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Set New Character of the Day</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cotd-date">Date</Label>
                      <Input
                        id="cotd-date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        data-testid="input-cotd-date"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cotd-character">Character</Label>
                      <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
                        <SelectTrigger data-testid="select-cotd-character">
                          <SelectValue placeholder="Select character" />
                        </SelectTrigger>
                        <SelectContent>
                          {baseChars?.map((char: any) => (
                            <SelectItem key={char.id} value={char.id}>
                              {char.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleSetCOTD}
                    disabled={setCOTDMutation.isPending || !selectedCharacter}
                    data-testid="button-set-cotd"
                  >
                    {setCOTDMutation.isPending ? "Setting..." : "Set Character of the Day"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testing Tools */}
          <TabsContent value="testing" className="space-y-6">
            <Card data-testid="card-testing-tools">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="text-secondary" size={20} />
                  Testing Tools
                </CardTitle>
                <CardDescription>
                  Test game mechanics and functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Test Character Roll */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Test Character Roll Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate character candidates for testing purposes
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="test-user-id">User ID</Label>
                      <Input
                        id="test-user-id"
                        placeholder="Enter test user ID"
                        value={testUserId}
                        onChange={(e) => setTestUserId(e.target.value)}
                        data-testid="input-test-user-id"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="roll-count">Number of Candidates</Label>
                      <Select value={rollCount} onValueChange={setRollCount}>
                        <SelectTrigger data-testid="select-roll-count">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 candidates</SelectItem>
                          <SelectItem value="5">5 candidates</SelectItem>
                          <SelectItem value="7">7 candidates</SelectItem>
                          <SelectItem value="10">10 candidates</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleTestRoll}
                    disabled={testRollMutation.isPending || !testUserId}
                    data-testid="button-test-roll"
                  >
                    {testRollMutation.isPending ? "Generating..." : "Generate Test Roll"}
                  </Button>
                </div>

                {/* API Endpoints */}
                <div className="space-y-4">
                  <h3 className="font-semibold">API Endpoints</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-sm">
                    <div><span className="text-secondary">GET</span> /api/health - Health check</div>
                    <div><span className="text-secondary">GET</span> /api/cotd - Current Character of the Day</div>
                    <div><span className="text-secondary">GET</span> /api/characters/base - Base character data</div>
                    <div><span className="text-secondary">GET</span> /api/items - Available items</div>
                    <div><span className="text-primary">POST</span> /api/test/roll - Generate test character roll</div>
                    <div><span className="text-primary">POST</span> /api/test/pvp - Simulate PvP battle</div>
                    <div><span className="text-primary">POST</span> /api/admin/cotd - Set Character of the Day</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Status */}
          <TabsContent value="database" className="space-y-6">
            <Card data-testid="card-database-status">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="text-primary" size={20} />
                  Database Status
                </CardTitle>
                <CardDescription>
                  Current database configuration and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Storage Configuration</h3>
                    <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Storage Type:</span>
                        <Badge variant="outline">In-Memory</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Persistence:</span>
                        <Badge variant="outline">Session-based</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Auto-save:</span>
                        <Badge variant="secondary">Enabled</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Data Counts</h3>
                    <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Base Characters:</span>
                        <span className="font-mono">{baseChars?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Available Items:</span>
                        <span className="font-mono">4</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Content Blocks:</span>
                        <span className="font-mono">10+</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-600 mb-2">Development Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    This application is running with in-memory storage. All data will be lost when the server restarts.
                    For production deployment, configure a persistent database connection.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring */}
          <TabsContent value="monitoring" className="space-y-6">
            <Card data-testid="card-monitoring">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="text-accent" size={20} />
                  System Monitoring
                </CardTitle>
                <CardDescription>
                  Monitor bot performance and system health
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Bot Status</h3>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-secondary' : 'bg-destructive'}`}></div>
                      <span className={isOnline ? 'text-secondary' : 'text-destructive'}>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Server Uptime</h3>
                    <p className="text-sm text-muted-foreground">
                      {healthCheck ? 'Active' : 'Unknown'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Last Health Check</h3>
                    <p className="text-sm text-muted-foreground">
                      {healthCheck?.timestamp 
                        ? new Date(healthCheck.timestamp).toLocaleString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Environment Variables</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>DISCORD_BOT_TOKEN:</span>
                      <Badge variant={process.env.VITE_DISCORD_BOT_TOKEN ? "secondary" : "destructive"}>
                        {process.env.VITE_DISCORD_BOT_TOKEN ? "Set" : "Missing"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>NODE_ENV:</span>
                      <Badge variant="outline">{process.env.NODE_ENV || 'development'}</Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-600 mb-2">Discord Bot Requirements</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    For the Discord bot to function properly, ensure:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• DISCORD_BOT_TOKEN environment variable is set</li>
                    <li>• Bot has necessary Discord permissions (Send Messages, Use Slash Commands, etc.)</li>
                    <li>• Bot is invited to target Discord servers</li>
                    <li>• Server is accessible from Discord's perspective</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
