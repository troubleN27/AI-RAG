import { getGoogleAuth } from "@/lib/chat/googleAuth";

// ==========================================================
// Типы googleapis
// ==========================================================

interface DriveModule {
  google: {
    drive: (options: { version: string; auth: unknown }) => {
      files: {
        list(options: {
          q: string;
          fields: string;
          orderBy?: string;
          pageSize?: number;
        }): Promise<{
          data: {
            files?: Array<{
              id?: string | null;
              name?: string | null;
              modifiedTime?: string | null;
            }>;
          };
        }>;
        export(
          params: { fileId: string; mimeType: string },
          options: { responseType: "text" },
        ): Promise<{ data: string }>;
      };
    };
  };
}

async function loadDrive() {
  const mod = (await import("googleapis")) as unknown as
    | DriveModule
    | { default: DriveModule };
  const google = "default" in mod ? mod.default : mod;
  const auth = await getGoogleAuth();
  return google.google.drive({ version: "v3", auth });
}

// ==========================================================
// Публичный API
// ==========================================================

export interface DriveDocMeta {
  id: string;
  name: string;
  modifiedTime?: string;
}

/**
 * Возвращает список Google Docs (native) внутри указанной папки.
 */
export async function listDocsInFolder(
  folderId: string,
): Promise<DriveDocMeta[]> {
  const drive = await loadDrive();

  const response = await drive.files.list({
    q: [
      `'${folderId}' in parents`,
      `mimeType='application/vnd.google-apps.document'`,
      `trashed=false`,
    ].join(" and "),
    fields: "files(id, name, modifiedTime)",
    orderBy: "name",
    pageSize: 100,
  });

  const files = response.data.files ?? [];

  return files
    .filter(
      (f): f is { id: string; name: string; modifiedTime?: string | null } =>
        typeof f.id === "string" && typeof f.name === "string",
    )
    .map((f) => ({
      id: f.id,
      name: f.name,
      modifiedTime: f.modifiedTime ?? undefined,
    }));
}

/**
 * Экспортирует Google Doc как plain text.
 */
export async function exportDocAsText(fileId: string): Promise<string> {
  const drive = await loadDrive();

  const response = await drive.files.export(
    {
      fileId,
      mimeType: "text/plain",
    },
    { responseType: "text" },
  );

  return response.data ?? "";
}

/**
 * Загружает все документы папки как один склеенный текст.
 */
export async function loadAllDocsFromFolder(
  folderId: string,
): Promise<string> {
  const docs = await listDocsInFolder(folderId);
  if (docs.length === 0) return "";

  const parts: string[] = [];

  for (const doc of docs) {
    try {
      const text = (await exportDocAsText(doc.id)).trim();
      if (text.length === 0) continue;
      parts.push(`### Документ: ${doc.name}\n\n${text}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        `[gdrive] Не удалось прочитать документ "${doc.name}":`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  return parts.join("\n\n---\n\n");
}