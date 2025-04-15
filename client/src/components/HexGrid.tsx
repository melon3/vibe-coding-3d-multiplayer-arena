import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

interface HexGridProps {
  gridRadius?: number;
  position?: [number, number, number];
  baseScaleFactor?: number;
  pathScaleFactor?: number;
  arenaScaleFactor?: number;
  borderColorFactor?: number;
  mapColor?: { r: number; g: number; b: number };
  arenaColor?: { r: number; g: number; b: number };
  pathColor?: { r: number; g: number; b: number };
  baseColors?: Array<{ r: number; g: number; b: number }>;
}

export const HexGrid: React.FC<HexGridProps> = ({
  gridRadius = 25,
  position = [0, 0, 0],
  baseScaleFactor = 0.25,
  pathScaleFactor = 0.02,
  arenaScaleFactor = 0.3,
  borderColorFactor = -0.3,
  mapColor = { r: 0.533, g: 0.533, b: 0.533 },
  arenaColor = { r: 1, g: 1, b: 0 },
  pathColor = { r: 1, g: 1, b: 1 },
  baseColors = [
    { r: 1, g: 0, b: 0 },
    { r: 0, g: 1, b: 0 },
    { r: 0, g: 0, b: 1 }
  ]
}) => {
  const { scene } = useThree();
  const hexGridRef = useRef<any>(null);

  useEffect(() => {
    if (!scene) return;

    class MapFactory {
      scene: THREE.Scene;
      gridRadius: number;
      cellCount: number;
      baseScaleFactor: number;
      pathScaleFactor: number;
      arenaScaleFactor: number;
      borderColorFactor: number;
      arenaColor: { r: number; g: number; b: number };
      pathColor: { r: number; g: number; b: number };
      baseColors: Array<{ r: number; g: number; b: number }>;
      mapColor: { r: number; g: number; b: number };

      constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.gridRadius = gridRadius;
        this.cellCount = this._calculateHexGridCellCount(this.gridRadius);
        this.baseScaleFactor = baseScaleFactor;
        this.pathScaleFactor = pathScaleFactor;
        this.arenaScaleFactor = arenaScaleFactor;
        this.borderColorFactor = borderColorFactor;
        this.arenaColor = arenaColor;
        this.pathColor = pathColor;
        this.baseColors = baseColors;
        this.mapColor = mapColor;
      }

      _createHexGeometry(size: number, borderColor: THREE.Color) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        const colors = [];

        // Thickness for the land effect (negative to extrude downward)
        const thickness = 0.5;

        // Outer hex vertices (border) - Top face
        for (let i = 0; i < 6; i++) {
          const angle = (i * 60 + 30) * Math.PI / 180;
          const x = size * Math.cos(angle);
          const z = size * Math.sin(angle);
          vertices.push(x, 0, z);
          colors.push(borderColor.r, borderColor.g, borderColor.b);
        }

        // Inner hex vertices (fill) - Top face
        const innerSize = size * 0.99;
        for (let i = 0; i < 6; i++) {
          const angle = (i * 60 + 30) * Math.PI / 180;
          const x = innerSize * Math.cos(angle);
          const z = innerSize * Math.sin(angle);
          vertices.push(x, 0, z);
          colors.push(1, 1, 1); // Fill color placeholder
        }

        // Outer hex vertices (border) - Bottom face
        for (let i = 0; i < 6; i++) {
          const angle = (i * 60 + 30) * Math.PI / 180;
          const x = size * Math.cos(angle);
          const z = size * Math.sin(angle);
          vertices.push(x, thickness, z);
          colors.push(borderColor.r * 0.7, borderColor.g * 0.7, borderColor.b * 0.7); // Darker for depth
        }

        // Inner hex vertices (fill) - Bottom face
        for (let i = 0; i < 6; i++) {
          const angle = (i * 60 + 30) * Math.PI / 180;
          const x = innerSize * Math.cos(angle);
          const z = innerSize * Math.sin(angle);
          vertices.push(x, thickness, z);
          colors.push(0.7, 0.7, 0.7); // Darker fill for depth
        }

        // Indices for top face border (outer to inner)
        for (let i = 0; i < 6; i++) {
          const next = (i + 1) % 6;
          indices.push(i, next, i + 6);
          indices.push(next, next + 6, i + 6);
        }

        // Indices for top face inner hex fill
        for (let i = 1; i < 5; i++) {
          indices.push(6, 6 + i, 6 + ((i + 1) % 6));
        }

        // Indices for bottom face border (outer to inner)
        for (let i = 0; i < 6; i++) {
          const next = (i + 1) % 6;
          const offset = 12; // Offset for bottom vertices
          indices.push(offset + i, offset + next, offset + i + 6);
          indices.push(offset + next, offset + next + 6, offset + i + 6);
        }

        // Indices for bottom face inner hex fill
        for (let i = 1; i < 5; i++) {
          indices.push(18, 18 + i, 18 + ((i + 1) % 6));
        }

        // Indices for sides to connect top and bottom faces (outer border)
        for (let i = 0; i < 6; i++) {
          const next = (i + 1) % 6;
          const bottom = 12;
          indices.push(i, next, i + bottom);
          indices.push(next, next + bottom, i + bottom);
        }

        // Indices for inner sides (between inner top and bottom)
        for (let i = 0; i < 6; i++) {
          const next = (i + 1) % 6;
          const innerTop = 6;
          const innerBottom = 18;
          indices.push(innerTop + i, innerTop + next, innerBottom + i);
          indices.push(innerTop + next, innerBottom + next, innerBottom + i);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
      }

      _createHexFillGeometry(size: number) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];

        // Inner hex vertices (fill)
        const innerSize = size * 0.9; // Slightly smaller for border thickness
        for (let i = 0; i < 6; i++) {
          const angle = (i * 60 + 30) * Math.PI / 180;
          const x = innerSize * Math.cos(angle);
          const z = innerSize * Math.sin(angle);
          vertices.push(x, 0, z);
        }

        // Indices for inner hex fill
        for (let i = 1; i < 5; i++) {
          indices.push(0, i, ((i + 1) % 6));
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
      }

      _createHexBorderGeometry(size: number) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];

        // Outer hex vertices (border)
        for (let i = 0; i < 6; i++) {
          const angle = (i * 60 + 30) * Math.PI / 180;
          const x = size * Math.cos(angle);
          const z = size * Math.sin(angle);
          vertices.push(x, 0, z);
        }

        // Inner hex vertices
        const innerSize = size * 0.9; // Slightly smaller for border thickness
        for (let i = 0; i < 6; i++) {
          const angle = (i * 60 + 30) * Math.PI / 180;
          const x = innerSize * Math.cos(angle);
          const z = innerSize * Math.sin(angle);
          vertices.push(x, 0, z);
        }

        // Indices for border (outer to inner)
        for (let i = 0; i < 6; i++) {
          const next = (i + 1) % 6;
          indices.push(i, next, i + 6);
          indices.push(next, next + 6, i + 6);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
      }

      _calculateHexGridCellCount(radius: number) {
        return 3 * radius * (radius + 1) + 1;
      }

      createHexGrid() {
        const size = 3;
        const radius = this.gridRadius;

        const gray = new THREE.Color(this.mapColor.r, this.mapColor.g, this.mapColor.b);
        const baseColors = this.baseColors.map(c => new THREE.Color(c.r, c.g, c.b));
        const arenaColor = new THREE.Color(this.arenaColor.r, this.arenaColor.g, this.arenaColor.b);
        const pathColor = new THREE.Color(this.pathColor.r, this.pathColor.g, this.pathColor.b);

        // Calculate border colors for each layer
        const grayBorder = gray.clone();
        if (this.borderColorFactor < 0) {
          grayBorder.lerp(new THREE.Color(0x000000), -this.borderColorFactor);
        } else {
          grayBorder.lerp(new THREE.Color(0xffffff), this.borderColorFactor);
        }

        const pathBorder = pathColor.clone();
        if (this.borderColorFactor < 0) {
          pathBorder.lerp(new THREE.Color(0x000000), -this.borderColorFactor);
        } else {
          pathBorder.lerp(new THREE.Color(0xffffff), this.borderColorFactor);
        }

        const arenaBorder = arenaColor.clone();
        if (this.borderColorFactor < 0) {
          arenaBorder.lerp(new THREE.Color(0x000000), -this.borderColorFactor);
        } else {
          arenaBorder.lerp(new THREE.Color(0xffffff), this.borderColorFactor);
        }

        // Create geometries with pre-set border colors
        const grayHexGeometry = this._createHexGeometry(size, grayBorder);
        const pathHexGeometry = this._createHexGeometry(size, pathBorder);
        const arenaHexGeometry = this._createHexGeometry(size, arenaBorder);
        const baseHexGeometries = baseColors.map(color => {
          const borderColor = color.clone();
          if (this.borderColorFactor < 0) {
            borderColor.lerp(new THREE.Color(0x000000), -this.borderColorFactor);
          } else {
            borderColor.lerp(new THREE.Color(0xffffff), this.borderColorFactor);
          }
          return this._createHexGeometry(size, borderColor);
        });

        const arenaRadius = Math.floor(radius * this.arenaScaleFactor || radius * 0.5);
        const baseRadius = Math.floor(radius * this.baseScaleFactor || radius * 0.3);
        const pathWidth = Math.floor(radius * this.pathScaleFactor || 2);

        const isInArena = (q: number, r: number) => {
          const s = -q - r;
          return Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= arenaRadius;
        };

        const isInBase = (q: number, r: number) => {
          const basePositions = [
            { q: radius, r: -radius },
            { q: -radius, r: 0 },
            { q: 0, r: radius }
          ];
          for (let i = 0; i < basePositions.length; i++) {
            const base = basePositions[i];
            const dq = q - base.q;
            const dr = r - base.r;
            const ds = dq + dr;
            const dist = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
            if (dist <= baseRadius) return { isBase: true, baseIndex: i };
          }
          return { isBase: false, baseIndex: -1 };
        };

        const isOnPath = (q: number, r: number) => {
          const paths = [
            { start: { q: radius, r: -radius }, step: { dq: -1, dr: 1 } },
            { start: { q: -radius, r: 0 }, step: { dq: 1, dr: 0 } },
            { start: { q: 0, r: radius }, step: { dq: 0, dr: -1 } }
          ];
          for (const path of paths) {
            let currentQ = path.start.q;
            let currentR = path.start.r;
            while (!(currentQ === 0 && currentR === 0) && Math.abs(currentQ) <= radius && Math.abs(currentR) <= radius) {
              const dq = q - currentQ;
              const dr = r - currentR;
              const ds = dq + dr;
              const dist = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
              if (dist <= pathWidth) return true;
              currentQ += path.step.dq;
              currentR += path.step.dr;
            }
          }
          return false;
        };

        const layers = [
          { name: 'paths', color: pathColor, cells: [], geometry: pathHexGeometry },
          { name: 'bases', color: baseColors, cells: [], geometry: baseHexGeometries },
          { name: 'arena', color: arenaColor, cells: [], geometry: arenaHexGeometry }
        ];

        for (let q = -radius; q <= radius; q++) {
          for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
            const x = size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
            const z = size * (3 / 2 * r);
            const position = new THREE.Vector3(x, 0, z);

            const baseCheck = isInBase(q, r);
            if (baseCheck.isBase && baseCheck.baseIndex >= 0 && baseCheck.baseIndex < baseColors.length) {
              layers[1].cells.push({ q, r, position, color: baseColors[baseCheck.baseIndex], baseIndex: baseCheck.baseIndex });
            } else if (isInArena(q, r)) {
              layers[2].cells.push({ q, r, position, color: arenaColor });
            } else if (isOnPath(q, r)) {
              layers[0].cells.push({ q, r, position, color: pathColor });
            }
          }
        }

        const dummy = new THREE.Object3D();
        const material = new THREE.MeshBasicMaterial({ vertexColors: true });
        layers.forEach((layer, index) => {
          if (layer.cells.length === 0) return;

          if (layer.name === 'bases') {
            // Handle bases separately due to multiple colors and geometries
            const baseCellsByColor = [[], [], []];
            layer.cells.forEach((cell: any) => {
              if (cell.baseIndex >= 0 && cell.baseIndex < baseCellsByColor.length) {
                baseCellsByColor[cell.baseIndex].push(cell);
              }
            });

            baseCellsByColor.forEach((baseCells: any[], baseIndex: number) => {
              if (baseCells.length === 0) return;

              const hexMesh = new THREE.InstancedMesh(baseHexGeometries[baseIndex] as THREE.BufferGeometry, material, baseCells.length);

              baseCells.forEach((cell: any, i: number) => {
                dummy.position.copy(cell.position);
                dummy.rotation.x = Math.PI;
                dummy.updateMatrix();
                hexMesh.setMatrixAt(i, dummy.matrix);
                hexMesh.setColorAt(i, cell.color);
              });

              hexMesh.instanceMatrix.needsUpdate = true;
              hexMesh.instanceColor.needsUpdate = true;
              this.scene.add(hexMesh);
            });
          } else {
            const hexMesh = new THREE.InstancedMesh(layer.geometry as THREE.BufferGeometry, material, layer.cells.length);

            layer.cells.forEach((cell: any, i: number) => {
              dummy.position.copy(cell.position);
              dummy.rotation.x = Math.PI;
              dummy.updateMatrix();
              hexMesh.setMatrixAt(i, dummy.matrix);
              hexMesh.setColorAt(i, cell.color);
            });

            hexMesh.instanceMatrix.needsUpdate = true;
            hexMesh.instanceColor.needsUpdate = true;
            this.scene.add(hexMesh);
          }
        });
      }

      updateGrid() {
        this.cellCount = this._calculateHexGridCellCount(this.gridRadius);
        this.scene.children
          .filter(child => child instanceof THREE.InstancedMesh)
          .forEach(child => {
            this.scene.remove(child);
            child.geometry.dispose();
            child.material.dispose();
          });
        this.createHexGrid();
      }
    }

    hexGridRef.current = new MapFactory(scene);
    hexGridRef.current.createHexGrid();

    return () => {
      if (hexGridRef.current) {
        hexGridRef.current.updateGrid();
      }
    };
  }, [scene, gridRadius, baseScaleFactor, pathScaleFactor, arenaScaleFactor, borderColorFactor, mapColor, arenaColor, pathColor, baseColors]);

  return null;
}; 