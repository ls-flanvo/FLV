/**
 * Schengen Area detection from departure IATA airport code.
 * Returns true if the airport is OUTSIDE the Schengen Area
 * (requires passport control + potentially longer baggage wait).
 *
 * Schengen countries: AT BE CH CZ DE DK EE ES FI FR GR HR HU
 *                     IS IT LI LT LU LV MT NL NO PL PT SE SI SK
 */

// IATA prefix → country code mapping for common airports
// Built from the most frequent routes to/from Italian airports
const IATA_COUNTRY: Record<string, string> = {
  // Italy (domestic — always fast, no passport)
  FCO: 'IT', MXP: 'IT', LIN: 'IT', BGY: 'IT', VCE: 'IT', NAP: 'IT',
  CTA: 'IT', PMO: 'IT', BRI: 'IT', CAG: 'IT', CIA: 'IT', PSA: 'IT',
  BLQ: 'IT', TRN: 'IT', GOA: 'IT', FLR: 'IT', VRN: 'IT', AOI: 'IT',
  CIY: 'IT', REG: 'IT', SUF: 'IT', LMP: 'IT', PNL: 'IT',

  // Schengen — no passport control
  VIE: 'AT', GRZ: 'AT', INN: 'AT', SZG: 'AT',       // Austria
  BRU: 'BE', CRL: 'BE',                               // Belgium
  ZRH: 'CH', GVA: 'CH', BSL: 'CH',                   // Switzerland
  PRG: 'CZ', BRQ: 'CZ',                               // Czech Rep.
  CPH: 'DK', BLL: 'DK',                               // Denmark
  TLL: 'EE',                                           // Estonia
  HEL: 'FI', TMP: 'FI', OUL: 'FI',                   // Finland
  CDG: 'FR', ORY: 'FR', LYS: 'FR', MRS: 'FR', NCE: 'FR', TLS: 'FR', BOD: 'FR', NTE: 'FR',  // France
  FRA: 'DE', MUC: 'DE', DUS: 'DE', TXL: 'DE', BER: 'DE', HAM: 'DE', STR: 'DE', CGN: 'DE', HAJ: 'DE', NUE: 'DE',  // Germany
  ATH: 'GR', SKG: 'GR', HER: 'GR', RHO: 'GR', CFU: 'GR', KGS: 'GR', ZTH: 'GR', MJT: 'GR',  // Greece
  ZAG: 'HR', SPU: 'HR', DBV: 'HR',                   // Croatia
  BUD: 'HU', DEB: 'HU',                               // Hungary
  KEF: 'IS',                                           // Iceland
  VNO: 'LT', KUN: 'LT',                               // Lithuania
  LUX: 'LU',                                           // Luxembourg
  RIX: 'LV',                                           // Latvia
  MLA: 'MT',                                           // Malta
  AMS: 'NL', EIN: 'NL', RTM: 'NL',                   // Netherlands
  OSL: 'NO', BGO: 'NO', TRD: 'NO', SVG: 'NO', TOS: 'NO',  // Norway
  WAW: 'PL', KRK: 'PL', WRO: 'PL', GDN: 'PL', KTW: 'PL', POZ: 'PL',  // Poland
  LIS: 'PT', OPO: 'PT', FAO: 'PT', FNC: 'PT',        // Portugal
  ARN: 'SE', GOT: 'SE', MMX: 'SE',                   // Sweden
  LJU: 'SI',                                           // Slovenia
  BTS: 'SK', KSC: 'SK',                               // Slovakia
  MAD: 'ES', BCN: 'ES', PMI: 'ES', AGP: 'ES', ALC: 'ES', SVQ: 'ES', IBZ: 'ES', VLC: 'ES', BIO: 'ES', TFN: 'ES', LPA: 'ES',  // Spain

  // NON-Schengen — passport control required
  // United Kingdom
  LHR: 'GB', LGW: 'GB', LCY: 'GB', STN: 'GB', LTN: 'GB',
  MAN: 'GB', EDI: 'GB', BHX: 'GB', GLA: 'GB', BRS: 'GB', NCL: 'GB',
  // Turkey
  IST: 'TR', SAW: 'TR', AYT: 'TR', ADB: 'TR', ESB: 'TR', DLM: 'TR', BJV: 'TR',
  // UAE
  DXB: 'AE', AUH: 'AE', SHJ: 'AE',
  // Morocco
  CMN: 'MA', RAK: 'MA', FEZ: 'MA', TNG: 'MA', AGA: 'MA',
  // Tunisia
  TUN: 'TN', MIR: 'TN', DJE: 'TN', SFA: 'TN',
  // Egypt
  CAI: 'EG', HRG: 'EG', SSH: 'EG', LXR: 'EG',
  // Albania
  TIA: 'AL',
  // Serbia
  BEG: 'RS',
  // North Macedonia
  SKP: 'MK',
  // Bosnia
  SJJ: 'BA',
  // Kosovo
  PRN: 'XK',
  // Montenegro
  TGD: 'ME', TIV: 'ME',
  // Georgia
  TBS: 'GE',
  // Armenia
  EVN: 'AM',
  // Azerbaijan
  GYD: 'AZ',
  // Israel
  TLV: 'IL',
  // Jordan
  AMM: 'JO',
  // USA
  JFK: 'US', EWR: 'US', LAX: 'US', ORD: 'US', MIA: 'US', BOS: 'US',
  ATL: 'US', SFO: 'US', IAD: 'US', DFW: 'US', PHX: 'US',
  // Canada
  YYZ: 'CA', YUL: 'CA', YVR: 'CA', YYC: 'CA',
  // India
  DEL: 'IN', BOM: 'IN', BLR: 'IN', MAA: 'IN', HYD: 'IN', CCU: 'IN',
  // China
  PEK: 'CN', PVG: 'CN', CAN: 'CN', SZX: 'CN', CTU: 'CN',
  // Japan
  NRT: 'JP', HND: 'JP', KIX: 'JP',
  // South Korea
  ICN: 'KR', GMP: 'KR',
  // Thailand
  BKK: 'TH', DMK: 'TH', HKT: 'TH', CNX: 'TH',
  // Brazil
  GRU: 'BR', GIG: 'BR', BSB: 'BR',
  // Argentina
  EZE: 'AR', AEP: 'AR',
  // Russia (mostly suspended 2022+)
  SVO: 'RU', DME: 'RU', LED: 'RU',
  // Ukraine
  KBP: 'UA', LWO: 'UA',
  // Iran
  IKA: 'IR', MHD: 'IR',
  // Saudi Arabia
  RUH: 'SA', JED: 'SA', DMM: 'SA',
  // Kuwait
  KWI: 'KW',
  // Qatar
  DOH: 'QA',
  // Bahrain
  BAH: 'BH',
  // Oman
  MCT: 'OM',
};

const SCHENGEN_COUNTRIES = new Set([
  'AT', 'BE', 'CH', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR',
  'GR', 'HR', 'HU', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MT',
  'NL', 'NO', 'PL', 'PT', 'SE', 'SI', 'SK',
]);

/**
 * Returns true if the departure airport is OUTSIDE the Schengen Area.
 * Defaults to false (Schengen) for unknown airports — conservative choice
 * since false negatives (treating non-Schengen as Schengen) are worse.
 */
export function isExtraSchengen(departureIata: string): boolean {
  const country = IATA_COUNTRY[departureIata.toUpperCase()];
  if (!country) return false; // Unknown → assume Schengen (safe default)
  return !SCHENGEN_COUNTRIES.has(country);
}

/**
 * Returns baggage wait minutes based on flight origin.
 * - Domestic (IT): 20 min
 * - Schengen: 25 min
 * - Extra-Schengen (passport control): 45 min
 */
export function baggageWaitMins(departureIata: string): number {
  const country = IATA_COUNTRY[departureIata.toUpperCase()];
  if (country === 'IT') return 20;
  if (!country || SCHENGEN_COUNTRIES.has(country)) return 25;
  return 45;
}
