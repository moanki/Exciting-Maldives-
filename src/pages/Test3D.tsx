import Scene3D from '../components/3d/Scene';
import FloatingCard from '../components/3d/FloatingCard';

export default function Test3D() {
  return (
    <Scene3D>
      <FloatingCard position={[-2, 0, 0]}>
        <h2 className="text-2xl font-serif text-brand-navy mb-4">Welcome</h2>
        <p className="text-brand-navy/70">This is a floating 3D card.</p>
      </FloatingCard>
      <FloatingCard position={[2, 0, 0]}>
        <h2 className="text-2xl font-serif text-brand-navy mb-4">Explore</h2>
        <p className="text-brand-navy/70">Discover Maldives.</p>
      </FloatingCard>
    </Scene3D>
  );
}
