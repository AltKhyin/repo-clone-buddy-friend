// ABOUTME: Phone input component with Brazilian country selection and proper masking
import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "./input"

interface PhoneInputProps extends Omit<React.ComponentProps<"input">, 'type'> {
  value?: string;
  onValueChange?: (value: string) => void;
  countryCode?: string;
  onCountryCodeChange?: (countryCode: string) => void;
}

const countries = [
  { id: "br", code: "+55", name: "Brasil", flag: "🇧🇷", fallback: "BR" },
  { id: "us", code: "+1", name: "Estados Unidos", flag: "🇺🇸", fallback: "US" },
  { id: "pt", code: "+351", name: "Portugal", flag: "🇵🇹", fallback: "PT" },
  { id: "ar", code: "+54", name: "Argentina", flag: "🇦🇷", fallback: "AR" },
  { id: "cl", code: "+56", name: "Chile", flag: "🇨🇱", fallback: "CL" },
  { id: "co", code: "+57", name: "Colômbia", flag: "🇨🇴", fallback: "CO" },
  { id: "pe", code: "+51", name: "Peru", flag: "🇵🇪", fallback: "PE" },
  { id: "ve", code: "+58", name: "Venezuela", flag: "🇻🇪", fallback: "VE" },
  { id: "ec", code: "+593", name: "Equador", flag: "🇪🇨", fallback: "EC" },
  { id: "uy", code: "+598", name: "Uruguai", flag: "🇺🇾", fallback: "UY" },
  { id: "py", code: "+595", name: "Paraguai", flag: "🇵🇾", fallback: "PY" },
  { id: "bo", code: "+591", name: "Bolívia", flag: "🇧🇴", fallback: "BO" },
  { id: "es", code: "+34", name: "Espanha", flag: "🇪🇸", fallback: "ES" },
  { id: "it", code: "+39", name: "Itália", flag: "🇮🇹", fallback: "IT" },
  { id: "fr", code: "+33", name: "França", flag: "🇫🇷", fallback: "FR" },
  { id: "de", code: "+49", name: "Alemanha", flag: "🇩🇪", fallback: "DE" },
  { id: "gb", code: "+44", name: "Reino Unido", flag: "🇬🇧", fallback: "GB" },
  { id: "nl", code: "+31", name: "Holanda", flag: "🇳🇱", fallback: "NL" },
  { id: "ch", code: "+41", name: "Suíça", flag: "🇨🇭", fallback: "CH" },
  { id: "at", code: "+43", name: "Áustria", flag: "🇦🇹", fallback: "AT" },
  { id: "be", code: "+32", name: "Bélgica", flag: "🇧🇪", fallback: "BE" },
  { id: "dk", code: "+45", name: "Dinamarca", flag: "🇩🇰", fallback: "DK" },
  { id: "se", code: "+46", name: "Suécia", flag: "🇸🇪", fallback: "SE" },
  { id: "no", code: "+47", name: "Noruega", flag: "🇳🇴", fallback: "NO" },
  { id: "fi", code: "+358", name: "Finlândia", flag: "🇫🇮", fallback: "FI" },
  { id: "pl", code: "+48", name: "Polônia", flag: "🇵🇱", fallback: "PL" },
  { id: "cz", code: "+420", name: "República Tcheca", flag: "🇨🇿", fallback: "CZ" },
  { id: "hu", code: "+36", name: "Hungria", flag: "🇭🇺", fallback: "HU" },
  { id: "ua", code: "+380", name: "Ucrânia", flag: "🇺🇦", fallback: "UA" },
  { id: "ru", code: "+7", name: "Rússia", flag: "🇷🇺", fallback: "RU" },
  { id: "cn", code: "+86", name: "China", flag: "🇨🇳", fallback: "CN" },
  { id: "jp", code: "+81", name: "Japão", flag: "🇯🇵", fallback: "JP" },
  { id: "kr", code: "+82", name: "Coreia do Sul", flag: "🇰🇷", fallback: "KR" },
  { id: "in", code: "+91", name: "Índia", flag: "🇮🇳", fallback: "IN" },
  { id: "hk", code: "+852", name: "Hong Kong", flag: "🇭🇰", fallback: "HK" },
  { id: "sg", code: "+65", name: "Singapura", flag: "🇸🇬", fallback: "SG" },
  { id: "my", code: "+60", name: "Malásia", flag: "🇲🇾", fallback: "MY" },
  { id: "th", code: "+66", name: "Tailândia", flag: "🇹🇭", fallback: "TH" },
  { id: "vn", code: "+84", name: "Vietnã", flag: "🇻🇳", fallback: "VN" },
  { id: "id", code: "+62", name: "Indonésia", flag: "🇮🇩", fallback: "ID" },
  { id: "ph", code: "+63", name: "Filipinas", flag: "🇵🇭", fallback: "PH" },
  { id: "au", code: "+61", name: "Austrália", flag: "🇦🇺", fallback: "AU" },
  { id: "nz", code: "+64", name: "Nova Zelândia", flag: "🇳🇿", fallback: "NZ" },
  { id: "za", code: "+27", name: "África do Sul", flag: "🇿🇦", fallback: "ZA" },
  { id: "eg", code: "+20", name: "Egito", flag: "🇪🇬", fallback: "EG" },
  { id: "ng", code: "+234", name: "Nigéria", flag: "🇳🇬", fallback: "NG" },
  { id: "ke", code: "+254", name: "Quênia", flag: "🇰🇪", fallback: "KE" },
  { id: "mx", code: "+52", name: "México", flag: "🇲🇽", fallback: "MX" },
  { id: "ca", code: "+1", name: "Canadá", flag: "🇨🇦", fallback: "CA" },
];

// Component to render country flag with fallback
const CountryFlag: React.FC<{ flag: string; fallback: string; className?: string }> = ({ 
  flag, 
  fallback, 
  className = "" 
}) => {
  const [useFallback, setUseFallback] = React.useState(false);
  
  React.useEffect(() => {
    // Simple test to detect if emoji flags are supported
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '16px Arial';
      ctx.fillText(flag, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      
      // If all pixels are the same (likely all transparent), emojis aren't supported
      const isEmptyCanvas = data.every((value, index) => index % 4 === 3 ? true : value === data[0]);
      setUseFallback(isEmptyCanvas);
    }
  }, [flag]);

  if (useFallback) {
    return (
      <div className={cn(
        "text-xs font-bold bg-gray-200 text-gray-700 px-1 py-0.5 rounded min-w-[20px] text-center",
        className
      )}>
        {fallback}
      </div>
    );
  }

  return (
    <span 
      className={cn("text-base", className)} 
      style={{ 
        fontFamily: '"Twemoji Country Flags", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
        fontSize: '16px',
        lineHeight: '1',
        display: 'inline-block'
      }}
    >
      {flag}
    </span>
  );
};

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ 
    className, 
    value = "", 
    onValueChange, 
    countryCode = "+55",
    onCountryCodeChange,
    onChange,
    ...props 
  }, ref) => {
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Format Brazilian phone number: +55 (XX) XXXXX-XXXX
    const formatPhoneNumber = (phone: string, country: string): string => {
      // Remove all non-digits
      const digits = phone.replace(/\D/g, '');
      
      if (country === "+55") {
        // Brazilian format
        if (digits.length <= 2) return digits;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        if (digits.length <= 11) {
          return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
        }
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
      }
      
      // Default formatting for other countries
      return digits;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formattedValue = formatPhoneNumber(inputValue, countryCode);
      
      onValueChange?.(formattedValue);
      
      // Also call the original onChange if provided
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: formattedValue
          }
        };
        onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
      }
    };

    const handleCountrySelect = (code: string) => {
      onCountryCodeChange?.(code);
      setIsDropdownOpen(false);
    };

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsDropdownOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedCountry = countries.find(c => c.code === countryCode) || countries[0];

    return (
      <div className="relative flex">
        {/* Country selector dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1 px-3 py-2 h-10 bg-white border border-gray-300 border-r-0 rounded-l-md hover:bg-gray-50 focus:outline-none focus:border-black focus:z-10 relative"
          >
            <CountryFlag 
              flag={selectedCountry.flag} 
              fallback={selectedCountry.fallback}
            />
            <span className="text-sm font-medium text-gray-700">{selectedCountry.code}</span>
            <ChevronDown className="h-3 w-3 text-gray-500" />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 z-20 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto min-w-[180px]">
              {countries.map((country) => (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => handleCountrySelect(country.code)}
                  className={cn(
                    "w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 text-sm",
                    country.code === countryCode && "bg-gray-50 font-medium"
                  )}
                >
                  <CountryFlag 
                    flag={country.flag} 
                    fallback={country.fallback}
                  />
                  <span className="font-medium">{country.code}</span>
                  <span className="text-gray-600">{country.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Phone number input */}
        <Input
          type="tel"
          ref={ref}
          value={value}
          onChange={handleInputChange}
          placeholder={
            value && value.length > 0 
              ? countryCode === "+55" ? "(11) 99999-9999" : "Número de telefone"
              : "Telefone"
          }
          className={cn(
            "rounded-l-none border-l-0 focus:border-l focus:z-30 relative",
            className
          )}
          {...props}
        />
      </div>
    );
  }
)
PhoneInput.displayName = "PhoneInput"

export { PhoneInput }