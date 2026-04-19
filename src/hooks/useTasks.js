import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/auth-context";
import {
  buildTaskInsertPayload,
  buildTaskUpdatePayload,
  insertActivityRecord,
  normalizeTaskRow,
  TASK_SELECT_FIELDS,
} from "../lib/eventData";

export function useTasks(eventId, event = null) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let query = supabase
        .from("tasks")
        .select(TASK_SELECT_FIELDS)
        .eq("organization_id", user.organizationId)
        .order("due_date", { ascending: true });

      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setTasks((data || []).map(normalizeTaskRow));
    } catch (nextError) {
      setTasks([]);
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }, [eventId, user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(
    async (payload) => {
      if (!eventId || !event || !user) {
        throw new Error("Task creation requires an event context.");
      }

      const { data, error: insertError } = await supabase
        .from("tasks")
        .insert(buildTaskInsertPayload(payload, event, user))
        .select(TASK_SELECT_FIELDS)
        .single();

      if (insertError) {
        throw insertError;
      }

      const normalized = normalizeTaskRow(data);
      setTasks((current) => [...current, normalized]);

      try {
        await insertActivityRecord({
          event_id: eventId,
          organization_id: event.organizationId,
          user_id: user.id,
          type: "TASK_CREATED",
          message: "Task created",
          metadata: {
            taskId: normalized.id,
            title: normalized.title,
            stage: normalized.stage,
          },
        });
      } catch {
        // Avoid blocking task creation on audit logging failure.
      }

      return normalized;
    },
    [event, eventId, user]
  );

  const updateTask = useCallback(
    async (id, updates) => {
      const currentTask = tasks.find((task) => task.id === id);

      if (!currentTask) {
        throw new Error("Task not found.");
      }

      const { data, error: updateError } = await supabase
        .from("tasks")
        .update(buildTaskUpdatePayload(currentTask, updates))
        .eq("id", id)
        .select(TASK_SELECT_FIELDS)
        .single();

      if (updateError) {
        throw updateError;
      }

      const normalized = normalizeTaskRow(data);
      setTasks((current) => current.map((task) => (task.id === id ? normalized : task)));

      try {
        await insertActivityRecord({
          event_id: normalized.eventId,
          organization_id: normalized.organizationId,
          user_id: user?.id || null,
          type: "TASK_UPDATED",
          message: "Task updated",
          metadata: {
            taskId: normalized.id,
            title: normalized.title,
          },
        });
      } catch {
        // Avoid blocking task updates on audit logging failure.
      }

      return normalized;
    },
    [tasks, user]
  );

  const toggleTask = useCallback(
    async (id) => {
      const currentTask = tasks.find((task) => task.id === id);

      if (!currentTask) {
        throw new Error("Task not found.");
      }

      const { data, error: updateError } = await supabase
        .from("tasks")
        .update({ status: currentTask.done ? "open" : "done" })
        .eq("id", id)
        .select(TASK_SELECT_FIELDS)
        .single();

      if (updateError) {
        throw updateError;
      }

      const normalized = normalizeTaskRow(data);
      setTasks((current) => current.map((task) => (task.id === id ? normalized : task)));

      try {
        await insertActivityRecord({
          event_id: normalized.eventId,
          organization_id: normalized.organizationId,
          user_id: user?.id || null,
          type: normalized.done ? "TASK_COMPLETED" : "TASK_REOPENED",
          message: normalized.done ? "Task completed" : "Task reopened",
          metadata: {
            taskId: normalized.id,
            title: normalized.title,
          },
        });
      } catch {
        // Avoid blocking task toggles on audit logging failure.
      }

      return normalized;
    },
    [tasks, user]
  );

  const deleteTask = useCallback(
    async (id) => {
      const currentTask = tasks.find((task) => task.id === id);

      const { error: deleteError } = await supabase.from("tasks").delete().eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      setTasks((current) => current.filter((task) => task.id !== id));

      if (currentTask) {
        try {
          await insertActivityRecord({
            event_id: currentTask.eventId,
            organization_id: currentTask.organizationId,
            user_id: user?.id || null,
            type: "TASK_DELETED",
            message: "Task deleted",
            metadata: {
              taskId: currentTask.id,
              title: currentTask.title,
            },
          });
        } catch {
          // Avoid blocking task deletes on audit logging failure.
        }
      }

      return true;
    },
    [tasks, user]
  );

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
    refresh: fetchTasks,
  };
}
