import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Settings, Zap, Plus, X, Loader2, Shuffle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGeneratedMusicContext } from "@/hooks/useGeneratedMusicContext";
import { SunoGenerateRequest } from "@/types/music";
import { toast } from "sonner";
import { useAccount } from "wagmi";

export const GeneratePanel = () => {
  const [musicDescription, setMusicDescription] = useState("");
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [inspirationTags, setInspirationTags] = useState(["electronic", "ambient", "chill"]);
  const [customTag, setCustomTag] = useState("");
  const [styleDescription, setStyleDescription] = useState("");
  const [title, setTitle] = useState("");
  const [shuffledTags, setShuffledTags] = useState([
    "rock", "pop", "jazz", "electronic", "classical", "hip-hop",
    "blues", "folk", "reggae", "metal", "indie", "ambient",
    "house", "techno", "dubstep", "trap", "drill", "r&b",
    "soul", "funk", "disco", "punk", "grunge", "alternative",
    "country", "bluegrass", "gospel", "latin", "salsa", "bossa nova",
    "afrobeat", "reggaeton", "dancehall", "ska", "swing", "bebop",
    "fusion", "progressive", "psychedelic", "synthwave", "vaporwave",
    "lo-fi", "chillhop", "trance", "drum & bass", "jungle",
    "garage", "uk drill", "grime", "breakbeat", "hardcore",
    "industrial", "gothic", "post-rock", "shoegaze", "emo",
    "screamo", "metalcore", "death metal", "black metal", "thrash",
    "power metal", "symphonic metal", "nu metal", "rap", "trap soul",
    "neo soul", "contemporary r&b", "motown", "doo-wop", "rockabilly",
    "surf rock", "garage rock", "art rock", "glam rock", "hard rock",
    "soft rock", "yacht rock", "new wave", "post-punk", "indie pop",
    "indie rock", "dream pop", "chamber pop", "folk rock", "celtic",
    "world music", "tribal", "ethnic", "meditation", "new age",
    "cinematic", "orchestral", "minimalist", "experimental", "noise",
    "drone", "dark ambient", "space ambient", "downtempo", "trip-hop",
    "acid jazz", "smooth jazz", "cool jazz", "hot jazz", "free jazz",
    "modal jazz", "hard bop", "post-bop", "latin jazz", "vocal jazz"
  ]);

  // Advanced mode settings
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [model, setModel] = useState<"V3_5" | "V4" | "V4_5">("V4");
  const [vocalGender, setVocalGender] = useState<"m" | "f">("m");
  const [lyricsMode, setLyricsMode] = useState<"auto" | "manual">("manual");

  const { generateMusic, isGenerating, currentTaskId, isContractPending, isContractSuccess, contractHash, generationFee, advancedGenerationFee, dailyGenerationsLeft } = useGeneratedMusicContext();
  const { address, isConnected } = useAccount();

  // State untuk menampilkan status tx sent
  const [txSent, setTxSent] = useState<string | null>(null);

  useEffect(() => {
    if (isContractSuccess && contractHash) {
      setTxSent(contractHash);
    } else if (!isContractPending) {
      setTxSent(null);
    }
  }, [isContractSuccess, contractHash, isContractPending]);

  const predefinedTags = [
    "rock", "pop", "jazz", "electronic", "classical", "hip-hop",
    "blues", "folk", "reggae", "metal", "indie", "ambient",
    "house", "techno", "dubstep", "trap", "drill", "r&b",
    "soul", "funk", "disco", "punk", "grunge", "alternative",
    "country", "bluegrass", "gospel", "latin", "salsa", "bossa nova",
    "afrobeat", "reggaeton", "dancehall", "ska", "swing", "bebop",
    "fusion", "progressive", "psychedelic", "synthwave", "vaporwave",
    "lo-fi", "chillhop", "trance", "drum & bass", "jungle",
    "garage", "uk drill", "grime", "breakbeat", "hardcore",
    "industrial", "gothic", "post-rock", "shoegaze", "emo",
    "screamo", "metalcore", "death metal", "black metal", "thrash",
    "power metal", "symphonic metal", "nu metal", "rap", "trap soul",
    "neo soul", "contemporary r&b", "motown", "doo-wop", "rockabilly",
    "surf rock", "garage rock", "art rock", "glam rock", "hard rock",
    "soft rock", "yacht rock", "new wave", "post-punk", "indie pop",
    "indie rock", "dream pop", "chamber pop", "folk rock", "celtic",
    "world music", "tribal", "ethnic", "meditation", "new age",
    "cinematic", "orchestral", "minimalist", "experimental", "noise",
    "drone", "dark ambient", "space ambient", "downtempo", "trip-hop",
    "acid jazz", "smooth jazz", "cool jazz", "hot jazz", "free jazz",
    "modal jazz", "hard bop", "post-bop", "latin jazz", "vocal jazz"
  ];

  const shuffleTags = () => {
    const shuffled = [...predefinedTags].sort(() => Math.random() - 0.5);
    setShuffledTags(shuffled);
  };

  const addTag = (tag: string) => {
    if (inspirationTags.length < 5 && !inspirationTags.includes(tag)) {
      setInspirationTags([...inspirationTags, tag]);
    }
  };

  const addGenreToDescription = (genre: string) => {
    if (isAdvancedMode) {
      if (styleDescription.trim()) {
        setStyleDescription(styleDescription + ", " + genre);
      } else {
        setStyleDescription(genre);
      }
    } else {
      if (musicDescription.trim()) {
        setMusicDescription(musicDescription + ", " + genre);
      } else {
        setMusicDescription(genre);
      }
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

  const handleGenerate = async () => {
    const prompt = isAdvancedMode ? musicDescription : musicDescription;
    const style = isAdvancedMode ?
      (styleDescription || inspirationTags.join(", ")) :
      inspirationTags.join(", ");

    if (!prompt.trim()) return;

    // Check if wallet is connected
    if (!isConnected || !address) {
      toast.error("Please connect your wallet to generate music onchain");
      return;
    }

    try {
      const generateParams: SunoGenerateRequest = {
        prompt: prompt,
        customMode: isAdvancedMode,
        instrumental: isInstrumental,
        model: model,
        ...(isAdvancedMode && {
          title: title || "AI Generated Music",
          style: style,
          vocalGender: vocalGender,
        }),
        ...(inspirationTags.length > 0 && {
          negativeTags: "",
        })
      };

      await generateMusic(generateParams);
    } catch (error) {
      // Error handling is now done in generateMusic function
    }
  };

  return (
    <GlassCard
      className="p-3 h-full flex flex-col"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'hsl(220, 20%, 20%) transparent'
      }}
    >
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2 border-b border-glass-border/20">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create your own song</h2>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="advanced-mode-toggle" className="text-xs text-muted-foreground">
                Advanced
              </Label>
              <Switch
                id="advanced-mode-toggle"
                checked={isAdvancedMode}
                onCheckedChange={setIsAdvancedMode}
                className="transition-all duration-200"
              />
            </div>
            <Select value={model} onValueChange={(value: "V3_5" | "V4" | "V4_5") => setModel(value)}>
              <SelectTrigger className="h-5 px-2 py-1 text-xs border-0 bg-muted/20 hover:bg-primary/10 rounded-full min-w-0 w-auto transition-all duration-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card/95 backdrop-blur-sm border-glass-border hover:bg-card/98 transition-colors">
                <SelectItem value="V3_5" className="hover:bg-primary/15 hover:text-primary focus:bg-primary/20 focus:text-primary transition-colors duration-200 rounded-full">v3.5</SelectItem>
                <SelectItem value="V4" className="hover:bg-primary/15 hover:text-primary focus:bg-primary/20 focus:text-primary transition-colors duration-200 rounded-full">v4</SelectItem>
                <SelectItem value="V4_5" className="hover:bg-primary/15 hover:text-primary focus:bg-primary/20 focus:text-primary transition-colors duration-200 rounded-full">v4.5</SelectItem>
              </SelectContent>
            </Select>
            <Settings className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {/* User Stats Section */}
        <div className="bg-muted/10 border border-glass-border/30 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Daily Generations Left</span>
            <div className="flex items-center gap-2">
              <span className="text-primary font-medium">
                {dailyGenerationsLeft !== undefined ? dailyGenerationsLeft.toString() : '...'}
              </span>
            </div>
          </div>
          {/* <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Wallet Status</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-xs font-medium ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                {isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div> */}
        </div>

        {/* Music Description - Simple Mode */}
        {!isAdvancedMode && (
          <div className="space-y-3">
            <Label htmlFor="music-description" className="text-sm font-medium">
              Music description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="music-description"
              placeholder="Describe the music you want to create..."
              value={musicDescription}
              onChange={(e) => setMusicDescription(e.target.value)}
              className="min-h-[100px] bg-input/50 border-glass-border resize-none rounded-xl p-4"
            />

            {/* Audio/Lyrics Toggle for Simple Mode */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdvancedMode(true)}
                className="rounded-full px-4 py-2 text-sm transition-all bg-transparent border-muted-foreground/30 text-muted-foreground hover:bg-muted/20"
              >
                + Lyrics
              </Button>
              <Button
                variant={isInstrumental ? "default" : "outline"}
                size="sm"
                onClick={() => setIsInstrumental(!isInstrumental)}
                className={`rounded-full px-4 py-2 text-sm transition-all ${
                  isInstrumental
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-transparent border-muted-foreground/30 text-muted-foreground hover:bg-muted/20"
                }`}
              >
                Instrumental
              </Button>
            </div>

            {/* Inspiration Tags for Simple Mode */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">✨ Quick inspiration</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shuffleTags}
                  className="rounded-full px-3 py-1 text-xs h-6 hover:bg-primary/20 hover:border-primary/60 hover:text-primary transition-all duration-200"
                >
                  <Shuffle className="w-3 h-3 mr-1" />
                  Shuffle
                </Button>
              </div>
              <div className="relative">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2" style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}>
                  <div className="flex gap-2 animate-scroll-right">
                    {shuffledTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors rounded-full text-xs whitespace-nowrap flex-shrink-0"
                        onClick={() => addGenreToDescription(tag)}
                      >
                        +{tag}
                      </Badge>
                    ))}
                    {/* Duplicate for seamless scroll */}
                    {shuffledTags.map((tag) => (
                      <Badge
                        key={`${tag}-duplicate`}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors rounded-full text-xs whitespace-nowrap flex-shrink-0"
                        onClick={() => addGenreToDescription(tag)}
                      >
                        +{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lyrics - Advanced Mode */}
        {isAdvancedMode && !isInstrumental && (
          <div className="space-y-2 animate-in fade-in-0 duration-500">
            <div className="flex items-center justify-between">
              <Label htmlFor="music-description" className="text-sm font-medium flex items-center gap-2">
                Lyrics
              </Label>
              <div className="relative bg-muted/20 rounded-full p-0.5 border border-glass-border/30">
                <div
                  className={`absolute top-0.5 bottom-0.5 bg-primary rounded-full transition-all duration-300 ease-out ${
                    lyricsMode === "auto" ? "left-0.5 right-[50%]" : "left-[50%] right-0.5"
                  }`}
                />
                <button
                  onClick={() => setLyricsMode("auto")}
                  className={`relative z-10 px-3 py-1.5 text-xs rounded-full transition-colors duration-300 w-1/2 ${
                    lyricsMode === "auto" ? "text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Auto
                </button>
                <button
                  onClick={() => setLyricsMode("manual")}
                  className={`relative z-10 px-3 py-1.5 text-xs rounded-full transition-colors duration-300 w-1/2 ${
                    lyricsMode === "manual" ? "text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Manual
                </button>
              </div>
            </div>
            <Textarea
              id="music-description"
              placeholder={lyricsMode === "auto" ? "Describe the style and mood for AI to generate lyrics..." : "Add your own lyrics here"}
              value={musicDescription}
              onChange={(e) => setMusicDescription(e.target.value)}
              className="min-h-[120px] bg-input/50 border-glass-border resize-none rounded-xl p-4 transition-all duration-300"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="lyrics-instrumental-toggle"
                    checked={isInstrumental}
                    onCheckedChange={setIsInstrumental}
                    className="transition-all duration-200"
                  />
                  <Label htmlFor="lyrics-instrumental-toggle" className="text-sm text-muted-foreground">
                    Instrumental
                  </Label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full px-3 py-1 text-xs bg-muted/20 border-glass-border text-primary hover:bg-primary/10 hover:border-primary/50 backdrop-blur-sm transition-all duration-200"
                >
                  ✨ Full Song
                </Button>
              </div>
            </div>

            {/* Vocal Gender - Below Lyrics */}
            {!isInstrumental && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Vocal Gender</Label>
                <Select value={vocalGender} onValueChange={(value: "m" | "f") => setVocalGender(value)}>
                  <SelectTrigger className="bg-input/50 border-glass-border rounded-full px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">Male</SelectItem>
                    <SelectItem value="f">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Instrumental Toggle - Advanced Mode */}
        {isAdvancedMode && isInstrumental && (
          <div className="space-y-2 animate-in fade-in-0 duration-500">
            <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl transition-all duration-300">
              <Switch
                id="lyrics-instrumental-toggle"
                checked={isInstrumental}
                onCheckedChange={setIsInstrumental}
                className="transition-all duration-200"
              />
              <Label htmlFor="lyrics-instrumental-toggle" className="text-sm font-medium text-primary">
                Instrumental
              </Label>
            </div>
          </div>
        )}

        {/* Styles - Advanced Mode */}
        {isAdvancedMode && (
          <div className="space-y-2 p-3 bg-muted/20 rounded-lg border border-glass-border/30">
            <Label className="text-sm font-medium">Styles</Label>

            {/* Style Description Textarea */}
            <Textarea
              placeholder="Describe the musical style, genre, instruments, and overall sound you want..."
              value={styleDescription}
              onChange={(e) => setStyleDescription(e.target.value)}
              className="min-h-[100px] bg-input/50 border-glass-border resize-none rounded-xl p-4"
            />

            {/* Scrolling Genre Tags for Advanced Mode */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">✨ Quick inspiration</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shuffleTags}
                  className="rounded-full px-3 py-1 text-xs h-6 hover:bg-primary/20 hover:border-primary/60 hover:text-primary transition-all duration-200"
                >
                  <Shuffle className="w-3 h-3 mr-1" />
                  Shuffle
                </Button>
              </div>
              <div className="relative">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2" style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}>
                  <div className="flex gap-2 animate-scroll-right">
                    {shuffledTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors rounded-full text-xs whitespace-nowrap flex-shrink-0"
                        onClick={() => addGenreToDescription(tag)}
                      >
                        +{tag}
                      </Badge>
                    ))}
                    {/* Duplicate for seamless scroll */}
                    {shuffledTags.map((tag) => (
                      <Badge
                        key={`${tag}-duplicate`}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors rounded-full text-xs whitespace-nowrap flex-shrink-0"
                        onClick={() => addGenreToDescription(tag)}
                      >
                        +{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Current Tags */}
              <div className="flex flex-wrap gap-2">
                {inspirationTags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 cursor-pointer group rounded-full"
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
                  className="flex-1 bg-input/50 border-glass-border rounded-full px-4"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addCustomTag}
                  disabled={!customTag.trim() || inspirationTags.length >= 5}
                  className="rounded-full px-4"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Current Tags */}
            <div className="flex flex-wrap gap-2">
              {inspirationTags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 cursor-pointer group rounded-full"
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
                className="flex-1 bg-input/50 border-glass-border rounded-full px-4"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={addCustomTag}
                disabled={!customTag.trim() || inspirationTags.length >= 5}
                className="rounded-full px-4"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Advanced Mode Settings */}
        {isAdvancedMode && (
          <div className="space-y-3 p-3 bg-muted/20 rounded-lg border border-glass-border/30">
            <h3 className="text-sm font-medium text-primary">Advanced Settings</h3>

            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="song-title" className="text-sm font-medium">
                Song Title
              </Label>
              <Input
                id="song-title"
                placeholder="Enter song title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-input/50 border-glass-border rounded-full px-4"
              />
            </div>
          </div>
        )}
      </div>

      {/* Generate Button - Fixed at bottom */}
      <div className="flex-shrink-0 px-3 pb-3 pt-0 space-y-9 border-t border-glass-border/20 -mt-3">
        <Button
          className="w-full bg-gradient-button hover:bg-gradient-button-hover text-primary-foreground font-medium py-3 rounded-full shadow-glow hover:shadow-glow/80 transition-all duration-300 disabled:opacity-50"
          onClick={handleGenerate}
          disabled={!musicDescription.trim() || isGenerating || isContractPending || (dailyGenerationsLeft !== undefined && dailyGenerationsLeft <= 0) || !isConnected}
        >
          {!isConnected ? (
            <>
              <span>🔗</span>
              Connect Wallet to Generate
            </>
          ) : (dailyGenerationsLeft !== undefined && dailyGenerationsLeft <= 0) ? (
            <>
              <span>🚫</span>
              Daily Limit Reached
            </>
          ) : isContractPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Confirm Transaction...
            </>
          ) : isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Music...
            </>
            ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Generate Music
              {((isAdvancedMode ? advancedGenerationFee : generationFee)) && (
                <span className="ml-2 text-xs opacity-75">
                  ({(Number(isAdvancedMode ? advancedGenerationFee! : generationFee!) / 1e18).toFixed(4)} STT)
                </span>
              )}
            </>
          )}
        </Button>

        {/* {isGenerating && currentTaskId && (
          <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">AI Processing...</span>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>~1-2 min remaining</span>
            </div>
            <p className="text-xs text-blue-400 text-center mt-2 font-mono">
              Task ID: {currentTaskId}
            </p>
          </div>
        )} */}

        {((isAdvancedMode ? advancedGenerationFee : generationFee)) && !isGenerating && !isContractPending && (
          <div className="text-xs text-muted-foreground text-center mt-2 space-y-1">
            <p>💰 Generation Fee: {(Number(isAdvancedMode ? advancedGenerationFee! : generationFee!) / 1e18).toFixed(4)} STT</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center mt-2">
         Total estimated time: 45-90 seconds (transaction + AI generation)
        </p>

        {/* Callback Status Display */}
        {/* <CallbackStatus
          taskId={currentTaskId}
        /> */}
      </div>
    </GlassCard>
  );
};