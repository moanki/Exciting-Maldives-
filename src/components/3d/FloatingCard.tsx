import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import { motion } from 'motion/react';

export default function FloatingCard({ children, position = [0, 0, 0] }: { children: React.ReactNode, position?: [number, number, number] }) {
  const mesh = useRef<any>(null);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
      mesh.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={mesh} position={position}>
        <boxGeometry args={[2, 3, 0.1]} />
        <meshStandardMaterial color="white" metalness={0.8} roughness={0.2} />
        <Html transform occlude distanceFactor={2} position={[0, 0, 0.06]}>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-white/70 backdrop-blur-md border border-white/50 p-6 rounded-2xl shadow-xl w-64 h-96 flex flex-col items-center justify-center"
          >
            {children}
          </motion.div>
        </Html>
      </mesh>
    </Float>
  );
}
