import initializeWasender from "../services/wasenderService.js";

export const sendTextMessage = async (req, res) => {
  try {
    const wasender = initializeWasender();
    
    if (!wasender) {
      return res.status(503).json({
        success: false,
        error: "Wasender service is not initialized. Check your environment variables."
      });
    }

    const { to, text } = req.body;

    const payload = {
      messageType: "text",
      to,
      text
    };

    const result = await wasender.send(payload);

    res.status(200).json({
      success: true,
      message: result.response.message,
      remaining: result.rateLimit.remaining
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};