import fs from "fs/promises";

export async function readFile(path: string): Promise<string> {
  try {
    return await fs.readFile(path, "utf8");
  } catch (error) {
    console.error(`Error reading file at ${path}:`, error);
    throw error;
  }
}

export async function writeFile(path: string, data: any): Promise<void> {
  try {
    await fs.writeFile(path, JSON.stringify(data, null, 2), "utf8");
    console.log(`File written successfully at ${path}`);
  } catch (error) {
    console.error(`Error writing file at ${path}:`, error);
    throw error;
  }
}
