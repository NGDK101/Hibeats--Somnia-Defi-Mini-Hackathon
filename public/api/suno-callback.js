// Production Callback Endpoint untuk Suno API
// Endpoint ini akan dipanggil oleh Suno ketika generasi musik selesai

async function handleSunoCallback(request) {
  try {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const callbackData = await request.json();
    
    // Validasi data callback dari Suno
    if (!callbackData || callbackData.code !== 200) {
      console.error('Invalid Suno callback data:', callbackData);
      return new Response('Invalid callback data', { status: 400 });
    }

    // Log untuk monitoring
    console.log('Suno callback received:', {
      taskId: callbackData.data?.task_id,
      trackCount: callbackData.data?.data?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Dalam production, ini bisa:
    // 1. Menyimpan ke database
    // 2. Mengirim WebSocket message ke client
    // 3. Trigger notification ke user
    // 4. Update cache/session storage

    // Response success ke Suno
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Callback processed successfully',
      taskId: callbackData.data?.task_id
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Suno callback processing error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Export untuk berbagai platform
export default handleSunoCallback;
export { handleSunoCallback as POST };
