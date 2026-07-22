import { state } from "./store";

export function generateSessionPack() {
  return JSON.stringify(
    {
      schemaVersion: "weblink-session-v2",
      exportedAt: new Date().toISOString(),
      peer: {
        displayName: state.identity.name,
        clientId: state.identity.clientId,
      },
      roomId: state.room.roomId,
      theme: state.ui.theme,
      messages: state.chat.messages.map((message) => ({
        id: message.id,
        text: message.text,
        role: message.from === "demo" ? "demo" : "local",
        createdAt: new Date(message.at).toISOString(),
      })),
      fileQueue: state.files.queue.map((file) => ({
        id: file.id,
        name: file.name,
        sizeBytes: file.size,
        status: file.status === "transferring" ? "paused" : file.status,
        bytesTransferred: file.bytesTransferred,
      })),
      transferLog: state.transferLog,
    },
    null,
    2,
  );
}

export function generateTranscriptMarkdown() {
  let markdown = "# Weblink Chat Transcript\n\n";
  markdown += `**Peer:** ${state.identity.name} (${state.identity.clientId})\n`;
  markdown += `**Room:** ${state.room.roomId || "None"}\n`;
  markdown += `**Exported At:** ${new Date().toISOString()}\n\n`;
  markdown += "---\n\n";

  for (const message of state.chat.messages) {
    const role = message.from === "demo" ? "demo" : "local";
    const time = new Date(message.at).toISOString();
    markdown += `**[${time}] ${role}:**\n${message.text}\n\n`;
  }

  return markdown;
}
