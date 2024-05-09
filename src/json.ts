export async function checkClipboardForJson(text : string) {
    try {
      const data = JSON.parse(text);
      return data;
    } catch (error) {
      return null;
    }
  }
  

  