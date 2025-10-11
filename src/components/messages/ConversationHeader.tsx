import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Circle, Video, CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationHeaderProps {
  isMobile: boolean;
  otherUserId: string;
  otherUserName: string;
  otherUserRole: string | null;
  otherUserAvatar: string | null;
  statusIndicator: { color: string; text: string } | null;
  lastSeen: string | null;
  jobTitle: string;
  videoCallMenuOpen: boolean;
  setVideoCallMenuOpen: (open: boolean) => void;
  schedulePopoverOpen: boolean;
  setSchedulePopoverOpen: (open: boolean) => void;
  scheduleDate: Date | undefined;
  setScheduleDate: (date: Date | undefined) => void;
  scheduleTime: string;
  setScheduleTime: (time: string) => void;
  onScheduleCall: () => void;
  onInstantCall: () => void;
  onBack: () => void;
}

export const ConversationHeader = ({
  isMobile,
  otherUserId,
  otherUserName,
  otherUserRole,
  otherUserAvatar,
  statusIndicator,
  lastSeen,
  jobTitle,
  videoCallMenuOpen,
  setVideoCallMenuOpen,
  schedulePopoverOpen,
  setSchedulePopoverOpen,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
  onScheduleCall,
  onInstantCall,
  onBack
}: ConversationHeaderProps) => {
  return (
    <div className={cn(
      "h-[72px] shrink-0 border-b bg-gradient-to-r from-[hsl(var(--accent-pink))]/10 via-[hsl(var(--accent-mint))]/10 to-[hsl(var(--accent-lilac))]/10 flex items-center gap-3 px-4",
      isMobile && "bg-background"
    )}>
      {/* Back button on mobile */}
      {isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      
      {/* User info */}
      <Link 
        to={otherUserRole === "headhunter" 
          ? `/profile/headhunter/${otherUserId}` 
          : `/profile/employer/${otherUserId}`
        } 
        className="flex items-center gap-3 flex-1 hover:opacity-80 transition"
      >
        <div className="relative">
          {otherUserAvatar ? (
            <img 
              src={otherUserAvatar} 
              alt={otherUserName} 
              className="h-10 w-10 rounded-full object-cover" 
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(var(--accent-pink))] to-[hsl(var(--accent-lilac))] flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
          )}
          {statusIndicator && (
            <Circle 
              className={`absolute bottom-0 right-0 h-3 w-3 fill-current ${statusIndicator.color} border-2 border-background rounded-full`} 
            />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base">{otherUserName}</h2>
            {otherUserRole && (
              <Badge variant="outline" className="text-xs capitalize">
                {otherUserRole}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{jobTitle}</p>
          {statusIndicator ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span className={statusIndicator.color}>●</span>
              <span className={statusIndicator.color}>{statusIndicator.text}</span>
            </div>
          ) : lastSeen ? (
            <p className="text-xs text-muted-foreground">{lastSeen}</p>
          ) : null}
        </div>
      </Link>
      
      {/* Video call button */}
      <DropdownMenu open={videoCallMenuOpen} onOpenChange={setVideoCallMenuOpen}>
        <DropdownMenuTrigger asChild>
          {isMobile ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 hover:opacity-90"
              title="Video Call"
            >
              <Video className="h-5 w-5 text-white" />
            </Button>
          ) : (
            <Button
              variant="default"
              className="h-10 px-4 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 hover:opacity-90 shadow-lg flex items-center gap-2"
              title="Video Call Options"
            >
              <Video className="h-4 w-4" />
              <span className="text-sm font-semibold">+ Video Call</span>
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setSchedulePopoverOpen(true)}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Schedule a video call
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onInstantCall}>
            <Clock className="mr-2 h-4 w-4" />
            Start an instant video call
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Schedule popover */}
      <Popover open={schedulePopoverOpen} onOpenChange={setSchedulePopoverOpen}>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Calendar
                mode="single"
                selected={scheduleDate}
                onSelect={setScheduleDate}
                disabled={(date) => date < new Date()}
                initialFocus
                className={cn("pointer-events-auto")}
              />
            </div>
            <div className="space-y-2">
              <Label>Select Time</Label>
              <Select value={scheduleTime} onValueChange={setScheduleTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return [
                      <SelectItem key={`${hour}:00`} value={`${hour}:00`}>{`${hour}:00`}</SelectItem>,
                      <SelectItem key={`${hour}:30`} value={`${hour}:30`}>{`${hour}:30`}</SelectItem>
                    ];
                  }).flat()}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={onScheduleCall}
            >
              Send Invitation
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
