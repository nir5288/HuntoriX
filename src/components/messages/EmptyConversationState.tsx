import { MessageSquare } from "lucide-react";

export const EmptyConversationState = () => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Select a conversation to start messaging</p>
      </div>
    </div>
  );
};
