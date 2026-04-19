import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/auth-context";
import { ACTIVITY_SELECT_FIELDS, normalizeActivityRow } from "../lib/eventData";

export function useActivities(eventId) {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchActivities = useCallback(async () => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let query = supabase
        .from("activities")
        .select(ACTIVITY_SELECT_FIELDS)
        .eq("organization_id", user.organizationId)
        .order("created_at", { ascending: false });

      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setActivities((data || []).map(normalizeActivityRow));
    } catch (nextError) {
      setActivities([]);
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }, [eventId, user]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { activities, loading, error, refresh: fetchActivities };
}
