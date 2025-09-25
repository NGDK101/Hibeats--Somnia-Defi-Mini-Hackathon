import React, { useState } from 'react';
import { Clock, TrendingUp, Calendar, Gift, ChevronDown, RefreshCw, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useRewardHistoryV3 } from '@/hooks/useRewardHistoryV3';
import { cn } from '@/lib/utils';

interface RewardHistoryPanelProps {
  className?: string;
}

export const RewardHistoryPanel: React.FC<RewardHistoryPanelProps> = ({ className }) => {
  const { rewardHistory, rewardSummary, isLoading, isRefreshing, refreshHistory, getRewardTypeDisplay, getRewardTypeIcon, contractActivityRewards } = useRewardHistoryV3();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 4;

  // Period options for dropdown
  const periodOptions = [
    { value: 'today', label: 'Today', icon: '📅' },
    { value: 'week', label: 'This Week', icon: '📊' },
    { value: 'month', label: 'This Month', icon: '🗓️' },
    { value: 'all', label: 'All Time', icon: '⏳' }
  ] as const;

  // Get current period display
  const currentPeriodOption = periodOptions.find(option => option.value === selectedPeriod);

  // Filter events by period
  const filteredHistory = React.useMemo(() => {
    const now = Date.now() / 1000;
    const periods = {
      today: now - (24 * 60 * 60),
      week: now - (7 * 24 * 60 * 60),
      month: now - (30 * 24 * 60 * 60),
      all: 0
    };

    return rewardHistory.filter(event => event.timestamp >= periods[selectedPeriod]);
  }, [rewardHistory, selectedPeriod]);

  // Pagination logic
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

  // Reset to page 1 when period changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod]);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Format amount with highlighting for large amounts
  const formatRewardAmount = (amount: string, streakBonus?: any) => {
    const value = parseFloat(amount);
    const isLarge = value >= 10;
    
    return (
      <div className="text-right">
        <span className={cn(
          "font-bold text-xs",
          isLarge ? "text-yellow-400" : "text-green-400"
        )}>
          +{amount}
        </span>
        <div className="text-[9px] text-muted-foreground">BEATS</div>
        {streakBonus && (
          <div className="text-[9px] text-orange-300 flex items-center gap-0.5">
            🔥 +{streakBonus.bonusAmount}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={cn("bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-96", className)}>
      <CardHeader className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="w-5 h-5 text-white" />
            <h3 className="text-lg font-semibold text-white">Reward History</h3>
            {/* Period Selection Dropdown in Header */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-7 px-2 justify-between bg-transparent border-none hover:bg-white/10 text-xs"
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{currentPeriodOption?.icon}</span>
                    <span className="font-medium text-xs text-muted-foreground">{currentPeriodOption?.label}</span>
                  </div>
                  <ChevronDown className="h-3 w-3 opacity-50 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40 bg-popover/95 backdrop-blur-sm border-border/50">
                {periodOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSelectedPeriod(option.value)}
                    className={cn(
                      "flex items-center gap-1.5 cursor-pointer text-xs py-1.5",
                      selectedPeriod === option.value && "bg-accent text-accent-foreground"
                    )}
                  >
                    <span className="text-xs">{option.icon}</span>
                    <span className="text-xs">{option.label}</span>
                    {selectedPeriod === option.value && (
                      <Badge variant="secondary" className="ml-auto bg-primary/20 text-primary text-[10px] px-1 py-0">
                        ✓
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshHistory}
            disabled={isRefreshing}
            className="h-8 w-8 text-muted-foreground hover:text-white"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-3">
        {/* Summary Stats */}
        <div className="flex flex-col gap-3 mb-3">
          {/* Summary Stats - Vertical Layout */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-2.5 border border-green-500/20">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-green-400 flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">Total Earned</span>
              </div>
              <div className="text-sm font-bold text-green-400 truncate">
                {selectedPeriod === 'today' ? rewardSummary.todayRewards :
                 selectedPeriod === 'week' ? rewardSummary.weeklyRewards :
                 selectedPeriod === 'month' ? rewardSummary.monthlyRewards :
                 rewardSummary.totalRewards} BEATS
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg p-2.5 border border-orange-500/20">
              <div className="flex items-center gap-1.5">
                <span className="text-orange-400 text-xs flex-shrink-0">🔥</span>
                <span className="text-xs text-muted-foreground truncate">Streak Bonus</span>
              </div>
              <div className="text-sm font-bold text-orange-400 truncate">
                {rewardSummary.streakBonusEarned} BEATS
              </div>
            </div>
          </div>
        </div>

        {/* Reward History Content */}
        <ScrollArea className="h-80 pr-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-24">
              <RefreshCw className="w-4 h-4 animate-spin text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Loading rewards...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
              <Gift className="w-5 h-5 mb-1 opacity-50" />
              <p className="text-xs font-medium">No rewards found</p>
              <p className="text-[10px] mt-0.5">Complete activities to earn BEATS!</p>
              <div className="mt-2 text-[10px] text-center space-y-0.5">
                <p>🌅 Daily: 2 BEATS</p>
                <p>🎵 Music: 10 BEATS</p>
                <p>🎨 NFT: 15 BEATS</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Show refresh indicator at the top if refreshing */}
              {isRefreshing && (
                <div className="flex items-center justify-center py-1 text-[10px] text-muted-foreground">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin mr-1" />
                  Updating rewards...
                </div>
              )}
              {paginatedHistory.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2.5 rounded-md bg-background/50 border border-border/30 hover:border-border/60 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center text-sm flex-shrink-0">
                      {getRewardTypeIcon(event.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-xs truncate">
                        {getRewardTypeDisplay(event.type)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate">{formatTimestamp(event.timestamp)}</span>
                        {event.streakBonus && (
                          <Badge variant="secondary" className="text-[9px] bg-orange-500/20 text-orange-300 px-1 py-0 h-4">
                            Day {event.streakBonus.streakDays}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {formatRewardAmount(event.amount, event.streakBonus)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0"
                      onClick={() => window.open(`https://shannon-explorer.somnia.network/tx/${event.transactionHash}`, '_blank')}
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Pagination Controls */}
        {filteredHistory.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-3 h-3 mr-1" />
              Prev
            </Button>
            
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white">
                {filteredHistory.length} total
              </Badge>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-white disabled:opacity-30"
            >
              Next
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};