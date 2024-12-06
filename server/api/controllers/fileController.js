const { supabase } = require("../config/supabase");

console.log("Initializing file controller");

const getTaskFiles = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { data: files, error } = await supabase
      .from("files")
      .select(
        `
        *,
        uploaded_by_user:uploaded_by(username)
      `
      )
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.json({ data: files });
  } catch (err) {
    next(err);
  }
};

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

    const { taskId } = req.params;
    const uploadedFile = req.files.file;
    const userId = req.user.id;

    // Get task details to verify access
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("team_id")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      console.error("Task not found:", taskError);
      return res.status(404).json({ error: "Task not found" });
    }

    // Check team membership
    const { data: teamMember, error: memberError } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", task.team_id)
      .eq("user_id", userId)
      .single();

    if (memberError || !teamMember) {
      console.error("Team membership check failed:", memberError);
      return res.status(403).json({ error: "Access denied" });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${uploadedFile.name}`;
    const filePath = `${taskId}/${fileName}`;

    // Upload to Supabase storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from("task-files")
      .upload(filePath, uploadedFile.data, {
        contentType: uploadedFile.mimetype,
        cacheControl: "3600",
        upsert: false,
      });

    if (storageError) {
      console.error("Storage upload error:", storageError);
      return res.status(500).json({
        error: "Failed to upload file",
        details: storageError.message,
      });
    }

    // Get public URL
    const { data: urlData } = await supabase.storage
      .from("task-files")
      .getPublicUrl(filePath);

    // Create file record in database
    const { data: fileRecord, error: dbError } = await supabase
      .from("files")
      .insert([
        {
          task_id: taskId,
          file_name: fileName,
          file_url: urlData.publicUrl,
          uploaded_by: userId,
          mime_type: uploadedFile.mimetype,
          size: uploadedFile.size,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      return res.status(500).json({
        error: "Failed to save file record",
        details: dbError.message,
      });
    }

    res.json({
      data: fileRecord,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // Get file metadata
    const { data: file, error: fileError } = await supabase
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

    if (fileError || !file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Check team membership
    const { data: teamMember, error: memberError } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", file.task.team_id)
      .eq("user_id", userId)
      .single();

    if (memberError || !teamMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get download URL
    const { data: urlData, error: urlError } = await supabase.storage
      .from("task-files")
      .createSignedUrl(`${file.task_id}/${file.file_name}`, 60);

    if (urlError) {
      throw urlError;
    }

    res.json({
      data: {
        ...file,
        downloadUrl: urlData.signedUrl,
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

const controller = {
  getTaskFiles,
  uploadFile,
  downloadFile,
  deleteFile,
};

console.log("Exporting file controller:", Object.keys(controller));

module.exports = controller;
