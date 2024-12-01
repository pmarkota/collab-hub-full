const { supabase, supabaseAdminClient } = require("../config/supabase");

const uploadFile = async (req, res) => {
  try {
    console.log("Upload request received");
    console.log("Request files:", req.files);
    console.log("Request body:", req.body);
    console.log("Request headers:", req.headers);

    if (!req.files) {
      console.log("No files object in request");
      return res.status(400).json({ error: "No files object" });
    }

    if (!req.files.file) {
      console.log("No file field in request.files");
      return res.status(400).json({ error: "No file field found" });
    }

    // Check if bucket exists using admin client
    const { data: buckets, error: bucketsError } =
      await supabaseAdminClient.storage.listBuckets();

    console.log("Buckets response:", { data: buckets, error: bucketsError });

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return res.status(500).json({
        error: "Failed to access storage system",
        details: bucketsError.message,
      });
    }

    console.log(
      "Available buckets:",
      buckets.map((b) => b.name)
    );

    let taskFilesBucket = buckets?.find((b) => b.name === "task-files");

    if (!taskFilesBucket) {
      console.log("Creating task-files bucket...");
      const { data: newBucket, error: createError } =
        await supabaseAdminClient.storage.createBucket("task-files", {
          public: true,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ["application/pdf", "image/*", "text/*"],
        });

      if (createError) {
        console.error("Error creating bucket:", createError);
        return res.status(500).json({
          error: "Failed to create storage bucket",
          details: createError.message,
        });
      }

      console.log("Bucket created successfully:", newBucket);
      taskFilesBucket = newBucket;
    }

    // Try to list files in the bucket to verify access
    const { data: files, error: filesError } = await supabase.storage
      .from("task-files")
      .list();

    console.log("Files list response:", { data: files, error: filesError });

    if (filesError) {
      console.error("Error accessing bucket:", filesError);
      return res.status(500).json({
        error: "Failed to access storage bucket",
        details: filesError.message,
      });
    }

    const { taskId } = req.params;
    const uploadedFile = req.files.file;
    const userId = req.user.id;

    console.log("File details:", {
      name: uploadedFile.name,
      size: uploadedFile.size,
      mimetype: uploadedFile.mimetype,
      taskId,
      userId,
    });

    // Check if user has access to the task
    console.log("Checking task existence...");
    const { data: task } = await supabase
      .from("tasks")
      .select("team_id")
      .eq("id", taskId)
      .single();

    if (!task) {
      console.log("Task not found:", taskId);
      return res.status(404).json({ error: "Task not found" });
    }

    // Check team membership
    console.log("Checking team membership...");
    const { data: teamMember } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", task.team_id)
      .eq("user_id", userId)
      .single();

    if (!teamMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Create a unique filename to prevent collisions
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${uploadedFile.name}`;
    const filePath = `${taskId}/${uniqueFilename}`;

    // Upload to Supabase Storage using admin client
    console.log("Uploading to Supabase storage...");
    const { data, error } = await supabaseAdminClient.storage
      .from("task-files")
      .upload(filePath, uploadedFile.data, {
        contentType: uploadedFile.mimetype,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      throw error;
    }

    // Get public URL using admin client
    const { data: publicUrl } = supabaseAdminClient.storage
      .from("task-files")
      .getPublicUrl(filePath);

    console.log("File uploaded successfully, public URL:", publicUrl);

    // Store metadata in files table
    const { data: fileRecord, error: dbError } = await supabaseAdminClient
      .from("files")
      .insert({
        file_name: uploadedFile.name,
        file_url: publicUrl.publicUrl,
        task_id: taskId,
        uploaded_by: userId,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    console.log("File record created:", fileRecord);

    res.status(201).json({
      message: "File uploaded successfully",
      data: fileRecord,
    });
  } catch (error) {
    console.error("File upload error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: error.message || "Failed to upload file",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // Get file metadata
    const { data: file } = await supabase
      .from("files")
      .select(
        `
        *,
        task:tasks!inner(
          team_id
        )
      `
      )
      .eq("id", fileId)
      .single();

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Check team membership
    const { data: teamMember } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", file.task.team_id)
      .eq("user_id", userId)
      .single();

    if (!teamMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      data: {
        ...file,
        download_url: file.file_url,
      },
    });
  } catch (error) {
    console.error("File download error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // Get file metadata
    const { data: file } = await supabase
      .from("files")
      .select(
        `
        *,
        task:tasks!inner(
          team_id
        )
      `
      )
      .eq("id", fileId)
      .single();

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Check if user is file owner or team admin
    const { data: teamMember } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", file.task.team_id)
      .eq("user_id", userId)
      .single();

    if (
      !teamMember ||
      (teamMember.role !== "admin" && file.uploaded_by !== userId)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Delete from storage
    const filePath = `${file.task_id}/${file.file_name}`;
    const { error: storageError } = await supabase.storage
      .from("task-files")
      .remove([filePath]);

    if (storageError) throw storageError;

    // Delete metadata
    const { error: dbError } = await supabase
      .from("files")
      .delete()
      .eq("id", fileId);

    if (dbError) throw dbError;

    res.json({
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("File deletion error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const getTaskFiles = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Get task to check team membership
    const { data: task } = await supabase
      .from("tasks")
      .select("team_id")
      .eq("id", taskId)
      .single();

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check team membership
    const { data: teamMember } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", task.team_id)
      .eq("user_id", userId)
      .single();

    if (!teamMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get files with uploader information
    const { data: files, error } = await supabase
      .from("files")
      .select(
        `
        *,
        uploader:users!files_uploaded_by_fkey (
          id,
          username,
          avatar_url
        )
      `
      )
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      data: files,
    });
  } catch (error) {
    console.error("Get task files error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = {
  uploadFile,
  downloadFile,
  deleteFile,
  getTaskFiles,
};
