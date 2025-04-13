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

      _createHexGeometry(size: number) {
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

        // Inner hex vertices (fill)
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

        // Indices for inner hex fill
        for (let i = 1; i < 5; i++) {
          indices.push(6, 6 + i, 6 + ((i + 1) % 6));
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
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
        const hexFillGeometry = this._createHexFillGeometry(size);
        const hexBorderGeometry = this._createHexBorderGeometry(size);

        const gray = new THREE.Color(this.mapColor.r, this.mapColor.g, this.mapColor.b);
        const baseColors = this.baseColors.map(c => new THREE.Color(c.r, c.g, c.b));
        const arenaColor = new THREE.Color(this.arenaColor.r, this.arenaColor.g, this.arenaColor.b);
        const pathColor = new THREE.Color(this.pathColor.r, this.pathColor.g, this.pathColor.b);
        const tempBorderColor = new THREE.Color();

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
          { name: 'empty', color: gray, cells: [] },
          { name: 'paths', color: pathColor, cells: [] },
          { name: 'bases', color: baseColors, cells: [] },
          { name: 'arena', color: arenaColor, cells: [] }
        ];

        for (let q = -radius; q <= radius; q++) {
          for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
            const x = size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
            const z = size * (3 / 2 * r);
            const position = new THREE.Vector3(x, 0, z);

            const baseCheck = isInBase(q, r);
            if (baseCheck.isBase) {
              layers[2].cells.push({ q, r, position, color: baseColors[baseCheck.baseIndex] });
            } else if (isInArena(q, r)) {
              layers[3].cells.push({ q, r, position, color: arenaColor });
            } else if (isOnPath(q, r)) {
              layers[1].cells.push({ q, r, position, color: pathColor });
            } else {
              layers[0].cells.push({ q, r, position, color: gray });
            }
          }
        }

        const dummy = new THREE.Object3D();
        const fillMaterial = new THREE.MeshBasicMaterial({ vertexColors: false });
        const borderMaterial = new THREE.MeshBasicMaterial({ vertexColors: false });
        layers.forEach((layer, index) => {
          if (layer.cells.length === 0) return;

          const hexFillMesh = new THREE.InstancedMesh(hexFillGeometry, fillMaterial, layer.cells.length);
          const hexBorderMesh = new THREE.InstancedMesh(hexBorderGeometry, borderMaterial, layer.cells.length);

          layer.cells.forEach((cell: any, i: number) => {
            dummy.position.copy(cell.position);
            dummy.rotation.x = Math.PI;
            dummy.updateMatrix();
            hexFillMesh.setMatrixAt(i, dummy.matrix);
            hexFillMesh.setColorAt(i, cell.color);
            hexBorderMesh.setMatrixAt(i, dummy.matrix);
            // Set border color
            const borderColor = new THREE.Color();
            borderColor.copy(cell.color);
            if (this.borderColorFactor < 0) {
              borderColor.lerp(new THREE.Color(0x000000), -this.borderColorFactor);
            } else {
              borderColor.lerp(new THREE.Color(0xffffff), this.borderColorFactor);
            }
            hexBorderMesh.setColorAt(i, borderColor);
          });

          hexFillMesh.instanceMatrix.needsUpdate = true;
          hexFillMesh.instanceColor.needsUpdate = true;
          hexBorderMesh.instanceMatrix.needsUpdate = true;
          hexBorderMesh.instanceColor.needsUpdate = true;
          this.scene.add(hexFillMesh);
          this.scene.add(hexBorderMesh);
        });
      }

      updateGrid() {
        this.cellCount = this._calculateHexGridCellCount(this.gridRadius);
        this.scene.children
          .filter(child => child instanceof THREE.InstancedMesh || child instanceof THREE.LineSegments)
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