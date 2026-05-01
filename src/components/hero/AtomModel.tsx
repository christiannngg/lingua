"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function AtomMesh() {
    const { scene } = useGLTF("/models/atom.glb");
    const ref = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        if (ref.current) {
            ref.current.rotation.y += delta * 1;
            ref.current.rotation.x += delta * 1;
        }
    });

    return <primitive ref={ref} object={scene} scale={0.6} />;
}

export default function AtomModel() {
    return (
        <Canvas
            camera={{ position: [0, 0, 5], fov: 45 }}
            gl={{ alpha: true, antialias: true }}
            style={{ background: "transparent", width: "100%", height: "100%" }}
        >
            <AtomMesh />
            <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
    );
}

useGLTF.preload("/models/atom.glb");