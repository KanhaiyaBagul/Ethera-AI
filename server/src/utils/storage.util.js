const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role key bypasses RLS for server-side uploads
);

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'flow-attachments';

/**
 * Upload a file buffer to Supabase Storage.
 * Returns the public URL.
 */
const uploadFile = async ({ buffer, mimetype, originalname, taskId }) => {
  // Sanitize filename and create unique path
  const ext = originalname.split('.').pop();
  const safeFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storagePath = `tasks/${taskId}/${safeFilename}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType: mimetype,
      upsert: false,
    });

  if (error) {
    console.error('[Supabase Storage Error]', error);
    throw new Error('File upload failed');
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return {
    url: urlData.publicUrl,
    storagePath,
    fileName: originalname,
  };
};

/**
 * Delete a file from Supabase Storage by its path.
 */
const deleteFile = async (storagePath) => {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
  if (error) {
    console.error('[Supabase Storage Delete Error]', error);
  }
};

module.exports = { uploadFile, deleteFile };
