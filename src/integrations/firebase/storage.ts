import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./client";

export async function uploadFile(bucket: string, path: string, file: File) {
  const storageRef = ref(storage, `${bucket}/${path}`);
  await uploadBytes(storageRef, file);
  return { path };
}

export async function deleteFile(bucket: string, path: string) {
  const storageRef = ref(storage, `${bucket}/${path}`);
  await deleteObject(storageRef);
}

export async function getFileUrl(bucket: string, path: string) {
  const storageRef = ref(storage, `${bucket}/${path}`);
  return getDownloadURL(storageRef);
}
