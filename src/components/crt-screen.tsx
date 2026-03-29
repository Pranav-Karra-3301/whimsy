"use client";

import { useEffect, useRef, useCallback } from "react";

interface CRTScreenProps {
  /** Lines of text to render on the CRT screen */
  text: string;
  /** Called when the component is ready */
  onReady?: () => void;
}

/**
 * Renders content through the actual cool-retro-term-renderer WebGL pipeline.
 * Uses Three.js with TerminalText (13 CRT shaders) + TerminalFrame (bezel).
 * The canvas fills its container.
 */
export function CRTScreen({ text, onReady }: CRTScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rendererRef = useRef<{
    threeRenderer: any;
    terminalText: any;
    terminalFrame: any;
    scene: any;
    camera: any;
    animId: number;
  } | null>(null);

  const initCRT = useCallback(async () => {
    const container = containerRef.current;
    if (!container || rendererRef.current) return;

    const THREE = await import("three");
    const { TerminalText, TerminalFrame } = await import(
      "cool-retro-term-renderer"
    );

    const w = container.clientWidth;
    const h = container.clientHeight;

    // Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const threeRenderer = new THREE.WebGLRenderer({ antialias: true });
    threeRenderer.setSize(w, h);
    threeRenderer.setPixelRatio(window.devicePixelRatio);
    threeRenderer.setClearColor(0x000000);
    container.appendChild(threeRenderer.domElement);

    // Terminal text (content + all CRT shaders)
    const terminalText = new TerminalText(w, h);
    terminalText.mesh.position.z = 0;
    scene.add(terminalText.mesh);

    // Configure CRT effects to match reference defaults
    terminalText.setScreenCurvature(0.3);
    terminalText.setBloom(0.55);
    terminalText.setBrightness(0.5);
    terminalText.setFlickering(0.1);
    terminalText.setJitter(0.2);
    terminalText.setStaticNoise(0.12);
    terminalText.setGlowingLine(0.2);
    terminalText.setBurnIn(0.25);
    terminalText.setRasterizationMode(1); // scanlines
    terminalText.setRasterizationIntensity(0.5);
    terminalText.setHorizontalSync(0.08);
    terminalText.setAmbientLight(0.2);

    // Terminal frame (bezel overlay)
    const terminalFrame = new TerminalFrame(w, h);
    terminalFrame.mesh.position.z = 0.1;
    terminalFrame.setScreenCurvature(0.3);
    scene.add(terminalFrame.mesh);

    // Set initial text
    terminalText.setText(text);

    // Animation loop
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      terminalText.updateTime(performance.now());
      terminalText.renderStaticPass(threeRenderer);
      threeRenderer.render(scene, camera);
    };
    animate();

    rendererRef.current = {
      threeRenderer,
      terminalText,
      terminalFrame,
      scene,
      camera,
      animId,
    };

    onReady?.();
  }, [text, onReady]);

  // Initialize on mount
  useEffect(() => {
    initCRT();

    return () => {
      if (rendererRef.current) {
        cancelAnimationFrame(rendererRef.current.animId);
        rendererRef.current.threeRenderer.dispose();
        rendererRef.current.terminalText.dispose();
        rendererRef.current.terminalFrame.dispose();
        // Remove canvas
        const canvas =
          rendererRef.current.threeRenderer.domElement;
        canvas.parentElement?.removeChild(canvas);
        rendererRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update text when it changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.terminalText.setText(text);
    }
  }, [text]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const ref = rendererRef.current;
      if (!container || !ref) return;

      const w = container.clientWidth;
      const h = container.clientHeight;
      ref.threeRenderer.setSize(w, h);
      ref.terminalText.updateSize(w, h);
      ref.terminalFrame.updateSize(w, h);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ background: "#000" }}
    />
  );
}
