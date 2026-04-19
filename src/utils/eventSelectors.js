import dayjs from "dayjs";

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getItemsForEvent(groupedItems, eventId) {
  return groupedItems?.[eventId] || [];
}

export function buildEventSummary(event, groupedItems = {}) {
  const tasks = getItemsForEvent(groupedItems.tasksByEventId, event.id);
  const vendors = getItemsForEvent(groupedItems.vendorsByEventId, event.id);
  const spent = vendors.reduce((sum, vendor) => sum + (vendor.cost || 0), 0);
  const remaining = event.budget - spent;
  const completedTasks = tasks.filter((task) => task.done).length;
  const taskProgress = tasks.length === 0 ? 0 : completedTasks / tasks.length;
  const confirmedVendors = vendors.filter(
    (vendor) => vendor.status === "Confirmed" || vendor.status === "Paid"
  ).length;
  const vendorProgress = vendors.length === 0 ? 0 : confirmedVendors / vendors.length;
  const overallProgress = Math.round(((taskProgress + vendorProgress) / 2) * 100);

  const nextTask =
    [...tasks]
      .filter((task) => !task.done)
      .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())[0] || null;

  const overdueTasks = tasks.filter(
    (task) => !task.done && dayjs(task.dueDate).isBefore(dayjs(), "day")
  );
  const unconfirmedVendors = vendors.filter((vendor) => vendor.status === "Quoted");
  const budgetAlert = spent > event.budget * 0.8;

  return {
    spent,
    remaining,
    completedTasks,
    confirmedVendors,
    taskProgress,
    vendorProgress,
    overallProgress,
    nextTask,
    overdueTasks,
    unconfirmedVendors,
    budgetAlert,
    taskCount: tasks.length,
    vendorCount: vendors.length,
  };
}

export function buildCalendarItems(events, tasksByEventId = {}) {
  return events.flatMap((event) => [
    {
      id: `event-${event.id}`,
      title: event.name,
      date: event.date,
      type: "event",
      eventId: event.id,
    },
    ...getItemsForEvent(tasksByEventId, event.id).map((task) => ({
      id: `${event.id}-${task.id}`,
      title: task.title,
      date: task.dueDate,
      type: "task",
      eventId: event.id,
      stage: task.stage,
      done: task.done,
    })),
  ]);
}
