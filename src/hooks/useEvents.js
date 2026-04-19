import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/auth-context";
import {
  EVENT_SELECT_FIELDS,
  insertActivityRecord,
  normalizeEventRow,
} from "../lib/eventData";

export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("events")
        .select(EVENT_SELECT_FIELDS)
        .eq("organization_id", user.organizationId)
        .order("date", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setEvents((data || []).map(normalizeEventRow));
    } catch (nextError) {
      setEvents([]);
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = useCallback(
    async ({ name, type, date, venue, budget, notes }) => {
      if (!user) {
        throw new Error("You must be signed in to create an event.");
      }

      const numericBudget = Number(budget) || 0;
      const payload = {
        organization_id: user.organizationId,
        owner_id: user.id,
        manager_ids: user.role === "manager" ? [user.id] : [],
        name,
        type: type || "Event",
        date,
        venue,
        notes: notes || "",
        budget: numericBudget,
        status: "Planning",
        contacts: [],
      };

      const { data, error: insertError } = await supabase
        .from("events")
        .insert(payload)
        .select(EVENT_SELECT_FIELDS)
        .single();

      if (insertError) {
        throw insertError;
      }

      const normalized = normalizeEventRow(data);
      setEvents((current) => [normalized, ...current]);

      try {
        await insertActivityRecord({
          event_id: normalized.id,
          organization_id: normalized.organizationId,
          user_id: user.id,
          type: "EVENT_CREATED",
          message: "Event workspace created",
          metadata: { eventName: normalized.name },
        });
      } catch {
        // Avoid blocking the main event flow on audit logging failure.
      }

      return normalized;
    },
    [user]
  );

  const updateEvent = useCallback(async (id, updates) => {
    const { error: updateError } = await supabase.from("events").update(updates).eq("id", id);

    if (updateError) {
      throw updateError;
    }

    await fetchEvents();
  }, [fetchEvents]);

  const deleteEvent = useCallback(async (id) => {
    const { error: deleteError } = await supabase.from("events").delete().eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    setEvents((current) => current.filter((event) => event.id !== id));
  }, []);

  const addContact = useCallback(
    async (eventId, contact) => {
      const currentEvent = events.find((event) => event.id === eventId);

      if (!currentEvent || !user) {
        return false;
      }

      const nextContacts = [
        ...currentEvent.contacts,
        {
          id: crypto.randomUUID(),
          notes: "",
          ...contact,
        },
      ];

      const { error: updateError } = await supabase
        .from("events")
        .update({ contacts: nextContacts })
        .eq("id", eventId);

      if (updateError) {
        setError(updateError.message);
        return false;
      }

      setEvents((current) =>
        current.map((event) =>
          event.id === eventId
            ? {
                ...event,
                contacts: nextContacts,
              }
            : event
        )
      );

      try {
        await insertActivityRecord({
          event_id: eventId,
          organization_id: currentEvent.organizationId,
          user_id: user.id,
          type: "CONTACT_CREATED",
          message: "Contact added",
          metadata: {
            name: contact.name,
            company: contact.company || "",
          },
        });
      } catch {
        // Avoid blocking contact creation on audit logging failure.
      }

      setError("");
      return true;
    },
    [events, user]
  );

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    addContact,
    refresh: fetchEvents,
  };
}
