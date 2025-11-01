import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { ParsedReceipt } from './types';

const AI_PROVIDER = process.env.AI_PROVIDER || 'claude';

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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
  if (AI_PROVIDER === 'claude' && anthropic) {
    return parseWithClaude(imageBase64);
  } else if (AI_PROVIDER === 'openai' && openai) {
    return parseWithOpenAI(imageBase64);
  } else {
    throw new Error(
      `AI provider ${AI_PROVIDER} is not configured. Please set API keys in .env.local`
    );
  }
}

async function parseWithClaude(imageBase64: string): Promise<ParsedReceipt> {
  if (!anthropic) {
    throw new Error('Anthropic API key not configured');
  }

  // Determine media type from base64 prefix
  let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
  if (imageBase64.startsWith('data:')) {
    const match = imageBase64.match(/^data:(image\/\w+);base64,/);
    if (match) {
      mediaType = match[1] as any;
      imageBase64 = imageBase64.split(',')[1];
    }
  }

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: RECEIPT_PARSING_PROMPT,
          },
        ],
      },
    ],
  });

  const responseText = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  return parseAIResponse(responseText);
}

async function parseWithOpenAI(imageBase64: string): Promise<ParsedReceipt> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  // Ensure proper data URI format
  let imageDataUri = imageBase64;
  if (!imageBase64.startsWith('data:')) {
    imageDataUri = `data:image/jpeg;base64,${imageBase64}`;
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageDataUri,
            },
          },
          {
            type: 'text',
            text: RECEIPT_PARSING_PROMPT,
          },
        ],
      },
    ],
  });

  const responseText = response.choices[0]?.message?.content || '';
  return parseAIResponse(responseText);
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

export async function classifyProduct(
  productName: string
): Promise<string> {
  const prompt = `Classify this product into ONE of these categories: Groceries, Household, Personal Care, Beverages, Snacks, Dairy, Meat & Fish, Fruits & Vegetables, Bakery, Other.

Product: ${productName}

Return ONLY the category name, nothing else.`;

  try {
    if (AI_PROVIDER === 'claude' && anthropic) {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
        messages: [{ role: 'user', content: prompt }],
      });

      return message.content[0].type === 'text'
        ? message.content[0].text.trim()
        : 'Other';
    } else if (AI_PROVIDER === 'openai' && openai) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 50,
        messages: [{ role: 'user', content: prompt }],
      });

      return response.choices[0]?.message?.content?.trim() || 'Other';
    }
  } catch (error) {
    console.error('Failed to classify product:', error);
  }

  return 'Other';
}
