import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, List, AlignRight, AlignLeft, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichJobDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFilled?: boolean;
  error?: boolean;
}

export function RichJobDescriptionEditor({
  value,
  onChange,
  placeholder = "Describe the role, key responsibilities, requirements, and what makes this opportunity exciting...",
  className,
  autoFilled,
  error
}: RichJobDescriptionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const baseRows = 6;
  const expandedRows = 18; // 3x the original

  // Auto-expand based on content
  useEffect(() => {
    if (textareaRef.current) {
      const lineHeight = 24; // approximate line height
      const padding = 16; // padding in pixels
      const contentHeight = textareaRef.current.scrollHeight;
      const visibleHeight = textareaRef.current.clientHeight;
      
      // Auto-expand if content is larger than visible area
      if (contentHeight > visibleHeight + padding && !isExpanded) {
        setIsExpanded(true);
      }
    }
  }, [value]);

  const insertAtCursor = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const makeBold = () => {
    insertAtCursor('**', '**');
  };

  const addBullet = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const beforeCursor = value.substring(0, start);
    const afterCursor = value.substring(start);
    
    // Check if we're at the start of a line
    const lastNewline = beforeCursor.lastIndexOf('\n');
    const currentLineStart = lastNewline === -1 ? 0 : lastNewline + 1;
    const isStartOfLine = start === currentLineStart;
    
    if (isStartOfLine) {
      insertAtCursor('• ');
    } else {
      insertAtCursor('\n• ');
    }
  };

  const toggleDirection = () => {
    setDirection(prev => prev === 'ltr' ? 'rtl' : 'ltr');
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="space-y-2">
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={makeBold}
            className="h-8 w-8 p-0"
            title="Bold (wrap selection with **text**)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addBullet}
            className="h-8 w-8 p-0"
            title="Add bullet point"
          >
            <List className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleDirection}
            className={cn("h-8 w-8 p-0", direction === 'rtl' && "bg-accent")}
            title={direction === 'ltr' ? "Switch to RTL" : "Switch to LTR"}
          >
            {direction === 'ltr' ? <AlignLeft className="h-4 w-4" /> : <AlignRight className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleExpand}
          className="h-8 px-3 text-xs"
          title={isExpanded ? "Collapse" : "Expand (3x size)"}
        >
          {isExpanded ? (
            <>
              <Minimize2 className="h-3.5 w-3.5 mr-1" />
              Collapse
            </>
          ) : (
            <>
              <Maximize2 className="h-3.5 w-3.5 mr-1" />
              Expand
            </>
          )}
        </Button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={isExpanded ? expandedRows : baseRows}
        dir={direction}
        placeholder={placeholder}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-300",
          autoFilled && 'bg-yellow-50 dark:bg-yellow-950/20',
          error && 'border-destructive ring-2 ring-destructive/20',
          className
        )}
      />

      {/* Helper text */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>💡 Tips: Use **text** for bold, • for bullets</p>
        {isExpanded && <p className="text-primary">✨ Expanded to 3x size for detailed descriptions</p>}
      </div>
    </div>
  );
}
