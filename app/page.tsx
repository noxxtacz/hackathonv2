import Link from 'next/link';

export default function Home() {
  return (
    <div className="landing">
      <h1>Nebula Village</h1>
      <p>
        A cozy place to reflect on your day, talk to friendly NPCs, 
        and find your calm through gentle mini-games.
      </p>
      <div className="button-group">
        <Link href="/village">
          <button className="btn btn-primary">🏘️ Enter Village</button>
        </Link>
        <Link href="/log">
          <button className="btn btn-secondary">📝 Write Log</button>
        </Link>
        <Link href="/dashboard">
          <button className="btn btn-secondary">📊 Dashboard</button>
        </Link>
      </div>
    </div>
  );
}
