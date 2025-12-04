export type DeviceIconType =
  | 'tractor'
  | 'combine'
  | 'sprayer'
  | 'truck'
  | 'car'
  | 'pickup'
  | 'plane'
  | 'motorcycle'
  | 'boat'
  | 'jet-ski'
  | 'dog'
  | 'cat'
  | 'ox'
  | 'cow'
  | 'sheep'

export type DeviceIconOption = {
  value: DeviceIconType
  label: string
  emoji: string
  color: string
}

export const deviceIconOptions: DeviceIconOption[] = [
  { value: 'tractor', label: 'Trator', emoji: '🚜', color: '#16a34a' },
  { value: 'combine', label: 'Colheitadeira', emoji: '🌾', color: '#d97706' },
  { value: 'sprayer', label: 'Pulverizador', emoji: '💨', color: '#2563eb' },
  { value: 'truck', label: 'Caminhão', emoji: '🚚', color: '#0ea5e9' },
  { value: 'car', label: 'Carro', emoji: '🚗', color: '#ef4444' },
  { value: 'pickup', label: 'Caminhonete', emoji: '🛻', color: '#f97316' },
  { value: 'plane', label: 'Avião', emoji: '✈️', color: '#334155' },
  { value: 'motorcycle', label: 'Moto', emoji: '🏍️', color: '#8b5cf6' },
  { value: 'boat', label: 'Barco', emoji: '⛵️', color: '#0ea5e9' },
  { value: 'jet-ski', label: 'Jet Ski', emoji: '🌊', color: '#14b8a6' },
  { value: 'dog', label: 'Cachorro', emoji: '🐕', color: '#f59e0b' },
  { value: 'cat', label: 'Gato', emoji: '🐈', color: '#c084fc' },
  { value: 'ox', label: 'Boi', emoji: '🐂', color: '#92400e' },
  { value: 'cow', label: 'Vaca', emoji: '🐄', color: '#84cc16' },
  { value: 'sheep', label: 'Ovinos', emoji: '🐑', color: '#22c55e' },
]

export function getDeviceIcon(value?: string): DeviceIconOption {
  return deviceIconOptions.find((option) => option.value === value) ?? deviceIconOptions[0]
}
