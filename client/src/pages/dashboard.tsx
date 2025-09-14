import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Crown, Dice1, Swords, Users, Star, Trophy, Gamepad2 } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();

  const { data: cotd, isLoading: cotdLoading } = useQuery({
    queryKey: ['/api/cotd'],
  });

  const { data: baseChars, isLoading: baseCharsLoading } = useQuery({
    queryKey: ['/api/characters/base'],
  });

  const { data: healthCheck } = useQuery({
    queryKey: ['/api/health'],
  });

  const isOnline = healthCheck?.status === 'healthy';

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="dashboard-page">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Gamepad2 className="text-primary-foreground" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-primary">Kyuukei Discord Bot</h1>
                <p className="text-muted-foreground">Collect → Train → Lock → Battle</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-secondary' : 'bg-destructive'}`}></div>
              <span className="text-sm text-muted-foreground">
                {isOnline ? 'Bot Online' : 'Bot Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="characters" data-testid="tab-characters">Characters</TabsTrigger>
            <TabsTrigger value="instructions" data-testid="tab-instructions">How to Play</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Character of the Day */}
            <Card data-testid="card-cotd">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="text-accent" size={20} />
                  Character of the Day
                </CardTitle>
                <CardDescription>
                  Get +10pp bonus to all stats when rolling this character (capped at 115%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cotdLoading ? (
                  <div className="h-16 bg-muted animate-pulse rounded" data-testid="cotd-loading" />
                ) : cotd ? (
                  <div className="flex items-center gap-4" data-testid="cotd-display">
                    <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center border-2 border-secondary">
                      <Crown className="text-secondary" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground">{cotd.character?.name}</h3>
                      <p className="text-sm text-muted-foreground">{cotd.character?.description}</p>
                      <Badge variant="secondary" className="mt-1">
                        <Star size={12} className="mr-1" />
                        COTD Bonus Active
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No Character of the Day set</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card data-testid="card-discord-commands">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dice1 className="text-primary" size={20} />
                    Discord Commands
                  </CardTitle>
                  <CardDescription>Use these commands in Discord</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="bg-muted p-2 rounded font-mono text-sm">
                    <span className="text-primary">/roll</span> - Roll for characters (hourly)
                  </div>
                  <div className="bg-muted p-2 rounded font-mono text-sm">
                    <span className="text-primary">/collection</span> - View your characters
                  </div>
                  <div className="bg-muted p-2 rounded font-mono text-sm">
                    <span className="text-primary">/pvp @user</span> - Challenge to battle
                  </div>
                  <div className="bg-muted p-2 rounded font-mono text-sm">
                    <span className="text-primary">/resume</span> - Continue training
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-game-flow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="text-secondary" size={20} />
                    Game Flow
                  </CardTitle>
                  <CardDescription>How the game works</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">1</div>
                    <span className="text-sm">Roll characters hourly</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">2</div>
                    <span className="text-sm">Train in DMs (14 days)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">3</div>
                    <span className="text-sm">Character locks to collection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">4</div>
                    <span className="text-sm">Challenge others in PvP</span>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-stats-system">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="text-accent" size={20} />
                    8-Stat System
                  </CardTitle>
                  <CardDescription>Character attributes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>STR</strong> - Strength/Attack</div>
                    <div><strong>AGI</strong> - Agility/Speed</div>
                    <div><strong>STA</strong> - Stamina/HP</div>
                    <div><strong>MAG</strong> - Magic Power</div>
                    <div><strong>WIT</strong> - Precision/Control</div>
                    <div><strong>WIL</strong> - Mental Resistance</div>
                    <div><strong>CHA</strong> - Charisma/Charm</div>
                    <div><strong>LUK</strong> - Luck Factor</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/characters" data-testid="link-characters">
                  <Users size={16} className="mr-2" />
                  View All Characters
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin" data-testid="link-admin">
                  <Crown size={16} className="mr-2" />
                  Admin Panel
                </Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="characters" className="space-y-6">
            <Card data-testid="card-available-characters">
              <CardHeader>
                <CardTitle>Available Characters</CardTitle>
                <CardDescription>
                  These characters can be rolled and trained
                </CardDescription>
              </CardHeader>
              <CardContent>
                {baseCharsLoading ? (
                  <div className="grid gap-4" data-testid="characters-loading">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : baseChars && baseChars.length > 0 ? (
                  <div className="grid gap-4" data-testid="characters-list">
                    {baseChars.map((char: any) => (
                      <div key={char.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary">
                            <Swords className="text-primary" size={20} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-card-foreground">
                              {char.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {char.description}
                            </p>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline">
                                {char.signatureAbility.replace(/_/g, ' ')}
                              </Badge>
                              {char.canShop && (
                                <Badge variant="secondary">Can Shop</Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              {Object.entries(char.baseStats).map(([stat, value]) => (
                                <div key={stat} className="text-center p-1 bg-muted/50 rounded">
                                  <div className="text-muted-foreground">{stat.toUpperCase()}</div>
                                  <div className="font-mono text-card-foreground">{value as number}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No characters available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instructions" className="space-y-6">
            <Card data-testid="card-instructions">
              <CardHeader>
                <CardTitle>How to Play Kyuukei</CardTitle>
                <CardDescription>
                  Complete guide to the Discord bot game
                </CardDescription>
              </CardHeader>
              <CardContent className="prose prose-invert max-w-none">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Invite the Kyuukei bot to your Discord server</li>
                      <li>Use <code className="bg-muted px-1 rounded">/roll</code> to get your first character batch</li>
                      <li>Choose one character to start training</li>
                      <li>Training will continue in DMs for 14 days</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Character Rolling</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Roll once per hour for 5-10 character candidates</li>
                      <li>Each stat rolls 70-115% of base values</li>
                      <li>Character of the Day gets +10pp bonus (capped at 115%)</li>
                      <li>Tier ranking: S (110%+), A (100-109%), B (90-99%), C (80-89%), D (70-79%)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Training System</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Training happens in DMs with 3 daily options</li>
                      <li>Regular training focuses on 1-2 stats</li>
                      <li>Events provide bigger rewards but may have risks</li>
                      <li>Shop access allows purchasing items and equipment</li>
                      <li>Auto-save prevents progress loss</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">PvP Combat</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Challenge other players with locked characters</li>
                      <li>Battles use opposed checks (A vs B = A/(A+B) chance)</li>
                      <li>Signature abilities: Transform (Shimi), Regeneration (Kyuu), Charm (Dreymi)</li>
                      <li>Items provide tactical advantages and counters</li>
                      <li>Detailed battle narration shows key moments</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Signature Abilities</h3>
                    <div className="space-y-3 text-sm">
                      <div className="bg-muted p-3 rounded">
                        <strong>Kyuu - Regeneration + Seal-Gated Defeat:</strong>
                        <p>Regenerates HP each turn. To defeat Kyuu, opponents must succeed at Seal checks or use Anti-Regen items.</p>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <strong>Shimi - Transform Multi-Gate:</strong>
                        <p>5-stage transformation: Approach → Grapple → Overwrite → Anti-flinch → Will. Success at final gate = instant win.</p>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <strong>Dreymi - Charm/Drain Snowball:</strong>
                        <p>Charm applies debuffs and drains HP. Multiple charm stacks can lead to Domination victory.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
