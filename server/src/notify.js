import { server } from "./server.js";
import { changeTypes, modelEvents } from "./constants.js";
import { WS_EVENTS } from "./websocket.js";

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

// add mongo schema middleware
// and broadcast notifications on change
export const registerNotificationEvents = (modelName, schema) => {
  schema
    .post(modelEvents.SAVE, (data) => {
      const wsEvent = eventTypeMap[modelName]?.[changeTypes.INSERT];
      if (wsEvent) {
        server.broadcast({
          type: wsEvent,
          payload: data
        });
      }
    })
    .post(modelEvents.UPDATE, (data) => {
      const wsEvent = eventTypeMap[modelName]?.[changeTypes.UPDATE];
      if (wsEvent) {
        server.broadcast({
          type: wsEvent,
          payload: data
        });
      }
    })
    .post(modelEvents.DELETE, (data) => {
      const wsEvent = eventTypeMap[modelName]?.[changeTypes.DELETE];
      if (wsEvent) {
        server.broadcast({
          type: wsEvent,
          payload: data
        });
      }
    });
};
