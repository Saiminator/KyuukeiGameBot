import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dumbbell, Zap, Store, Star, Clock, Save, AlertTriangle } from "lucide-react";

interface TrainingStats {
  str: number;
  agi: number;
  sta: number;
  mag: number;
  wit: number;
  wil: number;
  cha: number;
  luk: number;
}

interface TrainingOption {
  id: string;
  label: string;
  kind: "training" | "event";
  primaryTag?: string;
  preFlair?: string;
  postFlair?: string;
  statGains?: Partial<TrainingStats>;
  coinGain?: number;
  injuryRisk?: number;
  openShop?: boolean;
}

interface TrainingCharacter {
  id: string;
  baseCharacterId: string;
  currentStats: TrainingStats;
  tier: string;
  trainingDay: number;
  maxTrainingDays: number;
  coins: number;
  items: string[];
  injuries: string[];
}

interface TrainingInterfaceProps {
  character: TrainingCharacter;
  characterName: string;
  options: TrainingOption[];
  sessionId: string;
  onChoiceSelect: (optionId: string) => void;
  onContinueTraining: () => void;
  isLoading?: boolean;
  lastResult?: {
    block: TrainingOption;
    statGains?: Partial<TrainingStats>;
    coinGain?: number;
    newItems?: string[];
    openShop?: boolean;
    postFlair?: string;
  };
}

export function TrainingInterface({ 
  character, 
  characterName,
  options, 
  sessionId,
  onChoiceSelect,
  onContinueTraining,
  isLoading = false,
  lastResult
}: TrainingInterfaceProps) {
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

  const formatStatGains = (gains: Partial<TrainingStats> | undefined) => {
    if (!gains) return 'No stat changes';
    
    const formatted = Object.entries(gains)
      .filter(([_, value]) => value && value !== 0)
      .map(([stat, value]) => `${stat.toUpperCase()}: +${value}`)
      .join(', ');
    
    return formatted || 'No stat changes';
  };

  const getStatProgress = (currentValue: number, statName: string) => {
    // Calculate progress as percentage towards stat cap (999)
    return (currentValue / 999) * 100;
  };

  const getOptionIcon = (option: TrainingOption) => {
    if (option.kind === "event") return <Zap className="text-accent" size={20} />;
    if (option.openShop) return <Store className="text-secondary" size={20} />;
    return <Dumbbell className="text-primary" size={20} />;
  };

  const getOptionVariant = (option: TrainingOption) => {
    if (option.kind === "event") return "secondary";
    if (option.openShop) return "outline";
    return "default";
  };

  return (
    <div className="space-y-6" data-testid="training-interface">
      {/* Training Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="text-secondary" size={20} />
            Training Session - Day {character.trainingDay}/{character.maxTrainingDays}
          </CardTitle>
          <CardDescription>
            Training with <strong>{characterName}</strong> {getTierEmoji(character.tier)}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Character Status */}
      <Card className="border-secondary/30" data-testid="character-status">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center border-2 border-secondary">
              <Dumbbell className="text-secondary" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-card-foreground">{characterName}</h3>
              <div className="flex items-center gap-2">
                <Badge className={`tier-${character.tier.toLowerCase()}`}>
                  {character.tier}
                </Badge>
                <span className="text-secondary text-sm">In Training</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Coins</div>
              <div className="text-primary font-mono text-lg">{character.coins.toLocaleString()}</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {Object.entries(character.currentStats).map(([stat, value]) => (
              <div key={stat} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{stat.toUpperCase()}</span>
                  <span className="text-card-foreground font-mono">{value}</span>
                </div>
                <Progress 
                  value={getStatProgress(value, stat)} 
                  className="h-2" 
                />
              </div>
            ))}
          </div>

          {/* Items and Injuries */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Equipment</h4>
              <div className="flex flex-wrap gap-1">
                {character.items.length > 0 ? (
                  character.items.map((item, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {item.replace(/_/g, ' ')}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No items</span>
                )}
              </div>
            </div>
            
            {character.injuries.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Injuries</h4>
                <div className="flex flex-wrap gap-1">
                  {character.injuries.map((injury, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      <AlertTriangle size={10} className="mr-1" />
                      {injury}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Last Result */}
      {lastResult && (
        <Card className="bg-accent/5 border-accent/30" data-testid="training-result">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Star size={20} />
              Training Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastResult.postFlair && (
              <p className="text-sm text-muted-foreground italic">
                {lastResult.postFlair}
              </p>
            )}
            
            <div className="grid md:grid-cols-3 gap-4">
              {lastResult.statGains && (
                <div>
                  <h4 className="font-medium text-accent mb-1">Stat Gains</h4>
                  <p className="text-sm">{formatStatGains(lastResult.statGains)}</p>
                </div>
              )}
              
              {lastResult.coinGain && lastResult.coinGain > 0 && (
                <div>
                  <h4 className="font-medium text-accent mb-1">Coins Earned</h4>
                  <p className="text-sm font-mono">+{lastResult.coinGain}</p>
                </div>
              )}
              
              {lastResult.newItems && lastResult.newItems.length > 0 && (
                <div>
                  <h4 className="font-medium text-accent mb-1">Items Obtained</h4>
                  <p className="text-sm">{lastResult.newItems.join(', ')}</p>
                </div>
              )}
            </div>

            {lastResult.openShop && (
              <div className="bg-secondary/10 border border-secondary/30 rounded p-3">
                <div className="flex items-center gap-2">
                  <Store className="text-secondary" size={16} />
                  <span className="font-medium text-secondary">Shop Access Available</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  You can now visit the merchant to purchase items and equipment.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Training Options */}
      {options.length > 0 && (
        <Card data-testid="training-options">
          <CardHeader>
            <CardTitle>Choose Your Training</CardTitle>
            <CardDescription>
              Select one of the available training options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {options.map((option, index) => (
              <Button
                key={option.id}
                variant={getOptionVariant(option)}
                className="w-full h-auto p-4 justify-start text-left"
                onClick={() => onChoiceSelect(option.id)}
                disabled={isLoading}
                data-testid={`training-option-${index}`}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    {getOptionIcon(option)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{option.label}</h3>
                      {option.kind === "event" && (
                        <Badge variant="secondary" className="text-xs">
                          <Zap size={10} className="mr-1" />
                          Special Event
                        </Badge>
                      )}
                    </div>
                    
                    {option.preFlair && option.kind === "event" && (
                      <p className="text-sm text-muted-foreground">
                        {option.preFlair}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {formatStatGains(option.statGains)}
                        {option.coinGain && option.coinGain > 0 && ` • +${option.coinGain} coins`}
                      </span>
                      {option.injuryRisk && option.injuryRisk > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle size={10} className="mr-1" />
                          {option.injuryRisk}% injury risk
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Continue Training Button */}
      {options.length === 0 && !lastResult?.openShop && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Button
              onClick={onContinueTraining}
              disabled={isLoading}
              data-testid="button-continue-training"
            >
              <Clock size={16} className="mr-2" />
              Continue to Next Day
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Auto-save indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Save className="text-secondary" size={12} />
          <span>Auto-saved</span>
        </div>
        <span>Owner only • Progress is automatically saved</span>
      </div>
    </div>
  );
}
