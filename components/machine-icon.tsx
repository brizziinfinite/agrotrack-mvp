'use client'

import { CSSProperties } from 'react'

interface MachineIconProps {
  icon?: string
  name?: string
  size?: number
  className?: string
}

const MACHINE_ICONS = [
  'trator',
  'colhedeira',
  'pulverizador',
  'plantadeira',
  'grade',
  'pacarregadeira',
  'retroescavadeira',
  'caminhao',
  'aviao',
  'drone'
]

export default function MachineIcon({
  icon,
  name,
  size = 40,
  className = ''
}: MachineIconProps) {
  // Aceita tanto 'icon' quanto 'name' para compatibilidade
  const iconName = icon || name || ''

  // Verifica se é um ícone SVG customizado
  const isMachineIcon = MACHINE_ICONS.includes(iconName)

  if (!isMachineIcon) {
    // Se não for um ícone de máquina, renderiza como emoji
    return (
      <span className={className} style={{ fontSize: size }}>
        {iconName}
      </span>
    )
  }

  const style: CSSProperties = {
    width: size,
    height: size,
    display: 'inline-block'
  }

  return (
    <span className={className} style={style}>
      <img
        src={`/icons/machines/${iconName}.svg`}
        alt={iconName}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
    </span>
  )
}

export { MACHINE_ICONS }
