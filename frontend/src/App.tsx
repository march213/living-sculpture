import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Environment, OrbitControls } from "@react-three/drei";
import { useControls } from "leva";
import CustomShaderMaterial from "three-custom-shader-material";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import wobbleVertexShader from "./shaders/wobble/vertex.glsl";
import wobbleFragmentShader from "./shaders/wobble/fragment.glsl";
import { type OSCRelayData } from "./types";

import { io, Socket } from "socket.io-client";

import { useEffect, useMemo, useRef } from "react";

function App() {
  return (
    <>
      <Canvas camera={{ position: [3, 3, 3] }}>
        <OrbitControls />
        <Environment preset="city" />
        <WobbleSphere />
        <directionalLight position={[0.25, 2, -2.25]} intensity={1} />
      </Canvas>
    </>
  );
}

const WobbleSphere = () => {
  // This reference will give us direct access to the mesh
  const mesh = useRef(null);
  const materialRef = useRef(null);

  const handData = useRef({ distortion: 0 });

  useEffect(() => {
    const socket: Socket = io("http://localhost:3000");

    socket.on("td-data", (data: OSCRelayData) => {
      if (data.address === "/pinch") {
        console.log(handData?.current);
        handData.current.distortion = data.value;
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const {
    metalness,
    roughness,
    transmission,
    ior,
    thickness,
    transparent,
    wireframe,
    // uniforms
    uPositionFrequency,
    uTimeFrequency,
    uStrenght,
    uWarpPositionFrequency,
    uWarpTimeFrequency,
    uWarpStrenght,
    uColorA,
    uColorB,
  } = useControls({
    metalness: { value: 0, min: 0, max: 1, step: 0.001 },
    roughness: { value: 0.5, min: 0, max: 1, step: 0.001 },
    transmission: { value: 0, min: 0, max: 1, step: 0.001 },
    ior: { value: 1.5, min: 0, max: 10, step: 0.001 },
    thickness: { value: 1.5, min: 0, max: 10, step: 0.001 },
    transparent: false,
    wireframe: false,

    // uniforms
    uPositionFrequency: { value: 0.5, min: 0, max: 2, step: 0.001 },
    uTimeFrequency: { value: 0.4, min: 0, max: 2, step: 0.001 },
    uStrenght: { value: 0.3, min: 0, max: 2, step: 0.001 },
    uWarpPositionFrequency: { value: 0.38, min: 0, max: 2, step: 0.001 },
    uWarpTimeFrequency: { value: 0.12, min: 0, max: 2, step: 0.001 },
    uWarpStrenght: { value: 1.7, min: 0, max: 2, step: 0.001 },
    uColorA: { value: "#ff0000" },
    uColorB: { value: "#00ff00" },
  });

  const geometry = useMemo(() => {
    // 1. Create the base geometry
    const baseGeom = new THREE.IcosahedronGeometry(2.5, 50);

    // 2. Merge the vertices
    const mergedGeom = mergeVertices(baseGeom);

    // 3. Compute tangents if you use normal maps in your shader
    mergedGeom.computeTangents();

    return mergedGeom;
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={mesh} geometry={geometry}>
      <CustomShaderMaterial
        ref={materialRef}
        // CSM
        baseMaterial={THREE.MeshPhysicalMaterial}
        // custom shader material props
        vertexShader={wobbleVertexShader}
        fragmentShader={wobbleFragmentShader}
        // mesh MeshPhysicalMaterial props
        metalness={metalness}
        roughness={roughness}
        transmission={transmission}
        ior={ior}
        thickness={thickness}
        transparent={transparent}
        wireframe={wireframe}
        //uniforms
        uniforms={{
          uTime: { value: 0 },
          uPositionFrequency: { value: uPositionFrequency },
          uTimeFrequency: { value: uTimeFrequency },
          uStrenght: { value: uStrenght },
          uWarpPositionFrequency: { value: uWarpPositionFrequency },
          uWarpTimeFrequency: { value: uWarpTimeFrequency },
          uWarpStrenght: { value: uWarpStrenght },
          uColorA: { value: new THREE.Color(uColorA) },
          uColorB: { value: new THREE.Color(uColorB) },
        }}
      />
    </mesh>
  );
};

export default App;
