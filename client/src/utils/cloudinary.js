export async function uploadImageToCloudinary(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; // unsigned preset
  const folder = import.meta.env.VITE_CLOUDINARY_FOLDER; // optional, e.g., "products"

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Missing Cloudinary config. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in client/.env"
    );
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);
  if (folder) {
    form.append("folder", folder);
  }

  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.secure_url;
}

export async function uploadMultipleToCloudinary(files) {
  const uploads = Array.from(files).map((f) => uploadImageToCloudinary(f));
  return Promise.all(uploads);
}
