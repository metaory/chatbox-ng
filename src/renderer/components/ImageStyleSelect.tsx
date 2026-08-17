
import type { SessionSettings } from '../../shared/types'
import { AdaptiveSelect } from './AdaptiveSelect'

export interface Props {
  value: SessionSettings['dalleStyle']
  onChange(value: SessionSettings['dalleStyle']): void
  className?: string
}

export default function ImageStyleSelect(props: Props) {

  return (
    <AdaptiveSelect
      label="Image Style"
      data={[
        {
          label: 'Vivid',
          value: 'vivid',
        },
        {
          label: 'Natural',
          value: 'natural',
        },
      ]}
      value={props.value}
      onChange={(e) => e && props.onChange && props.onChange(e as SessionSettings['dalleStyle'])}
    />
  )
}
