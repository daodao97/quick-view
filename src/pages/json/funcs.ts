import { invoke } from "@tauri-apps/api/core";
export async function isJsonText(text : string) {
    try {
      text = await invoke("remove_comments", { input: text });
      const data = JSON.parse(text);
      return data;
    } catch (error) {
      return null;
    }
  }
  
