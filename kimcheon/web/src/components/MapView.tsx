import { CircleMarker, MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { mountains, zoneById, type Place } from '../data'
import { useApp } from '../store'

const placeIcon = (label: string, color: string) =>
  L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:grid;place-items:center"><span style="transform:rotate(45deg);color:#fff;font:800 13px Pretendard,sans-serif">${label}</span></div>`,
  })

const PLACE_COLOR = { tour: '#2C4A6E', food: '#C7793A', stay: '#5E5470' } as const
const PLACE_LABEL = { tour: '관', food: '식', stay: '숙' } as const

/** 김천 100산 지도 – OSM 타일 + 실제 정상 좌표 */
export function MapView({
  center = [36.03, 128.05],
  zoom = 10,
  focus,
  places = [],
  onPick,
  className = 'h-64',
}: {
  center?: [number, number]
  zoom?: number
  focus?: string
  places?: Place[]
  onPick?: (id: string) => void
  className?: string
}) {
  const records = useApp((s) => s.records)
  return (
    <MapContainer center={center} zoom={zoom} zoomControl={false} attributionControl={false} className={`isolate ${className}`} scrollWheelZoom>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <div className="pointer-events-none absolute right-1.5 bottom-1 z-[400] rounded bg-white/80 px-1.5 text-[13px] text-sub">© 오픈스트리트맵</div>
      {mountains
        .filter((m) => m.lat != null)
        .map((m) => {
          const done = !!records[m.id]
          const isFocus = m.id === focus
          const color = zoneById(m.zone).color
          return (
            <CircleMarker
              key={m.id}
              center={[m.lat!, m.lng!]}
              radius={isFocus ? 11 : done ? 7 : 6}
              pathOptions={{ color: isFocus ? '#F26B3A' : '#fff', weight: isFocus ? 3 : 2, fillColor: done ? '#2F7D57' : color, fillOpacity: done ? 1 : 0.75 }}
              eventHandlers={{ click: () => onPick?.(m.id) }}
            >
              <Tooltip direction="top" offset={[0, -6]} permanent={isFocus}>
                {m.title} {m.height}m{done ? ' · 인증완료' : ''}
              </Tooltip>
            </CircleMarker>
          )
        })}
      {places.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={placeIcon(PLACE_LABEL[p.type], PLACE_COLOR[p.type])}>
          <Tooltip direction="top" offset={[0, -28]}>
            {p.name}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  )
}
