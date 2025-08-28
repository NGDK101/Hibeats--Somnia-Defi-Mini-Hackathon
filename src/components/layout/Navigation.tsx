import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Search, Music, Zap, Library, TrendingUp, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const navItems = [
    { id: "explore", label: "explore", icon: TrendingUp },
    { id: "create", label: "create", icon: Zap, active: true },
    { id: "library", label: "library", icon: Library },
    { id: "markets", label: "markets", icon: TrendingUp },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-glass-border/50 backdrop-blur-xl bg-glass/90">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Music className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              hibeats
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "text-muted-foreground hover:text-foreground transition-colors",
                  activeTab === item.id && "text-primary bg-primary/10"
                )}
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Search Bar */}
        <div className="hidden md:block flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="search by creator or title song"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input/50 border-glass-border focus:border-primary/50"
            />
          </div>
        </div>

        {/* User Info & Wallet */}
        <div className="flex items-center space-x-4">
          <GlassCard className="px-3 py-2 text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-muted-foreground">
                <Zap className="w-4 h-4 inline mr-1" />
                100 beats
              </span>
              <span className="text-primary font-medium">20 STT</span>
              <div className="w-8 h-8 rounded-full bg-gradient-secondary flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </GlassCard>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
};