import { OrbitControls, Html } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { type ComponentRef, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  EquipmentFixtureModel,
  PackingWorkstationModel,
  SafetyFixtureModel,
  StorageRackModel,
  WarehouseShell,
} from './Warehouse3DModels'
import type {
  HeatmapMetric,
  VisualizationMode,
} from './WarehouseIsometricVisualizer'
import {
  generateWarehouse3DLayout,
  type PlacedZone,
} from './warehouseLayoutGenerator'
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
  racks?: WarehouseRack[]
  products?: Product[]
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

// Camera controller that smoothly transitions between 3D Perspective, 2D Floor Plan, and Elevation cutaway
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
      // 3D Perspective architectural orbit angle
      camera.position.set(19, 17, 21)
      camera.lookAt(0, 1.5, 0)
      controlsRef.current.target.set(0, 1.2, 0)
      controlsRef.current.maxPolarAngle = Math.PI / 2 - 0.05
      controlsRef.current.minPolarAngle = 0.1
      controlsRef.current.enableRotate = true
    } else if (viewMode === 'topdown') {
      // 2D Floor Plan: top-down architectural layout
      camera.position.set(0, 34, 0.001)
      camera.lookAt(0, 0, 0)
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.maxPolarAngle = 0.02
      controlsRef.current.minPolarAngle = 0
      controlsRef.current.enableRotate = false
    } else if (viewMode === 'elevation') {
      // Elevation: side cutaway profile showing vertical shelf tiers
      camera.position.set(0, 4.5, 29)
      camera.lookAt(0, 2.5, 0)
      controlsRef.current.target.set(0, 2.2, 0)
      controlsRef.current.maxPolarAngle = Math.PI / 2
      controlsRef.current.minPolarAngle = Math.PI / 2.25
      controlsRef.current.enableRotate = true
    }

    camera.updateProjectionMatrix()
    controlsRef.current.update()
  }, [viewMode, camera, cameraResetTrigger])

  return (
    <OrbitControls
      dampingFactor={0.08}
      enableDamping
      enablePan
      enableZoom
      maxDistance={70}
      minDistance={5}
      ref={controlsRef}
    />
  )
}

// Interactive Storage Zone Demarcation with Ground Boundaries & 3D Billboard Labels
function InteractiveZoneBoundary({
  placedZone,
  isSelected,
  isHovered,
  heatmapMetric,
  onSelect,
  onHover,
}: {
  placedZone: PlacedZone
  isSelected: boolean
  isHovered: boolean
  heatmapMetric: HeatmapMetric
  onSelect: () => void
  onHover: (hovered: boolean) => void
}) {
  const [width, depth] = placedZone.size
  const { zone, actualValuation, occupancyPct } = placedZone

  const zoneColor = useMemo(() => {
    if (heatmapMetric === 'occupancy') {
      if (occupancyPct >= 75) return '#059669'
      if (occupancyPct >= 35) return '#2563EB'
      if (occupancyPct > 0) return '#D97706'
      return '#DC2626'
    }
    if (heatmapMetric === 'type') {
      switch (zone.type) {
        case 'Picking':
          return '#0891B2'
        case 'Cold Storage':
          return '#38BDF8'
        case 'Receiving':
          return '#D97706'
        case 'Packing':
          return '#059669'
        case 'Quarantine':
          return '#DC2626'
        default:
          return '#2563EB'
      }
    }
    return actualValuation > 500000 ? '#0891B2' : '#2563EB'
  }, [heatmapMetric, occupancyPct, zone.type, actualValuation])

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
      position={placedZone.position}
    >
      {/* Zone Floor Tint Mesh */}
      <mesh position={[0, 0.008, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial
          color={isSelected ? '#43D9E8' : isHovered ? zoneColor : '#162434'}
          opacity={isSelected ? 0.22 : isHovered ? 0.14 : 0.05}
          transparent
        />
      </mesh>

      {/* Zone Boundary Perimeter Line */}
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
        position={[0, 5.0, 0]}
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
              ? formatInr(actualValuation)
              : `${occupancyPct}% Occ`}
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
  products = [],
  racks,
  selectedRackId,
  selectedZoneId,
  viewMode,
  zones,
}: Props) {
  // Generate deterministic architectural layout based on actual warehouse data
  const layout = useMemo(() => {
    const allRacks =
      racks && racks.length > 0 ? racks : zones.flatMap((z) => z.racks)
    return generateWarehouse3DLayout(activeWarehouse, zones, allRacks, products)
  }, [activeWarehouse, zones, racks, products])

  return (
    <div className="relative w-full h-[540px] bg-[#0A0E15] rounded-xl overflow-hidden select-none">
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

        {/* 1. Structural Warehouse Shell, Floor Slab & Columns */}
        <WarehouseShell
          columns={layout.columns}
          height={layout.dimensions.height}
          length={layout.dimensions.length}
          width={layout.dimensions.width}
        />

        {/* 2. Directional Industrial Lighting & Ambient Ambiance */}
        <ambientLight color="#162230" intensity={1.4} />
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
          intensity={0.65}
          position={[-16, 14, -12]}
        />
        <pointLight
          color="#5AA9FF"
          distance={28}
          intensity={0.75}
          position={[0, 9, 0]}
        />

        {/* 3. Storage Zones with Floor Demarcation & Interactive Billboard Badges */}
        {layout.zones.map((placedZone) => (
          <InteractiveZoneBoundary
            heatmapMetric={heatmapMetric}
            isHovered={hoveredZoneId === placedZone.zone.id}
            isSelected={selectedZoneId === placedZone.zone.id}
            key={placedZone.zone.id}
            onHover={(hov) => onHoverZone(hov ? placedZone.zone.id : null)}
            onSelect={() => onSelectZone(placedZone.zone.id)}
            placedZone={placedZone}
          />
        ))}

        {/* 4. Racks with Frames, Step Beams, Wire Decks, Pallets & Real Stock Cartons */}
        {layout.zones.flatMap((placedZone) =>
          placedZone.racks.map((placedRack) => (
            <StorageRackModel
              heatmapMetric={heatmapMetric}
              isSelected={selectedRackId === placedRack.rack.id}
              key={placedRack.rack.id}
              onSelect={() => {
                onSelectRack(placedRack.rack.id)
                onSelectZone(placedZone.zone.id)
              }}
              placedRack={placedRack}
            />
          )),
        )}

        {/* 5. Packing Workstations & Flow Conveyors (Packing Category) */}
        {layout.workstations.map((ws) => (
          <PackingWorkstationModel fixture={ws} key={ws.id} />
        ))}

        {/* 6. Material Handling Equipment: Forklift, Pallet Jacks & Charging Dock (Equipment Category) */}
        {layout.equipment.map((eq) => (
          <EquipmentFixtureModel fixture={eq} key={eq.id} />
        ))}

        {/* 7. Safety Fixtures: Flammable Cabinets, Bollards & Hazard Cages (Safety Category) */}
        {layout.safetyFixtures.map((sf) => (
          <SafetyFixtureModel fixture={sf} key={sf.id} />
        ))}

        {/* 8. Camera and View Mode Controller */}
        <CameraController
          cameraResetTrigger={cameraResetTrigger}
          viewMode={viewMode}
        />
      </Canvas>
    </div>
  )
}
