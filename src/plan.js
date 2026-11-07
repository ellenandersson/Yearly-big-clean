export function cabinetItems(plan) {
  if (!plan) return [];
  const items = [];
  for (const wall of plan.walls) {
    for (const column of wall.columns) {
      if (column.tall) items.push(...column.tall);
      if (column.upper) items.push(column.upper);
      if (column.lower?.drawers) items.push(...column.lower.drawers);
      else if (column.lower && !column.lower.fixed) items.push(column.lower);
    }
  }
  return items;
}

export function roomStats(room) {
  const cabinets = cabinetItems(room.cabinetPlan);
  const tasksDone = room.tasks.filter((task) => task.done).length;
  const cabinetsDone = cabinets.filter((item) => item.done).length;
  return {
    tasksDone,
    tasksTotal: room.tasks.length,
    cabinetsDone,
    cabinetsTotal: cabinets.length,
    done: tasksDone + cabinetsDone,
    total: room.tasks.length + cabinets.length,
  };
}

function toggleItem(item, id) {
  if (!item || item.id !== id) return item;
  return { ...item, done: !item.done };
}

function mapPlan(plan, cabinetId) {
  return {
    ...plan,
    walls: plan.walls.map((wall) => ({
      ...wall,
      columns: wall.columns.map((column) => ({
        ...column,
        tall: column.tall?.map((section) => toggleItem(section, cabinetId)),
        upper: toggleItem(column.upper, cabinetId),
        lower: column.lower?.drawers
          ? {
              ...column.lower,
              drawers: column.lower.drawers.map((drawer) => toggleItem(drawer, cabinetId)),
            }
          : toggleItem(column.lower, cabinetId),
      })),
    })),
  };
}

function clearPlan(plan) {
  if (!plan) return plan;
  const clear = (item) => (item ? { ...item, done: false } : item);
  return {
    ...plan,
    walls: plan.walls.map((wall) => ({
      ...wall,
      columns: wall.columns.map((column) => ({
        ...column,
        tall: column.tall?.map(clear),
        upper: clear(column.upper),
        lower: column.lower?.drawers
          ? { ...column.lower, drawers: column.lower.drawers.map(clear) }
          : column.lower?.fixed
            ? column.lower
            : clear(column.lower),
      })),
    })),
  };
}

export function toggleTask(doc, roomId, taskId) {
  return {
    ...doc,
    rooms: doc.rooms.map((room) =>
      room.id !== roomId
        ? room
        : {
            ...room,
            tasks: room.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
          },
    ),
  };
}

export function toggleCabinet(doc, roomId, cabinetId) {
  return {
    ...doc,
    rooms: doc.rooms.map((room) =>
      room.id !== roomId || !room.cabinetPlan
        ? room
        : { ...room, cabinetPlan: mapPlan(room.cabinetPlan, cabinetId) },
    ),
  };
}

export function clearAll(doc) {
  return {
    ...doc,
    rooms: doc.rooms.map((room) => ({
      ...room,
      tasks: room.tasks.map((task) => ({ ...task, done: false })),
      cabinetPlan: clearPlan(room.cabinetPlan),
    })),
  };
}
