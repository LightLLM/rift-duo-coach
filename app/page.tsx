import RiftRewind from '@/components/RiftRewind';
import { generateRecap } from './actions';

export default function Page() {
  return (
    <main>
      <RiftRewind action={generateRecap} />
    </main>
  );
}

