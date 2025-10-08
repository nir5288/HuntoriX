import { useState, useEffect, useRef, useCallback } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type LocationOption = {
  type: 'city' | 'country' | 'recent';
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
  { type: 'city', city: 'Ashdod', country: 'Israel', displayValue: 'Ashdod, Israel' },
  { type: 'city', city: 'Holon', country: 'Israel', displayValue: 'Holon, Israel' },
  { type: 'city', city: 'Bnei Brak', country: 'Israel', displayValue: 'Bnei Brak, Israel' },
  { type: 'city', city: 'Bat Yam', country: 'Israel', displayValue: 'Bat Yam, Israel' },
  { type: 'city', city: 'Rehovot', country: 'Israel', displayValue: 'Rehovot, Israel' },
  { type: 'city', city: 'Ashkelon', country: 'Israel', displayValue: 'Ashkelon, Israel' },
  { type: 'city', city: 'Kfar Saba', country: 'Israel', displayValue: 'Kfar Saba, Israel' },
  { type: 'city', city: 'Ra\'anana', country: 'Israel', displayValue: 'Ra\'anana, Israel' },
  { type: 'city', city: 'Hod HaSharon', country: 'Israel', displayValue: 'Hod HaSharon, Israel' },
  { type: 'city', city: 'Modi\'in', country: 'Israel', displayValue: 'Modi\'in, Israel' },
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
  { type: 'city', city: 'Denver', country: 'United States', displayValue: 'Denver, United States' },
  { type: 'city', city: 'Atlanta', country: 'United States', displayValue: 'Atlanta, United States' },
  { type: 'city', city: 'Washington DC', country: 'United States', displayValue: 'Washington DC, United States' },
  { type: 'city', city: 'Philadelphia', country: 'United States', displayValue: 'Philadelphia, United States' },
  { type: 'city', city: 'San Diego', country: 'United States', displayValue: 'San Diego, United States' },
  { type: 'city', city: 'Dallas', country: 'United States', displayValue: 'Dallas, United States' },
  { type: 'city', city: 'Houston', country: 'United States', displayValue: 'Houston, United States' },
  { type: 'city', city: 'Phoenix', country: 'United States', displayValue: 'Phoenix, United States' },
  { type: 'city', city: 'Portland', country: 'United States', displayValue: 'Portland, United States' },
  { type: 'city', city: 'San Jose', country: 'United States', displayValue: 'San Jose, United States' },
  { type: 'city', city: 'Nashville', country: 'United States', displayValue: 'Nashville, United States' },
  { type: 'city', city: 'Boulder', country: 'United States', displayValue: 'Boulder, United States' },
  { type: 'city', city: 'Raleigh', country: 'United States', displayValue: 'Raleigh, United States' },
  { type: 'city', city: 'Las Vegas', country: 'United States', displayValue: 'Las Vegas, United States' },
  { type: 'country', country: 'United States', displayValue: 'United States' },
  
  // United Kingdom
  { type: 'city', city: 'London', country: 'United Kingdom', displayValue: 'London, United Kingdom' },
  { type: 'city', city: 'Manchester', country: 'United Kingdom', displayValue: 'Manchester, United Kingdom' },
  { type: 'city', city: 'Edinburgh', country: 'United Kingdom', displayValue: 'Edinburgh, United Kingdom' },
  { type: 'city', city: 'Birmingham', country: 'United Kingdom', displayValue: 'Birmingham, United Kingdom' },
  { type: 'city', city: 'Cambridge', country: 'United Kingdom', displayValue: 'Cambridge, United Kingdom' },
  { type: 'city', city: 'Oxford', country: 'United Kingdom', displayValue: 'Oxford, United Kingdom' },
  { type: 'city', city: 'Bristol', country: 'United Kingdom', displayValue: 'Bristol, United Kingdom' },
  { type: 'city', city: 'Leeds', country: 'United Kingdom', displayValue: 'Leeds, United Kingdom' },
  { type: 'city', city: 'Glasgow', country: 'United Kingdom', displayValue: 'Glasgow, United Kingdom' },
  { type: 'city', city: 'Liverpool', country: 'United Kingdom', displayValue: 'Liverpool, United Kingdom' },
  { type: 'country', country: 'United Kingdom', displayValue: 'United Kingdom' },
  
  // Germany
  { type: 'city', city: 'Berlin', country: 'Germany', displayValue: 'Berlin, Germany' },
  { type: 'city', city: 'Munich', country: 'Germany', displayValue: 'Munich, Germany' },
  { type: 'city', city: 'Frankfurt', country: 'Germany', displayValue: 'Frankfurt, Germany' },
  { type: 'city', city: 'Hamburg', country: 'Germany', displayValue: 'Hamburg, Germany' },
  { type: 'city', city: 'Cologne', country: 'Germany', displayValue: 'Cologne, Germany' },
  { type: 'city', city: 'Stuttgart', country: 'Germany', displayValue: 'Stuttgart, Germany' },
  { type: 'city', city: 'Dusseldorf', country: 'Germany', displayValue: 'Dusseldorf, Germany' },
  { type: 'city', city: 'Dortmund', country: 'Germany', displayValue: 'Dortmund, Germany' },
  { type: 'country', country: 'Germany', displayValue: 'Germany' },
  
  // India
  { type: 'city', city: 'Bangalore', country: 'India', displayValue: 'Bangalore, India' },
  { type: 'city', city: 'Mumbai', country: 'India', displayValue: 'Mumbai, India' },
  { type: 'city', city: 'Delhi', country: 'India', displayValue: 'Delhi, India' },
  { type: 'city', city: 'Hyderabad', country: 'India', displayValue: 'Hyderabad, India' },
  { type: 'city', city: 'Pune', country: 'India', displayValue: 'Pune, India' },
  { type: 'city', city: 'Chennai', country: 'India', displayValue: 'Chennai, India' },
  { type: 'city', city: 'Kolkata', country: 'India', displayValue: 'Kolkata, India' },
  { type: 'city', city: 'Ahmedabad', country: 'India', displayValue: 'Ahmedabad, India' },
  { type: 'city', city: 'Gurgaon', country: 'India', displayValue: 'Gurgaon, India' },
  { type: 'city', city: 'Noida', country: 'India', displayValue: 'Noida, India' },
  { type: 'country', country: 'India', displayValue: 'India' },
  
  // France
  { type: 'city', city: 'Paris', country: 'France', displayValue: 'Paris, France' },
  { type: 'city', city: 'Lyon', country: 'France', displayValue: 'Lyon, France' },
  { type: 'city', city: 'Marseille', country: 'France', displayValue: 'Marseille, France' },
  { type: 'city', city: 'Toulouse', country: 'France', displayValue: 'Toulouse, France' },
  { type: 'city', city: 'Nice', country: 'France', displayValue: 'Nice, France' },
  { type: 'city', city: 'Nantes', country: 'France', displayValue: 'Nantes, France' },
  { type: 'country', country: 'France', displayValue: 'France' },
  
  // Netherlands
  { type: 'city', city: 'Amsterdam', country: 'Netherlands', displayValue: 'Amsterdam, Netherlands' },
  { type: 'city', city: 'Rotterdam', country: 'Netherlands', displayValue: 'Rotterdam, Netherlands' },
  { type: 'city', city: 'The Hague', country: 'Netherlands', displayValue: 'The Hague, Netherlands' },
  { type: 'city', city: 'Utrecht', country: 'Netherlands', displayValue: 'Utrecht, Netherlands' },
  { type: 'city', city: 'Eindhoven', country: 'Netherlands', displayValue: 'Eindhoven, Netherlands' },
  { type: 'country', country: 'Netherlands', displayValue: 'Netherlands' },
  
  // Canada
  { type: 'city', city: 'Toronto', country: 'Canada', displayValue: 'Toronto, Canada' },
  { type: 'city', city: 'Vancouver', country: 'Canada', displayValue: 'Vancouver, Canada' },
  { type: 'city', city: 'Montreal', country: 'Canada', displayValue: 'Montreal, Canada' },
  { type: 'city', city: 'Calgary', country: 'Canada', displayValue: 'Calgary, Canada' },
  { type: 'city', city: 'Ottawa', country: 'Canada', displayValue: 'Ottawa, Canada' },
  { type: 'city', city: 'Edmonton', country: 'Canada', displayValue: 'Edmonton, Canada' },
  { type: 'city', city: 'Waterloo', country: 'Canada', displayValue: 'Waterloo, Canada' },
  { type: 'country', country: 'Canada', displayValue: 'Canada' },
  
  // Australia
  { type: 'city', city: 'Sydney', country: 'Australia', displayValue: 'Sydney, Australia' },
  { type: 'city', city: 'Melbourne', country: 'Australia', displayValue: 'Melbourne, Australia' },
  { type: 'city', city: 'Brisbane', country: 'Australia', displayValue: 'Brisbane, Australia' },
  { type: 'city', city: 'Perth', country: 'Australia', displayValue: 'Perth, Australia' },
  { type: 'city', city: 'Adelaide', country: 'Australia', displayValue: 'Adelaide, Australia' },
  { type: 'city', city: 'Canberra', country: 'Australia', displayValue: 'Canberra, Australia' },
  { type: 'country', country: 'Australia', displayValue: 'Australia' },
  
  // Singapore
  { type: 'city', city: 'Singapore', country: 'Singapore', displayValue: 'Singapore, Singapore' },
  { type: 'country', country: 'Singapore', displayValue: 'Singapore' },
  
  // UAE
  { type: 'city', city: 'Dubai', country: 'United Arab Emirates', displayValue: 'Dubai, United Arab Emirates' },
  { type: 'city', city: 'Abu Dhabi', country: 'United Arab Emirates', displayValue: 'Abu Dhabi, United Arab Emirates' },
  { type: 'country', country: 'United Arab Emirates', displayValue: 'United Arab Emirates' },
  
  // Spain
  { type: 'city', city: 'Madrid', country: 'Spain', displayValue: 'Madrid, Spain' },
  { type: 'city', city: 'Barcelona', country: 'Spain', displayValue: 'Barcelona, Spain' },
  { type: 'city', city: 'Valencia', country: 'Spain', displayValue: 'Valencia, Spain' },
  { type: 'city', city: 'Seville', country: 'Spain', displayValue: 'Seville, Spain' },
  { type: 'country', country: 'Spain', displayValue: 'Spain' },
  
  // Italy
  { type: 'city', city: 'Rome', country: 'Italy', displayValue: 'Rome, Italy' },
  { type: 'city', city: 'Milan', country: 'Italy', displayValue: 'Milan, Italy' },
  { type: 'city', city: 'Turin', country: 'Italy', displayValue: 'Turin, Italy' },
  { type: 'city', city: 'Florence', country: 'Italy', displayValue: 'Florence, Italy' },
  { type: 'country', country: 'Italy', displayValue: 'Italy' },
  
  // Switzerland
  { type: 'city', city: 'Zurich', country: 'Switzerland', displayValue: 'Zurich, Switzerland' },
  { type: 'city', city: 'Geneva', country: 'Switzerland', displayValue: 'Geneva, Switzerland' },
  { type: 'city', city: 'Basel', country: 'Switzerland', displayValue: 'Basel, Switzerland' },
  { type: 'city', city: 'Bern', country: 'Switzerland', displayValue: 'Bern, Switzerland' },
  { type: 'country', country: 'Switzerland', displayValue: 'Switzerland' },
  
  // Sweden
  { type: 'city', city: 'Stockholm', country: 'Sweden', displayValue: 'Stockholm, Sweden' },
  { type: 'city', city: 'Gothenburg', country: 'Sweden', displayValue: 'Gothenburg, Sweden' },
  { type: 'city', city: 'Malmo', country: 'Sweden', displayValue: 'Malmo, Sweden' },
  { type: 'country', country: 'Sweden', displayValue: 'Sweden' },
  
  // Ireland
  { type: 'city', city: 'Dublin', country: 'Ireland', displayValue: 'Dublin, Ireland' },
  { type: 'city', city: 'Cork', country: 'Ireland', displayValue: 'Cork, Ireland' },
  { type: 'city', city: 'Galway', country: 'Ireland', displayValue: 'Galway, Ireland' },
  { type: 'country', country: 'Ireland', displayValue: 'Ireland' },
  
  // Belgium
  { type: 'city', city: 'Brussels', country: 'Belgium', displayValue: 'Brussels, Belgium' },
  { type: 'city', city: 'Antwerp', country: 'Belgium', displayValue: 'Antwerp, Belgium' },
  { type: 'city', city: 'Ghent', country: 'Belgium', displayValue: 'Ghent, Belgium' },
  { type: 'country', country: 'Belgium', displayValue: 'Belgium' },
  
  // Austria
  { type: 'city', city: 'Vienna', country: 'Austria', displayValue: 'Vienna, Austria' },
  { type: 'city', city: 'Salzburg', country: 'Austria', displayValue: 'Salzburg, Austria' },
  { type: 'country', country: 'Austria', displayValue: 'Austria' },
  
  // Poland
  { type: 'city', city: 'Warsaw', country: 'Poland', displayValue: 'Warsaw, Poland' },
  { type: 'city', city: 'Krakow', country: 'Poland', displayValue: 'Krakow, Poland' },
  { type: 'city', city: 'Wroclaw', country: 'Poland', displayValue: 'Wroclaw, Poland' },
  { type: 'country', country: 'Poland', displayValue: 'Poland' },
  
  // Japan
  { type: 'city', city: 'Tokyo', country: 'Japan', displayValue: 'Tokyo, Japan' },
  { type: 'city', city: 'Osaka', country: 'Japan', displayValue: 'Osaka, Japan' },
  { type: 'city', city: 'Kyoto', country: 'Japan', displayValue: 'Kyoto, Japan' },
  { type: 'country', country: 'Japan', displayValue: 'Japan' },
  
  // South Korea
  { type: 'city', city: 'Seoul', country: 'South Korea', displayValue: 'Seoul, South Korea' },
  { type: 'city', city: 'Busan', country: 'South Korea', displayValue: 'Busan, South Korea' },
  { type: 'country', country: 'South Korea', displayValue: 'South Korea' },
  
  // China
  { type: 'city', city: 'Beijing', country: 'China', displayValue: 'Beijing, China' },
  { type: 'city', city: 'Shanghai', country: 'China', displayValue: 'Shanghai, China' },
  { type: 'city', city: 'Shenzhen', country: 'China', displayValue: 'Shenzhen, China' },
  { type: 'city', city: 'Guangzhou', country: 'China', displayValue: 'Guangzhou, China' },
  { type: 'city', city: 'Hong Kong', country: 'China', displayValue: 'Hong Kong, China' },
  { type: 'country', country: 'China', displayValue: 'China' },
  
  // Brazil
  { type: 'city', city: 'Sao Paulo', country: 'Brazil', displayValue: 'Sao Paulo, Brazil' },
  { type: 'city', city: 'Rio de Janeiro', country: 'Brazil', displayValue: 'Rio de Janeiro, Brazil' },
  { type: 'city', city: 'Brasilia', country: 'Brazil', displayValue: 'Brasilia, Brazil' },
  { type: 'country', country: 'Brazil', displayValue: 'Brazil' },
  
  // Mexico
  { type: 'city', city: 'Mexico City', country: 'Mexico', displayValue: 'Mexico City, Mexico' },
  { type: 'city', city: 'Guadalajara', country: 'Mexico', displayValue: 'Guadalajara, Mexico' },
  { type: 'city', city: 'Monterrey', country: 'Mexico', displayValue: 'Monterrey, Mexico' },
  { type: 'country', country: 'Mexico', displayValue: 'Mexico' },
  
  // Argentina
  { type: 'city', city: 'Buenos Aires', country: 'Argentina', displayValue: 'Buenos Aires, Argentina' },
  { type: 'city', city: 'Cordoba', country: 'Argentina', displayValue: 'Cordoba, Argentina' },
  { type: 'country', country: 'Argentina', displayValue: 'Argentina' },
  
  // New Zealand
  { type: 'city', city: 'Auckland', country: 'New Zealand', displayValue: 'Auckland, New Zealand' },
  { type: 'city', city: 'Wellington', country: 'New Zealand', displayValue: 'Wellington, New Zealand' },
  { type: 'country', country: 'New Zealand', displayValue: 'New Zealand' },
];

export function LocationAutocomplete({ value, onChange, placeholder, className }: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<LocationOption[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [triggerWidth, setTriggerWidth] = useState<number>(0);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentLocationSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent location searches');
      }
    }
  }, []);

  // Save to recent searches
  const addToRecentSearches = useCallback((query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentLocationSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // Delete a recent search
  const deleteRecentSearch = useCallback((searchToDelete: string) => {
    const updated = recentSearches.filter(s => s !== searchToDelete);
    setRecentSearches(updated);
    localStorage.setItem('recentLocationSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // Filter and sort locations based on search query with smart prioritization
  useEffect(() => {
    if (searchQuery.length === 0) {
      // Show trending/popular locations when no search query
      const trending = [
        'Israel',
        'United States', 
        'Tel Aviv, Israel',
        'New York, United States',
        'London, United Kingdom',
        'Berlin, Germany',
      ];
      const trendingLocations = LOCATION_DATA.filter(loc => trending.includes(loc.displayValue));
      setFilteredLocations(trendingLocations);
    } else {
      const query = searchQuery.toLowerCase().trim();
      
      // Filter matching locations
      const filtered = LOCATION_DATA.filter(location =>
        location.displayValue.toLowerCase().includes(query) ||
        location.country.toLowerCase().includes(query) ||
        (location.city && location.city.toLowerCase().includes(query))
      );
      
      // Sort by relevance
      const sorted = filtered.sort((a, b) => {
        const aDisplay = a.displayValue.toLowerCase();
        const bDisplay = b.displayValue.toLowerCase();
        const aCountry = a.country.toLowerCase();
        const bCountry = b.country.toLowerCase();
        const aCity = a.city?.toLowerCase() || '';
        const bCity = b.city?.toLowerCase() || '';
        
        // Exact country match - prioritize country-only entries
        const aExactCountry = aCountry === query && a.type === 'country';
        const bExactCountry = bCountry === query && b.type === 'country';
        
        if (aExactCountry && !bExactCountry) return -1;
        if (!aExactCountry && bExactCountry) return 1;
        
        // Exact city match
        const aExactCity = aCity === query;
        const bExactCity = bCity === query;
        
        if (aExactCity && !bExactCity) return -1;
        if (!aExactCity && bExactCity) return 1;
        
        // Starts with priority (city or country starts with query)
        const aStartsCity = aCity.startsWith(query);
        const bStartsCity = bCity.startsWith(query);
        const aStartsCountry = aCountry.startsWith(query);
        const bStartsCountry = bCountry.startsWith(query);
        
        if (aStartsCity && !bStartsCity) return -1;
        if (!aStartsCity && bStartsCity) return 1;
        if (aStartsCountry && !bStartsCountry) return -1;
        if (!aStartsCountry && bStartsCountry) return 1;
        
        // Contains in display value
        const aContains = aDisplay.includes(query);
        const bContains = bDisplay.includes(query);
        
        if (aContains && !bContains) return -1;
        if (!aContains && bContains) return 1;
        
        // Alphabetical fallback
        return aDisplay.localeCompare(bDisplay);
      });
      
      setFilteredLocations(sorted);
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
    addToRecentSearches(location.displayValue);
    setOpen(false);
    setSelectedIndex(-1);
  };

  // Flatten all items for keyboard navigation
  const allItems: LocationOption[] = [
    ...(searchQuery.length === 0 ? recentSearches.map(s => ({ type: 'recent' as const, displayValue: s, country: '' })) : []),
    ...filteredLocations,
  ];

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => prev < allItems.length - 1 ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < allItems.length) {
        const selectedItem = allItems[selectedIndex];
        if (selectedItem.type === 'recent') {
          onChange(selectedItem.displayValue);
          setSearchQuery(selectedItem.displayValue);
          setOpen(false);
          setSelectedIndex(-1);
        } else {
          handleSelect(selectedItem);
        }
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setSelectedIndex(-1);
    }
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
              setSelectedIndex(-1);
              if (!open) setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            className="flex h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 bg-background z-50" 
        style={{ width: triggerWidth > 0 ? `${triggerWidth}px` : 'auto' }}
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command className="rounded-lg border-none shadow-lg">
          <CommandList className="max-h-[400px]">
            {searchQuery.length === 0 && recentSearches.length > 0 && (
              <CommandGroup heading={
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Recent Searches
                </div>
              }>
                {recentSearches.map((search, idx) => (
                  <CommandItem
                    key={`recent-${idx}`}
                    value={search}
                    onSelect={() => {
                      onChange(search);
                      setSearchQuery(search);
                      setOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onMouseLeave={() => setSelectedIndex(-1)}
                    className={cn(
                      "flex items-center justify-between group",
                      selectedIndex === idx
                        ? "bg-gray-100 dark:bg-gray-800 data-[selected=true]:bg-gray-100 dark:data-[selected=true]:bg-gray-800"
                        : "data-[selected=true]:bg-transparent data-[selected=true]:text-foreground"
                    )}
                  >
                    <span>{search}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRecentSearch(search);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {filteredLocations.length === 0 && searchQuery.length > 0 && (
              <CommandEmpty>No locations found.</CommandEmpty>
            )}

            {Object.keys(groupedLocations).map((country, countryIdx) => {
              const startIdx = (searchQuery.length === 0 ? recentSearches.length : 0) + 
                               filteredLocations.findIndex(loc => loc.country === country);
              return (
                <CommandGroup key={country} heading={country}>
                  {groupedLocations[country].map((location, idx) => {
                    const globalIdx = startIdx + idx;
                    return (
                      <CommandItem
                        key={`${location.type}-${location.displayValue}-${idx}`}
                        value={location.displayValue}
                        onSelect={() => handleSelect(location)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        onMouseLeave={() => setSelectedIndex(-1)}
                        className={cn(
                          "flex items-center gap-2",
                          selectedIndex === globalIdx
                            ? "bg-gray-100 dark:bg-gray-800 data-[selected=true]:bg-gray-100 dark:data-[selected=true]:bg-gray-800"
                            : "data-[selected=true]:bg-transparent data-[selected=true]:text-foreground"
                        )}
                      >
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className={cn(
                          location.type === 'country' && 'font-semibold'
                        )}>
                          {location.displayValue}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

