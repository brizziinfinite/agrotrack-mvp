export type VehicleType = 
  | 'car' 
  | 'pickup'
  | 'truck' 
  | 'motorcycle' 
  | 'bus'
  | 'tractor'
  | 'sprayer'
  | 'harvester'
  | 'bicycle'
  | 'boat'
  | 'jetski'
  | 'person'
  | 'animal';

export type VehicleStatus = 'moving' | 'stopped' | 'idle' | 'offline';

export interface Vehicle {
  id: string;
  plate: string;
  name: string;
  type: VehicleType;
  status: VehicleStatus;
  driver: string;
  position: {
    lat: number;
    lng: number;
  };
  speed: number;
  maxSpeed: number;
  odometer: number;
  hourmeter: number;
  fuel: {
    percentage: number;
    liters: number;
    capacity: number;
  };
  ignition: boolean;
  lastUpdate: Date;
  todayKm: number;
  todayHours: number;
  alerts: number;
  // Bloqueio
  blocked: boolean;
  blockedAt?: Date;
  blockedBy?: string;
  blockedReason?: string;
  // Dados do dispositivo
  imei?: string;
  iccid?: string;
  m2mNumber?: string;
  model?: string;
  color?: string;
}

export interface Alert {
  id: string;
  vehicleId: string;
  type: 'speed' | 'geofence' | 'maintenance' | 'fuel' | 'idle';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  acknowledged: boolean;
}

export interface Trip {
  id: string;
  vehicleId: string;
  startTime: Date;
  endTime: Date;
  startLocation: string;
  endLocation: string;
  distance: number;
  duration: number;
  maxSpeed: number;
  avgSpeed: number;
  fuelConsumed: number;
}

// Generate random coordinates in Brazil
const generateBrazilCoordinates = () => ({
  lat: -23.5505 + (Math.random() - 0.5) * 0.2,
  lng: -46.6333 + (Math.random() - 0.5) * 0.2,
});

export const mockVehicles: Vehicle[] = [
  {
    id: 'v1',
    plate: 'ABC-1234',
    name: 'Fiorino #01',
    type: 'car',
    status: 'moving',
    driver: 'Carlos Silva',
    position: { lat: -23.5505, lng: -46.6333 },
    speed: 45,
    maxSpeed: 80,
    odometer: 125430,
    hourmeter: 4521,
    fuel: { percentage: 75, liters: 37.5, capacity: 50 },
    ignition: true,
    lastUpdate: new Date(),
    todayKm: 87,
    todayHours: 6.5,
    alerts: 0,
    blocked: false,
  },
  {
    id: 'v2',
    plate: 'DEF-5678',
    name: 'Truck #02',
    type: 'truck',
    status: 'stopped',
    driver: 'João Oliveira',
    position: { lat: -23.5625, lng: -46.6543 },
    speed: 0,
    maxSpeed: 90,
    odometer: 354210,
    hourmeter: 12540,
    fuel: { percentage: 45, liters: 180, capacity: 400 },
    ignition: false,
    lastUpdate: new Date(Date.now() - 1800000),
    todayKm: 156,
    todayHours: 8.2,
    alerts: 1,
    blocked: false,
  },
  {
    id: 'v3',
    plate: 'GHI-9012',
    name: 'Moto #03',
    type: 'motorcycle',
    status: 'moving',
    driver: 'Pedro Santos',
    position: { lat: -23.5412, lng: -46.6189 },
    speed: 62,
    maxSpeed: 100,
    odometer: 45890,
    hourmeter: 1230,
    fuel: { percentage: 60, liters: 10.8, capacity: 18 },
    ignition: true,
    lastUpdate: new Date(),
    todayKm: 134,
    todayHours: 7.0,
    alerts: 0,
    blocked: false,
  },
  {
    id: 'v4',
    plate: 'JKL-3456',
    name: 'Trator #04',
    type: 'tractor',
    status: 'idle',
    driver: 'Marcos Lima',
    position: { lat: -23.5789, lng: -46.6421 },
    speed: 0,
    maxSpeed: 40,
    odometer: 8450,
    hourmeter: 6780,
    fuel: { percentage: 30, liters: 45, capacity: 150 },
    ignition: true,
    lastUpdate: new Date(Date.now() - 300000),
    todayKm: 12,
    todayHours: 4.5,
    alerts: 2,
    blocked: true,
    blockedAt: new Date(Date.now() - 86400000),
    blockedBy: 'Admin',
    blockedReason: 'Manutenção preventiva programada',
  },
  {
    id: 'v5',
    plate: 'MNO-7890',
    name: 'Van #05',
    type: 'car',
    status: 'moving',
    driver: 'Ana Costa',
    position: { lat: -23.5321, lng: -46.6654 },
    speed: 38,
    maxSpeed: 80,
    odometer: 89120,
    hourmeter: 3210,
    fuel: { percentage: 85, liters: 59.5, capacity: 70 },
    ignition: true,
    lastUpdate: new Date(),
    todayKm: 67,
    todayHours: 5.0,
    alerts: 0,
    blocked: false,
  },
  {
    id: 'v6',
    plate: 'PQR-1357',
    name: 'Truck #06',
    type: 'truck',
    status: 'offline',
    driver: 'Roberto Dias',
    position: { lat: -23.5678, lng: -46.6789 },
    speed: 0,
    maxSpeed: 90,
    odometer: 567890,
    hourmeter: 18920,
    fuel: { percentage: 20, liters: 80, capacity: 400 },
    ignition: false,
    lastUpdate: new Date(Date.now() - 7200000),
    todayKm: 0,
    todayHours: 0,
    alerts: 3,
    blocked: false,
  },
  {
    id: 'v7',
    plate: 'STU-2468',
    name: 'Pickup #07',
    type: 'car',
    status: 'moving',
    driver: 'Fernanda Reis',
    position: { lat: -23.5234, lng: -46.6234 },
    speed: 52,
    maxSpeed: 120,
    odometer: 67450,
    hourmeter: 2340,
    fuel: { percentage: 55, liters: 38.5, capacity: 70 },
    ignition: true,
    lastUpdate: new Date(),
    todayKm: 98,
    todayHours: 6.8,
    alerts: 0,
    blocked: false,
  },
  {
    id: 'v8',
    plate: 'VWX-3579',
    name: 'Moto #08',
    type: 'motorcycle',
    status: 'stopped',
    driver: 'Lucas Mendes',
    position: { lat: -23.5567, lng: -46.6012 },
    speed: 0,
    maxSpeed: 100,
    odometer: 23450,
    hourmeter: 890,
    fuel: { percentage: 40, liters: 7.2, capacity: 18 },
    ignition: false,
    lastUpdate: new Date(Date.now() - 900000),
    todayKm: 45,
    todayHours: 3.2,
    alerts: 0,
    blocked: false,
  },
];

export const mockAlerts: Alert[] = [
  {
    id: 'a1',
    vehicleId: 'v2',
    type: 'maintenance',
    message: 'Troca de óleo próxima - 500km restantes',
    severity: 'medium',
    timestamp: new Date(Date.now() - 3600000),
    acknowledged: false,
  },
  {
    id: 'a2',
    vehicleId: 'v4',
    type: 'fuel',
    message: 'Nível de combustível baixo (30%)',
    severity: 'high',
    timestamp: new Date(Date.now() - 1800000),
    acknowledged: false,
  },
  {
    id: 'a3',
    vehicleId: 'v4',
    type: 'idle',
    message: 'Veículo parado com motor ligado há 15min',
    severity: 'low',
    timestamp: new Date(Date.now() - 900000),
    acknowledged: false,
  },
  {
    id: 'a4',
    vehicleId: 'v6',
    type: 'maintenance',
    message: 'Revisão programada vencida',
    severity: 'high',
    timestamp: new Date(Date.now() - 86400000),
    acknowledged: false,
  },
  {
    id: 'a5',
    vehicleId: 'v6',
    type: 'fuel',
    message: 'Nível crítico de combustível (20%)',
    severity: 'high',
    timestamp: new Date(Date.now() - 7200000),
    acknowledged: false,
  },
  {
    id: 'a6',
    vehicleId: 'v6',
    type: 'geofence',
    message: 'Veículo fora da área permitida',
    severity: 'medium',
    timestamp: new Date(Date.now() - 7200000),
    acknowledged: true,
  },
];

export const getVehicleStats = () => {
  const total = mockVehicles.length;
  const connected = mockVehicles.filter(v => v.status !== 'offline').length;
  const moving = mockVehicles.filter(v => v.status === 'moving').length;
  const stopped = mockVehicles.filter(v => v.status === 'stopped').length;
  const idle = mockVehicles.filter(v => v.status === 'idle').length;
  const offline = mockVehicles.filter(v => v.status === 'offline').length;
  const totalKmToday = mockVehicles.reduce((acc, v) => acc + v.todayKm, 0);
  const totalHoursToday = mockVehicles.reduce((acc, v) => acc + v.todayHours, 0);
  const activeAlerts = mockAlerts.filter(a => !a.acknowledged).length;
  
  // Alertas operacionais
  const blockedCount = mockVehicles.filter(v => v.blocked).length;
  const speedingCount = mockVehicles.filter(v => v.speed > v.maxSpeed).length;
  const maintenanceCount = mockAlerts.filter(a => a.type === 'maintenance' && !a.acknowledged).length;
  
  // Consumo médio (L/km) - calculado a partir dos dados de consumo da semana
  const totalConsumption = mockConsumptionData.reduce((acc, d) => acc + d.consumption, 0);
  const totalKm = mockConsumptionData.reduce((acc, d) => acc + d.km, 0);
  const avgConsumption = totalKm > 0 ? (totalConsumption / totalKm).toFixed(2) : '0';
  
  // Consumo por hora (L/h) - estimando horas baseado em velocidade média de 45 km/h
  const totalHours = totalKm / 45;
  const avgConsumptionPerHour = totalHours > 0 ? (totalConsumption / totalHours).toFixed(1) : '0';

  return {
    total,
    connected,
    moving,
    stopped,
    idle,
    offline,
    totalKmToday,
    totalHoursToday,
    activeAlerts,
    blockedCount,
    speedingCount,
    maintenanceCount,
    avgConsumption,
    avgConsumptionPerHour,
  };
};

// Mock speed data for chart
export const mockSpeedData = [
  { time: '06:00', speed: 35 },
  { time: '08:00', speed: 65 },
  { time: '10:00', speed: 55 },
  { time: '12:00', speed: 45 },
  { time: '14:00', speed: 58 },
  { time: '16:00', speed: 70 },
  { time: '18:00', speed: 48 },
  { time: '20:00', speed: 30 },
];

export const mockFuelConsumptionData = {
  week: [
    { period: 'Seg', current: 45, previous: 48 },
    { period: 'Ter', current: 52, previous: 50 },
    { period: 'Qua', current: 38, previous: 42 },
    { period: 'Qui', current: 61, previous: 55 },
    { period: 'Sex', current: 55, previous: 58 },
    { period: 'Sáb', current: 28, previous: 32 },
    { period: 'Dom', current: 15, previous: 18 },
  ],
  month: [
    { period: 'Sem 1', current: 320, previous: 290 },
    { period: 'Sem 2', current: 380, previous: 350 },
    { period: 'Sem 3', current: 290, previous: 310 },
    { period: 'Sem 4', current: 420, previous: 380 },
  ],
  year: [
    { period: 'Jan', current: 1200, previous: 1100 },
    { period: 'Fev', current: 1150, previous: 1050 },
    { period: 'Mar', current: 1300, previous: 1200 },
    { period: 'Abr', current: 1250, previous: 1180 },
    { period: 'Mai', current: 1400, previous: 1300 },
    { period: 'Jun', current: 1350, previous: 1250 },
    { period: 'Jul', current: 1280, previous: 1220 },
    { period: 'Ago', current: 1420, previous: 1350 },
    { period: 'Set', current: 1380, previous: 1280 },
    { period: 'Out', current: 1450, previous: 1400 },
    { period: 'Nov', current: 1320, previous: 1250 },
    { period: 'Dez', current: 1410, previous: 1330 },
  ],
};

export const mockConsumptionData = [
  { day: 'Seg', consumption: 45, km: 320 },
  { day: 'Ter', consumption: 52, km: 380 },
  { day: 'Qua', consumption: 38, km: 290 },
  { day: 'Qui', consumption: 61, km: 420 },
  { day: 'Sex', consumption: 55, km: 380 },
  { day: 'Sáb', consumption: 28, km: 200 },
  { day: 'Dom', consumption: 20, km: 180 },
];

export const mockRouteData = [
  { route: 'São Paulo → Campinas', trips: 28, km: 2520 },
  { route: 'Rio → São Paulo', trips: 22, km: 9460 },
  { route: 'Curitiba → Florianópolis', trips: 18, km: 5400 },
  { route: 'BH → Vitória', trips: 15, km: 7650 },
  { route: 'Porto Alegre → Curitiba', trips: 12, km: 8640 },
];
