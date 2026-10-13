import { useMemo } from 'react'
import * as THREE from 'three'
import type {
  EquipmentFixture,
  PlacedRack,
  SafetyFixture,
  Vector3Tuple,
  WorkstationFixture,
} from './warehouseLayoutGenerator'
import type { HeatmapMetric } from './WarehouseIsometricVisualizer'

// =============================================================================
// 1. WAREHOUSE STRUCTURAL SHELL & FLOOR
// =============================================================================

export function WarehouseShell({
  width,
  length,
  height,
  columns,
}: {
  width: number
  length: number
  height: number
  columns: Vector3Tuple[]
}) {
  return (
    <group position={[0, 0, 0]}>
      {/* Structural Reinforced Concrete Foundation Slab (Thickness 0.8m) */}
      <mesh position={[0, -0.4, 0]} receiveShadow>
        <boxGeometry args={[width, 0.8, length]} />
        <meshStandardMaterial
          color="#0C131D"
          metalness={0.2}
          roughness={0.85}
        />
      </mesh>

      {/* Perimeter Ground Bevel Trim */}
      <lineSegments position={[0, 0.005, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(width, 0.01, length)]} />
        <lineBasicMaterial color="#1E2B3A" />
      </lineSegments>

      {/* Main Longitudinal Transport Highway (Central Aisle Z-axis) */}
      <mesh position={[0, 0.01, 0]}>
        <planeGeometry args={[2.8, length - 2]} />
        <meshStandardMaterial
          color="#111B28"
          metalness={0.15}
          roughness={0.9}
        />
      </mesh>

      {/* High-Visibility Aisle Safety Boundary Stripes (Cyan & Amber Guide Rails) */}
      <mesh position={[1.4, 0.012, 0]}>
        <planeGeometry args={[0.08, length - 2]} />
        <meshBasicMaterial color="#43D9E8" opacity={0.65} transparent />
      </mesh>
      <mesh position={[-1.4, 0.012, 0]}>
        <planeGeometry args={[0.08, length - 2]} />
        <meshBasicMaterial color="#43D9E8" opacity={0.65} transparent />
      </mesh>

      {/* Cross-Aisle Transport Arteries (East-West Transverse Walkways) */}
      <mesh position={[0, 0.011, 0]}>
        <planeGeometry args={[width - 3, 2.2]} />
        <meshStandardMaterial color="#101925" />
      </mesh>
      <mesh position={[0, 0.013, 1.1]}>
        <planeGeometry args={[width - 3, 0.06]} />
        <meshBasicMaterial color="#F5A524" opacity={0.7} transparent />
      </mesh>
      <mesh position={[0, 0.013, -1.1]}>
        <planeGeometry args={[width - 3, 0.06]} />
        <meshBasicMaterial color="#F5A524" opacity={0.7} transparent />
      </mesh>

      {/* Front Inbound/Outbound Loading Dock Apron (+Z) */}
      <mesh position={[0, 0.011, length / 2 - 2.5]}>
        <planeGeometry args={[width * 0.55, 4.2]} />
        <meshStandardMaterial color="#13202E" />
      </mesh>
      <lineSegments position={[0, 0.014, length / 2 - 2.5]}>
        <edgesGeometry
          args={[new THREE.BoxGeometry(width * 0.55, 0.01, 4.2)]}
        />
        <lineBasicMaterial color="#F5A524" opacity={0.8} transparent />
      </lineSegments>

      {/* Loading Dock Leveler Plates (Steel diamond-plate texture simulation) */}
      {[-5, 0, 5].map((dockX) => (
        <group
          key={`dock-plate-${dockX}`}
          position={[dockX, 0.02, length / 2 - 0.7]}
        >
          <mesh>
            <boxGeometry args={[2.2, 0.03, 1.2]} />
            <meshStandardMaterial
              color="#2B3E52"
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <planeGeometry args={[2.0, 0.1]} />
            <meshBasicMaterial color="#F5A524" />
          </mesh>
        </group>
      ))}

      {/* Structural Steel Columns with Base Mounting Flanges */}
      {columns.map(([cx, cy, cz], idx) => (
        <group key={`column-${idx}`} position={[cx, 0, cz]}>
          {/* Base Anchor Plate */}
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.7, 0.08, 0.7]} />
            <meshStandardMaterial
              color="#1E2A38"
              metalness={0.7}
              roughness={0.4}
            />
          </mesh>
          {/* Vertical Steel Column */}
          <mesh castShadow position={[0, cy, 0]}>
            <boxGeometry args={[0.38, height, 0.38]} />
            <meshStandardMaterial
              color="#233446"
              metalness={0.75}
              roughness={0.35}
            />
          </mesh>
          {/* High-visibility yellow lower bumper wrapping */}
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[0.42, 1.1, 0.42]} />
            <meshStandardMaterial color="#EAB308" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Low Enclosure Industrial Perimeter Walls (3-wall cutaway for unobstructed camera orbit) */}
      {/* Rear Wall (-Z) */}
      <mesh position={[0, 1.5, -length / 2 + 0.1]}>
        <boxGeometry args={[width, 3.0, 0.2]} />
        <meshStandardMaterial
          color="#0F1723"
          metalness={0.4}
          opacity={0.88}
          roughness={0.7}
          transparent
        />
      </mesh>
      {/* Left Wall (-X) */}
      <mesh position={[-width / 2 + 0.1, 1.5, 0]}>
        <boxGeometry args={[0.2, 3.0, length]} />
        <meshStandardMaterial
          color="#0F1723"
          metalness={0.4}
          opacity={0.88}
          roughness={0.7}
          transparent
        />
      </mesh>
      {/* Right Wall (+X) */}
      <mesh position={[width / 2 - 0.1, 1.5, 0]}>
        <boxGeometry args={[0.2, 3.0, length]} />
        <meshStandardMaterial
          color="#0F1723"
          metalness={0.4}
          opacity={0.88}
          roughness={0.7}
          transparent
        />
      </mesh>
    </group>
  )
}

// =============================================================================
// 2. STORAGE RACK MODEL (FRAMES, BEAMS, WIRE DECKS, PALLETS & CARGO)
// =============================================================================

export function StorageRackModel({
  placedRack,
  heatmapMetric,
  isSelected,
  onSelect,
}: {
  placedRack: PlacedRack
  heatmapMetric: HeatmapMetric
  isSelected: boolean
  onSelect: () => void
}) {
  const {
    width,
    depth,
    levels,
    occupancyPct,
    occupiedUnits,
    assignedProducts,
    zone,
  } = placedRack
  const levelHeight = 1.05
  const totalHeight = levels * levelHeight + 0.3

  // Color derivation based on category, stock status and active heatmap
  const cargoColor = useMemo(() => {
    if (heatmapMetric === 'occupancy') {
      if (occupancyPct >= 75) return '#059669' // Emerald healthy
      if (occupancyPct >= 35) return '#2563EB' // Active blue
      if (occupancyPct > 0) return '#D97706' // Warning amber
      return '#DC2626' // Red out of stock
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

    // Valuation metric
    const totalVal = assignedProducts.reduce(
      (sum, p) => sum + p.stock * p.price,
      0,
    )
    if (totalVal > 500000) return '#0891B2'
    if (totalVal > 100000) return '#2563EB'
    return '#475569'
  }, [heatmapMetric, occupancyPct, zone.type, assignedProducts])

  return (
    <group
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      position={placedRack.position}
      rotation={[0, placedRack.rotationY, 0]}
    >
      {/* 4 Steel Teardrop Vertical Upright Columns */}
      {[-width / 2, width / 2].map((x) =>
        [-depth / 2, depth / 2].map((z) => (
          <group key={`upright-${x}-${z}`} position={[x, totalHeight / 2, z]}>
            <mesh castShadow>
              <boxGeometry args={[0.08, totalHeight, 0.08]} />
              <meshStandardMaterial
                color={isSelected ? '#43D9E8' : '#233345'}
                metalness={0.7}
                roughness={0.35}
              />
            </mesh>
            {/* Foot Mounting Plate at ground level */}
            <mesh position={[0, -totalHeight / 2 + 0.03, 0]}>
              <boxGeometry args={[0.18, 0.04, 0.18]} />
              <meshStandardMaterial
                color="#17222E"
                metalness={0.8}
                roughness={0.4}
              />
            </mesh>
          </group>
        )),
      )}

      {/* Structural Diagonal Trusses on Side End-Frames */}
      {[-width / 2, width / 2].map((x) => (
        <group key={`truss-${x}`} position={[x, totalHeight / 2, 0]}>
          <mesh rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.03, totalHeight * 0.95, 0.03]} />
            <meshStandardMaterial
              color="#1E2B3A"
              metalness={0.6}
              roughness={0.5}
            />
          </mesh>
          <mesh rotation={[-0.4, 0, 0]}>
            <boxGeometry args={[0.03, totalHeight * 0.95, 0.03]} />
            <meshStandardMaterial
              color="#1E2B3A"
              metalness={0.6}
              roughness={0.5}
            />
          </mesh>
        </group>
      ))}

      {/* Shelf Levels with Load Beams, Wire Decking, Pallets and Cargo */}
      {Array.from({ length: levels }).map((_, lvlIdx) => {
        const y = (lvlIdx + 1) * levelHeight - 0.15
        const isLevelOccupied =
          occupiedUnits > 0 && occupancyPct >= ((lvlIdx + 1) / levels) * 60

        return (
          <group key={`shelf-level-${lvlIdx}`} position={[0, y, 0]}>
            {/* Front Industrial Load Beam (Safety Orange #EA580C) */}
            <mesh castShadow position={[0, 0, depth / 2]}>
              <boxGeometry args={[width + 0.1, 0.09, 0.07]} />
              <meshStandardMaterial
                color={isSelected ? '#43D9E8' : '#EA580C'}
                metalness={0.5}
                roughness={0.4}
              />
            </mesh>
            {/* Rear Industrial Load Beam */}
            <mesh castShadow position={[0, 0, -depth / 2]}>
              <boxGeometry args={[width + 0.1, 0.09, 0.07]} />
              <meshStandardMaterial
                color={isSelected ? '#43D9E8' : '#EA580C'}
                metalness={0.5}
                roughness={0.4}
              />
            </mesh>

            {/* Heavy-Duty Welded Wire Decking Surface */}
            <mesh position={[0, 0.03, 0]}>
              <boxGeometry args={[width - 0.1, 0.02, depth - 0.1]} />
              <meshStandardMaterial
                color="#1B2836"
                metalness={0.8}
                roughness={0.3}
              />
            </mesh>

            {/* 2 Heavy Pallets with Modular Cargo stacked per tier */}
            {[-width * 0.25, width * 0.25].map((palletX, pIdx) => {
              const showCargo =
                occupiedUnits > 0 &&
                (isLevelOccupied || (lvlIdx === 0 && pIdx === 0))

              return (
                <group key={`pallet-${pIdx}`} position={[palletX, 0.07, 0]}>
                  {/* Wooden 4-Way Entry Stringer Pallet Base */}
                  <group position={[0, 0.05, 0]}>
                    {/* Top deck boards */}
                    <mesh castShadow receiveShadow position={[0, 0.035, 0]}>
                      <boxGeometry args={[1.65, 0.025, 1.05]} />
                      <meshStandardMaterial color="#7A5D3E" roughness={0.9} />
                    </mesh>
                    {/* 3 longitudinal runners with forklift notches */}
                    {[-0.45, 0, 0.45].map((rz) => (
                      <mesh key={`runner-${rz}`} position={[0, 0, rz]}>
                        <boxGeometry args={[1.65, 0.045, 0.08]} />
                        <meshStandardMaterial
                          color="#684E34"
                          roughness={0.95}
                        />
                      </mesh>
                    ))}
                    {/* Bottom deck boards */}
                    <mesh position={[0, -0.035, 0]}>
                      <boxGeometry args={[1.65, 0.02, 1.05]} />
                      <meshStandardMaterial color="#7A5D3E" roughness={0.9} />
                    </mesh>
                  </group>

                  {/* Cargo Units (Realistic Corrugated Cartons & Bins) */}
                  {showCargo && (
                    <group position={[0, 0.12, 0]}>
                      {/* Box Tier 1 - Main Industrial Carton */}
                      <mesh castShadow position={[-0.35, 0.22, -0.15]}>
                        <boxGeometry args={[0.65, 0.44, 0.58]} />
                        <meshStandardMaterial
                          color={cargoColor}
                          emissive={isSelected ? cargoColor : '#000000'}
                          emissiveIntensity={isSelected ? 0.3 : 0}
                          metalness={0.2}
                          roughness={0.65}
                        />
                      </mesh>

                      {/* Box Tier 1 - Secondary Carton */}
                      <mesh castShadow position={[0.35, 0.2, 0.12]}>
                        <boxGeometry args={[0.62, 0.4, 0.52]} />
                        <meshStandardMaterial
                          color={cargoColor}
                          emissive={isSelected ? cargoColor : '#000000'}
                          emissiveIntensity={isSelected ? 0.25 : 0}
                          metalness={0.25}
                          roughness={0.6}
                        />
                      </mesh>

                      {/* Box Tier 2 - Top Crate */}
                      <mesh castShadow position={[-0.1, 0.52, 0.04]}>
                        <boxGeometry args={[0.48, 0.28, 0.42]} />
                        <meshStandardMaterial
                          color={cargoColor}
                          emissive={isSelected ? cargoColor : '#000000'}
                          emissiveIntensity={isSelected ? 0.25 : 0}
                          metalness={0.3}
                          roughness={0.55}
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

      {/* Selected Rack Precision Holographic Bounding Cage */}
      {isSelected && (
        <lineSegments position={[0, totalHeight / 2, 0]}>
          <edgesGeometry
            args={[
              new THREE.BoxGeometry(
                width + 0.35,
                totalHeight + 0.35,
                depth + 0.35,
              ),
            ]}
          />
          <lineBasicMaterial color="#43D9E8" linewidth={2} />
        </lineSegments>
      )}
    </group>
  )
}

// =============================================================================
// 3. PACKING WORKSTATION & CONVEYOR FIXTURES (PACKING CATEGORY)
// =============================================================================

export function PackingWorkstationModel({
  fixture,
}: {
  fixture: WorkstationFixture
}) {
  return (
    <group position={fixture.position} rotation={[0, fixture.rotationY, 0]}>
      {/* Heavy Steel Ergonomic Workbench */}
      <mesh castShadow position={[0, 0.48, 0]}>
        <boxGeometry args={[2.4, 0.08, 1.2]} />
        <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* 4 Steel Workbench Legs */}
      {[-1.1, 1.1].map((lx) =>
        [-0.5, 0.5].map((lz) => (
          <mesh
            castShadow
            key={`bench-leg-${lx}-${lz}`}
            position={[lx, 0.24, lz]}
          >
            <boxGeometry args={[0.07, 0.48, 0.07]} />
            <meshStandardMaterial
              color="#1E293B"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        )),
      )}

      {/* Overhead Steel Utility Gantry */}
      <mesh position={[-1.1, 1.1, -0.5]}>
        <boxGeometry args={[0.05, 1.2, 0.05]} />
        <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[1.1, 1.1, -0.5]}>
        <boxGeometry args={[0.05, 1.2, 0.05]} />
        <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.7, -0.5]}>
        <boxGeometry args={[2.25, 0.05, 0.05]} />
        <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Overhead LED Task Light Fixture */}
      <mesh position={[0, 1.66, -0.3]}>
        <boxGeometry args={[1.4, 0.04, 0.15]} />
        <meshStandardMaterial
          color="#E2E8F0"
          emissive="#FFFFFF"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Articulated Terminal Screen (Barcode & Packing Manifest Display) */}
      <mesh position={[0.6, 0.88, -0.3]} rotation={[-0.1, -0.3, 0]}>
        <boxGeometry args={[0.38, 0.26, 0.03]} />
        <meshStandardMaterial
          color="#0F172A"
          emissive="#2563EB"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Industrial Tape Dispenser with Roll of Packing Tape */}
      <mesh position={[-0.6, 0.58, 0.2]}>
        <boxGeometry args={[0.15, 0.12, 0.3]} />
        <meshStandardMaterial color="#D97706" metalness={0.4} />
      </mesh>

      {/* Flat Carton Storage Rack under workbench */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[1.8, 0.02, 0.9]} />
        <meshStandardMaterial color="#1E293B" metalness={0.6} />
      </mesh>

      {/* Roller Conveyor Section for Finished Packed Parcels */}
      <group position={[0, 0.42, 1.1]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.4, 0.06, 0.6]} />
          <meshStandardMaterial
            color="#2B3E52"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        {/* Conveyor Rollers */}
        {[-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9].map((rx) => (
          <mesh
            key={`roller-${rx}`}
            position={[rx, 0.04, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.025, 0.025, 0.55, 12]} />
            <meshStandardMaterial
              color="#94A3B8"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
        ))}
        {/* Sample Outbound Carton waiting on conveyor */}
        <mesh castShadow position={[0.2, 0.22, 0]}>
          <boxGeometry args={[0.42, 0.32, 0.38]} />
          <meshStandardMaterial color="#D97706" roughness={0.7} />
        </mesh>
      </group>
    </group>
  )
}

// =============================================================================
// 4. EQUIPMENT FIXTURES: FORKLIFT & PALLET JACK (EQUIPMENT CATEGORY)
// =============================================================================

export function EquipmentFixtureModel({
  fixture,
}: {
  fixture: EquipmentFixture
}) {
  if (fixture.type === 'forklift') {
    return (
      <group position={fixture.position} rotation={[0, fixture.rotationY, 0]}>
        {/* Heavy Chassis / Body */}
        <mesh castShadow position={[0, 0.55, 0]}>
          <boxGeometry args={[1.3, 0.7, 1.8]} />
          <meshStandardMaterial
            color="#EA580C"
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>
        {/* Rear Counterweight (Cast Iron Steel) */}
        <mesh castShadow position={[0, 0.55, -0.9]}>
          <boxGeometry args={[1.25, 0.65, 0.55]} />
          <meshStandardMaterial
            color="#1E293B"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        {/* 4 Rubber Industrial Wheels */}
        {[-0.68, 0.68].map((wx) =>
          [-0.65, 0.65].map((wz) => (
            <mesh
              key={`wheel-${wx}-${wz}`}
              position={[wx, 0.22, wz]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.22, 0.22, 0.2, 16]} />
              <meshStandardMaterial color="#0F172A" roughness={0.9} />
            </mesh>
          )),
        )}
        {/* Overhead Protective Steel Operator Cage */}
        {[-0.55, 0.55].map((cx) =>
          [-0.6, 0.3].map((cz) => (
            <mesh key={`cage-post-${cx}-${cz}`} position={[cx, 1.35, cz]}>
              <boxGeometry args={[0.06, 0.9, 0.06]} />
              <meshStandardMaterial color="#1E293B" metalness={0.7} />
            </mesh>
          )),
        )}
        {/* Cage Overhead Roof */}
        <mesh position={[0, 1.8, -0.15]}>
          <boxGeometry args={[1.2, 0.04, 1.0]} />
          <meshStandardMaterial color="#1E293B" metalness={0.7} />
        </mesh>
        {/* Front Dual Mast Uprights */}
        {[-0.32, 0.32].map((mx) => (
          <mesh castShadow key={`mast-${mx}`} position={[mx, 1.25, 1.0]}>
            <boxGeometry args={[0.08, 1.9, 0.08]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
        ))}
        {/* Fork Carriage & Dual Steel Forks */}
        <mesh position={[0, 0.35, 1.1]}>
          <boxGeometry args={[0.8, 0.2, 0.08]} />
          <meshStandardMaterial color="#1E293B" metalness={0.8} />
        </mesh>
        {[-0.22, 0.22].map((fx) => (
          <mesh castShadow key={`fork-${fx}`} position={[fx, 0.06, 1.65]}>
            <boxGeometry args={[0.08, 0.04, 1.05]} />
            <meshStandardMaterial
              color="#475569"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
        ))}
      </group>
    )
  }

  if (fixture.type === 'pallet_jack') {
    return (
      <group position={fixture.position} rotation={[0, fixture.rotationY, 0]}>
        {/* Hydraulic Pump Housing */}
        <mesh castShadow position={[0, 0.35, -0.45]}>
          <cylinderGeometry args={[0.16, 0.16, 0.45, 12]} />
          <meshStandardMaterial color="#EA580C" metalness={0.5} />
        </mesh>
        {/* Tiller Steering Handle */}
        <mesh position={[0, 0.72, -0.6]} rotation={[-0.45, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.65, 8]} />
          <meshStandardMaterial color="#1E293B" />
        </mesh>
        <mesh position={[0, 0.98, -0.75]}>
          <boxGeometry args={[0.3, 0.04, 0.04]} />
          <meshStandardMaterial color="#1E293B" />
        </mesh>
        {/* Dual Forks */}
        {[-0.2, 0.2].map((fx) => (
          <mesh castShadow key={`jack-fork-${fx}`} position={[fx, 0.1, 0.3]}>
            <boxGeometry args={[0.14, 0.07, 1.1]} />
            <meshStandardMaterial
              color="#EA580C"
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
        ))}
      </group>
    )
  }

  // Charging Station
  return (
    <group position={fixture.position} rotation={[0, fixture.rotationY, 0]}>
      <mesh castShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[0.7, 1.8, 0.45]} />
        <meshStandardMaterial color="#1E293B" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* High-visibility yellow safety faceplate */}
      <mesh position={[0, 1.2, 0.24]}>
        <planeGeometry args={[0.55, 0.8]} />
        <meshStandardMaterial color="#EAB308" roughness={0.4} />
      </mesh>
      {/* Status LED Ticker */}
      <mesh position={[0, 1.45, 0.25]}>
        <planeGeometry args={[0.4, 0.1]} />
        <meshBasicMaterial color="#10B981" />
      </mesh>
      {/* Heavy-gauge charging cable */}
      <mesh position={[0.25, 0.6, 0.3]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>
    </group>
  )
}

// =============================================================================
// 5. SAFETY FIXTURES: CABINETS, BOLLARDS, EYEWASH (SAFETY CATEGORY)
// =============================================================================

export function SafetyFixtureModel({ fixture }: { fixture: SafetyFixture }) {
  if (fixture.type === 'safety_cabinet') {
    return (
      <group position={fixture.position} rotation={[0, fixture.rotationY, 0]}>
        {/* Double-walled Yellow Hazardous Storage Cabinet (OSHA Standard) */}
        <mesh castShadow position={[0, 0.95, 0]}>
          <boxGeometry args={[1.2, 1.9, 0.65]} />
          <meshStandardMaterial
            color="#FACC15"
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
        {/* Cabinet Door Seam */}
        <mesh position={[0, 0.95, 0.33]}>
          <planeGeometry args={[0.02, 1.8]} />
          <meshBasicMaterial color="#1E293B" />
        </mesh>
        {/* Red Hazard / Flammable Warning Plaque */}
        <mesh position={[0, 1.5, 0.34]}>
          <planeGeometry args={[0.65, 0.22]} />
          <meshStandardMaterial color="#DC2626" />
        </mesh>
        {/* Twin Door Handles */}
        {[-0.1, 0.1].map((hx) => (
          <mesh key={`handle-${hx}`} position={[hx, 0.95, 0.36]}>
            <boxGeometry args={[0.04, 0.15, 0.04]} />
            <meshStandardMaterial color="#1E293B" metalness={0.9} />
          </mesh>
        ))}
      </group>
    )
  }

  if (fixture.type === 'bollard') {
    return (
      <group position={fixture.position} rotation={[0, fixture.rotationY, 0]}>
        {/* Heavy-Duty Steel Impact Bollard with Safety Stripes */}
        <mesh castShadow position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 1.0, 16]} />
          <meshStandardMaterial
            color="#EAB308"
            metalness={0.4}
            roughness={0.4}
          />
        </mesh>
        {/* Black Hazard Warning Stripe Rings */}
        {[0.3, 0.6, 0.85].map((sy) => (
          <mesh key={`stripe-${sy}`} position={[0, sy, 0]}>
            <cylinderGeometry args={[0.104, 0.104, 0.08, 16]} />
            <meshBasicMaterial color="#0F172A" />
          </mesh>
        ))}
        {/* Base Floor Mounting Flange */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.04, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
      </group>
    )
  }

  if (fixture.type === 'eyewash_station') {
    return (
      <group position={fixture.position} rotation={[0, fixture.rotationY, 0]}>
        {/* Pedestal Stand */}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.1, 12]} />
          <meshStandardMaterial color="#059669" metalness={0.5} />
        </mesh>
        {/* Eyewash Basin Bowl */}
        <mesh position={[0, 1.05, 0]}>
          <cylinderGeometry args={[0.22, 0.16, 0.15, 16]} />
          <meshStandardMaterial
            color="#E2E8F0"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        {/* High-visibility green emergency sign backplate */}
        <mesh position={[0, 1.6, 0.05]}>
          <boxGeometry args={[0.45, 0.35, 0.02]} />
          <meshStandardMaterial color="#059669" />
        </mesh>
      </group>
    )
  }

  // Hazard Quarantine Perimeter Cage
  return (
    <group position={fixture.position} rotation={[0, fixture.rotationY, 0]}>
      <lineSegments position={[0, 0.015, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(8, 0.01, 6)]} />
        <lineBasicMaterial color="#DC2626" linewidth={2} />
      </lineSegments>
      {/* Corner Stanchions */}
      {[-4, 4].map((px) =>
        [-3, 3].map((pz) => (
          <mesh key={`stanchion-${px}-${pz}`} position={[px, 0.8, pz]}>
            <cylinderGeometry args={[0.04, 0.04, 1.6, 8]} />
            <meshStandardMaterial color="#DC2626" />
          </mesh>
        )),
      )}
    </group>
  )
}
