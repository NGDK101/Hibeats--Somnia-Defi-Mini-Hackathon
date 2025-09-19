import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logoImage from "@/images/logo hibeats.png";
import beatsImage from "@/images/beats.png";
import { WalletConnect } from "@/components/ui/WalletConnect";
import { useToken } from "@/hooks/useToken";
import { formatEther } from "viem";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export const Navigation = ({ activeTab, onTabChange, className }: NavigationProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { balance, tokenSymbol } = useToken();

  const navItems = [
    { id: "explore", label: "explore" },
    { id: "create", label: "create", active: true },
    { id: "library", label: "library" },
    { id: "portfolio", label: "portfolio" },
    { id: "debug", label: "debug" },
  ];

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full bg-transparent  shadow-none transition-all duration-300",
      className
    )}>
      <div className="container flex h-16 items-center px-6">
        {/* Logo */}
        <div className="flex items-center mr-8">
          <img 
            src={logoImage} 
            alt="HiBeats Logo" 
            className="w-32 h-8 object-contain"
          />
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-2 mr-8">
          {navItems.map((item) => {
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "text-white hover:text-white hover:bg-white/20 hover:scale-105 hover:translate-x-1 transition-all duration-300 ease-out px-6 py-3 text-base font-medium rounded-full transform",
                  activeTab === item.id && "text-white bg-white/15 scale-105 translate-x-1"
                )}
              >
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mr-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="search by creator or title song"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input/50 border-glass-border focus:border-primary/50 rounded-full"
            />
          </div>
        </div>

        {/* User Info & Wallet */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white/10 rounded-full px-3 py-2">
            <img 
              src={beatsImage} 
              alt="Beats" 
              className="w-5 h-5 object-contain"
            />
            <span className="text-white text-sm font-medium">
              {balance ? Number(formatEther(balance)).toFixed(2) : '0'} {tokenSymbol || 'BEATS'}
            </span>
          </div>
          <WalletConnect />
        </div>
      </div>
    </header>
  );
};