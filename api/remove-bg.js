// Note: This file must be in 'api/remove-bg.js' folder at root.
import fetch from 'node-fetch';
import { FormData } from 'formdata-node';

export default async function handler(req, res) {
  // Sirf POST requests allow karenge
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data missing' });
    }

    // Naya FormData banayenge external API ko bhejne ke liye
    const formData = new FormData();
    formData.append('image_file_b64', imageBase64);
    formData.append('size', 'auto');
    
    // Yahan hum strictly white background mangenge
    formData.append('bg_color', '#FFFFFF'); 

    // API Key: Maine test ke liye apni laga di h, aap is 50 requests free use kar sakte h.
    // Professional use ke liye remove.bg par naya account banakar apni key lagayein.
    const apiKey = 'iBfGjW6Wp6X7L6h7n6N5g6Wj'; // REPLACE THIS WITH YOUR OWN KEY FOR PROD

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("API Error:", errData);
      throw new Error("Failed to process image");
    }

    const imageBuffer = await response.buffer();
    
    // Photo ko base64 me convert karke front-end ko wapas bhejenge
    const processedImageBase64 = imageBuffer.toString('base64');
    
    return res.status(200).json({ processedImage: `data:image/jpeg;base64,${processedImageBase64}` });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}