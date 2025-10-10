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
  const editorRef = useRef<HTMLDivElement>(null);
  const baseHeight = '144px'; // 6 rows
  const expandedHeight = '432px'; // 18 rows (3x)

  // Auto-collapse when content is empty
  useEffect(() => {
    if (!value || value.trim() === '') {
      setIsExpanded(false);
    }
  }, [value]);

  // Auto-expand based on content
  useEffect(() => {
    if (editorRef.current && value) {
      const contentHeight = editorRef.current.scrollHeight;
      const visibleHeight = editorRef.current.clientHeight;
      
      if (contentHeight > visibleHeight && !isExpanded) {
        setIsExpanded(true);
      }
    }
  }, [value]);

  // Sync content with value prop
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const makeBold = () => {
    document.execCommand('bold', false);
    editorRef.current?.focus();
  };

  const addBullet = () => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;

    // Check if we're already in a list
    let node = selection.anchorNode;
    let inList = false;
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'LI') {
        inList = true;
        break;
      }
      node = node.parentNode;
    }

    if (inList) {
      // Remove list formatting
      document.execCommand('insertUnorderedList', false);
    } else {
      // Add list formatting
      document.execCommand('insertUnorderedList', false);
    }
    
    editorRef.current.focus();
  };

  const toggleDirection = () => {
    setDirection(prev => prev === 'ltr' ? 'rtl' : 'ltr');
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection) return;

      // Check if we're in an empty list item
      let node = selection.anchorNode;
      let listItem: HTMLLIElement | null = null;
      
      while (node && node !== editorRef.current) {
        if (node.nodeName === 'LI') {
          listItem = node as HTMLLIElement;
          break;
        }
        node = node.parentNode;
      }

      if (listItem && (!listItem.textContent || listItem.textContent.trim() === '')) {
        // Empty list item - remove bullet
        e.preventDefault();
        document.execCommand('insertUnorderedList', false);
        document.execCommand('formatBlock', false, 'p');
      }
    }
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

      {/* Rich Text Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        dir={direction}
        data-placeholder={placeholder}
        style={{ 
          minHeight: isExpanded ? expandedHeight : baseHeight,
          maxHeight: isExpanded ? expandedHeight : baseHeight 
        }}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-y-auto transition-all duration-300",
          "prose prose-sm max-w-none dark:prose-invert",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground [&:empty]:before:pointer-events-none",
          autoFilled && 'bg-yellow-50 dark:bg-yellow-950/20',
          error && 'border-destructive ring-2 ring-destructive/20',
          className
        )}
      />
    </div>
  );
}
