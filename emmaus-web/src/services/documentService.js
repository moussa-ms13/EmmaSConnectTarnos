import supabase from './supabaseClient';

/**
 * documentService — File uploads to the 'documents' bucket and CRUD operations for the documents table.
 */

/**
 * Helper to extract the relative file path inside the 'documents' bucket from a public URL.
 * e.g., "https://xxx.supabase.co/storage/v1/object/public/documents/compagnons/foo.pdf" -> "compagnons/foo.pdf"
 * @param {string} fileUrl
 * @returns {string | null}
 */
function extractFilePathFromUrl(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string' || fileUrl === '#') return null;
  const marker = '/documents/';
  const idx = fileUrl.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(fileUrl.substring(idx + marker.length));
  }
  return null;
}

/**
 * Upload a document file to the 'documents' Supabase storage bucket.
 * @param {File} file
 * @returns {Promise<{ url: string | null, error: object | null }>}
 */
export async function uploadDocument(file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `compagnons/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('⚠️ Storage upload error:', uploadError.message);
      return { url: null, error: uploadError };
    }

    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return { url: data?.publicUrl || null, error: null };
  } catch (err) {
    console.error('❌ Unexpected error in uploadDocument:', err);
    return { url: null, error: err };
  }
}

/**
 * Fetch all documents joined with companion details.
 * @returns {Promise<{ data: array, error: object }>}
 */
export async function getAllDocuments() {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*, compagnons(id, first_name, last_name, avatar_url, profession)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('⚠️ Error in getAllDocuments:', error.message);
    }
    return { data, error };
  } catch (err) {
    console.error('❌ Unexpected error in getAllDocuments:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch documents for a specific companion.
 * @param {string} compagnonId
 * @returns {Promise<{ data: array, error: object }>}
 */
export async function getCompanionDocuments(compagnonId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('compagnon_id', compagnonId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('⚠️ Error in getCompanionDocuments:', error.message);
    }
    return { data, error };
  } catch (err) {
    console.error('❌ Unexpected error in getCompanionDocuments:', err);
    return { data: null, error: err };
  }
}

/**
 * Create a new document record.
 * @param {object} docData - { compagnon_id, file_name, file_url, file_type, file_size, expiration_date, status }
 * @returns {Promise<{ data: object, error: object }>}
 */
export async function createDocument(docData) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert([docData])
      .select('*, compagnons(id, first_name, last_name, avatar_url, profession)')
      .maybeSingle();

    if (error) {
      console.error('⚠️ Error in createDocument:', error.message);
    }
    return { data, error };
  } catch (err) {
    console.error('❌ Unexpected error in createDocument:', err);
    return { data: null, error: err };
  }
}

/**
 * Update a document record (e.g. status or expiration date).
 * @param {string} id
 * @param {object} updateData
 * @returns {Promise<{ data: object, error: object }>}
 */
export async function updateDocument(id, updateData) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .select('*, compagnons(id, first_name, last_name, avatar_url, profession)')
      .maybeSingle();

    if (error) {
      console.error('⚠️ Error in updateDocument:', error.message);
    }
    return { data, error };
  } catch (err) {
    console.error('❌ Unexpected error in updateDocument:', err);
    return { data: null, error: err };
  }
}

/**
 * Delete a document record by ID and remove its file from the storage bucket.
 * @param {string} id - Document record ID
 * @param {string} [file_url] - Optional file URL to delete from storage
 * @returns {Promise<{ error: object | null }>}
 */
export async function deleteDocument(id, file_url) {
  try {
    let targetUrl = file_url;

    // If file_url wasn't provided, try to query the document row first to get file_url
    if (!targetUrl && id) {
      const { data: docData } = await supabase
        .from('documents')
        .select('file_url')
        .eq('id', id)
        .maybeSingle();

      if (docData?.file_url) {
        targetUrl = docData.file_url;
      }
    }

    // 1. Delete file from storage if a valid path can be extracted
    const filePath = extractFilePathFromUrl(targetUrl);
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) {
        console.error('⚠️ Error deleting file from storage bucket:', storageError.message);
      }
    }

    // 2. Delete the row from the database table
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('⚠️ Error deleting document row from database:', dbError.message);
      return { error: dbError };
    }

    return { error: null };
  } catch (err) {
    console.error('❌ Unexpected error in deleteDocument:', err);
    return { error: err };
  }
}
