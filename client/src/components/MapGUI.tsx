import React, { useEffect, useRef } from 'react';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

interface MapGUIProps {
  onGridRadiusChange?: (value: number) => void;
  onBaseScaleFactorChange?: (value: number) => void;
  onPathScaleFactorChange?: (value: number) => void;
  onArenaScaleFactorChange?: (value: number) => void;
  onBorderColorFactorChange?: (value: number) => void;
  initialGridRadius?: number;
  initialBaseScaleFactor?: number;
  initialPathScaleFactor?: number;
  initialArenaScaleFactor?: number;
  initialBorderColorFactor?: number;
}

export const MapGUI: React.FC<MapGUIProps> = ({
  onGridRadiusChange,
  onBaseScaleFactorChange,
  onPathScaleFactorChange,
  onArenaScaleFactorChange,
  onBorderColorFactorChange,
  initialGridRadius = 20,
  initialBaseScaleFactor = 0.25,
  initialPathScaleFactor = 0.02,
  initialArenaScaleFactor = 0.3,
  initialBorderColorFactor = -0.3
}) => {
  const guiRef = useRef<GUI | null>(null);

  useEffect(() => {
    if (!guiRef.current) {
      guiRef.current = new GUI({ title: 'Map Controls' });
      
      const params = {
        gridRadius: initialGridRadius,
        baseScaleFactor: initialBaseScaleFactor,
        pathScaleFactor: initialPathScaleFactor,
        arenaScaleFactor: initialArenaScaleFactor,
        borderColorFactor: initialBorderColorFactor
      };

      guiRef.current.add(params, 'gridRadius', 5, 50, 1)
        .name('Grid Radius')
        .onChange((value: number) => {
          if (onGridRadiusChange) onGridRadiusChange(value);
        });

      guiRef.current.add(params, 'baseScaleFactor', 0.1, 0.5, 0.01)
        .name('Base Scale Factor')
        .onChange((value: number) => {
          if (onBaseScaleFactorChange) onBaseScaleFactorChange(value);
        });

      guiRef.current.add(params, 'pathScaleFactor', 0.01, 0.1, 0.01)
        .name('Path Scale Factor')
        .onChange((value: number) => {
          if (onPathScaleFactorChange) onPathScaleFactorChange(value);
        });

      guiRef.current.add(params, 'arenaScaleFactor', 0.1, 0.5, 0.01)
        .name('Arena Scale Factor')
        .onChange((value: number) => {
          if (onArenaScaleFactorChange) onArenaScaleFactorChange(value);
        });

      guiRef.current.add(params, 'borderColorFactor', -1, 1, 0.1)
        .name('Border Color Factor')
        .onChange((value: number) => {
          if (onBorderColorFactorChange) onBorderColorFactorChange(value);
        });

      // Add click handler to prevent propagation
      const guiElement = guiRef.current.domElement;
      const handlePanelClick = (event: MouseEvent) => {
        event.stopPropagation();
      };
      guiElement.addEventListener('click', handlePanelClick);
    }

    return () => {
      if (guiRef.current) {
        guiRef.current.destroy();
        guiRef.current = null;
      }
    };
  }, [
    onGridRadiusChange, 
    onBaseScaleFactorChange, 
    onPathScaleFactorChange, 
    onArenaScaleFactorChange, 
    onBorderColorFactorChange,
    initialGridRadius,
    initialBaseScaleFactor,
    initialPathScaleFactor,
    initialArenaScaleFactor,
    initialBorderColorFactor
  ]);

  return null;
}; 