import React from 'react'
import Switch from 'react-switch'

interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

const CustomSwitch = React.forwardRef<HTMLDivElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled = false, ...props }, ref) => {
    const handleChange = (checked: boolean) => {
      onCheckedChange?.(checked);
    };

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    return (
      <div ref={ref} className={className} onClick={handleClick}>
        <Switch
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          onColor="#10b981"
          offColor="#d1d5db"
          checkedIcon={false}
          uncheckedIcon={false}
          height={24}
          width={44}
          handleDiameter={16}
          {...props}
        />
      </div>
    )
  }
)

CustomSwitch.displayName = "Switch"

export { CustomSwitch as Switch }