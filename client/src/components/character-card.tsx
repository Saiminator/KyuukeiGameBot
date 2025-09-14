import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, Zap, Heart, Swords, Star } from "lucide-react";

interface CharacterStats {
  str: number;
  agi: number;
  sta: number;
  mag: number;
  wit: number;
  wil: number;
  cha: number;
  luk: number;
}

interface CharacterCardProps {
  character: {
    id: string;
    baseCharacterId: string;
    currentStats: CharacterStats;
    rollPercentages: CharacterStats;
    tier: string;
    averagePercentage: number;
    cotdUsed: boolean;
    status: string;
    items: string[];
    isActivePvP?: boolean;
  };
  baseCharacter?: {
    name: string;
    description: string;
  };
  variant?: "candidate" | "collection" | "detailed";
  onSelect?: () => void;
  onSetActive?: () => void;
  showDetails?: boolean;
}

export function CharacterCard({ 
  character, 
  baseCharacter, 
  variant = "collection",
  onSelect,
  onSetActive,
  showDetails = false 
}: CharacterCardProps) {
  const getCharacterImageUrl = (charId: string) => {
    return `https://kyuukei.s3.us-east-2.amazonaws.com/character/${charId.toLowerCase()}/pfp.png`;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'S': return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-50';
      case 'A': return 'bg-green-500 text-green-50';
      case 'B': return 'bg-yellow-500 text-yellow-50';
      case 'C': return 'bg-orange-500 text-orange-50';
      case 'D': return 'bg-red-600 text-red-50';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatStatInline = (stats: CharacterStats) => {
    return `STR:${stats.str} AGI:${stats.agi} STA:${stats.sta} MAG:${stats.mag} WIT:${stats.wit} WIL:${stats.wil} CHA:${stats.cha} LUK:${stats.luk}`;
  };

  const iconSize = variant === "detailed" ? "w-16 h-16" : variant === "candidate" ? "w-12 h-12" : "w-14 h-14";
  const cardPadding = variant === "detailed" ? "p-6" : "p-4";

  return (
    <Card 
      className={`relative ${character.isActivePvP ? 'border-secondary border-2' : ''} ${
        variant === "candidate" ? 'hover:border-primary/50 transition-colors cursor-pointer' : ''
      }`}
      onClick={variant === "candidate" ? onSelect : undefined}
      data-testid={`character-card-${character.id}`}
    >
      <CardContent className={cardPadding}>
        {/* Header with tier and special badges */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex gap-1">
            <Badge className={getTierColor(character.tier)} data-testid={`tier-badge-${character.tier}`}>
              {character.tier}
            </Badge>
            {character.cotdUsed && (
              <Badge className="bg-accent/20 text-accent" data-testid="cotd-badge">
                <Star size={12} className="mr-1" />
                COTD
              </Badge>
            )}
            {character.isActivePvP && (
              <Badge className="bg-secondary/20 text-secondary" data-testid="active-pvp-badge">
                Active
              </Badge>
            )}
          </div>
          {variant === "candidate" && (
            <span className="text-sm text-muted-foreground">
              Avg: {character.averagePercentage}%
            </span>
          )}
        </div>

        {/* Character info */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`${iconSize} bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary overflow-hidden`}>
            <img 
              src={getCharacterImageUrl(character.baseCharacterId)} 
              alt={baseCharacter?.name || character.baseCharacterId}
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                // Fallback to default icon if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-muted-foreground"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/><path d="M3 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/><path d="M12 21c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/><path d="M12 3c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/></svg></div>`;
              }}
              data-testid={`character-image-${character.baseCharacterId}`}
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-card-foreground">
              {baseCharacter?.name || character.baseCharacterId}
            </h3>
            {variant !== "candidate" && (
              <p className="text-xs text-muted-foreground">
                Season 2025S1
              </p>
            )}
            {baseCharacter?.description && variant === "detailed" && (
              <p className="text-sm text-muted-foreground mt-1">
                {baseCharacter.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats display */}
        {variant === "detailed" || showDetails ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(character.currentStats).map(([stat, value]) => (
                <div key={stat} className="text-center p-2 bg-muted/50 rounded">
                  <div className="text-muted-foreground">{stat.toUpperCase()}</div>
                  <div className="font-mono text-card-foreground">{value}</div>
                  {variant === "candidate" && character.rollPercentages && (
                    <div className="text-xs text-primary">
                      ({character.rollPercentages[stat as keyof CharacterStats]}%)
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Items */}
            {character.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Equipment</h4>
                <div className="flex flex-wrap gap-1">
                  {character.items.map((item, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {item.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground font-mono">
            {formatStatInline(character.currentStats)}
          </div>
        )}

        {/* Action buttons */}
        {variant === "collection" && !character.isActivePvP && onSetActive && (
          <Button 
            onClick={onSetActive}
            className="w-full mt-3"
            size="sm"
            data-testid={`button-set-active-${character.id}`}
          >
            Set as PvP Active
          </Button>
        )}

        {variant === "detailed" && (
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={onSetActive}
              variant={character.isActivePvP ? "secondary" : "default"}
              className="flex-1"
              disabled={character.isActivePvP}
              data-testid={`button-set-active-detailed-${character.id}`}
            >
              {character.isActivePvP ? "Currently Active" : "Set as Active"}
            </Button>
            <Button variant="outline" className="flex-1" data-testid={`button-view-details-${character.id}`}>
              View Details
            </Button>
          </div>
        )}

        {variant === "candidate" && (
          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">Click to select for training</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
