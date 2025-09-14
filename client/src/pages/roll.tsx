import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CharacterCard } from "@/components/character-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Dice6, Star, Clock, RefreshCw } from "lucide-react";
import { Link } from "wouter";

interface CharacterInstance {
  id: string;
  baseCharacterId: string;
  currentStats: {
    str: number;
    agi: number;
    sta: number;
    mag: number;
    wit: number;
    wil: number;
    cha: number;
    luk: number;
  };
  rollPercentages: {
    str: number;
    agi: number;
    sta: number;
    mag: number;
    wit: number;
    wil: number;
    cha: number;
    luk: number;
  };
  tier: string;
  averagePercentage: number;
  cotdUsed: boolean;
  status: string;
  items: string[];
}

interface BaseCharacter {
  id: string;
  name: string;
  description: string;
}

export default function Roll() {
  const { toast } = useToast();
  const [testUserId, setTestUserId] = useState("user123");
  const [rollCandidates, setRollCandidates] = useState<CharacterInstance[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  const { data: baseChars } = useQuery({
    queryKey: ['/api/characters/base'],
  });

  const { data: cotd } = useQuery({
    queryKey: ['/api/cotd'],
  });

  const { data: healthCheck } = useQuery({
    queryKey: ['/api/health'],
  });

  // Generate roll candidates mutation
  const rollMutation = useMutation({
    mutationFn: async (data: { userId: string; count: number }) => {
      const response = await apiRequest('POST', '/api/test/roll', data);
      return response.json();
    },
    onSuccess: (data: CharacterInstance[]) => {
      setRollCandidates(data);
      setSelectedCandidate(null);
      toast({
        title: "Roll Generated!",
        description: `Generated ${data.length} character candidates`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate character roll",
        variant: "destructive",
      });
    },
  });

  const handleRoll = () => {
    rollMutation.mutate({
      userId: testUserId,
      count: 5,
    });
  };

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidate(candidateId);
    const candidate = rollCandidates.find(c => c.id === candidateId);
    if (candidate) {
      toast({
        title: "Character Selected!",
        description: `Selected ${getCharacterName(candidate.baseCharacterId)} (Tier ${candidate.tier}) for training`,
      });
    }
  };

  const getCharacterName = (characterId: string): string => {
    const baseChar = baseChars?.find((char: BaseCharacter) => char.id === characterId);
    return baseChar?.name || characterId;
  };

  const getCharacterData = (characterId: string): BaseCharacter | undefined => {
    return baseChars?.find((char: BaseCharacter) => char.id === characterId);
  };

  const isOnline = healthCheck?.status === 'healthy';

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="roll-page">
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
                <h1 className="text-3xl font-bold text-primary">Character Roll</h1>
                <p className="text-muted-foreground">Roll for new character candidates</p>
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

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Character of the Day */}
        {cotd && (
          <Card data-testid="card-cotd-info">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="text-accent" size={20} />
                Character of the Day Bonus
              </CardTitle>
              <CardDescription>
                Get +10pp bonus to all stats when rolling {cotd.character?.name} (capped at 115%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <img 
                  src={`https://kyuukei.s3.us-east-2.amazonaws.com/character/${cotd.character?.id.toLowerCase()}/pfp.png`}
                  alt={cotd.character?.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-accent"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div>
                  <h3 className="font-semibold">{cotd.character?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {cotd.character?.description}
                  </p>
                </div>
                <Badge className="bg-accent/20 text-accent ml-auto">
                  COTD Bonus Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Roll Controls */}
        <Card data-testid="card-roll-controls">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dice6 className="text-primary" size={20} />
              Roll for Characters
            </CardTitle>
            <CardDescription>
              Generate 5 character candidates with random stats (70-115% range)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-id">User ID (for testing)</Label>
                <Input
                  id="user-id"
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                  placeholder="Enter user ID"
                  className="w-48"
                  data-testid="input-user-id"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleRoll}
                  disabled={rollMutation.isPending || !testUserId}
                  size="lg"
                  data-testid="button-roll"
                >
                  {rollMutation.isPending ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Rolling...
                    </>
                  ) : (
                    <>
                      <Dice6 size={16} className="mr-2" />
                      Roll Characters
                    </>
                  )}
                </Button>
              </div>
            </div>

            {rollCandidates.length === 0 && !rollMutation.isPending && (
              <div className="text-center py-8">
                <Clock className="mx-auto text-muted-foreground mb-2" size={48} />
                <p className="text-muted-foreground">
                  Click "Roll Characters" to generate candidates
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roll Results */}
        {rollCandidates.length > 0 && (
          <Card data-testid="card-roll-results">
            <CardHeader>
              <CardTitle>Character Candidates</CardTitle>
              <CardDescription>
                Select a character to begin training. You can only choose one!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {rollCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className={`relative ${
                      selectedCandidate === candidate.id 
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                        : ''
                    }`}
                  >
                    <CharacterCard
                      character={candidate}
                      baseCharacter={getCharacterData(candidate.baseCharacterId)}
                      variant="candidate"
                      onSelect={() => handleSelectCandidate(candidate.id)}
                      showDetails={true}
                    />
                    {selectedCandidate === candidate.id && (
                      <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                        Selected
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {selectedCandidate && (
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Ready to start training?</h3>
                      <p className="text-sm text-muted-foreground">
                        In the Discord bot, this character would be sent to your DMs for training
                      </p>
                    </div>
                    <Button size="lg" data-testid="button-start-training">
                      Start Training
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How Rolling Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground font-bold mt-0.5">1</div>
                <div>
                  <p className="font-medium">Roll Candidates</p>
                  <p className="text-muted-foreground">Generate 5 random character candidates with varying stats</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground font-bold mt-0.5">2</div>
                <div>
                  <p className="font-medium">Choose Wisely</p>
                  <p className="text-muted-foreground">Select one candidate to train - this choice is permanent</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground font-bold mt-0.5">3</div>
                <div>
                  <p className="font-medium">Begin Training</p>
                  <p className="text-muted-foreground">Train your character through DMs to improve their abilities</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stat Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="font-medium">STR</span> - Strength/Attack</div>
                <div><span className="font-medium">AGI</span> - Agility/Speed</div>
                <div><span className="font-medium">STA</span> - Stamina/HP</div>
                <div><span className="font-medium">MAG</span> - Magic Power</div>
                <div><span className="font-medium">WIT</span> - Precision/Control</div>
                <div><span className="font-medium">WIL</span> - Mental Resistance</div>
                <div><span className="font-medium">CHA</span> - Charisma/Charm</div>
                <div><span className="font-medium">LUK</span> - Luck Factor</div>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground">
                  Roll percentages range from 70-115%. Higher percentages result in better stats!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}