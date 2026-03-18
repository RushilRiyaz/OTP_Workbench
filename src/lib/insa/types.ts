// INSA Response Types (from actual API response at /restproxy/2.49/trip)

export interface InsaLocation {
  name: string;
  type: string; // "ST" = station, "ADR" = address, etc.
  id: string;
  extId: string;
  lon: number;
  lat: number;
  routeIdx?: number;
  prognosisType?: string;
  time: string; // "HH:mm:ss"
  date: string; // "YYYY-MM-DD"
  tz?: number;
  altId?: string[];
  minimumChangeDuration?: string;
}

export interface InsaProduct {
  name: string;
  internalName?: string;
  displayNumber?: string;
  num?: string;
  line?: string;
  lineId?: string;
  catOut: string; // "Bus", "Tram", "S", "RE", "RB", "ICE", "IC", etc.
  catIn?: string;
  catCode: string; // "0"-"9"
  cls: string; // bitmask as string, e.g. "64"
  catOutS?: string;
  catOutL?: string;
  operatorCode?: string;
  operator?: string;
  admin?: string;
  routeIdxFrom?: number;
  routeIdxTo?: number;
  matchId?: string;
  icon?: { res?: string };
  operatorInfo?: {
    name?: string;
    nameS?: string;
    nameN?: string;
    nameL?: string;
    id?: string;
  };
}

export interface InsaStop {
  name: string;
  id?: string;
  extId?: string;
  lon?: number;
  lat?: number;
  routeIdx?: number;
  arrTime?: string;
  arrDate?: string;
  arrTz?: number;
  depTime?: string;
  depDate?: string;
  depTz?: number;
  arrTrack?: string;
  depTrack?: string;
  depDir?: string;
  type?: string;
}

export interface InsaPolylineDesc {
  delta: boolean;
  dim: number;
  crdEncYX: string;
  crdEncS?: string;
  crdEncZ?: string;
}

export interface InsaGisRoute {
  dist?: number;
  durS?: string;
  polylineDesc?: InsaPolylineDesc[];
}

export interface InsaLeg {
  Origin: InsaLocation;
  Destination: InsaLocation;
  Product?: InsaProduct[];
  Stops?: { Stop: InsaStop[] };
  JourneyDetailRef?: { ref: string };
  JourneyDetail?: { ref: string; dayOfOperation?: string };
  JourneyStatus?: string;
  Freq?: { waitMinimum?: number; waitMaximum?: number; alternativeCount?: number };
  GisRoute?: InsaGisRoute;
  PolylineGroup?: { polylineDesc: InsaPolylineDesc[] };
  id: string;
  idx: number;
  name?: string;
  number?: string;
  category?: string;
  type: string; // "JNY" = journey, "WALK" = walking, "TRSF" = transfer
  reachable?: boolean;
  waitingState?: string;
  direction?: string;
  directionFlag?: string;
  duration: string; // ISO 8601, e.g. "PT3M"
  dist?: number; // distance in meters (walk legs)
}

export interface InsaTrip {
  Origin: InsaLocation;
  Destination: InsaLocation;
  ServiceDays?: Array<{
    planningPeriodBegin: string;
    planningPeriodEnd: string;
    sDaysR?: string;
    sDaysI?: string;
    sDaysB?: string;
  }>;
  LegList: { Leg: InsaLeg[] };
  Freq?: { waitMinimum?: number };
  TripStatus?: { hintCode?: number };
  calculation?: string;
  idx: number;
  tripId: string;
  ctxRecon?: string;
  duration: string; // ISO 8601, e.g. "PT1H37M"
  checksum?: string;
}

export interface InsaTripResponse {
  Trip?: InsaTrip[];
  ResultStatus?: { timeDiffCritical?: boolean };
  Sorting?: unknown;
  TechnicalMessages?: unknown;
  serverVersion?: string;
  dialectVersion?: string;
  planRtTs?: string;
  requestId?: string;
  scrB?: string;
  scrF?: string;
  // Error fields
  errorCode?: string;
  errorText?: string;
}
