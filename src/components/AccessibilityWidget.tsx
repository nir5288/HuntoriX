import { useState } from 'react';
import { Accessibility, Plus, Minus, RotateCcw, Eye, Type, Link2, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export const AccessibilityWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings, resetSettings } = useAccessibility();

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
        aria-label="Open accessibility options"
        size="icon"
      >
        <Accessibility className="h-6 w-6" />
      </Button>

      {/* Widget Panel */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 p-6 shadow-2xl z-50 animate-scale-in border-2">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Accessibility className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Accessibility</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetSettings}
                aria-label="Reset all settings"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Text Size */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Text Size
                </Label>
                <span className="text-sm text-muted-foreground">{settings.fontSize}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateSettings({ fontSize: Math.max(80, settings.fontSize - 10) })}
                  aria-label="Decrease text size"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={([value]) => updateSettings({ fontSize: value })}
                  min={80}
                  max={150}
                  step={10}
                  className="flex-1"
                  aria-label="Adjust text size"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateSettings({ fontSize: Math.min(150, settings.fontSize + 10) })}
                  aria-label="Increase text size"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <Label htmlFor="high-contrast" className="flex items-center gap-2 cursor-pointer">
                <Eye className="h-4 w-4" />
                High Contrast
              </Label>
              <Switch
                id="high-contrast"
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSettings({ highContrast: checked })}
                aria-label="Toggle high contrast mode"
              />
            </div>

            {/* Underline Links */}
            <div className="flex items-center justify-between">
              <Label htmlFor="underline-links" className="flex items-center gap-2 cursor-pointer">
                <Link2 className="h-4 w-4" />
                Underline Links
              </Label>
              <Switch
                id="underline-links"
                checked={settings.underlineLinks}
                onCheckedChange={(checked) => updateSettings({ underlineLinks: checked })}
                aria-label="Toggle link underlines"
              />
            </div>

            {/* Readable Font */}
            <div className="flex items-center justify-between">
              <Label htmlFor="readable-font" className="flex items-center gap-2 cursor-pointer">
                <Type className="h-4 w-4" />
                Readable Font
              </Label>
              <Switch
                id="readable-font"
                checked={settings.readableFont}
                onCheckedChange={(checked) => updateSettings({ readableFont: checked })}
                aria-label="Toggle readable font"
              />
            </div>

            {/* Keyboard Navigation */}
            <div className="flex items-center justify-between">
              <Label htmlFor="keyboard-nav" className="flex items-center gap-2 cursor-pointer">
                <Keyboard className="h-4 w-4" />
                Keyboard Highlights
              </Label>
              <Switch
                id="keyboard-nav"
                checked={settings.keyboardNav}
                onCheckedChange={(checked) => updateSettings({ keyboardNav: checked })}
                aria-label="Toggle keyboard navigation highlights"
              />
            </div>

            {/* Close Button */}
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};
