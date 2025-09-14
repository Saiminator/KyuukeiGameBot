import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharacterCard } from "@/components/character-card";
import { Crown, Swords, Users, Star, ArrowLeft, Shield, Zap, Heart } from "lucide-react";
import { Link } from "wouter";

export default function Characters() {
  const { data: baseChars, isLoading: baseCharsLoading } = useQuery({
    queryKey: ['/api/characters/base'],
  });

  const { data: cotd } = useQuery({
    queryKey: ['/api/cotd'],
  });

  const { data: items } = useQuery({
    queryKey: ['/api/items'],
  });

  const getCharacterIcon = (charId: string) => {
    switch (charId) {
      case 'kyuu': return <Shield className="text-secondary" size={20} />;
      case 'shimi': return <Zap className="text-primary" size={20} />;
      case 'dreymi': return <Heart className="text-accent" size={20} />;
      default: return <Swords className="text-muted-foreground" size={20} />;
    }
  };

  const getStatMaxValue = (stat: string) => {
    // Base stat caps for visual representation
    const caps: { [key: string]: number } = {
      str: 400, agi: 400, sta: 500, mag: 300, 
      wit: 400, wil: 500, cha: 450, luk: 500
    };
    return caps[stat] || 400;
  };

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="characters-page">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/" data-testid="button-back">
                <ArrowLeft size={16} className="mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-primary">Character Database</h1>
              <p className="text-muted-foreground">Detailed information about all available characters</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="characters" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="characters" data-testid="tab-characters">Characters</TabsTrigger>
            <TabsTrigger value="abilities" data-testid="tab-abilities">Signature Abilities</TabsTrigger>
            <TabsTrigger value="items" data-testid="tab-items">Items & Equipment</TabsTrigger>
          </TabsList>

          <TabsContent value="characters" className="space-y-6">
            {/* Character of the Day */}
            {cotd && (
              <Card className="border-accent/50" data-testid="card-cotd-highlight">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="text-accent" size={20} />
                    Character of the Day - {cotd.character?.name}
                  </CardTitle>
                  <CardDescription>
                    Rolling this character grants +10pp bonus to all stats (capped at 115%)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center border-2 border-accent">
                        {getCharacterIcon(cotd.character?.id)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{cotd.character?.name}</h3>
                        <p className="text-sm text-muted-foreground">{cotd.character?.description}</p>
                        <Badge variant="secondary" className="mt-2">
                          <Star size={12} className="mr-1" />
                          COTD Bonus Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Character List */}
            <div className="grid gap-6" data-testid="characters-detailed-list">
              {baseCharsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-32 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))
              ) : baseChars && baseChars.length > 0 ? (
                baseChars.map((char: any) => (
                  <Card key={char.id} className="overflow-hidden" data-testid={`character-card-${char.id}`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary">
                          {getCharacterIcon(char.id)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-2xl">{char.name}</CardTitle>
                            {cotd?.character?.id === char.id && (
                              <Badge className="bg-accent text-accent-foreground">
                                <Star size={12} className="mr-1" />
                                COTD
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-base">{char.description}</CardDescription>
                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="outline" className="font-mono">
                              {char.signatureAbility.replace(/_/g, ' ')}
                            </Badge>
                            {char.canShop && (
                              <Badge variant="secondary">Shop Access</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Base Stats */}
                      <div>
                        <h4 className="font-semibold mb-3 text-card-foreground">Base Statistics</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(char.baseStats).map(([stat, value]) => (
                            <div key={stat} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium text-muted-foreground">{stat.toUpperCase()}</span>
                                <span className="font-mono text-card-foreground">{value as number}</span>
                              </div>
                              <Progress 
                                value={(value as number) / getStatMaxValue(stat) * 100} 
                                className="h-2"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Growth Weights */}
                      <div>
                        <h4 className="font-semibold mb-3 text-card-foreground">Training Efficiency</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          How effectively this character gains stats during training (multipliers)
                        </p>
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                          {Object.entries(char.growthWeights).map(([stat, weight]) => {
                            const efficiency = weight as number;
                            const color = efficiency >= 1.4 ? 'text-accent' : 
                                        efficiency >= 1.2 ? 'text-secondary' : 
                                        efficiency >= 1.0 ? 'text-primary' : 'text-muted-foreground';
                            return (
                              <div key={stat} className="text-center p-2 bg-muted/50 rounded">
                                <div className="text-xs text-muted-foreground">{stat.toUpperCase()}</div>
                                <div className={`font-mono text-sm ${color}`}>
                                  {efficiency.toFixed(1)}x
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No characters available</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="abilities" className="space-y-6">
            <Card data-testid="card-signature-abilities">
              <CardHeader>
                <CardTitle>Signature Abilities</CardTitle>
                <CardDescription>
                  Each character has unique mechanics that define their PvP style
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Kyuu */}
                <div className="border border-secondary/30 rounded-lg p-6 bg-secondary/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center border-2 border-secondary">
                      <Shield className="text-secondary" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground">Kyuu - Regeneration + Seal-Gated Defeat</h3>
                      <Badge variant="secondary">Defensive Specialist</Badge>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      Kyuu regenerates HP each round and is extremely difficult to defeat permanently.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-secondary mb-2">Regeneration</h4>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Recovers 10% max HP per round</li>
                          <li>• Cannot be one-shot eliminated</li>
                          <li>• Maintains pressure over time</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-secondary mb-2">Seal-Gated Defeat</h4>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Must be sealed to defeat permanently</li>
                          <li>• Seal check: Wit+Mag vs Wit+Wil</li>
                          <li>• Anti-regen items provide instant defeat</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shimi */}
                <div className="border border-primary/30 rounded-lg p-6 bg-primary/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary">
                      <Zap className="text-primary" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground">Shimi - Transform Multi-Gate</h3>
                      <Badge variant="default">All-or-Nothing</Badge>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      Shimi attempts a complex 5-stage transformation sequence for instant victory.
                    </p>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-primary">Transformation Gates</h4>
                      <div className="grid gap-2">
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span>1. Approach</span>
                          <span className="text-muted-foreground">Agi+Wit vs Agi+Wit</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span>2. Grapple</span>
                          <span className="text-muted-foreground">Str+Agi vs Str+Agi</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span>3. Overwrite</span>
                          <span className="text-muted-foreground">Wit+Mag vs Wit+Mag</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span>4. Anti-flinch</span>
                          <span className="text-muted-foreground">Opponent Agi vs Shimi Agi</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span>5. Will Override</span>
                          <span className="text-muted-foreground">Wil+Wit vs Wil+Wit (+item bonuses)</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Success at final gate = instant victory. Failure at any gate = basic attack.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dreymi */}
                <div className="border border-accent/30 rounded-lg p-6 bg-accent/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center border-2 border-accent">
                      <Heart className="text-accent" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground">Dreymi - Charm/Drain Snowball</h3>
                      <Badge style={{ backgroundColor: 'hsl(var(--accent))' }} className="text-accent-foreground">
                        Control Specialist
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      Dreymi builds charm stacks to control the opponent and drain their strength.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-accent mb-2">Charm Mechanics</h4>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Charm check: Cha vs Wil</li>
                          <li>• Successful charms apply debuffs</li>
                          <li>• Each stack increases power</li>
                          <li>• Drains HP and heals Dreymi</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-accent mb-2">Domination Victory</h4>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Requires 3+ charm stacks</li>
                          <li>• Final check: Wit vs Wil</li>
                          <li>• Success = instant victory</li>
                          <li>• Countered by high Will resistance</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="space-y-6">
            <Card data-testid="card-items-database">
              <CardHeader>
                <CardTitle>Items & Equipment</CardTitle>
                <CardDescription>
                  Equipment that can be obtained through training, events, or shop purchases
                </CardDescription>
              </CardHeader>
              <CardContent>
                {items ? (
                  <div className="grid gap-4" data-testid="items-list">
                    {items.map((item: any) => (
                      <div key={item.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${
                            item.tags.includes('pvp') ? 'bg-primary/20 border-primary/30' :
                            item.tags.includes('rare') ? 'bg-accent/20 border-accent/30' :
                            'bg-muted border-border'
                          }`}>
                            {item.tags.includes('weapon') ? <Swords size={20} /> :
                             item.tags.includes('defense') ? <Shield size={20} /> :
                             <Star size={20} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-card-foreground">{item.name}</h3>
                              <div className="flex gap-1">
                                {item.tags.map((tag: string) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                            
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Price:</span>
                                  <span className="font-mono text-primary">
                                    {item.price > 0 ? `${item.price} coins` : 'Not for sale'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Availability:</span>
                                  <span>
                                    {item.shopOnly ? 'Shop only' : 'Quest reward'}
                                  </span>
                                </div>
                                {item.stockPerRun && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Stock:</span>
                                    <span>{item.stockPerRun} per training run</span>
                                  </div>
                                )}
                              </div>
                              {item.pvpEffect && (
                                <div>
                                  <span className="text-muted-foreground">PvP Effect:</span>
                                  <p className="text-accent font-medium">{item.pvpEffect}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading items...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
