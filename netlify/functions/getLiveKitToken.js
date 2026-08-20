const { AccessToken } = require('livekit-server-sdk');

exports.handler = async (event, context) => {
  try {
    // 1. Recibir los datos del usuario que intenta entrar
    const roomName = event.queryStringParameters.room;
    const participantName = event.queryStringParameters.username;

    if (!roomName || !participantName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Falta el nombre de la sala o el usuario' }),
      };
    }

    // 2. Leer tus llaves maestras ocultas
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Llaves de LiveKit no configuradas en el servidor' }),
      };
    }

    // 3. Crear el Pase VIP para este usuario específico
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      name: participantName,
    });

    // 4. Darle permisos para entrar a esa sala específica, hablar y mostrar video
    at.addGrant({ 
      roomJoin: true, 
      room: roomName, 
      canPublish: true, 
      canSubscribe: true 
    });

    // 5. Sellar el Pase VIP y entregarlo
    const token = await at.toJwt();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    };
  } catch (error) {
    console.error("Error generando el token:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno del servidor' }),
    };
  }
};