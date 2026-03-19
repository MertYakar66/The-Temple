import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin } from 'lucide-react';

interface Prediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

interface LocationAutocompleteProps {
  value: string;
  placeId?: string;
  onChange: (location: string, placeId?: string) => void;
  className?: string;
  placeholder?: string;
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

let placesReady: Promise<void> | null = null;

function ensurePlacesLoaded(): Promise<void> {
  if (!API_KEY) return Promise.reject(new Error('No API key'));
  if (placesReady) return placesReady;
  const loader = new Loader({ apiKey: API_KEY, libraries: ['places'] });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  placesReady = (loader as any).importLibrary('places').then(() => {}) as Promise<void>;
  return placesReady;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export function LocationAutocomplete({
  value,
  onChange,
  className = '',
  placeholder = 'Add location',
}: LocationAutocompleteProps) {
  const [input, setInput] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);
  const autocompleteService = useRef<any>(null);
  const sessionToken = useRef<any>(null);
  const placesNs = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensurePlacesLoaded()
      .then(() => {
        const places = (window as any).google.maps.places;
        placesNs.current = places;
        autocompleteService.current = new places.AutocompleteService();
        sessionToken.current = new places.AutocompleteSessionToken();
        setApiAvailable(true);
      })
      .catch(() => {
        setApiAvailable(false);
      });
  }, []);

  useEffect(() => {
    setInput(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchPredictions = useCallback((query: string) => {
    if (!autocompleteService.current || !query.trim()) {
      setPredictions([]);
      return;
    }
    autocompleteService.current.getPlacePredictions(
      { input: query, sessionToken: sessionToken.current },
      (results: any[] | null, status: string) => {
        if (status === 'OK' && results) {
          setPredictions(
            results.map((r: any) => ({
              placeId: r.place_id,
              mainText: r.structured_formatting.main_text,
              secondaryText: r.structured_formatting.secondary_text || '',
              description: r.description,
            }))
          );
        } else {
          setPredictions([]);
        }
      }
    );
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    onChange(val, undefined);
    if (apiAvailable && val.trim().length >= 2) {
      fetchPredictions(val);
      setOpen(true);
    } else {
      setPredictions([]);
      setOpen(false);
    }
  };

  const handleSelect = (pred: Prediction) => {
    setInput(pred.description);
    onChange(pred.description, pred.placeId);
    setPredictions([]);
    setOpen(false);
    // Refresh session token after selection
    if (placesNs.current) {
      sessionToken.current = new placesNs.current.AutocompleteSessionToken();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // No API key → plain text input
  if (!API_KEY) {
    return (
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          onChange(e.target.value, undefined);
        }}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        onFocus={() => { if (predictions.length > 0) setOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {open && predictions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-60 overflow-y-auto">
          {predictions.map((pred) => (
            <button
              key={pred.placeId}
              type="button"
              onClick={() => handleSelect(pred)}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {pred.mainText}
                </p>
                {pred.secondaryText && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {pred.secondaryText}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
