/**
 * GameScene.tsx
 * 
 * Core component that manages the 3D multiplayer game environment:
 * 
 * Key functionality:
 * - Acts as the primary container for all 3D game elements
 * - Manages the game world environment (terrain, lighting, physics)
 * - Instantiates and coordinates player entities
 * - Handles multiplayer synchronization across clients
 * - Manages game state and lifecycle (start, join, disconnect)
 * - Maintains socket connections for real-time gameplay
 * 
 * Props:
 * - username: The local player's display name
 * - playerClass: The selected character class for the local player
 * - roomId: Unique identifier for the multiplayer game session
 * - onDisconnect: Callback function when player disconnects from game
 * 
 * Technical implementation:
 * - Uses React Three Fiber (R3F) for 3D rendering within React
 * - Implements physics system with Rapier for realistic interactions
 * - Manages socket.io connections for multiplayer state synchronization
 * - Handles dynamic loading and instantiation of 3D assets
 * 
 * Related files:
 * - Player.tsx: Individual player entity component
 * - JoinGameDialog.tsx: UI for joining a game session
 * - PlayerUI.tsx: In-game user interface elements
 * - Socket handlers for network communication
 */

import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Box, Plane, Grid, Sky, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { DirectionalLightHelper, CameraHelper } from 'three'; // Import the helper
// Import generated types
import { PlayerData, InputState } from '../generated';
import { Identity } from '@clockworklabs/spacetimedb-sdk';
import { Player } from './Player';
import { HexGrid } from './HexGrid';
import { MapGUI } from './MapGUI';

interface GameSceneProps {
  players: ReadonlyMap<string, PlayerData>; // Receive the map
  localPlayerIdentity: Identity | null;
  onPlayerRotation?: (rotation: THREE.Euler) => void; // Optional callback for player rotation
  currentInputRef?: React.MutableRefObject<InputState>; // Add input state ref prop
  isDebugPanelVisible?: boolean; // Prop to indicate if the debug panel is visible
}

export const GameScene: React.FC<GameSceneProps> = ({ 
  players, 
  localPlayerIdentity,
  onPlayerRotation,
  currentInputRef, // Receive input state ref
  isDebugPanelVisible = false // Destructure the new prop
}) => {
  // Ref for the main directional light
  const directionalLightRef = useRef<THREE.DirectionalLight>(null!); 

  // State for HexGrid parameters
  const [gridRadius, setGridRadius] = useState<number>(20);
  const [baseScaleFactor, setBaseScaleFactor] = useState<number>(0.25);
  const [pathScaleFactor, setPathScaleFactor] = useState<number>(0.02);
  const [arenaScaleFactor, setArenaScaleFactor] = useState<number>(0.3);
  const [borderColorFactor, setBorderColorFactor] = useState<number>(-0.3);

  const [dpr, setDpr] = useState(2)

  return (
    <>
      <Canvas 
        camera={{ position: [0, 10, 20], fov: 60 }} 
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} 
        shadows // Enable shadows
        dpr={dpr}
      >
        
        {/* Add Sky component */}
        <Sky distance={450000} sunPosition={[5, 1, 8]} inclination={0} azimuth={0.25} />

        {/* Ambient light for general scene illumination */}
        <ambientLight intensity={0.5} />
        
        {/* Main directional light with improved shadow settings */}
        <directionalLight 
          ref={directionalLightRef} // Assign ref
          position={[15, 20, 10]} 
          intensity={2.5} 
          castShadow 
          shadow-mapSize-width={2048} // Increased resolution
          shadow-mapSize-height={2048} // Increased resolution
          shadow-bias={-0.0001} // Made bias less negative (closer to 0)
          shadow-camera-left={-30} // Wider frustum
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-camera-near={0.1} // Closer near plane
          shadow-camera-far={100} // Further far plane
        />

        {/* Conditionally render Light and Shadow Camera Helpers */}
        {isDebugPanelVisible && directionalLightRef.current && (
          <>
            {/* <primitive object={new DirectionalLightHelper(directionalLightRef.current, 5)} /> */}
            {/* Add CameraHelper for the shadow camera */}
            {/* <primitive object={new CameraHelper(directionalLightRef.current.shadow.camera)} />  */}
          </>
        )}

        {/* Simplified Grid Helper (mid-gray lines) */}
        {/* <Grid 
          position={[0, 0, 0]} 
          args={[200, 200]} 
          cellSize={2} 
          cellThickness={1}
          cellColor={new THREE.Color('#888888')} // Mid-gray grid lines
        /> */}
        <HexGrid 
          position={[0, 0, 0]} 
          gridRadius={gridRadius}
          baseScaleFactor={baseScaleFactor}
          pathScaleFactor={pathScaleFactor}
          arenaScaleFactor={arenaScaleFactor}
          borderColorFactor={borderColorFactor}
        />

        {/* Render Players */}
        {Array.from(players.values()).map((player) => {
          const isLocal = localPlayerIdentity?.toHexString() === player.identity.toHexString();
          return (
            <Player 
              key={player.identity.toHexString()} 
              playerData={player}
              isLocalPlayer={isLocal}
              onRotationChange={isLocal ? onPlayerRotation : undefined}
              currentInput={isLocal ? currentInputRef?.current : undefined}
              isDebugArrowVisible={isLocal ? isDebugPanelVisible : false} // Pass down arrow visibility
              isDebugPanelVisible={isDebugPanelVisible} // Pass down general debug visibility
            />
          );
        })}

        {/* Remove OrbitControls as we're using our own camera controls */}
      </Canvas>
      {isDebugPanelVisible && (
        <MapGUI 
          onGridRadiusChange={setGridRadius}
          onBaseScaleFactorChange={setBaseScaleFactor}
          onPathScaleFactorChange={setPathScaleFactor}
          onArenaScaleFactorChange={setArenaScaleFactor}
          onBorderColorFactorChange={setBorderColorFactor}
          initialGridRadius={gridRadius}
          initialBaseScaleFactor={baseScaleFactor}
          initialPathScaleFactor={pathScaleFactor}
          initialArenaScaleFactor={arenaScaleFactor}
          initialBorderColorFactor={borderColorFactor}
        />
      )}
    </>
  );
};
