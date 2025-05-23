import { server } from "./server.js";
import { changeTypes, modelEvents } from "./constants.js";
import { WS_EVENTS } from "./websocket.js";
import { broadcastMessage } from "./websocket.js";

// Map model events to WebSocket events
const eventTypeMap = {
  Project: {
    [changeTypes.INSERT]: WS_EVENTS.PROJECT_CREATED,
    [changeTypes.UPDATE]: WS_EVENTS.PROJECT_UPDATED,
    [changeTypes.DELETE]: WS_EVENTS.PROJECT_DELETED
  },
  Task: {
    [changeTypes.INSERT]: WS_EVENTS.TASK_CREATED,
    [changeTypes.UPDATE]: WS_EVENTS.TASK_UPDATED,
    [changeTypes.DELETE]: WS_EVENTS.TASK_DELETED
  }
};

export const registerNotificationEvents = (modelName, schema) => {
  schema
      .post(modelEvents.SAVE, (data) => {
        const wsEvent = eventTypeMap[modelName]?.[changeTypes.INSERT];
        if (wsEvent) {
          broadcastMessage(wsEvent, data);
        }
      })
      .post(modelEvents.UPDATE, (data) => {
        const wsEvent = eventTypeMap[modelName]?.[changeTypes.UPDATE];
        if (wsEvent) {
          broadcastMessage(wsEvent, data);
        }
      })
      .post(modelEvents.DELETE, (data) => {
        const wsEvent = eventTypeMap[modelName]?.[changeTypes.DELETE];
        if (wsEvent && data && data._id) {
          broadcastMessage(wsEvent, {
            _id: data._id.toString(),
            name: data.name
          });
        } else {
          console.warn(`[WS] Cannot broadcast DELETE for ${modelName}, missing _id`);
        }
      });
};