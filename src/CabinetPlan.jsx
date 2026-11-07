function CabinetButton({ item, onToggle, kind = 'door' }) {
  return (
    <button
      type="button"
      className={`cabinet ${kind}${item.done ? ' done' : ''}`}
      aria-pressed={item.done}
      onClick={() => onToggle(item.id)}
    >
      <span className="knob" aria-hidden="true" />
      <span className="cabinet-label">{item.label}</span>
    </button>
  );
}

function Elevation({ wall, onToggle }) {
  return (
    <div className="elevation" aria-label={wall.name}>
      {wall.columns.map((column) => (
        <div key={column.id} className="bay" style={{ flexGrow: column.span || 1 }}>
          {column.tall ? (
            <div className="tall">
              {column.tall.map((section) => (
                <CabinetButton key={section.id} item={section} onToggle={onToggle} kind="tall" />
              ))}
            </div>
          ) : (
            <>
              <div className="upper-slot">
                {column.upper ? <CabinetButton item={column.upper} onToggle={onToggle} /> : null}
              </div>
              {column.divider !== false ? (
                <div className={`counter${column.counter ? ' marked' : ''}`}>{column.counter || ''}</div>
              ) : null}
              <div className="lower-slot">
                {column.lower?.fixed ? (
                  <div className="fixture">{column.lower.label}</div>
                ) : column.lower?.drawers ? (
                  <div className="drawers">
                    {column.lower.drawers.map((drawer) => (
                      <CabinetButton key={drawer.id} item={drawer} onToggle={onToggle} kind="drawer" />
                    ))}
                  </div>
                ) : column.lower ? (
                  <CabinetButton item={column.lower} onToggle={onToggle} />
                ) : null}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export function CabinetPlan({ plan, done, total, onToggle }) {
  const side = plan.walls.find((wall) => wall.role === 'left') ?? plan.walls[0];
  const main = plan.walls.find((wall) => wall.role === 'right') ?? plan.walls[1];

  return (
    <section className="plan">
      <div className="section-heading">
        <div>
          <h2>Skåpstäd</h2>
          <p>Klicka i varje skåp och låda när det städats ur.</p>
        </div>
        <p className="fraction">
          {done} of {total}
        </p>
      </div>

      <div className="l-shape">
        <div className="run">
          <h3>{side.name}</h3>
          <Elevation wall={side} onToggle={onToggle} />
        </div>
        <div className="corner-joint" aria-hidden="true">
          <div className="upper-slot" />
          <div className="counter" />
          <div className="lower-slot" />
        </div>
        <div className="run main-run">
          <h3>{main.name}</h3>
          <Elevation wall={main} onToggle={onToggle} />
        </div>
      </div>
    </section>
  );
}
