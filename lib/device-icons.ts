export type DeviceIconType =
  | 'default'
  | 'car'
  | 'truck'
  | 'motorcycle'
  | 'bicycle'
  | 'boat'
  | 'airplane'
  | 'person'
  | 'animal'
  | 'crane'
  | 'bus'
  | 'taxi'
  | 'tractor'

export type DeviceIconOption = {
  value: DeviceIconType
  label: string
  emoji: string
  color: string
}

export const deviceIconOptions: DeviceIconOption[] = [
  { value: 'default', label: 'Padrão', emoji: '❔', color: '#0ea5e9' },
  { value: 'car', label: 'Carro', emoji: '🚗', color: '#ef4444' },
  { value: 'truck', label: 'Caminhão', emoji: '🚚', color: '#0ea5e9' },
  { value: 'motorcycle', label: 'Motocicleta', emoji: '🏍️', color: '#8b5cf6' },
  { value: 'bicycle', label: 'Bicicleta', emoji: '🚲', color: '#22c55e' },
  { value: 'boat', label: 'Barco', emoji: '⛵️', color: '#0ea5e9' },
  { value: 'airplane', label: 'Avião', emoji: '✈️', color: '#334155' },
  { value: 'person', label: 'Pessoa', emoji: '🧍', color: '#f97316' },
  { value: 'animal', label: 'Animal', emoji: '🐾', color: '#16a34a' },
  { value: 'crane', label: 'Guindaste', emoji: '🏗️', color: '#f59e0b' },
  { value: 'bus', label: 'Ônibus', emoji: '🚌', color: '#f97316' },
  { value: 'taxi', label: 'Táxi', emoji: '🚕', color: '#eab308' },
  { value: 'tractor', label: 'Trator', emoji: '🚜', color: '#16a34a' },
]

export function getDeviceIcon(value?: string): DeviceIconOption {
  return deviceIconOptions.find((option) => option.value === value) ?? deviceIconOptions[0]
}
