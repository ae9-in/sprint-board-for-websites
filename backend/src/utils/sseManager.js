const clients = new Map();

export function addClient(userId, res) {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId).add(res);
}

export function removeClient(userId, res) {
  const userClients = clients.get(userId);
  if (userClients) {
    userClients.delete(res);
    if (userClients.size === 0) {
      clients.delete(userId);
    }
  }
}

export function push(userId, data) {
  const userClients = clients.get(userId);
  if (!userClients) return;

  const payload = JSON.stringify(data);

  for (const res of userClients) {
    try {
      res.write(`event: NOTIFICATION\ndata: ${payload}\n\n`);
    } catch (err) {
      console.error('SSE push error:', err);
      removeClient(userId, res);
    }
  }
}

export function broadcast(eventName, data) {
  const payload = JSON.stringify(data);

  for (const [userId, userClients] of clients) {
    for (const res of userClients) {
      try {
        res.write(`event: ${eventName}\ndata: ${payload}\n\n`);
      } catch (err) {
        console.error('SSE broadcast error:', err);
        removeClient(userId, res);
      }
    }
  }
}

export function broadcastToOrganization(organizationId, eventName, data, excludeUserId = null) {
  // This would need organization info in the client map
  // For now, broadcast to all connected clients
  broadcast(eventName, data);
}

export default { addClient, removeClient, push, broadcast, broadcastToOrganization };