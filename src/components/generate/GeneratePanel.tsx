import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Settings, Zap, Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export const GeneratePanel = () => {
  const [musicDescription, setMusicDescription] = useState("");
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [inspirationTags, setInspirationTags] = useState(["rock", "rock", "rock"]);
  const [customTag, setCustomTag] = useState("");
  
  // Advanced mode settings
  const [duration, setDuration] = useState([120]);
  const [tempo, setTempo] = useState("medium");
  const [key, setKey] = useState("C");
  const [mood, setMood] = useState("energetic");

  const predefinedTags = [
    "rock", "pop", "jazz", "electronic", "classical", "hip-hop", 
    "blues", "folk", "reggae", "metal", "indie", "ambient"
  ];

  const addTag = (tag: string) => {
    if (inspirationTags.length < 5 && !inspirationTags.includes(tag)) {
      setInspirationTags([...inspirationTags, tag]);
    }
  };

  const removeTag = (index: number) => {
    setInspirationTags(inspirationTags.filter((_, i) => i !== index));
  };

  const addCustomTag = () => {
    if (customTag.trim() && !inspirationTags.includes(customTag.toLowerCase())) {
      addTag(customTag.toLowerCase());
      setCustomTag("");
    }
  };

  const handleGenerate = () => {
    // TODO: Implement Suno AI integration
    console.log("Generating music with:", {
      description: musicDescription,
      tags: inspirationTags,
      isAdvanced: isAdvancedMode,
      settings: isAdvancedMode ? { duration, tempo, key, mood } : null
    });
  };

  return (
    <GlassCard className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Create your own song</h2>
        <div className="flex items-center space-x-2">
          <Badge variant={isAdvancedMode ? "default" : "secondary"} className="text-xs">
            {isAdvancedMode ? "advance" : "simple"}
          </Badge>
          <Settings className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="mode-toggle" className="text-sm text-muted-foreground">
            Mode
          </Label>
          <div className="flex items-center space-x-2">
            <span className={`text-xs ${!isAdvancedMode ? 'text-primary' : 'text-muted-foreground'}`}>
              Simple
            </span>
            <Switch
              id="mode-toggle"
              checked={isAdvancedMode}
              onCheckedChange={setIsAdvancedMode}
            />
            <span className={`text-xs ${isAdvancedMode ? 'text-primary' : 'text-muted-foreground'}`}>
              Advanced
            </span>
          </div>
        </div>

        {/* Music Description */}
        <div className="space-y-2">
          <Label htmlFor="music-description" className="text-sm font-medium">
            music description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="music-description"
            placeholder="Describe the music you want to create..."
            value={musicDescription}
            onChange={(e) => setMusicDescription(e.target.value)}
            className="min-h-[100px] bg-input/50 border-glass-border resize-none"
          />
        </div>

        {/* Advanced Mode Settings */}
        {isAdvancedMode && (
          <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-glass-border/30">
            <h3 className="text-sm font-medium text-primary">Advanced Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Duration (seconds)</Label>
                <Slider
                  value={duration}
                  onValueChange={setDuration}
                  max={300}
                  min={30}
                  step={10}
                  className="w-full"
                />
                <div className="text-xs text-center text-muted-foreground">
                  {duration[0]}s
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tempo</Label>
                <Select value={tempo} onValueChange={setTempo}>
                  <SelectTrigger className="bg-input/50 border-glass-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow (60-90 BPM)</SelectItem>
                    <SelectItem value="medium">Medium (90-120 BPM)</SelectItem>
                    <SelectItem value="fast">Fast (120-160 BPM)</SelectItem>
                    <SelectItem value="very-fast">Very Fast (160+ BPM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Key</Label>
                <Select value={key} onValueChange={setKey}>
                  <SelectTrigger className="bg-input/50 border-glass-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Mood</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger className="bg-input/50 border-glass-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="uplifting">Uplifting</SelectItem>
                    <SelectItem value="melancholic">Melancholic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Inspiration Tags */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Inspiration</Label>
          
          {/* Current Tags */}
          <div className="flex flex-wrap gap-2">
            {inspirationTags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 cursor-pointer group"
                onClick={() => removeTag(index)}
              >
                {tag}
                <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Badge>
            ))}
          </div>

          {/* Add Custom Tag */}
          <div className="flex space-x-2">
            <Input
              placeholder="Add custom genre/style..."
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
              className="flex-1 bg-input/50 border-glass-border"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={addCustomTag}
              disabled={!customTag.trim() || inspirationTags.length >= 5}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Predefined Tags */}
          <div className="flex flex-wrap gap-2">
            {predefinedTags
              .filter(tag => !inspirationTags.includes(tag))
              .slice(0, 8)
              .map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors"
                  onClick={() => addTag(tag)}
                >
                  +{tag}
                </Badge>
              ))
            }
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-4">
          <Button
            className="w-full bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground font-medium py-3 rounded-lg shadow-glow hover:shadow-glow/80 transition-all"
            onClick={handleGenerate}
            disabled={!musicDescription.trim()}
          >
            <Zap className="w-5 h-5 mr-2" />
            Generate
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Cost: 1 beat • Estimated time: 30-60 seconds
          </p>
        </div>
      </div>
    </GlassCard>
  );
};