import { useEffect, useRef, useState } from 'react';
import { CabinetPlan } from './CabinetPlan.jsx';
import { clearAll, roomStats, toggleCabinet, toggleTask } from './plan.js';

const saveLabel = {
  saved: 'Saved',
  saving: 'Saving…',
  error: 'Not saved',
};

export function App() {
  const [doc, setDoc] = useState(null);
  const [roomId, setRoomId] = useState('kitchen');
  const [loadError, setLoadError] = useState('');
  const [saveState, setSaveState] = useState('saved');
  const docRef = useRef(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/tasks')
      .then((response) => {
        if (!response.ok) throw new Error('Could not load tasks');
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        docRef.current = data;
        setDoc(data);
        if (data.rooms?.[0]?.id) setRoomId(data.rooms[0].id);
      })
      .catch(() => {
        if (!cancelled) setLoadError('The task list did not load. Start the app with npm run dev and refresh.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  function persist(next) {
    docRef.current = next;
    setDoc(next);
    setSaveState('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(docRef.current),
        });
        if (!response.ok) throw new Error('Save failed');
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 250);
  }

  function reset() {
    if (!docRef.current) return;
    const confirmed = window.confirm('Clear every tick so you can start a new yearly clean?');
    if (!confirmed) return;
    persist(clearAll(docRef.current));
  }

  if (loadError) {
    return (
      <main className="shell error-shell">
        <h1>Yearly big clean</h1>
        <p>{loadError}</p>
      </main>
    );
  }

  if (!doc) {
    return (
      <main className="shell error-shell">
        <h1>Yearly big clean</h1>
        <p>Loading the list…</p>
      </main>
    );
  }

  const stats = doc.rooms.map((room) => ({ room, ...roomStats(room) }));
  const overallDone = stats.reduce((sum, item) => sum + item.done, 0);
  const overallTotal = stats.reduce((sum, item) => sum + item.total, 0);
  const current = stats.find((item) => item.room.id === roomId) ?? stats[0];
  const room = current.room;

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">{doc.year} apartment clean</p>
          <h1>{doc.title}</h1>
        </div>
        <div className="top-actions">
          <p className={`save save-${saveState}`}>{saveLabel[saveState]}</p>
          <button type="button" className="text-button" onClick={reset}>
            Clear all ticks
          </button>
        </div>
      </header>

      <div className="progress-block">
        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${overallTotal ? (overallDone / overallTotal) * 100 : 0}%` }} />
        </div>
        <p>
          {overallDone} of {overallTotal} done
        </p>
      </div>

      <div className="layout">
        <nav className="rooms" aria-label="Rooms">
          {stats.map((item) => (
            <button
              key={item.room.id}
              type="button"
              className={item.room.id === room.id ? 'room active' : 'room'}
              aria-current={item.room.id === room.id ? 'page' : undefined}
              onClick={() => setRoomId(item.room.id)}
            >
              <span>{item.room.name}</span>
              <span className="count">
                {item.done}/{item.total}
              </span>
            </button>
          ))}
        </nav>

        <main className="room-panel">
          <div className="section-heading">
            <div>
              <h2>{room.name}</h2>
              <p>
                {current.done === current.total && current.total > 0
                  ? 'This room is finished.'
                  : 'Tick a line when that job is done.'}
              </p>
            </div>
            <p className="fraction">
              {current.tasksDone} of {current.tasksTotal}
            </p>
          </div>

          <ul className="tasks">
            {room.tasks.map((task) => (
              <li key={task.id}>
                <label className={task.done ? 'task done' : 'task'}>
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => persist(toggleTask(docRef.current, room.id, task.id))}
                  />
                  <span>{task.label}</span>
                </label>
              </li>
            ))}
          </ul>

          {room.cabinetPlan ? (
            <CabinetPlan
              plan={room.cabinetPlan}
              done={current.cabinetsDone}
              total={current.cabinetsTotal}
              onToggle={(cabinetId) => persist(toggleCabinet(docRef.current, room.id, cabinetId))}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}
