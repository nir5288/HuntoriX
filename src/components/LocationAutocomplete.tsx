import { useState, useEffect, useRef } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

type LocationOption = {
  type: 'city' | 'country';
  city?: string;
  country: string;
  displayValue: string;
};

type LocationAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

// Comprehensive location data with cities and countries
const LOCATION_DATA: LocationOption[] = [
  // Israel
  { type: 'city', city: 'Tel Aviv', country: 'Israel', displayValue: 'Tel Aviv, Israel' },
  { type: 'city', city: 'Jerusalem', country: 'Israel', displayValue: 'Jerusalem, Israel' },
  { type: 'city', city: 'Haifa', country: 'Israel', displayValue: 'Haifa, Israel' },
  { type: 'city', city: 'Herzliya', country: 'Israel', displayValue: 'Herzliya, Israel' },
  { type: 'city', city: 'Ramat Gan', country: 'Israel', displayValue: 'Ramat Gan, Israel' },
  { type: 'city', city: 'Be\'er Sheva', country: 'Israel', displayValue: 'Be\'er Sheva, Israel' },
  { type: 'city', city: 'Netanya', country: 'Israel', displayValue: 'Netanya, Israel' },
  { type: 'city', city: 'Petah Tikva', country: 'Israel', displayValue: 'Petah Tikva, Israel' },
  { type: 'city', city: 'Rishon LeZion', country: 'Israel', displayValue: 'Rishon LeZion, Israel' },
  { type: 'country', country: 'Israel', displayValue: 'Israel' },
  
  // United States
  { type: 'city', city: 'New York', country: 'United States', displayValue: 'New York, United States' },
  { type: 'city', city: 'San Francisco', country: 'United States', displayValue: 'San Francisco, United States' },
  { type: 'city', city: 'Los Angeles', country: 'United States', displayValue: 'Los Angeles, United States' },
  { type: 'city', city: 'Seattle', country: 'United States', displayValue: 'Seattle, United States' },
  { type: 'city', city: 'Austin', country: 'United States', displayValue: 'Austin, United States' },
  { type: 'city', city: 'Boston', country: 'United States', displayValue: 'Boston, United States' },
  { type: 'city', city: 'Chicago', country: 'United States', displayValue: 'Chicago, United States' },
  { type: 'city', city: 'Miami', country: 'United States', displayValue: 'Miami, United States' },
  { type: 'country', country: 'United States', displayValue: 'United States' },
  
  // United Kingdom
  { type: 'city', city: 'London', country: 'United Kingdom', displayValue: 'London, United Kingdom' },
  { type: 'city', city: 'Manchester', country: 'United Kingdom', displayValue: 'Manchester, United Kingdom' },
  { type: 'city', city: 'Edinburgh', country: 'United Kingdom', displayValue: 'Edinburgh, United Kingdom' },
  { type: 'city', city: 'Birmingham', country: 'United Kingdom', displayValue: 'Birmingham, United Kingdom' },
  { type: 'city', city: 'Cambridge', country: 'United Kingdom', displayValue: 'Cambridge, United Kingdom' },
  { type: 'country', country: 'United Kingdom', displayValue: 'United Kingdom' },
  
  // Germany
  { type: 'city', city: 'Berlin', country: 'Germany', displayValue: 'Berlin, Germany' },
  { type: 'city', city: 'Munich', country: 'Germany', displayValue: 'Munich, Germany' },
  { type: 'city', city: 'Frankfurt', country: 'Germany', displayValue: 'Frankfurt, Germany' },
  { type: 'city', city: 'Hamburg', country: 'Germany', displayValue: 'Hamburg, Germany' },
  { type: 'country', country: 'Germany', displayValue: 'Germany' },
  
  // India
  { type: 'city', city: 'Bangalore', country: 'India', displayValue: 'Bangalore, India' },
  { type: 'city', city: 'Mumbai', country: 'India', displayValue: 'Mumbai, India' },
  { type: 'city', city: 'Delhi', country: 'India', displayValue: 'Delhi, India' },
  { type: 'city', city: 'Hyderabad', country: 'India', displayValue: 'Hyderabad, India' },
  { type: 'city', city: 'Pune', country: 'India', displayValue: 'Pune, India' },
  { type: 'country', country: 'India', displayValue: 'India' },
  
  // Other countries
  { type: 'city', city: 'Paris', country: 'France', displayValue: 'Paris, France' },
  { type: 'country', country: 'France', displayValue: 'France' },
  { type: 'city', city: 'Amsterdam', country: 'Netherlands', displayValue: 'Amsterdam, Netherlands' },
  { type: 'country', country: 'Netherlands', displayValue: 'Netherlands' },
  { type: 'city', city: 'Toronto', country: 'Canada', displayValue: 'Toronto, Canada' },
  { type: 'city', city: 'Vancouver', country: 'Canada', displayValue: 'Vancouver, Canada' },
  { type: 'country', country: 'Canada', displayValue: 'Canada' },
  { type: 'city', city: 'Sydney', country: 'Australia', displayValue: 'Sydney, Australia' },
  { type: 'city', city: 'Melbourne', country: 'Australia', displayValue: 'Melbourne, Australia' },
  { type: 'country', country: 'Australia', displayValue: 'Australia' },
  { type: 'city', city: 'Singapore', country: 'Singapore', displayValue: 'Singapore, Singapore' },
  { type: 'country', country: 'Singapore', displayValue: 'Singapore' },
  { type: 'city', city: 'Dubai', country: 'United Arab Emirates', displayValue: 'Dubai, United Arab Emirates' },
  { type: 'country', country: 'United Arab Emirates', displayValue: 'United Arab Emirates' },
];

export function LocationAutocomplete({ value, onChange, placeholder, className }: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<LocationOption[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [triggerWidth, setTriggerWidth] = useState<number>(0);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Filter locations based on search query
  useEffect(() => {
    if (searchQuery.length === 0) {
      setFilteredLocations(LOCATION_DATA.slice(0, 20)); // Show first 20 by default
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = LOCATION_DATA.filter(location =>
        location.displayValue.toLowerCase().includes(query) ||
        location.country.toLowerCase().includes(query) ||
        (location.city && location.city.toLowerCase().includes(query))
      );
      setFilteredLocations(filtered);
    }
  }, [searchQuery]);

  // Update search query when value changes from outside
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Measure trigger width for popover
  useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const handleSelect = (location: LocationOption) => {
    onChange(location.displayValue);
    setSearchQuery(location.displayValue);
    setOpen(false);
  };

  // Group by countries
  const groupedLocations: Record<string, LocationOption[]> = {};
  filteredLocations.forEach(location => {
    if (!groupedLocations[location.country]) {
      groupedLocations[location.country] = [];
    }
    groupedLocations[location.country].push(location);
  });

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <div
          ref={triggerRef}
          className={cn("relative", className)}
          role="combobox"
          aria-expanded={open}
        >
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder || "Search city or country..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onChange(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="flex h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0" 
        style={{ width: triggerWidth > 0 ? `${triggerWidth}px` : 'auto' }}
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command className="rounded-lg border-none shadow-lg">
          <CommandList className="max-h-[300px]">
            {filteredLocations.length === 0 && (
              <CommandEmpty>No locations found.</CommandEmpty>
            )}

            {Object.keys(groupedLocations).map(country => (
              <CommandGroup key={country} heading={country}>
                {groupedLocations[country].map((location, idx) => (
                  <CommandItem
                    key={`${location.type}-${location.displayValue}-${idx}`}
                    value={location.displayValue}
                    onSelect={() => handleSelect(location)}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className={cn(
                      location.type === 'country' && 'font-semibold'
                    )}>
                      {location.displayValue}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

