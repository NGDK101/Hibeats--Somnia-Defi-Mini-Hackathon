import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { useGeneratedMusicContext } from "@/hooks/useGeneratedMusicContext";

export const CallbackStatus = ({ taskId }: { taskId?: string | null }) => {
  const [status, setStatus] = useState<"waiting" | "received" | "error">("waiting");
  const [lastCallback, setLastCallback] = useState<any>(null);
  const [callbackCount, setCallbackCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SUNO_CALLBACK') {
        const callbackData = event.data.payload;

        // Update status
        setStatus("received");
        setLastCallback(callbackData);
        setCallbackCount(prev => prev + 1);

        // Reset status after 5 seconds
        setTimeout(() => {
          setStatus("waiting");
        }, 5000);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Set start time when task begins
  useEffect(() => {
    if (taskId && !startTime) {
      setStartTime(Date.now());
      setProgress(0);
    } else if (!taskId) {
      setStartTime(null);
      setProgress(0);
    }
  }, [taskId, startTime]);

  // Update progress every second
  useEffect(() => {
    if (!startTime || status === "received") return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const estimatedTotal = 180000; // 3 minutes
      const currentProgress = Math.min((elapsed / estimatedTotal) * 100, 90);
      setProgress(currentProgress);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, status]);

  if (!taskId && callbackCount === 0) {
    return null;
  }

  const getStatusIcon = () => {
    switch (status) {
      case "waiting":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "received":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "waiting":
        return taskId ? "Waiting for callback..." : "Ready for callbacks";
      case "received":
        return "Callback received!";
      case "error":
        return "Callback error";
      default:
        return "Processing...";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "waiting":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "received":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "error":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
    }
  };

  return (
    <Card className={`p-4 ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium">{getStatusText()}</span>
        </div>
        {taskId && (
          <Badge variant="outline" className="text-xs">
            Task: {taskId.slice(0, 8)}...
          </Badge>
        )}
      </div>

      {status === "waiting" && taskId && (
        <div className="mt-3">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {callbackCount > 0 && (
        <div className="mt-3 text-sm">
          <span className="text-muted-foreground">
            Total callbacks received: {callbackCount}
          </span>
        </div>
      )}
    </Card>
  );
};