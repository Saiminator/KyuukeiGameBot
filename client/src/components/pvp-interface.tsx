import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Swords, Shield, Zap, Heart, Trophy, Share, RotateCcw, Target } from "lucide-react";

interface PvPStats {
  str: number;
  agi: number;
  sta: number;
  mag: number;
  wit: number;
  wil: number;
  cha: number;
  luk: number;
}

interface PvPCharacter {
  id: string;
  baseCharacterId: string;
  currentStats: PvPStats;
  tier: string;
  items: string[];
  userId: string;
}

interface BattleStep {
  type: string;
  description: string;
  values?: any;
}

interface PvPResult {
  match: {
    id: string;
    winner?: string;
    battleLog: BattleStep[];
    narration: string;
    createdAt: string;
  };
  challenger: PvPCharacter;
  opponent: PvPCharacter;
}

interface PvPInterfaceProps {
  result: PvPResult;
  challengerName: string;
  opponentName: string;
  onChallengeNew: () => void;
  onShareResults: () => void;
  isLoading?: boolean;
}

export function PvPInterface({ 
  result, 
  challengerName,
  opponentName,
  onChallengeNew,
  onShareResults,
  isLoading = false 
}: PvPInterfaceProps) {
  const getTierEmoji = (tier: string) => {
    switch (tier) {
      case 'S': return '🌟';
      case 'A': return '🟢';
      case 'B': return '🟡';
      case 'C': return '🟠';
      case 'D': return '🔴';
      default: return '⚪';
    }
  };

  const getCharacterIcon = (charId: string) => {
    switch (charId) {
      case 'kyuu': return <Shield className="text-secondary" size={20} />;
      case 'shimi': return <Zap className="text-primary" size={20} />;
      case 'dreymi': return <Heart className="text-accent" size={20} />;
      default: return <Swords className="text-muted-foreground" size={20} />;
    }
  };

  const getResultColor = (isWinner: boolean, isDraw: boolean) => {
    if (isDraw) return 'text-muted-foreground';
    return isWinner ? 'text-secondary' : 'text-destructive';
  };

  const formatStatValue = (stats: PvPStats) => {
    return `STR:${stats.str} AGI:${stats.agi} STA:${stats.sta} MAG:${stats.mag} WIT:${stats.wit} WIL:${stats.wil} CHA:${stats.cha} LUK:${stats.luk}`;
  };

  const isChallenerWinner = result.match.winner === result.challenger.userId;
  const isDraw = !result.match.winner;

  return (
    <div className="space-y-6" data-testid="pvp-interface">
      {/* Battle Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="text-destructive" size={20} />
            PvP Battle Results
          </CardTitle>
          <CardDescription>
            {isDraw ? (
              "The battle ends in a draw!"
            ) : (
              `${isChallenerWinner ? challengerName : opponentName} emerges victorious!`
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="results" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="results" data-testid="tab-results">Battle Results</TabsTrigger>
          <TabsTrigger value="chronicle" data-testid="tab-chronicle">Battle Chronicle</TabsTrigger>
          <TabsTrigger value="analysis" data-testid="tab-analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-6">
          {/* Battle Participants */}
          <div className="grid md:grid-cols-2 gap-4" data-testid="battle-participants">
            {/* Challenger */}
            <Card className={`${isChallenerWinner ? 'border-secondary border-2' : isDraw ? 'border-muted' : 'border-destructive/50'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center border-2 border-secondary">
                    {getCharacterIcon(result.challenger.baseCharacterId)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-card-foreground">
                      {challengerName}'s {result.challenger.baseCharacterId}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge className={`tier-${result.challenger.tier.toLowerCase()}`}>
                        {result.challenger.tier}
                      </Badge>
                      <span className={`text-sm font-medium ${getResultColor(isChallenerWinner, isDraw)}`}>
                        {isDraw ? 'DRAW' : isChallenerWinner ? 'WINNER' : 'DEFEATED'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground font-mono">
                    {formatStatValue(result.challenger.currentStats)}
                  </div>
                  
                  {result.challenger.items.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Equipment</h4>
                      <div className="flex flex-wrap gap-1">
                        {result.challenger.items.map((item, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {item.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Opponent */}
            <Card className={`${!isChallenerWinner && !isDraw ? 'border-secondary border-2' : isDraw ? 'border-muted' : 'border-destructive/50'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary">
                    {getCharacterIcon(result.opponent.baseCharacterId)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-card-foreground">
                      {opponentName}'s {result.opponent.baseCharacterId}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge className={`tier-${result.opponent.tier.toLowerCase()}`}>
                        {result.opponent.tier}
                      </Badge>
                      <span className={`text-sm font-medium ${getResultColor(!isChallenerWinner, isDraw)}`}>
                        {isDraw ? 'DRAW' : !isChallenerWinner ? 'WINNER' : 'DEFEATED'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground font-mono">
                    {formatStatValue(result.opponent.currentStats)}
                  </div>
                  
                  {result.opponent.items.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Equipment</h4>
                      <div className="flex flex-wrap gap-1">
                        {result.opponent.items.map((item, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {item.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Victory Summary */}
          <Card className={isDraw ? 'bg-muted/10' : isChallenerWinner ? 'bg-secondary/10' : 'bg-primary/10'}>
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className={isDraw ? 'text-muted-foreground' : isChallenerWinner ? 'text-secondary' : 'text-primary'} size={24} />
                <h3 className="text-xl font-bold">
                  {isDraw ? 'Battle Draw' : `${isChallenerWinner ? challengerName : opponentName} Wins!`}
                </h3>
              </div>
              <p className="text-muted-foreground">
                {isDraw 
                  ? "Both fighters fought valiantly to a standstill"
                  : `${isChallenerWinner ? result.challenger.baseCharacterId : result.opponent.baseCharacterId} proved superior in combat`
                }
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chronicle" className="space-y-6">
          {/* Battle Narration */}
          <Card data-testid="battle-chronicle">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="text-primary" size={20} />
                Battle Chronicle
              </CardTitle>
              <CardDescription>
                Detailed account of the battle events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                {result.match.narration}
              </div>
            </CardContent>
          </Card>

          {/* Battle Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Battle Events</CardTitle>
              <CardDescription>
                Step-by-step breakdown of key battle moments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.match.battleLog.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {step.type.replace(/_/g, ' ')}
                        </Badge>
                        {step.values?.success !== undefined && (
                          <Badge variant={step.values.success ? "secondary" : "destructive"} className="text-xs">
                            {step.values.success ? 'SUCCESS' : 'FAILED'}
                          </Badge>
                        )}
                        {step.values?.chance && (
                          <span className="text-xs text-muted-foreground">
                            {step.values.chance}% chance
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {/* Battle Statistics */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card data-testid="key-rolls">
              <CardHeader>
                <CardTitle className="text-lg">Key Rolls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.match.battleLog
                    .filter(step => step.values?.chance)
                    .map((step, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{step.type.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={step.values.success ? "secondary" : "outline"} className="text-xs">
                            {step.values.chance}%
                          </Badge>
                          <span className={`text-xs ${step.values.success ? 'text-secondary' : 'text-muted-foreground'}`}>
                            {step.values.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="effects-used">
              <CardHeader>
                <CardTitle className="text-lg">Effects Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Show signature abilities and item effects */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Signature Abilities</span>
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  </div>
                  
                  {result.challenger.items.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Challenger Items</span>
                      <Badge variant="secondary" className="text-xs">
                        {result.challenger.items.length} equipped
                      </Badge>
                    </div>
                  )}
                  
                  {result.opponent.items.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Opponent Items</span>
                      <Badge variant="secondary" className="text-xs">
                        {result.opponent.items.length} equipped
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Match Details */}
          <Card>
            <CardHeader>
              <CardTitle>Match Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Match ID:</span>
                  <span className="font-mono">{result.match.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Battle Date:</span>
                  <span>{new Date(result.match.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Rounds:</span>
                  <span>{result.match.battleLog.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Result:</span>
                  <span className={getResultColor(!isDraw, isDraw)}>
                    {isDraw ? 'Draw' : 'Decisive Victory'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          onClick={onChallengeNew}
          disabled={isLoading}
          className="flex-1"
          data-testid="button-challenge-new"
        >
          <Target size={16} className="mr-2" />
          Challenge Another Player
        </Button>
        <Button 
          variant="outline"
          onClick={onShareResults}
          disabled={isLoading}
          data-testid="button-share-results"
        >
          <Share size={16} className="mr-2" />
          Share Results
        </Button>
      </div>
    </div>
  );
}
