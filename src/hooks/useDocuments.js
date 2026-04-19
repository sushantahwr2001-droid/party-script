import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/auth-context";
import {
  buildDocumentInsertPayload,
  buildStoragePath,
  createDocumentSignedUrl,
  DOCUMENT_SELECT_FIELDS,
  DOCUMENTS_BUCKET,
  insertActivityRecord,
  normalizeDocumentRow,
} from "../lib/eventData";

export function useDocuments(eventId, event = null) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDocuments = useCallback(async () => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let query = supabase
        .from("documents")
        .select(DOCUMENT_SELECT_FIELDS)
        .eq("organization_id", user.organizationId)
        .order("created_at", { ascending: false });

      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      const normalized = await Promise.all(
        (data || []).map(async (document) => {
          const signedUrl = document.storage_path
            ? await createDocumentSignedUrl(document.storage_path)
            : "";

          return normalizeDocumentRow(document, signedUrl);
        })
      );

      setDocuments(normalized);
    } catch (nextError) {
      setDocuments([]);
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }, [eventId, user]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const upload = useCallback(
    async (document) => {
      if (!eventId || !event || !user || !document.file) {
        throw new Error("Document upload requires an event context and a file.");
      }

      const documentId = crypto.randomUUID();
      const storagePath = buildStoragePath(documentId, event.organizationId, event.id, document.name);
      const { error: uploadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(storagePath, document.file, {
          upsert: false,
          contentType: document.mimeType || document.file.type || undefined,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data, error: insertError } = await supabase
        .from("documents")
        .insert({
          id: documentId,
          ...buildDocumentInsertPayload(document, event, user, storagePath),
        })
        .select(DOCUMENT_SELECT_FIELDS)
        .single();

      if (insertError) {
        await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
        throw insertError;
      }

      const signedUrl = await createDocumentSignedUrl(storagePath);
      const normalized = normalizeDocumentRow(data, signedUrl);
      setDocuments((current) => [normalized, ...current]);

      try {
        await insertActivityRecord({
          event_id: eventId,
          organization_id: event.organizationId,
          user_id: user.id,
          type: "DOCUMENT_UPLOADED",
          message: "Document uploaded",
          metadata: {
            documentId: normalized.id,
            name: normalized.name,
            category: normalized.category,
          },
        });
      } catch {
        // Avoid blocking uploads on audit logging failure.
      }

      return normalized;
    },
    [event, eventId, user]
  );

  const rename = useCallback(
    async (documentId, name) => {
      const { data, error: updateError } = await supabase
        .from("documents")
        .update({ name })
        .eq("id", documentId)
        .select(DOCUMENT_SELECT_FIELDS)
        .single();

      if (updateError) {
        throw updateError;
      }

      const signedUrl = data.storage_path ? await createDocumentSignedUrl(data.storage_path) : "";
      const normalized = normalizeDocumentRow(data, signedUrl);
      setDocuments((current) =>
        current.map((document) => (document.id === documentId ? normalized : document))
      );

      try {
        await insertActivityRecord({
          event_id: normalized.eventId,
          organization_id: normalized.organizationId,
          user_id: user?.id || null,
          type: "DOCUMENT_RENAMED",
          message: "Document renamed",
          metadata: {
            documentId: normalized.id,
            name: normalized.name,
          },
        });
      } catch {
        // Avoid blocking rename on audit logging failure.
      }

      return normalized;
    },
    [user]
  );

  const replace = useCallback(
    async (documentId, nextDocument) => {
      const currentDocument = documents.find((document) => document.id === documentId);

      if (!currentDocument || !nextDocument.file) {
        throw new Error("Document replacement requires a current document and a file.");
      }

      const nextStoragePath = buildStoragePath(
        documentId,
        currentDocument.organizationId,
        currentDocument.eventId,
        nextDocument.name
      );
      const { error: uploadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(nextStoragePath, nextDocument.file, {
          upsert: true,
          contentType: nextDocument.mimeType || nextDocument.file.type || undefined,
        });

      if (uploadError) {
        throw uploadError;
      }

      if (currentDocument.storagePath && currentDocument.storagePath !== nextStoragePath) {
        await supabase.storage.from(DOCUMENTS_BUCKET).remove([currentDocument.storagePath]);
      }

      const { data, error: updateError } = await supabase
        .from("documents")
        .update({
          name: nextDocument.name,
          size_bytes: nextDocument.sizeBytes,
          mime_type: nextDocument.mimeType || currentDocument.mimeType,
          storage_path: nextStoragePath,
        })
        .eq("id", documentId)
        .select(DOCUMENT_SELECT_FIELDS)
        .single();

      if (updateError) {
        throw updateError;
      }

      const signedUrl = await createDocumentSignedUrl(nextStoragePath);
      const normalized = normalizeDocumentRow(data, signedUrl);
      setDocuments((current) =>
        current.map((document) => (document.id === documentId ? normalized : document))
      );

      try {
        await insertActivityRecord({
          event_id: normalized.eventId,
          organization_id: normalized.organizationId,
          user_id: user?.id || null,
          type: "DOCUMENT_REPLACED",
          message: "Document replaced",
          metadata: {
            documentId: normalized.id,
            name: normalized.name,
          },
        });
      } catch {
        // Avoid blocking replacement on audit logging failure.
      }

      return normalized;
    },
    [documents, user]
  );

  const remove = useCallback(
    async (documentId) => {
      const currentDocument = documents.find((document) => document.id === documentId);
      const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (deleteError) {
        throw deleteError;
      }

      if (currentDocument?.storagePath) {
        await supabase.storage.from(DOCUMENTS_BUCKET).remove([currentDocument.storagePath]);
      }

      setDocuments((current) => current.filter((document) => document.id !== documentId));

      if (currentDocument) {
        try {
          await insertActivityRecord({
            event_id: currentDocument.eventId,
            organization_id: currentDocument.organizationId,
            user_id: user?.id || null,
            type: "DOCUMENT_DELETED",
            message: "Document deleted",
            metadata: {
              documentId: currentDocument.id,
              name: currentDocument.name,
            },
          });
        } catch {
          // Avoid blocking deletion on audit logging failure.
        }
      }

      return true;
    },
    [documents, user]
  );

  return {
    documents,
    loading,
    error,
    upload,
    rename,
    replace,
    remove,
    refresh: fetchDocuments,
  };
}
