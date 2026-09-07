const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function createMeeting(data = {}) {
  const response = await fetch(`${API_URL}/api/meetings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to create meeting");
  }

  return response.json();
}

export async function getMeetings(type) {
  const url = type
    ? `${API_URL}/api/meetings?type=${encodeURIComponent(type)}`
    : `${API_URL}/api/meetings`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch meetings");
  }

  return response.json();
}

export async function getMeeting(meetingId) {
  const cleanId = String(meetingId).replace(/\s+/g, "").replace(/-/g, "");
  const response = await fetch(`${API_URL}/api/meetings/${cleanId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Meeting not found");
  }

  return response.json();
}

export async function joinMeeting(meetingId, displayName, isHost = false) {
  const cleanId = String(meetingId).replace(/\s+/g, "").replace(/-/g, "");
  const response = await fetch(`${API_URL}/api/meetings/${cleanId}/participants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      display_name: displayName,
      is_host: isHost,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Unable to join meeting");
  }

  return response.json();
}

export async function endMeeting(meetingId) {
  const cleanId = String(meetingId).replace(/\s+/g, "").replace(/-/g, "");
  const response = await fetch(`${API_URL}/api/meetings/${cleanId}/end`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to end meeting");
  }

  return response.json();
}

export async function deleteMeeting(meetingId) {
  const cleanId = String(meetingId).replace(/\s+/g, "").replace(/-/g, "");
  const response = await fetch(`${API_URL}/api/meetings/${cleanId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete meeting");
  }

  return response.json();
}

export function getWebSocketUrl(meetingId, clientId, displayName, isHost = false) {
  const baseWs = API_URL.replace(/^http/, "ws");
  const cleanId = String(meetingId).replace(/\s+/g, "").replace(/-/g, "");
  const params = new URLSearchParams({
    client_id: clientId,
    display_name: displayName,
    is_host: isHost ? "true" : "false",
  });
  return `${baseWs}/ws/meeting/${cleanId}?${params.toString()}`;
}