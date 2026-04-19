import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/auth-context";
import {
  buildVendorInsertPayload,
  buildVendorUpdatePayload,
  insertActivityRecord,
  normalizeVendorRow,
  VENDOR_SELECT_FIELDS,
} from "../lib/eventData";

export function useVendors(eventId, event = null) {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchVendors = useCallback(async () => {
    if (!user) {
      setVendors([]);
      setLoading(false);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let query = supabase
        .from("vendors")
        .select(VENDOR_SELECT_FIELDS)
        .eq("organization_id", user.organizationId)
        .order("created_at", { ascending: false });

      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setVendors((data || []).map(normalizeVendorRow));
    } catch (nextError) {
      setVendors([]);
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }, [eventId, user]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const createVendor = useCallback(
    async (payload) => {
      if (!eventId || !event || !user) {
        throw new Error("Vendor creation requires an event context.");
      }

      const { data, error: insertError } = await supabase
        .from("vendors")
        .insert(buildVendorInsertPayload(payload, event, user))
        .select(VENDOR_SELECT_FIELDS)
        .single();

      if (insertError) {
        throw insertError;
      }

      const normalized = normalizeVendorRow(data);
      setVendors((current) => [normalized, ...current]);

      try {
        await insertActivityRecord({
          event_id: eventId,
          organization_id: event.organizationId,
          user_id: user.id,
          type: "VENDOR_CREATED",
          message: "Vendor added",
          metadata: {
            vendorId: normalized.id,
            name: normalized.name,
            status: normalized.status,
          },
        });
      } catch {
        // Avoid blocking vendor creation on audit logging failure.
      }

      return normalized;
    },
    [event, eventId, user]
  );

  const updateVendor = useCallback(
    async (id, updates) => {
      const { data, error: updateError } = await supabase
        .from("vendors")
        .update(buildVendorUpdatePayload(updates))
        .eq("id", id)
        .select(VENDOR_SELECT_FIELDS)
        .single();

      if (updateError) {
        throw updateError;
      }

      const normalized = normalizeVendorRow(data);
      setVendors((current) => current.map((vendor) => (vendor.id === id ? normalized : vendor)));

      try {
        await insertActivityRecord({
          event_id: normalized.eventId,
          organization_id: normalized.organizationId,
          user_id: user?.id || null,
          type: "VENDOR_UPDATED",
          message: "Vendor updated",
          metadata: {
            vendorId: normalized.id,
            name: normalized.name,
          },
        });
      } catch {
        // Avoid blocking vendor updates on audit logging failure.
      }

      return normalized;
    },
    [user]
  );

  const updateVendorStatus = useCallback(
    async (id, status) => {
      const { data, error: updateError } = await supabase
        .from("vendors")
        .update({ status })
        .eq("id", id)
        .select(VENDOR_SELECT_FIELDS)
        .single();

      if (updateError) {
        throw updateError;
      }

      const normalized = normalizeVendorRow(data);
      setVendors((current) => current.map((vendor) => (vendor.id === id ? normalized : vendor)));

      try {
        await insertActivityRecord({
          event_id: normalized.eventId,
          organization_id: normalized.organizationId,
          user_id: user?.id || null,
          type: "VENDOR_STATUS_UPDATED",
          message: "Vendor status updated",
          metadata: {
            vendorId: normalized.id,
            name: normalized.name,
            status: normalized.status,
          },
        });
      } catch {
        // Avoid blocking vendor status changes on audit logging failure.
      }

      return normalized;
    },
    [user]
  );

  const deleteVendor = useCallback(
    async (id) => {
      const currentVendor = vendors.find((vendor) => vendor.id === id);
      const { error: deleteError } = await supabase.from("vendors").delete().eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      setVendors((current) => current.filter((vendor) => vendor.id !== id));

      if (currentVendor) {
        try {
          await insertActivityRecord({
            event_id: currentVendor.eventId,
            organization_id: currentVendor.organizationId,
            user_id: user?.id || null,
            type: "VENDOR_DELETED",
            message: "Vendor deleted",
            metadata: {
              vendorId: currentVendor.id,
              name: currentVendor.name,
            },
          });
        } catch {
          // Avoid blocking vendor deletes on audit logging failure.
        }
      }

      return true;
    },
    [user, vendors]
  );

  return {
    vendors,
    loading,
    error,
    createVendor,
    updateVendor,
    updateVendorStatus,
    deleteVendor,
    refresh: fetchVendors,
  };
}
