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

    const root = editorRef.current;
    let range = selection.getRangeAt(0);
    if (range.collapsed) return; // No text selected

    // Capture original neighbor characters to preserve whitespace
    const getPrevChar = (node: Node, offset: number): string | null => {
      if (!root) return null;
      if (node.nodeType === Node.TEXT_NODE) {
        const t = node as Text;
        if (offset > 0) return t.data.charAt(offset - 1);
      }
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let current: Node | null = walker.nextNode();
      let prevText: Text | null = null;
      while (current) {
        if (current === node) break;
        prevText = current as Text;
        current = walker.nextNode();
      }
      if (prevText) {
        const d = prevText.data;
        return d.length ? d.charAt(d.length - 1) : null;
      }
      return null;
    };

    const getNextChar = (node: Node, offset: number): string | null => {
      if (!root) return null;
      if (node.nodeType === Node.TEXT_NODE) {
        const t = node as Text;
        if (offset < t.data.length) return t.data.charAt(offset);
      }
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let current: Node | null = walker.nextNode();
      while (current && current !== node) current = walker.nextNode();
      const nextText = walker.nextNode() as Text | null;
      if (nextText) return nextText.data.length ? nextText.data.charAt(0) : null;
      return null;
    };

    const origStart = range.startContainer;
    const origStartOffset = range.startOffset;
    const origEnd = range.endContainer;
    const origEndOffset = range.endOffset;

    const charBefore = getPrevChar(origStart, origStartOffset);
    const charAfter = getNextChar(origEnd, origEndOffset);

    const isSpaceLike = (ch: string | null) => ch === ' ' || ch === '\u00A0' || ch === '\n' || ch === '\t';

    // Exclude leading/trailing whitespace from selection
    const trimBoundaries = () => {
      while (range.startContainer.nodeType === Node.TEXT_NODE) {
        const text = range.startContainer as Text;
        if (range.startOffset < text.data.length && isSpaceLike(text.data.charAt(range.startOffset))) {
          range.setStart(text, range.startOffset + 1);
        } else {
          break;
        }
      }
      while (range.endContainer.nodeType === Node.TEXT_NODE) {
        const text = range.endContainer as Text;
        const idx = range.endOffset - 1;
        if (idx >= 0 && isSpaceLike(text.data.charAt(idx))) {
          range.setEnd(text, idx);
        } else {
          break;
        }
      }
    };

    trimBoundaries();
    if (range.toString().length === 0) return; // don't bold only whitespace

    // Apply bold via native command to preserve DOM whitespace
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('bold', false);

    // Normalize <b> to <strong>
    if (root) {
      const bs = Array.from(root.querySelectorAll('b'));
      bs.forEach((bEl) => {
        const strong = document.createElement('strong');
        strong.innerHTML = bEl.innerHTML;
        bEl.replaceWith(strong);
      });
    }

    // Identify the <strong> we just created (selection is usually inside it)
    const sel = window.getSelection();
    let strongAncestor: HTMLElement | null = null;
    if (sel && root) {
      let node: Node | null = sel.focusNode;
      while (node && node !== root) {
        if (node instanceof HTMLElement && node.tagName === 'STRONG') {
          strongAncestor = node;
          break;
        }
        node = node.parentNode;
      }
    }

    // Ensure whitespace around bolded text if it existed before
    const ensureLeadingSpace = () => {
      if (!strongAncestor) return;
      const prev = strongAncestor.previousSibling;
      const hadSpaceBefore = isSpaceLike(charBefore);
      const hasSpaceNow = prev && prev.nodeType === Node.TEXT_NODE ? isSpaceLike((prev as Text).data.slice(-1)) : false;
      if (hadSpaceBefore && !hasSpaceNow) {
        strongAncestor.parentNode?.insertBefore(document.createTextNode(' '), strongAncestor);
      }
    };

    const ensureTrailingSpace = () => {
      if (!strongAncestor) return;
      const next = strongAncestor.nextSibling;
      const hadSpaceAfter = isSpaceLike(charAfter);
      const hasSpaceNow = next && next.nodeType === Node.TEXT_NODE ? isSpaceLike((next as Text).data.charAt(0)) : false;
      if (hadSpaceAfter && !hasSpaceNow) {
        strongAncestor.parentNode?.insertBefore(document.createTextNode(' '), strongAncestor.nextSibling);
      }
    };

    ensureLeadingSpace();
    ensureTrailingSpace();

    // Move caret after bold element (skip one space if present)
    if (sel && strongAncestor) {
      const next = strongAncestor.nextSibling;
      const caret = document.createRange();
      if (next && next.nodeType === Node.TEXT_NODE) {
        const t = next as Text;
        const offset = isSpaceLike(t.data.charAt(0)) ? 1 : 0;
        caret.setStart(next, offset);
      } else {
        caret.setStartAfter(strongAncestor);
      }
      caret.collapse(true);
      sel.removeAllRanges();
      sel.addRange(caret);
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
