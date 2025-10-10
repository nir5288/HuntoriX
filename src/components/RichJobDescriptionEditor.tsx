import { useState, useRef, useEffect, useCallback } from 'react';
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
  const baseHeight = 150; // ~6 rows
  const expandedHeight = 450; // 3x the original

  // Auto-collapse when content is empty
  useEffect(() => {
    if (editorRef.current) {
      const isEmpty = editorRef.current.textContent?.trim() === '';
      if (isEmpty && isExpanded) {
        setIsExpanded(false);
      }
    }
  }, [value, isExpanded]);

  // Sync value with contentEditable
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const makeBold = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    let range = selection.getRangeAt(0);
    if (range.collapsed) return; // No text selected

    // Exclude leading/trailing spaces from the selection to preserve spacing
    const trimBoundaries = () => {
      // Trim leading spaces at start
      while (range.startContainer.nodeType === Node.TEXT_NODE) {
        const text = range.startContainer as Text;
        if (range.startOffset < text.data.length && text.data.charAt(range.startOffset) === ' ') {
          range.setStart(text, range.startOffset + 1);
        } else {
          break;
        }
      }
      // Trim trailing spaces at end
      while (range.endContainer.nodeType === Node.TEXT_NODE) {
        const text = range.endContainer as Text;
        const idx = range.endOffset - 1;
        if (idx >= 0 && text.data.charAt(idx) === ' ') {
          range.setEnd(text, idx);
        } else {
          break;
        }
      }
    };

    trimBoundaries();
    if (range.toString().length === 0) return; // don't bold only spaces

    // Use native command to preserve DOM whitespace exactly
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('bold', false);

    const root = editorRef.current;

    // Normalize <b> to <strong> for semantic HTML
    if (root) {
      const bs = Array.from(root.querySelectorAll('b'));
      bs.forEach((bEl) => {
        const strong = document.createElement('strong');
        strong.innerHTML = bEl.innerHTML;
        bEl.replaceWith(strong);
      });
    }

    // Move caret just after the bold element so next typing isn't bold
    const sel = window.getSelection();
    if (sel) {
      let node: Node | null = sel.focusNode;
      let strongAncestor: HTMLElement | null = null;
      while (node && node !== root) {
        if (node instanceof HTMLElement && (node.tagName === 'STRONG' || node.tagName === 'B')) {
          strongAncestor = node;
          break;
        }
        node = node.parentNode;
      }

      const caret = document.createRange();
      if (strongAncestor) {
        const next = strongAncestor.nextSibling;
        if (next && next.nodeType === Node.TEXT_NODE) {
          const t = next as Text;
          const offset = t.data.startsWith(' ') ? 1 : 0; // skip a following space if present
          caret.setStart(next, offset);
        } else {
          caret.setStartAfter(strongAncestor);
        }
        caret.collapse(true);
        sel.removeAllRanges();
        sel.addRange(caret);
      } else {
        // Fallback: collapse to end
        sel.collapseToEnd();
      }
    }

    root?.focus();
    handleInput();
  };

  const addBullet = () => {
    document.execCommand('insertUnorderedList', false);
    editorRef.current?.focus();
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

      {/* ContentEditable Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        dir={direction}
        data-placeholder={placeholder}
        style={{ minHeight: isExpanded ? expandedHeight : baseHeight }}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 overflow-auto prose prose-sm max-w-none",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground",
          autoFilled && 'bg-yellow-50 dark:bg-yellow-950/20',
          error && 'border-destructive ring-2 ring-destructive/20',
          className
        )}
      />
    </div>
  );
}
