export interface CameraZone {
  id: string;
  name: string;
  area: string;
  // SVG grid coords in 0-100 for the city map
  x: number;
  y: number;
  // approximate GPS for evidence modal
  lat: number;
  lng: number;
}

export const CAMERA_ZONES: CameraZone[] = [
  { id: "CAM-001", name: "MG Road Junction",      area: "MG Road",         x: 48, y: 50, lat: 12.9759, lng: 77.6064 },
  { id: "CAM-002", name: "Silk Board Flyover",    area: "Silk Board",      x: 55, y: 78, lat: 12.9176, lng: 77.6228 },
  { id: "CAM-003", name: "Hebbal Underpass",      area: "Hebbal",          x: 42, y: 18, lat: 13.0354, lng: 77.5970 },
  { id: "CAM-004", name: "Marathahalli Bridge",   area: "Marathahalli",    x: 72, y: 52, lat: 12.9580, lng: 77.6975 },
  { id: "CAM-005", name: "Electronic City Toll",  area: "Electronic City", x: 60, y: 88, lat: 12.8452, lng: 77.6602 },
  { id: "CAM-006", name: "Whitefield Main",       area: "Whitefield",      x: 84, y: 44, lat: 12.9698, lng: 77.7500 },
  { id: "CAM-007", name: "Indiranagar 100ft Rd",  area: "Indiranagar",    x: 60, y: 42, lat: 12.9784, lng: 77.6408 },
  { id: "CAM-008", name: "Koramangala 80ft Rd",   area: "Koramangala",    x: 54, y: 62, lat: 12.9352, lng: 77.6245 },
  { id: "CAM-009", name: "Trinity Circle",        area: "MG Road",         x: 50, y: 46, lat: 12.9722, lng: 77.6195 },
  { id: "CAM-010", name: "Banashankari Junction", area: "Banashankari",   x: 32, y: 70, lat: 12.9249, lng: 77.5468 },
  { id: "CAM-011", name: "Yeshwanthpur Circle",   area: "Yeshwanthpur",   x: 30, y: 32, lat: 13.0280, lng: 77.5546 },
  { id: "CAM-012", name: "Jayanagar 4th Block",   area: "Jayanagar",      x: 40, y: 64, lat: 12.9249, lng: 77.5938 },
];
