import {
  CoreMessage,
  CoreToolMessage,
  generateId,
  Message,
  ToolInvocation,
} from "ai";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { Chat } from "@/db/schema";
// import { headers } from "next/headers";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}


export function fetcherInternal(url: string, request: Request, option?: any) {

  const internalUrl = new URL(url, request.url).toString();
  console.log('fetcherInternal url:', internalUrl);

  return fetch(internalUrl, {
    method: "GET",
    headers: {
      "content-type": "application/json",
      // forward client cookies / auth headers when needed
      "cookie": request.headers.get("cookie") ?? "",
      "authorization": request.headers.get("authorization") ?? "",
    },
    ...option,
  });
}

export const fetcher = async (url: string, ...options: any) => {
  console.log('fetcher url:', url, ...options); // todo fix this
  const res = await fetch(url, ...options);

  if (!res.ok) {
    const error = new Error(
      "An error occurred while fetching the data.",
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== "undefined") {
    return JSON.parse(localStorage.getItem(key) || "[]");
  }
  return [];
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function addToolMessageToChat({
  toolMessage,
  messages,
}: {
  toolMessage: CoreToolMessage;
  messages: Array<Message>;
}): Array<Message> {
  return messages.map((message) => {
    if (message.toolInvocations) {
      return {
        ...message,
        toolInvocations: message.toolInvocations.map((toolInvocation) => {
          const toolResult = toolMessage.content.find(
            (tool) => tool.toolCallId === toolInvocation.toolCallId,
          );

          if (toolResult) {
            return {
              ...toolInvocation,
              state: "result",
              result: toolResult.result,
            };
          }

          return toolInvocation;
        }),
      };
    }

    return message;
  });
}

export function convertToUIMessages(
  messages: Array<CoreMessage>,
): Array<Message> {
  return messages.reduce((chatMessages: Array<Message>, message) => {
    if (message.role === "tool") {
      return addToolMessageToChat({
        toolMessage: message as CoreToolMessage,
        messages: chatMessages,
      });
    }

    let textContent = "";
    let toolInvocations: Array<ToolInvocation> = [];

    if (typeof message.content === "string") {
      textContent = message.content;
    } else if (Array.isArray(message.content)) {
      for (const content of message.content) {
        if (content.type === "text") {
          textContent += content.text;
        } else if (content.type === "tool-call") {
          toolInvocations.push({
            state: "call",
            toolCallId: content.toolCallId,
            toolName: content.toolName,
            args: content.args,
          });
        }
      }
    }

    chatMessages.push({
      id: generateId(),
      role: message.role,
      content: textContent,
      toolInvocations,
    });

    return chatMessages;
  }, []);
}

export function getTitleFromChat(chat: Chat) {
  const messages = convertToUIMessages(chat.messages as Array<CoreMessage>);
  const firstMessage = messages[0];

  if (!firstMessage) {
    return "Untitled";
  }

  return firstMessage.content;
}


export function osmToGeoJSON(osm: any) {
  const features = [];
  if(osm) {

  for (const el of osm.elements) {
    if (el.type !== "way") continue;

    features.push({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: el.geometry.map((g: any) => [g.lon, g.lat])
      },
    });
  }}

  return {
    type: "FeatureCollection",
    features,
    properties: osm.osm3s
  };
}


// TO change map designs: https://leaflet-extras.github.io/leaflet-providers/preview/
export const edi_coords = [55.9500, -3.3725]; // Edinburgh Airport coordinates
const pvg_coords: [number, number] = [31.1443, 121.8083]; // Shanghai Pudong International Airport coordinates
const geneva_coords: [number, number] = [46.2381, 6.1083]; // Geneva Airport coordinates
export const center_coords: [number, number] = [(edi_coords[0] + geneva_coords[0]) / 2, (edi_coords[1] + geneva_coords[1]) / 2];
