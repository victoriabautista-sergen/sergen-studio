
import { corsHeaders } from "../corsHeaders.ts";
import { createSupabaseClient } from "../supabaseClient.ts";
import { isValidDocumentType, getBucketName, createFilePath } from "../utils.ts";
import type { DocumentType } from "../utils.ts";

export async function handlePostRequest(req: Request): Promise<Response> {
  try {
    console.log('Upload request received');
    
    // Check Content-Type to ensure it's multipart/form-data
    const contentType = req.headers.get('Content-Type') || '';
    if (!contentType.includes('multipart/form-data')) {
      console.error('Invalid content type:', contentType);
      return new Response(
        JSON.stringify({ error: 'Content type must be multipart/form-data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Parse form data
    let formData;
    try {
      formData = await req.formData();
      console.log('Form data successfully parsed');
    } catch (error) {
      console.error('Error parsing form data:', error);
      return new Response(
        JSON.stringify({ error: 'Could not parse form data: ' + error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Extract file and metadata from form data
    const file = formData.get('file');
    const type = formData.get('type')?.toString() || 'invoice';
    const userId = formData.get('userId')?.toString();

    console.log('Upload request parameters:', { 
      type, 
      userId, 
      fileName: file instanceof File ? file.name : 'unknown',
      fileType: file instanceof File ? file.type : 'unknown',
      fileSize: file instanceof File ? file.size : 'unknown'
    });

    if (!file || !(file instanceof File)) {
      console.error('No file provided');
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (!userId) {
      console.error('Missing userId parameter');
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createSupabaseClient();

    // Validate document type
    if (!isValidDocumentType(type)) {
      console.error(`Invalid document type: ${type}`);
      return new Response(
        JSON.stringify({ error: `Invalid document type: ${type}. Valid types are: invoice, contract, report` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Determine bucket name
    const bucketName = getBucketName(type as DocumentType);
    console.log(`Using bucket name: ${bucketName}`);

    try {
      // Check if bucket exists, create if needed
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        console.log(`Bucket ${bucketName} does not exist, creating...`);
        try {
          await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 10485760, // 10MB
          });
          console.log(`Successfully created bucket ${bucketName}`);
        } catch (bucketError) {
          console.log(`Bucket creation error (may already exist): ${bucketError.message}`);
        }
      }

      // Create file path
      const fileExt = file.name.split('.').pop() || '';
      const fileName = createFilePath(userId, fileExt);
      console.log(`Uploading to bucket: ${bucketName}, path: ${fileName}`);

      // Upload file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      console.log('Generated public URL:', publicUrl);

      if (type === 'profile') {
        // Update user profile if profile image
        console.log('Updating user profile with new image URL');
        const { error: updateError } = await supabase
          .from('user_accounts')
          .update({ profile_image: publicUrl })
          .eq('id', userId);

        if (updateError) {
          console.error('Profile update error:', updateError);
          throw updateError;
        }
      } else {
        // Add document entry to documents table
        console.log('Adding document record');
        
        const { error: insertError } = await supabase
          .from('documents')
          .insert({
            user_id: userId,
            filename: file.name,
            file_path: fileName,
            document_type: type
          });

        if (insertError) {
          console.error('Document insert error:', insertError);
          throw insertError;
        }
      }

      return new Response(
        JSON.stringify({ 
          message: 'File uploaded successfully',
          url: publicUrl
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } catch (storageError) {
      console.error('Storage operation error:', storageError);
      return new Response(
        JSON.stringify({ error: `Storage operation failed: ${storageError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}
