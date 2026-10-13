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

// Camera controller that dynamically frames the warehouse bounds to fit any viewport
function CameraController({
  viewMode,
  cameraResetTrigger,
  dimensions,
}: {
  viewMode: VisualizationMode
  cameraResetTrigger: number
  dimensions: { width: number; length: number; height: number }
}) {
  const { camera, size } = useThree()
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null)

  useEffect(() => {
    if (!controlsRef.current) return
    const controls = controlsRef.current

    const w = dimensions.width
    const l = dimensions.length
    const h = dimensions.height

    // Calculate aspect ratio and FOV geometry
    const aspect = Math.max(0.3, size.width / Math.max(1, size.height))
    const pCam = camera as THREE.PerspectiveCamera
    const fov = pCam.fov ?? 40
    const vFovRad = (fov * Math.PI) / 180
    const tanHalfVFov = Math.tan(vFovRad / 2)
    const tanHalfHFov = tanHalfVFov * aspect
    const minHalfFov = Math.min(vFovRad / 2, Math.atan(tanHalfHFov))

    if (viewMode === 'isometric') {
      // 3D Perspective architectural orbit angle: fit complete bounding sphere
      const R = Math.sqrt((w / 2) ** 2 + (l / 2) ** 2 + (h / 2) ** 2)
      const safety = aspect < 1 ? 1.4 : 1.22
      const distance = Math.max(18, (R / Math.sin(minHalfFov)) * safety)

      const dir = new THREE.Vector3(1.15, 0.9, 1.15).normalize()
      const target = new THREE.Vector3(0, Math.min(2.0, h * 0.25), 0)
      const pos = target.clone().add(dir.multiplyScalar(distance))

      camera.position.copy(pos)
      camera.lookAt(target)
      controls.target.copy(target)
      controls.maxPolarAngle = Math.PI / 2 - 0.05
      controls.minPolarAngle = 0.1
      controls.enableRotate = true
      controls.maxDistance = distance * 2.8
      controls.minDistance = 4
    } else if (viewMode === 'topdown') {
      // 2D Floor Plan: top-down architectural layout fitted exactly to width & length
      const distV = l / 2 / tanHalfVFov
      const distH = w / 2 / tanHalfHFov
      const safety = aspect < 1 ? 1.35 : 1.18
      const distance = Math.max(20, Math.max(distV, distH) * safety)

      const target = new THREE.Vector3(0, 0, 0)
      const pos = new THREE.Vector3(0, distance, 0.001)

      camera.position.copy(pos)
      camera.lookAt(target)
      controls.target.copy(target)
      controls.maxPolarAngle = 0.02
      controls.minPolarAngle = 0
      controls.enableRotate = false
      controls.maxDistance = distance * 2.5
      controls.minDistance = 4
    } else if (viewMode === 'elevation') {
      // Elevation: elevated cutaway side profile displaying all vertical rack tiers
      const R = Math.sqrt((w / 2) ** 2 + (l / 2) ** 2 + (h / 2) ** 2)
      const safety = aspect < 1 ? 1.35 : 1.18
      const distance = Math.max(20, (R / Math.sin(minHalfFov)) * safety)

      // Look from angled side cutaway so vertical uprights and shelves are in clear view
      const dir = new THREE.Vector3(1.2, 0.45, 0.5).normalize()
      const target = new THREE.Vector3(0, Math.min(2.5, h * 0.3), 0)
      const pos = target.clone().add(dir.multiplyScalar(distance))

      camera.position.copy(pos)
      camera.lookAt(target)
      controls.target.copy(target)
      controls.maxPolarAngle = Math.PI / 2 - 0.05
      controls.minPolarAngle = 0.15
      controls.enableRotate = true
      controls.maxDistance = distance * 2.8
      controls.minDistance = 4
    }

    camera.updateProjectionMatrix()
    controls.update()
  }, [viewMode, camera, size, cameraResetTrigger, dimensions])

  return (
    <OrbitControls
      dampingFactor={0.08}
      enableDamping
      enablePan
      enableZoom
      ref={controlsRef}
    />
  )
}

// Interactive Storage Zone Demarcation with Ground Boundaries & 3D Billboard Labels
// Interactive Storage Zone Demarcation with Ground Boundaries & 3D Billboard Labels
function InteractiveZoneBoundary({
  placedZone,
  index = 0,
  isSelected,
  isHovered,
  heatmapMetric,
  viewMode,
  onSelect,
  onHover,
}: {
  placedZone: PlacedZone
  index?: number
  isSelected: boolean
  isHovered: boolean
  heatmapMetric: HeatmapMetric
  viewMode: VisualizationMode
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
          color={isSelected ? '#38BDF8' : isHovered ? zoneColor : '#162434'}
          opacity={isSelected ? 0.24 : isHovered ? 0.16 : 0.06}
          transparent
        />
      </mesh>

      {/* Zone Boundary Perimeter Line */}
      <lineSegments position={[0, 0.015, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(width, 0.01, depth)]} />
        <lineBasicMaterial
          color={isSelected ? '#38BDF8' : isHovered ? '#60A5FA' : '#2F435A'}
          linewidth={isSelected ? 2 : 1}
        />
      </lineSegments>

      {/* 3D Floating Zone Info Billboard Badge */}
      <Html
        center
        distanceFactor={viewMode === 'topdown' ? 42 : 32}
        position={[
          0,
          viewMode === 'topdown'
            ? 0.35
            : viewMode === 'elevation'
              ? 1.4 + (index % 2) * 1.5
              : 4.0,
          0,
        ]}
        style={{ pointerEvents: 'auto', userSelect: 'none' }}
      >
        <button
          className={`flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs shadow-lg backdrop-blur-md transition-all cursor-pointer whitespace-nowrap max-w-[150px] sm:max-w-none ${
            isSelected
              ? 'border-primary bg-primary/25 text-white font-bold shadow-[0_0_16px_rgba(56,189,248,0.5)] ring-1 ring-primary scale-105'
              : isHovered
                ? 'border-secondary/80 bg-slate-900/95 text-secondary scale-102'
                : 'border-slate-700/80 bg-slate-900/85 text-slate-200 hover:border-primary/50'
          }`}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          type="button"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: zoneColor }}
          />
          <span className="font-semibold text-[10px] sm:text-[11px] truncate">
            {zone.name}
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] text-slate-400 shrink-0">
            {heatmapMetric === 'valuation'
              ? formatInr(actualValuation)
              : `${occupancyPct}%`}
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
    <div className="relative w-full h-[480px] sm:h-[540px] bg-[#0A0F17] rounded-xl overflow-hidden select-none">
      <Canvas
        camera={{ fov: 40 }}
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
        <color args={['#0A0F17']} attach="background" />

        {/* 1. Structural Warehouse Shell, Floor Slab & Columns */}
        <WarehouseShell
          columns={layout.columns}
          height={layout.dimensions.height}
          length={layout.dimensions.length}
          width={layout.dimensions.width}
        />

        {/* 2. Directional Industrial Lighting & Ambient Skylight Ambiance */}
        <hemisphereLight
          color="#D8E2EC"
          groundColor="#1B2634"
          intensity={1.15}
        />
        <ambientLight color="#8DA4C4" intensity={0.9} />
        <directionalLight
          castShadow
          color="#FFFFFF"
          intensity={2.2}
          position={[22, 32, 18]}
          shadow-bias={-0.0005}
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight
          color="#38BDF8"
          intensity={0.9}
          position={[-20, 18, -16]}
        />
        <pointLight
          color="#60A5FA"
          distance={36}
          intensity={0.95}
          position={[0, 9, 0]}
        />

        {/* 3. Storage Zones with Floor Demarcation & Interactive Billboard Badges */}
        {layout.zones.map((placedZone, idx) => (
          <InteractiveZoneBoundary
            heatmapMetric={heatmapMetric}
            index={idx}
            isHovered={hoveredZoneId === placedZone.zone.id}
            isSelected={selectedZoneId === placedZone.zone.id}
            key={placedZone.zone.id}
            onHover={(hov) => onHoverZone(hov ? placedZone.zone.id : null)}
            onSelect={() => onSelectZone(placedZone.zone.id)}
            placedZone={placedZone}
            viewMode={viewMode}
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

        {/* 8. Camera and View Mode Controller with Dynamic Responsive Framing */}
        <CameraController
          cameraResetTrigger={cameraResetTrigger}
          dimensions={layout.dimensions}
          viewMode={viewMode}
        />
      </Canvas>
    </div>
  )
}
