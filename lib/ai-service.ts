import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedReceipt } from './types';
import db from './database';

// Get API key from environment or database
function getGeminiApiKey(): string | null {
  // First check environment variable
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  // Then check database
  try {
    const setting = db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get('gemini_api_key') as { value: string } | undefined;

    return setting?.value || null;
  } catch (error) {
    console.error('Error fetching API key from database:', error);
    return null;
  }
}

const RECEIPT_PARSING_PROMPT = `You are a receipt parsing assistant. Analyze the receipt image and extract the following information in JSON format.

⚠️ **MOST CRITICAL REQUIREMENT - STORE LOCATION**:
The "store_location" field is MANDATORY and EXTREMELY important. You MUST extract the store's physical address from the receipt.

WHERE TO FIND THE ADDRESS:
1. Look at the TOP of the receipt (header area) - most receipts print the store address here
2. Look at the BOTTOM of the receipt (footer area) - some receipts print address at the end
3. Look for text that includes: street names, building numbers, postal codes, city names
4. Look for branch numbers, store IDs, or location identifiers

WHAT TO EXTRACT:
- Street name and number (e.g., "Kalverstraat 152")
- Postal/ZIP code (e.g., "1012 XE")
- City name (e.g., "Amsterdam")
- Store/branch number if visible (e.g., "Branch 2410")

EXAMPLES OF GOOD LOCATION EXTRACTION:
✓ "Kalverstraat 152, 1012 XE Amsterdam"
✓ "Damrak 89, 1012 LP Amsterdam"
✓ "Branch 2410, Leidsestraat 35, Amsterdam"
✓ "Store #145, Hoofdstraat 20, Utrecht"

EXAMPLES OF BAD LOCATION EXTRACTION (DO NOT DO THIS):
✗ "Amsterdam" (too vague - which location?)
✗ "Netherlands" (country is not enough)
✗ "" (empty - NEVER leave empty!)

IF COMPLETE ADDRESS IS NOT VISIBLE:
- Extract whatever location information you can find (street name, area, store number, etc.)
- Include store/branch numbers as they help identify different locations
- Use any visible location identifiers

JSON FORMAT:

{
  "store_name": "Name of the store",
  "store_location": "FULL address with street, number, postal code, city, and/or branch number - NEVER leave this empty!",
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
      "suggested_category": "Category name - choose the MOST SPECIFIC and ACCURATE category from the list below. READ THE FULL PRODUCT NAME CAREFULLY before categorizing:

      CATEGORY GUIDELINES (with common examples):

      🥬 Fruits & Vegetables: Fresh/frozen fruits, vegetables, salads, leafy greens, potatoes, onions, tomatoes, lettuce, herbs

      🥩 Meat & Fish: Chicken, beef, pork, lamb, fish, seafood, sausages, bacon, deli meats (ham, salami, turkey slices)

      🥛 Dairy & Eggs: Milk, cheese, yogurt, butter, cream, eggs, ice cream, sour cream, cottage cheese

      🍞 Bakery & Bread: Bread, rolls, bagels, croissants, muffins, tortillas, pita, naan, baguettes

      🥤 Beverages: Water, soda, juice, sports drinks, energy drinks (but NOT coffee, tea, or alcohol)

      ☕ Coffee & Tea: Coffee beans/grounds, instant coffee, tea bags, hot chocolate, chai, matcha

      🍺 Alcohol & Wine: Beer, wine, spirits, liquor, cocktails, sake, cider

      🍪 Snacks & Sweets: Chips, cookies, candy, chocolate, gum, crackers, popcorn, nuts, trail mix

      🧊 Frozen Foods: Ice cream, frozen pizza, frozen meals, frozen vegetables, frozen fruits, popsicles

      🥫 Pantry & Canned: Rice, pasta, canned goods, beans, flour, sugar, cereal, oats, grains, dry goods

      🧂 Condiments & Sauces: Ketchup, mayo, mustard, soy sauce, oil, vinegar, spices, salt, pepper, hot sauce, salad dressing

      🍗 Deli & Prepared Foods: Rotisserie chicken, pre-made salads, sandwiches, sushi, ready-to-eat meals

      🧹 Household & Cleaning: Soap, detergent, paper towels, toilet paper, trash bags, cleaning supplies, dish soap, sponges

      💊 Personal Care & Health: Shampoo, toothpaste, deodorant, medicine, vitamins, bandages, lotion, razors, cosmetics

      👶 Baby Products: Diapers, baby food, baby wipes, formula, baby lotion

      🐾 Pet Supplies: Dog/cat food, pet treats, litter, pet toys

      IMPORTANT CATEGORIZATION RULES:
      - READ the full product name - don't just look at the first word
      - Ice cream goes to 'Dairy & Eggs' (NOT Frozen Foods)
      - Frozen pizza/meals go to 'Frozen Foods' (NOT Pantry)
      - Deli meats (sliced ham, turkey, salami) go to 'Meat & Fish' (NOT Deli & Prepared Foods)
      - Cheese goes to 'Dairy & Eggs' (even if it's deli cheese)
      - Rotisserie/prepared chicken goes to 'Deli & Prepared Foods'
      - Nuts and trail mix go to 'Snacks & Sweets' (NOT Pantry)
      - Cooking oil goes to 'Condiments & Sauces' (NOT Pantry)
      - Paper products go to 'Household & Cleaning'
      - If unsure between categories, choose the most common usage"
    }
  ]
}

Important Rules:
- Extract ALL items from the receipt
- Calculate unit_price if only total_price is shown (total_price / quantity)
- For discounts: Look for crossed-out prices, "was" prices, sale indicators, or discount lines
- If an item has a discount: original_price is the pre-discount price, discount_amount is the savings
- If no discount: original_price = 0, discount_amount = 0
- total_price is the final price paid (after discount)
- discount_amount at receipt level is the total discounts/savings shown on the receipt
- **CRITICAL**: Follow the detailed category guidelines provided above exactly
- Every item MUST fit into one of the 16 categories
- Be precise - read the full product name before categorizing
- When in doubt, choose the category that best matches the item's primary use
- Use the exact total and tax amounts shown on the receipt
- If currency is not specified, assume EUR
- Return ONLY valid JSON, no additional text`;

export async function parseReceiptWithAI(
  imageBase64: string
): Promise<ParsedReceipt> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'Gemini API key is not configured. Please provide your Google Gemini API key.'
    );
  }

  try {
    // Initialize Gemini with the API key
    const genAI = new GoogleGenerativeAI(apiKey);

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
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return 'Other';
  }

  const prompt = `Classify this product into ONE of these categories: Groceries, Household, Personal Care, Beverages, Snacks, Dairy, Meat & Fish, Fruits & Vegetables, Bakery, Other.

Product: ${productName}

Return ONLY the category name, nothing else.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Failed to classify product:', error);
    return 'Other';
  }
}
