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
  { type: 'city', city: 'Nahariya', country: 'Israel', displayValue: 'Nahariya, Israel' },
  { type: 'city', city: 'Tiberias', country: 'Israel', displayValue: 'Tiberias, Israel' },
  { type: 'city', city: 'Eilat', country: 'Israel', displayValue: 'Eilat, Israel' },
  { type: 'city', city: 'Rosh HaAyin', country: 'Israel', displayValue: 'Rosh HaAyin, Israel' },
  { type: 'city', city: 'Ramla', country: 'Israel', displayValue: 'Ramla, Israel' },
  { type: 'city', city: 'Lod', country: 'Israel', displayValue: 'Lod, Israel' },
  { type: 'city', city: 'Nazareth', country: 'Israel', displayValue: 'Nazareth, Israel' },
  { type: 'city', city: 'Acre', country: 'Israel', displayValue: 'Acre, Israel' },
  { type: 'city', city: 'Givatayim', country: 'Israel', displayValue: 'Givatayim, Israel' },
  { type: 'city', city: 'Kiryat Ata', country: 'Israel', displayValue: 'Kiryat Ata, Israel' },
  { type: 'city', city: 'Kiryat Gat', country: 'Israel', displayValue: 'Kiryat Gat, Israel' },
  { type: 'city', city: 'Kiryat Motzkin', country: 'Israel', displayValue: 'Kiryat Motzkin, Israel' },
  { type: 'city', city: 'Kiryat Yam', country: 'Israel', displayValue: 'Kiryat Yam, Israel' },
  { type: 'city', city: 'Kiryat Bialik', country: 'Israel', displayValue: 'Kiryat Bialik, Israel' },
  { type: 'city', city: 'Kiryat Ono', country: 'Israel', displayValue: 'Kiryat Ono, Israel' },
  { type: 'city', city: 'Or Yehuda', country: 'Israel', displayValue: 'Or Yehuda, Israel' },
  { type: 'city', city: 'Yavne', country: 'Israel', displayValue: 'Yavne, Israel' },
  { type: 'city', city: 'Beit Shemesh', country: 'Israel', displayValue: 'Beit Shemesh, Israel' },
  { type: 'city', city: 'Ness Ziona', country: 'Israel', displayValue: 'Ness Ziona, Israel' },
  { type: 'city', city: 'Ramat HaSharon', country: 'Israel', displayValue: 'Ramat HaSharon, Israel' },
  { type: 'city', city: 'Karmiel', country: 'Israel', displayValue: 'Karmiel, Israel' },
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
  { type: 'city', city: 'Detroit', country: 'United States', displayValue: 'Detroit, United States' },
  { type: 'city', city: 'Minneapolis', country: 'United States', displayValue: 'Minneapolis, United States' },
  { type: 'city', city: 'Tampa', country: 'United States', displayValue: 'Tampa, United States' },
  { type: 'city', city: 'Charlotte', country: 'United States', displayValue: 'Charlotte, United States' },
  { type: 'city', city: 'Columbus', country: 'United States', displayValue: 'Columbus, United States' },
  { type: 'city', city: 'Indianapolis', country: 'United States', displayValue: 'Indianapolis, United States' },
  { type: 'city', city: 'San Antonio', country: 'United States', displayValue: 'San Antonio, United States' },
  { type: 'city', city: 'Jacksonville', country: 'United States', displayValue: 'Jacksonville, United States' },
  { type: 'city', city: 'Fort Worth', country: 'United States', displayValue: 'Fort Worth, United States' },
  { type: 'city', city: 'Cleveland', country: 'United States', displayValue: 'Cleveland, United States' },
  { type: 'city', city: 'Milwaukee', country: 'United States', displayValue: 'Milwaukee, United States' },
  { type: 'city', city: 'Salt Lake City', country: 'United States', displayValue: 'Salt Lake City, United States' },
  { type: 'city', city: 'Kansas City', country: 'United States', displayValue: 'Kansas City, United States' },
  { type: 'city', city: 'Sacramento', country: 'United States', displayValue: 'Sacramento, United States' },
  { type: 'city', city: 'Pittsburgh', country: 'United States', displayValue: 'Pittsburgh, United States' },
  { type: 'city', city: 'Cincinnati', country: 'United States', displayValue: 'Cincinnati, United States' },
  { type: 'city', city: 'Baltimore', country: 'United States', displayValue: 'Baltimore, United States' },
  { type: 'city', city: 'St. Louis', country: 'United States', displayValue: 'St. Louis, United States' },
  { type: 'city', city: 'Orlando', country: 'United States', displayValue: 'Orlando, United States' },
  { type: 'city', city: 'Tucson', country: 'United States', displayValue: 'Tucson, United States' },
  { type: 'city', city: 'Albuquerque', country: 'United States', displayValue: 'Albuquerque, United States' },
  { type: 'city', city: 'New Orleans', country: 'United States', displayValue: 'New Orleans, United States' },
  { type: 'city', city: 'Memphis', country: 'United States', displayValue: 'Memphis, United States' },
  { type: 'city', city: 'Louisville', country: 'United States', displayValue: 'Louisville, United States' },
  { type: 'city', city: 'Richmond', country: 'United States', displayValue: 'Richmond, United States' },
  { type: 'city', city: 'Providence', country: 'United States', displayValue: 'Providence, United States' },
  { type: 'city', city: 'Hartford', country: 'United States', displayValue: 'Hartford, United States' },
  { type: 'city', city: 'Buffalo', country: 'United States', displayValue: 'Buffalo, United States' },
  { type: 'city', city: 'Rochester', country: 'United States', displayValue: 'Rochester, United States' },
  { type: 'city', city: 'Omaha', country: 'United States', displayValue: 'Omaha, United States' },
  { type: 'city', city: 'Boise', country: 'United States', displayValue: 'Boise, United States' },
  { type: 'city', city: 'Spokane', country: 'United States', displayValue: 'Spokane, United States' },
  { type: 'city', city: 'Durham', country: 'United States', displayValue: 'Durham, United States' },
  { type: 'city', city: 'Palo Alto', country: 'United States', displayValue: 'Palo Alto, United States' },
  { type: 'city', city: 'Irvine', country: 'United States', displayValue: 'Irvine, United States' },
  { type: 'city', city: 'Santa Clara', country: 'United States', displayValue: 'Santa Clara, United States' },
  { type: 'city', city: 'Redmond', country: 'United States', displayValue: 'Redmond, United States' },
  { type: 'city', city: 'Bellevue', country: 'United States', displayValue: 'Bellevue, United States' },
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
  { type: 'city', city: 'Mississauga', country: 'Canada', displayValue: 'Mississauga, Canada' },
  { type: 'city', city: 'Winnipeg', country: 'Canada', displayValue: 'Winnipeg, Canada' },
  { type: 'city', city: 'Quebec City', country: 'Canada', displayValue: 'Quebec City, Canada' },
  { type: 'city', city: 'Hamilton', country: 'Canada', displayValue: 'Hamilton, Canada' },
  { type: 'city', city: 'Brampton', country: 'Canada', displayValue: 'Brampton, Canada' },
  { type: 'city', city: 'Surrey', country: 'Canada', displayValue: 'Surrey, Canada' },
  { type: 'city', city: 'Laval', country: 'Canada', displayValue: 'Laval, Canada' },
  { type: 'city', city: 'Halifax', country: 'Canada', displayValue: 'Halifax, Canada' },
  { type: 'city', city: 'London', country: 'Canada', displayValue: 'London, Canada' },
  { type: 'city', city: 'Markham', country: 'Canada', displayValue: 'Markham, Canada' },
  { type: 'city', city: 'Vaughan', country: 'Canada', displayValue: 'Vaughan, Canada' },
  { type: 'city', city: 'Gatineau', country: 'Canada', displayValue: 'Gatineau, Canada' },
  { type: 'city', city: 'Saskatoon', country: 'Canada', displayValue: 'Saskatoon, Canada' },
  { type: 'city', city: 'Longueuil', country: 'Canada', displayValue: 'Longueuil, Canada' },
  { type: 'city', city: 'Kitchener', country: 'Canada', displayValue: 'Kitchener, Canada' },
  { type: 'city', city: 'Burnaby', country: 'Canada', displayValue: 'Burnaby, Canada' },
  { type: 'city', city: 'Regina', country: 'Canada', displayValue: 'Regina, Canada' },
  { type: 'city', city: 'Richmond', country: 'Canada', displayValue: 'Richmond, Canada' },
  { type: 'city', city: 'Richmond Hill', country: 'Canada', displayValue: 'Richmond Hill, Canada' },
  { type: 'city', city: 'Oakville', country: 'Canada', displayValue: 'Oakville, Canada' },
  { type: 'city', city: 'Burlington', country: 'Canada', displayValue: 'Burlington, Canada' },
  { type: 'city', city: 'Barrie', country: 'Canada', displayValue: 'Barrie, Canada' },
  { type: 'city', city: 'Oshawa', country: 'Canada', displayValue: 'Oshawa, Canada' },
  { type: 'city', city: 'Sherbrooke', country: 'Canada', displayValue: 'Sherbrooke, Canada' },
  { type: 'city', city: 'Saguenay', country: 'Canada', displayValue: 'Saguenay, Canada' },
  { type: 'city', city: 'St. Catharines', country: 'Canada', displayValue: 'St. Catharines, Canada' },
  { type: 'city', city: 'Cambridge', country: 'Canada', displayValue: 'Cambridge, Canada' },
  { type: 'city', city: 'Kingston', country: 'Canada', displayValue: 'Kingston, Canada' },
  { type: 'city', city: 'Guelph', country: 'Canada', displayValue: 'Guelph, Canada' },
  { type: 'city', city: 'Victoria', country: 'Canada', displayValue: 'Victoria, Canada' },
  { type: 'city', city: 'Whitby', country: 'Canada', displayValue: 'Whitby, Canada' },
  { type: 'city', city: 'Ajax', country: 'Canada', displayValue: 'Ajax, Canada' },
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
  const [previewValue, setPreviewValue] = useState('');
  const [originalQuery, setOriginalQuery] = useState('');

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
      setFilteredLocations(LOCATION_DATA.slice(0, 20)); // Show first 20 by default
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
    setPreviewValue('');
    setOriginalQuery('');
  };

  const showRecentSearches = searchQuery.length === 0;

  // Flatten all items for keyboard navigation
  const allItems = [
    ...(showRecentSearches ? recentSearches.map(s => ({ type: 'recent' as const, displayValue: s, country: '' })) : []),
    ...filteredLocations,
  ];

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Store original query on first arrow down
      if (selectedIndex === -1) {
        setOriginalQuery(searchQuery);
      }
      setSelectedIndex(prev => {
        const newIndex = prev < allItems.length - 1 ? prev + 1 : prev;
        // Preview the selected item
        if (newIndex >= 0 && newIndex < allItems.length) {
          setPreviewValue(allItems[newIndex].displayValue);
        }
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => {
        const newIndex = prev > -1 ? prev - 1 : -1;
        // Restore original query when going back to -1
        if (newIndex === -1) {
          setPreviewValue('');
        } else if (newIndex >= 0 && newIndex < allItems.length) {
          setPreviewValue(allItems[newIndex].displayValue);
        }
        return newIndex;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < allItems.length) {
        const selectedItem = allItems[selectedIndex];
        if (selectedItem.type === 'recent') {
          onChange(selectedItem.displayValue);
          setSearchQuery(selectedItem.displayValue);
          addToRecentSearches(selectedItem.displayValue);
          setOpen(false);
        } else {
          handleSelect(selectedItem as LocationOption);
        }
      }
      setPreviewValue('');
      setOriginalQuery('');
      setSelectedIndex(-1);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setOpen(false);
      setSelectedIndex(-1);
      setPreviewValue('');
      setOriginalQuery('');
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
          onMouseDown={(e) => {
            const target = e.target as HTMLElement;
            const clickedInput = !!target.closest('input');
            if (!open && !clickedInput) {
              e.preventDefault();
              setOpen(true);
              setSelectedIndex(-1);
              setPreviewValue('');
              requestAnimationFrame(() => inputRef.current?.focus());
            }
          }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            const clickedInput = !!target.closest('input');
            if (!open && !clickedInput) {
              e.preventDefault();
              setOpen(true);
              inputRef.current?.focus();
            }
          }}
        >
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder || "Search city or country..."}
            value={previewValue || searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onChange(e.target.value);
              setSelectedIndex(-1);
              setPreviewValue('');
              setOriginalQuery('');
              if (!open) setOpen(true);
            }}
            onMouseDown={(e) => {
              if (open) {
                e.stopPropagation();
              }
            }}
            onClick={(e) => {
              if (open) {
                e.stopPropagation();
              }
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
        className="p-0 z-[100]" 
        style={{ width: triggerWidth > 0 ? `${triggerWidth}px` : 'auto' }}
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command className="rounded-lg border-none shadow-lg bg-popover">
          <CommandList 
            className="max-h-[400px] overflow-y-auto overscroll-contain"
            onWheel={(e) => e.stopPropagation()}
          >
            {showRecentSearches && recentSearches.length > 0 && (
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
                      addToRecentSearches(search);
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

            {!showRecentSearches && filteredLocations.length === 0 && (
              <CommandEmpty>No locations found.</CommandEmpty>
            )}

            {!showRecentSearches && Object.keys(groupedLocations).map((country, countryIdx) => {
              const startIdx = (showRecentSearches ? recentSearches.length : 0) + filteredLocations.findIndex(loc => loc.country === country);
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

