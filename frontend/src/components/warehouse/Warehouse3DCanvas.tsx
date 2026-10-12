import { OrbitControls, Html } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { type ComponentRef, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type {
  HeatmapMetric,
  VisualizationMode,
} from './WarehouseIsometricVisualizer'
import type { Product, Warehouse } from '@/mocks/inventoryData'
import type { WarehouseRack, WarehouseZone } from '@/mocks/warehouseData'
import { formatInr } from '@/lib/formatters'

export type ZoneStatistic = WarehouseZone & {
  gridIndex: number
  racks: WarehouseRack[]
  rackCount: number
  totalCapacity: number
  assignedSkus: number
  actualUnits: number
  actualValuation: number
  occupancyPct: number
  zoneAssignedProducts?: Product[]
}

type Props = {
  activeWarehouse: Warehouse
  zones: ZoneStatistic[]
  viewMode: VisualizationMode
  heatmapMetric: HeatmapMetric
  selectedZoneId: string | null
  selectedRackId: string | null
  hoveredZoneId: string | null
  onSelectZone: (zoneId: string | null) => void
  onSelectRack: (rackId: string | null) => void
  onHoverZone: (zoneId: string | null) => void
  cameraResetTrigger: number
}

// Camera controller that animates between 3D Perspective, 2D Floor Plan, and Elevation views
function CameraController({
  viewMode,
  cameraResetTrigger,
}: {
  viewMode: VisualizationMode
  cameraResetTrigger: number
}) {
  const { camera } = useThree()
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null)

  useEffect(() => {
    if (!controlsRef.current) return

    if (viewMode === 'isometric') {
      // 3D Perspective angle
      camera.position.set(19, 17, 21)
      camera.lookAt(0, 1.5, 0)
      controlsRef.current.target.set(0, 1.2, 0)
      controlsRef.current.maxPolarAngle = Math.PI / 2 - 0.05
      controlsRef.current.minPolarAngle = 0.1
      controlsRef.current.enableRotate = true
    } else if (viewMode === 'topdown') {
      // 2D Floor Plan top-down view
      camera.position.set(0, 32, 0.01)
      camera.lookAt(0, 0, 0)
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.maxPolarAngle = 0.05
      controlsRef.current.minPolarAngle = 0
      controlsRef.current.enableRotate = false
    } else if (viewMode === 'elevation') {
      // Elevation side view (front profile)
      camera.position.set(0, 4.2, 28)
      camera.lookAt(0, 2.8, 0)
      controlsRef.current.target.set(0, 2.5, 0)
      controlsRef.current.maxPolarAngle = Math.PI / 2
      controlsRef.current.minPolarAngle = Math.PI / 2.2
      controlsRef.current.enableRotate = true
    }

    camera.updateProjectionMatrix()
    controlsRef.current.update()
  }, [viewMode, camera, cameraResetTrigger])

  return (
    <OrbitControls
      ref={controlsRef}
      dampingFactor={0.08}
      enableDamping
      enablePan
      enableZoom
      maxDistance={65}
      minDistance={6}
    />
  )
}

// Floor Slab with industrial thickness, concrete finish, safety aisle markings, and loading docks
function WarehouseFloor() {
  return (
    <group position={[0, 0, 0]}>
      {/* Structural Foundation Slab (thickness 0.6) */}
      <mesh receiveShadow position={[0, -0.3, 0]}>
        <boxGeometry args={[30, 0.6, 22]} />
        <meshStandardMaterial color="#0F1722" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Slab Bevel Perimeter Outline */}
      <lineSegments position={[0, 0.005, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(30, 0.01, 22)]} />
        <lineBasicMaterial color="#263748" linewidth={1} />
      </lineSegments>

      {/* Main Transport Cross-Aisle Marking */}
      <mesh position={[0, 0.01, 0]}>
        <planeGeometry args={[28, 2.4]} />
        <meshStandardMaterial color="#141E2B" metalness={0.1} roughness={0.9} />
      </mesh>

      {/* Aisle Safety Boundary Stripes (Cyan & Amber) */}
      <mesh position={[0, 0.012, 1.2]}>
        <planeGeometry args={[28, 0.08]} />
        <meshBasicMaterial color="#43D9E8" opacity={0.65} transparent />
      </mesh>
      <mesh position={[0, 0.012, -1.2]}>
        <planeGeometry args={[28, 0.08]} />
        <meshBasicMaterial color="#43D9E8" opacity={0.65} transparent />
      </mesh>

      {/* Central Pedestrian Safety Walkway */}
      <mesh position={[0, 0.011, 0]}>
        <planeGeometry args={[1.6, 20]} />
        <meshStandardMaterial color="#111B27" />
      </mesh>
      <mesh position={[0.8, 0.013, 0]}>
        <planeGeometry args={[0.06, 20]} />
        <meshBasicMaterial color="#F5A524" opacity={0.7} transparent />
      </mesh>
      <mesh position={[-0.8, 0.013, 0]}>
        <planeGeometry args={[0.06, 20]} />
        <meshBasicMaterial color="#F5A524" opacity={0.7} transparent />
      </mesh>

      {/* Loading Dock Staging Area (Front Bay) */}
      <mesh position={[0, 0.011, 8.2]}>
        <planeGeometry args={[12, 3.2]} />
        <meshStandardMaterial color="#142130" />
      </mesh>
      <lineSegments position={[0, 0.014, 8.2]}>
        <edgesGeometry args={[new THREE.BoxGeometry(12, 0.01, 3.2)]} />
        <lineBasicMaterial color="#F5A524" opacity={0.8} transparent />
      </lineSegments>

      {/* Perimeter Structural Steel Columns */}
      {[-14, 0, 14].map((x) =>
        [-10, 10].map((z) => (
          <mesh castShadow key={`col-${x}-${z}`} position={[x, 3, z]}>
            <boxGeometry args={[0.35, 6, 0.35]} />
            <meshStandardMaterial
              color="#1B2837"
              metalness={0.7}
              roughness={0.4}
            />
          </mesh>
        )),
      )}

      {/* Rear Low Enclosure Wall (Industrial Steel/Glass aesthetic) */}
      <mesh position={[0, 1.2, -10.8]}>
        <boxGeometry args={[29.8, 2.4, 0.15]} />
        <meshStandardMaterial
          color="#121C28"
          metalness={0.4}
          roughness={0.7}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Side Low Walls */}
      <mesh position={[-14.8, 1.2, 0]}>
        <boxGeometry args={[0.15, 2.4, 21.8]} />
        <meshStandardMaterial
          color="#121C28"
          metalness={0.4}
          roughness={0.7}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh position={[14.8, 1.2, 0]}>
        <boxGeometry args={[0.15, 2.4, 21.8]} />
        <meshStandardMaterial
          color="#121C28"
          metalness={0.4}
          roughness={0.7}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  )
}

// 3D Storage Rack Component with Steel Beams, Wire Decking, Pallets, and Varied Cargo Crates
function StorageRack3D({
  rack,
  zone,
  position,
  rotationY = 0,
  heatmapMetric,
  isSelected,
  onSelect,
}: {
  rack: WarehouseRack
  zone?: ZoneStatistic
  position: [number, number, number]
  rotationY?: number
  heatmapMetric: HeatmapMetric
  isSelected: boolean
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const levels = rack.levels ?? 4
  const rackWidth = 4.6
  const rackDepth = 1.3
  const levelHeight = 1.05
  const totalHeight = levels * levelHeight + 0.3

  // Determine box colors based on active heatmap metric
  const boxColor = useMemo(() => {
    if (!zone) return '#43D9E8'

    if (heatmapMetric === 'occupancy') {
      const pct = zone.occupancyPct
      if (pct >= 75) return '#19C995' // Healthy: Emerald/Cyan
      if (pct >= 40) return '#5AA9FF' // Active: Cool Blue
      if (pct > 0) return '#F5A524' // Low Stock: Amber
      return '#FF5263' // Out of stock: Crimson
    }

    if (heatmapMetric === 'type') {
      switch (zone.type) {
        case 'Picking':
          return '#43D9E8'
        case 'Cold Storage':
          return '#38BDF8'
        case 'Receiving':
          return '#F5A524'
        case 'Packing':
          return '#2DD4BF'
        case 'Quarantine':
          return '#FF5263'
        default:
          return '#5AA9FF'
      }
    }

    if (heatmapMetric === 'valuation') {
      if (zone.actualValuation > 500000) return '#43D9E8'
      if (zone.actualValuation > 100000) return '#5AA9FF'
      return '#3F556B'
    }

    return '#43D9E8'
  }, [zone, heatmapMetric])

  return (
    <group
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHovered(false)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      position={position}
      rotation={[0, rotationY, 0]}
    >
      {/* 4 Steel Corner Uprights */}
      {[-rackWidth / 2, rackWidth / 2].map((x) =>
        [-rackDepth / 2, rackDepth / 2].map((z) => (
          <mesh
            castShadow
            key={`upright-${x}-${z}`}
            position={[x, totalHeight / 2, z]}
          >
            <boxGeometry args={[0.07, totalHeight, 0.07]} />
            <meshStandardMaterial
              color={isSelected ? '#43D9E8' : hovered ? '#5AA9FF' : '#27384B'}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        )),
      )}

      {/* Horizontal Shelf Beams and Loaded Pallets at each level */}
      {Array.from({ length: levels }).map((_, lvlIdx) => {
        const y = (lvlIdx + 1) * levelHeight - 0.15
        const isLevelOccupied = zone
          ? zone.occupancyPct >= ((lvlIdx + 1) / levels) * 60
          : true

        return (
          <group key={`level-${lvlIdx}`} position={[0, y, 0]}>
            {/* Front & Back Steel Load Beams (Orange/Steel industrial finish) */}
            <mesh position={[0, 0, rackDepth / 2]}>
              <boxGeometry args={[rackWidth + 0.1, 0.08, 0.06]} />
              <meshStandardMaterial
                color={isSelected ? '#43D9E8' : '#F5A524'}
                metalness={0.5}
                roughness={0.4}
              />
            </mesh>
            <mesh position={[0, 0, -rackDepth / 2]}>
              <boxGeometry args={[rackWidth + 0.1, 0.08, 0.06]} />
              <meshStandardMaterial
                color={isSelected ? '#43D9E8' : '#F5A524'}
                metalness={0.5}
                roughness={0.4}
              />
            </mesh>

            {/* Wire Decking */}
            <mesh position={[0, 0.03, 0]}>
              <boxGeometry args={[rackWidth - 0.1, 0.02, rackDepth - 0.1]} />
              <meshStandardMaterial
                color="#1B2836"
                metalness={0.8}
                roughness={0.3}
              />
            </mesh>

            {/* 2 Pallets per shelf level */}
            {[-1.15, 1.15].map((palletX, pIdx) => {
              const showCargo = isLevelOccupied || pIdx === 0

              return (
                <group key={`pallet-${pIdx}`} position={[palletX, 0.08, 0]}>
                  {/* Wooden Pallet Base */}
                  <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
                    <boxGeometry args={[1.7, 0.1, 1.05]} />
                    <meshStandardMaterial color="#7A5D3E" roughness={0.9} />
                  </mesh>

                  {/* Varied Cargo Cartons on Pallet */}
                  {showCargo && (
                    <group position={[0, 0.12, 0]}>
                      {/* Box 1 (Main Carton) */}
                      <mesh castShadow position={[-0.38, 0.24, -0.16]}>
                        <boxGeometry args={[0.7, 0.48, 0.6]} />
                        <meshStandardMaterial
                          color={boxColor}
                          metalness={0.2}
                          roughness={0.6}
                          emissive={isSelected ? boxColor : '#000000'}
                          emissiveIntensity={isSelected ? 0.35 : 0}
                        />
                      </mesh>

                      {/* Box 2 (Secondary Carton) */}
                      <mesh castShadow position={[0.38, 0.22, 0.14]}>
                        <boxGeometry args={[0.65, 0.44, 0.55]} />
                        <meshStandardMaterial
                          color={boxColor}
                          metalness={0.25}
                          roughness={0.5}
                          emissive={isSelected ? boxColor : '#000000'}
                          emissiveIntensity={isSelected ? 0.25 : 0}
                        />
                      </mesh>

                      {/* Box 3 (Top Crate) */}
                      <mesh castShadow position={[-0.15, 0.58, 0.05]}>
                        <boxGeometry args={[0.5, 0.3, 0.45]} />
                        <meshStandardMaterial
                          color={boxColor}
                          metalness={0.3}
                          roughness={0.5}
                          emissive={isSelected ? boxColor : '#000000'}
                          emissiveIntensity={isSelected ? 0.25 : 0}
                        />
                      </mesh>
                    </group>
                  )}
                </group>
              )
            })}
          </group>
        )
      })}

      {/* Selected Rack Highlight Cage */}
      {isSelected && (
        <lineSegments position={[0, totalHeight / 2, 0]}>
          <edgesGeometry
            args={[
              new THREE.BoxGeometry(
                rackWidth + 0.3,
                totalHeight + 0.3,
                rackDepth + 0.3,
              ),
            ]}
          />
          <lineBasicMaterial color="#43D9E8" linewidth={2} />
        </lineSegments>
      )}
    </group>
  )
}

// Interactive Storage Zone Demarcation with Ground Boundaries & 3D Billboard Labels
function StorageZone3D({
  zone,
  position,
  size,
  isSelected,
  isHovered,
  heatmapMetric,
  onSelect,
  onHover,
}: {
  zone: ZoneStatistic
  position: [number, number, number]
  size: [number, number]
  isSelected: boolean
  isHovered: boolean
  heatmapMetric: HeatmapMetric
  onSelect: () => void
  onHover: (hovered: boolean) => void
}) {
  const [width, depth] = size

  const zoneColor = useMemo(() => {
    if (heatmapMetric === 'occupancy') {
      if (zone.occupancyPct >= 75) return '#19C995'
      if (zone.occupancyPct >= 40) return '#5AA9FF'
      if (zone.occupancyPct > 0) return '#F5A524'
      return '#FF5263'
    }
    if (heatmapMetric === 'type') {
      switch (zone.type) {
        case 'Picking':
          return '#43D9E8'
        case 'Cold Storage':
          return '#38BDF8'
        case 'Receiving':
          return '#F5A524'
        case 'Packing':
          return '#2DD4BF'
        case 'Quarantine':
          return '#FF5263'
        default:
          return '#5AA9FF'
      }
    }
    return zone.actualValuation > 500000 ? '#43D9E8' : '#5AA9FF'
  }, [zone, heatmapMetric])

  return (
    <group
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onPointerOut={() => onHover(false)}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(true)
      }}
      position={position}
    >
      {/* Zone Floor Perimeter Mesh */}
      <mesh position={[0, 0.008, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial
          color={isSelected ? '#43D9E8' : isHovered ? zoneColor : '#162434'}
          opacity={isSelected ? 0.18 : isHovered ? 0.12 : 0.04}
          transparent
        />
      </mesh>

      {/* Zone Boundary Outline */}
      <lineSegments position={[0, 0.015, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(width, 0.01, depth)]} />
        <lineBasicMaterial
          color={isSelected ? '#43D9E8' : isHovered ? '#5AA9FF' : '#2A3C50'}
          linewidth={isSelected ? 2 : 1}
        />
      </lineSegments>

      {/* 3D Floating Zone Info Billboard Badge */}
      <Html
        center
        distanceFactor={28}
        position={[0, 4.8, 0]}
        style={{ pointerEvents: 'auto' }}
      >
        <button
          className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs shadow-xl backdrop-blur-md transition-all cursor-pointer whitespace-nowrap ${
            isSelected
              ? 'border-primary bg-primary/20 text-primary font-bold shadow-[0_0_16px_rgba(67,217,232,0.4)] scale-105'
              : isHovered
                ? 'border-secondary/60 bg-surface-2/95 text-secondary scale-102'
                : 'border-surface-border/80 bg-surface/90 text-text-primary hover:border-primary/50'
          }`}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          type="button"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: zoneColor }}
          />
          <span className="font-semibold text-[11px]">{zone.name}</span>
          <span className="font-mono text-[10px] text-text-muted">
            {heatmapMetric === 'valuation'
              ? formatInr(zone.actualValuation)
              : `${zone.occupancyPct}% Occ`}
          </span>
        </button>
      </Html>
    </group>
  )
}

export function Warehouse3DCanvas({
  activeWarehouse,
  cameraResetTrigger,
  heatmapMetric,
  hoveredZoneId,
  onHoverZone,
  onSelectRack,
  onSelectZone,
  selectedRackId,
  selectedZoneId,
  viewMode,
  zones,
}: Props) {
  // Facility-specific 3D zone layout coordinates
  const zoneLayouts = useMemo(() => {
    const map = new Map<
      string,
      {
        zonePos: [number, number, number]
        zoneSize: [number, number]
        rackPositions: [number, number, number][]
      }
    >()

    if (activeWarehouse.id === 'wh-mum') {
      // Mumbai Central Layout (3 Zones)
      map.set('zon-mum-a', {
        zonePos: [-7, 0, -4.5],
        zoneSize: [11.5, 6.5],
        rackPositions: [
          [-7, 0, -6],
          [-7, 0, -3],
        ],
      })
      map.set('zon-mum-b', {
        zonePos: [7, 0, -4.5],
        zoneSize: [11.5, 6.5],
        rackPositions: [
          [7, 0, -6],
          [7, 0, -3],
        ],
      })
      map.set('zon-mum-c', {
        zonePos: [0, 0, -7.5],
        zoneSize: [9, 3.5],
        rackPositions: [[0, 0, -7.5]],
      })
    } else if (activeWarehouse.id === 'wh-del') {
      // Delhi North Layout (2 Zones)
      map.set('zon-del-a', {
        zonePos: [-6.5, 0, -2.5],
        zoneSize: [12, 8],
        rackPositions: [[-6.5, 0, -2.5]],
      })
      map.set('zon-del-b', {
        zonePos: [6.5, 0, -4],
        zoneSize: [12, 7.5],
        rackPositions: [
          [6.5, 0, -5.5],
          [6.5, 0, -2.5],
        ],
      })
    } else {
      // Bengaluru South Layout (2 Zones)
      map.set('zon-blr-a', {
        zonePos: [-6, 0, -3.5],
        zoneSize: [11, 7],
        rackPositions: [[-6, 0, -3.5]],
      })
      map.set('zon-blr-b', {
        zonePos: [6.5, 0, -4.5],
        zoneSize: [11, 6.5],
        rackPositions: [[6.5, 0, -4.5]],
      })
    }

    return map
  }, [activeWarehouse.id])

  return (
    <div className="relative w-full h-[520px] bg-[#0A0E15] rounded-xl overflow-hidden select-none">
      <Canvas
        camera={{ fov: 42, position: [19, 17, 21] }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        onPointerMissed={() => {
          onSelectZone(null)
          onSelectRack(null)
        }}
        shadows
      >
        <color args={['#0A0E15']} attach="background" />

        {/* Technical Grid on Floor */}
        <WarehouseFloor />

        {/* Architectural Directional Lighting */}
        <ambientLight color="#1A2634" intensity={1.3} />
        <directionalLight
          castShadow
          color="#FFFFFF"
          intensity={1.9}
          position={[18, 28, 14]}
          shadow-bias={-0.0005}
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight
          color="#43D9E8"
          intensity={0.6}
          position={[-16, 14, -12]}
        />
        <pointLight
          color="#5AA9FF"
          distance={25}
          intensity={0.8}
          position={[0, 8, 0]}
        />

        {/* Storage Zones with Boundary Lines and 3D Labels */}
        {zones.map((zone) => {
          const layout = zoneLayouts.get(zone.id)
          if (!layout) return null

          return (
            <StorageZone3D
              heatmapMetric={heatmapMetric}
              isHovered={hoveredZoneId === zone.id}
              isSelected={selectedZoneId === zone.id}
              key={zone.id}
              onHover={(hov) => onHoverZone(hov ? zone.id : null)}
              onSelect={() => onSelectZone(zone.id)}
              position={layout.zonePos}
              size={layout.zoneSize}
              zone={zone}
            />
          )
        })}

        {/* Storage Racks with Steel Structures & Pallet Cargo */}
        {zones.map((zone) => {
          const layout = zoneLayouts.get(zone.id)
          if (!layout) return null

          return zone.racks.map((rack, rIdx) => {
            const rackPos = layout.rackPositions[rIdx] ?? [
              layout.zonePos[0],
              0,
              layout.zonePos[2],
            ]

            return (
              <StorageRack3D
                heatmapMetric={heatmapMetric}
                isSelected={selectedRackId === rack.id}
                key={rack.id}
                onSelect={() => {
                  onSelectRack(rack.id)
                  onSelectZone(zone.id)
                }}
                position={rackPos}
                rack={rack}
                zone={zone}
              />
            )
          })
        })}

        {/* Camera and View Mode Controller */}
        <CameraController
          cameraResetTrigger={cameraResetTrigger}
          viewMode={viewMode}
        />
      </Canvas>
    </div>
  )
}
