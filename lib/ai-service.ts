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
  "currency": "EUR",
  "tax_amount": 0.00,
  "discount_amount": 0.00,
  "items": [
    {
      "product_name": "Product name",
      "quantity": 1,
      "unit_price": 0.00,
      "total_price": 0.00,
      "original_price": 0.00,
      "discount_amount": 0.00,
      "suggested_category": "Category name - choose the MOST SPECIFIC category from: Fruits & Vegetables, Meat & Fish, Dairy & Eggs, Bakery & Bread, Beverages, Coffee & Tea, Alcohol & Wine, Snacks & Sweets, Frozen Foods, Pantry & Canned, Condiments & Sauces, Deli & Prepared Foods, Household & Cleaning, Personal Care & Health, Baby Products, Pet Supplies"
    }
  ]
}

Important:
- Extract ALL items from the receipt
- Calculate unit_price if only total_price is shown (total_price / quantity)
- For discounts: Look for crossed-out prices, "was" prices, sale indicators, or discount lines
- If an item has a discount: original_price is the pre-discount price, discount_amount is the savings
- If no discount: original_price = 0, discount_amount = 0
- total_price is the final price paid (after discount)
- discount_amount at receipt level is the total discounts/savings shown on the receipt
- **IMPORTANT**: Choose the MOST SPECIFIC category for each item. AVOID generic categorization. Examples:
  - Fresh/frozen fruits, vegetables, salad → "Fruits & Vegetables"
  - Chicken, beef, pork, fish, seafood → "Meat & Fish"
  - Milk, cheese, yogurt, butter, eggs, cream → "Dairy & Eggs"
  - Bread, croissants, muffins, bagels, tortillas → "Bakery & Bread"
  - Water, soda, juice (non-coffee/tea) → "Beverages"
  - Coffee, tea, hot chocolate → "Coffee & Tea"
  - Beer, wine, spirits, liquor → "Alcohol & Wine"
  - Chips, cookies, candy, chocolate, gum → "Snacks & Sweets"
  - Ice cream, frozen pizza, frozen meals, frozen vegetables → "Frozen Foods"
  - Rice, pasta, canned goods, beans, flour, sugar, cereal → "Pantry & Canned"
  - Ketchup, mayo, mustard, soy sauce, oil, vinegar, spices → "Condiments & Sauces"
  - Rotisserie chicken, pre-made salads, deli meats, sandwiches → "Deli & Prepared Foods"
  - Soap, detergent, paper towels, trash bags, cleaning supplies → "Household & Cleaning"
  - Shampoo, toothpaste, deodorant, medicine, vitamins, bandages → "Personal Care & Health"
  - Diapers, baby food, baby wipes, formula → "Baby Products"
  - Dog/cat food, pet treats, litter → "Pet Supplies"
- Every item MUST fit into one of these categories - be creative with categorization
- Use the exact total and tax amounts shown on the receipt
- If currency is not specified, assume EUR
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
    // Use Gemini 2.5 Flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Failed to classify product:', error);
    return 'Other';
  }
}
