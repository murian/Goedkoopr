import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedReceipt } from './types';

// Initialize Gemini API
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.warn('GEMINI_API_KEY is not set. Receipt scanning will not work.');
}

const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

const RECEIPT_PARSING_PROMPT = `You are a receipt parsing assistant. Analyze the receipt image and extract the following information in JSON format:

{
  "store_name": "Name of the store",
  "store_location": "Store location/address if available",
  "receipt_date": "Date in YYYY-MM-DD format",
  "total_amount": 0.00,
  "currency": "USD",
  "tax_amount": 0.00,
  "items": [
    {
      "product_name": "Product name",
      "quantity": 1,
      "unit_price": 0.00,
      "total_price": 0.00,
      "suggested_category": "Category name from: Groceries, Household, Personal Care, Beverages, Snacks, Dairy, Meat & Fish, Fruits & Vegetables, Bakery, Other"
    }
  ]
}

Important:
- Extract ALL items from the receipt
- Calculate unit_price if only total_price is shown (total_price / quantity)
- Suggest the most appropriate category for each item
- Use the exact total and tax amounts shown on the receipt
- If currency is not specified, assume USD
- Return ONLY valid JSON, no additional text`;

export async function parseReceiptWithAI(
  imageBase64: string
): Promise<ParsedReceipt> {
  if (!genAI) {
    throw new Error(
      'Gemini API key is not configured. Please set GEMINI_API_KEY in .env.local'
    );
  }

  try {
    // Use Gemini Pro Vision model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Remove data URI prefix if present
    let base64Data = imageBase64;
    if (imageBase64.startsWith('data:')) {
      base64Data = imageBase64.split(',')[1];
    }

    // Determine mime type
    let mimeType = 'image/jpeg';
    if (imageBase64.startsWith('data:')) {
      const match = imageBase64.match(/^data:(image\/\w+);base64,/);
      if (match) {
        mimeType = match[1];
      }
    }

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([RECEIPT_PARSING_PROMPT, imagePart]);
    const response = await result.response;
    const responseText = response.text();

    return parseAIResponse(responseText);
  } catch (error: any) {
    console.error('Failed to parse receipt with Gemini:', error);
    throw new Error(
      error.message || 'Failed to parse receipt with Gemini API'
    );
  }
}

function parseAIResponse(responseText: string): ParsedReceipt {
  // Extract JSON from response (handle markdown code blocks)
  let jsonText = responseText.trim();

  // Remove markdown code blocks if present
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```\n?/g, '');
  }

  try {
    const parsed = JSON.parse(jsonText);

    // Validate required fields
    if (!parsed.store_name || !parsed.receipt_date || !parsed.total_amount) {
      throw new Error('Missing required fields in parsed receipt');
    }

    // Ensure items array exists
    if (!Array.isArray(parsed.items)) {
      parsed.items = [];
    }

    return parsed as ParsedReceipt;
  } catch (error) {
    console.error('Failed to parse AI response:', responseText);
    throw new Error('Failed to parse receipt data from AI response');
  }
}

export async function classifyProduct(productName: string): Promise<string> {
  if (!genAI) {
    return 'Other';
  }

  const prompt = `Classify this product into ONE of these categories: Groceries, Household, Personal Care, Beverages, Snacks, Dairy, Meat & Fish, Fruits & Vegetables, Bakery, Other.

Product: ${productName}

Return ONLY the category name, nothing else.`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Failed to classify product:', error);
    return 'Other';
  }
}
