# Pollinations.ai API Integration Report

## Overview

Pollinations.ai provides a comprehensive API for generating text, images, and videos using AI models. The API offers an OpenAI-compatible interface with additional specialized features like video generation and a unique "Bring Your Own Pollen" (BYOP) user-pays model.

**API Base URL:** `https://gen.pollinations.ai`

**Documentation:** https://enter.pollinations.ai/api/docs

---

## Available Capabilities

### 1. Image Generation (`/image/{prompt}`)

Generate images and videos from text prompts.

**Endpoint:** `GET /image/{prompt}`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string (path) | required | Text description of image/video to generate |
| `model` | enum | `zimage` | Image: `flux`, `zimage`, `turbo`, `gptimage`, `kontext`, `seedream`, `seedream-pro`, `nanobanana`, `nanobanana-pro`. Video: `veo`, `seedance`, `seedance-pro` |
| `width` | integer | 1024 | Image width in pixels |
| `height` | integer | 1024 | Image height in pixels |
| `seed` | integer | 0 | Random seed. Use `-1` for random |
| `enhance` | boolean | false | Let AI improve your prompt |
| `negative_prompt` | string | `worst quality, blurry` | What to avoid in the image |
| `safe` | boolean | false | Enable safety content filters |
| `quality` | enum | `medium` | Image quality: `low`, `medium`, `high`, `hd` (gptimage only) |
| `transparent` | boolean | false | Transparent background (gptimage only) |
| `image` | string | - | Reference image URL(s) for image-to-video |
| `duration` | integer | - | Video duration in seconds (video models). veo: 4/6/8, seedance: 2-10 |
| `aspectRatio` | string | - | Video aspect ratio: `16:9` or `9:16` |
| `audio` | boolean | false | Enable audio for video (veo only) |

**Example:**
```bash
curl 'https://gen.pollinations.ai/image/a%20beautiful%20sunset%20over%20mountains?model=flux&width=1024&height=1024&seed=42' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

**Supported Models:**
- **Image Generation:** flux, zimage, turbo, gptimage, kontext, seedream, nanobanana, nanobanana-pro
- **Video Generation:** veo (text-to-video, 4-8 seconds), seedance (text-to-video + image-to-video, 2-10 seconds)

---

### 2. Text Generation

#### Simple Text Endpoint (`/text/{prompt}`)

**Endpoint:** `GET /text/{prompt}`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string (path) | required | Text prompt for generation |
| `model` | enum | `openai` | Text model to use |
| `seed` | integer | 0 | Random seed for reproducibility (-1 for random) |
| `system` | string | - | System prompt for context/behavior |
| `json` | boolean | false | Return response as JSON |
| `temperature` | number | - | Creativity level (0.0=strict, 2.0=creative) |
| `stream` | boolean | false | Stream response in real-time |

```bash
curl 'https://gen.pollinations.ai/text/Write%20a%20haiku%20about%20coding?model=openai&seed=0&json=false' \
  -H 'Authorization: Bearer YOUR_API_KEY'
```

#### Chat Completions (`/v1/chat/completions`)

OpenAI-compatible chat completions endpoint.

**Endpoint:** `POST /v1/chat/completions`

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "model": "openai",
  "stream": false,
  "temperature": 1,
  "max_tokens": null,
  "modalities": ["text"],
  "audio": { "voice": "alloy", "format": "wav" }
}
```

**Supported Models:** openai, openai-fast, openai-large, qwen-coder, mistral, gemini, gemini-large, gemini-search

---

### 3. Model Discovery

List available models to discover capabilities:

**Text Models:** `GET /v1/models`  
**Image Models:** `GET /image/models`  
**All Models:** `GET /text/models`

Response includes pricing, capabilities, input/output modalities, and metadata.

---

## Authentication

### Key Types

1. **Publishable Keys (`pk_...`)**
   - Client-side safe
   - IP rate-limited (1 pollen/hour per IP+key)

2. **Secret Keys (`sk_...`)**
   - Server-side only
   - No rate limits
   - Can spend Pollen currency

### Auth Methods

```bash
# Header method (recommended)
Authorization: Bearer YOUR_API_KEY

# Query parameter method
?key=YOUR_API_KEY
```

---

## Bring Your Own Pollen (BYOP) - User Pays Model

Pollinations offers a unique model where end users pay for their own AI usage, allowing developers to ship apps without API costs.

### How It Works

1. User clicks "Connect with Pollinations"
2. They sign in and receive a temporary API key
3. Usage costs are billed to the user's account, not the developer's

### Implementation Flow

```javascript
// 1. Redirect user to auth
const redirectUrl = encodeURIComponent(window.location.href);
window.location.href = `https://enter.pollinations.ai/authorize?redirect_url=${redirectUrl}`;

// 2. After redirect, extract API key from URL fragment
const apiKey = new URLSearchParams(location.hash.slice(1)).get('api_key');

// 3. Use the key for API calls
const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'openai',
    messages: [{ role: 'user', content: 'yo' }]
  })
});
```

**Key Details:**
- API key is in URL fragment (`#`) - never hits server logs
- Keys expire in 30 days
- Users can revoke keys from their dashboard

---

## Special Features

### Vision (Image Input)

Process images with Gemini models:

```json
{
  "model": "gemini",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "Describe this image" },
        { "type": "image_url", "image_url": { "url": "https://example.com/image.jpg" } }
      ]
    }
  ]
}
```

### Gemini Tools

| Model | Capabilities |
|-------|--------------|
| `gemini`, `gemini-large` | code_execution (can generate images/plots) |
| `gemini-search` | google_search enabled |

### Content Blocks

Responses may include `content_blocks` with different types:
- `text` - Text content
- `image_url` - Generated images
- `thinking` - Model reasoning

---

## Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid input data |
| 401 | Authentication required |
| 500 | Server error |

---

## Integration Recommendations for A-Coder

### 1. Image Generation Tool

Create a new tool for image generation with the following structure:

```typescript
interface PollinationsImageOptions {
  prompt: string;
  model?: 'flux' | 'turbo' | 'gptimage' | 'kontext' | 'seedream' | 'nanobanana' | 'nanobanana-pro';
  width?: number;
  height?: number;
  seed?: number;
  enhance?: boolean;
  negative_prompt?: string;
  safe?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'hd';
  transparent?: boolean;
}
```

### 2. Video Generation Tool

Extend the image tool or create separate video tool:

```typescript
interface PollinationsVideoOptions {
  prompt: string;
  model?: 'veo' | 'seedance' | 'seedance-pro';
  duration?: number; // veo: 4/6/8, seedance: 2-10
  aspectRatio?: '16:9' | '9:16';
  audio?: boolean;
  image?: string; // Reference image for image-to-video
}
```

### 3. Text Generation

Implement compatible text generation that leverages:
- Simple `/text/{prompt}` for basic generation
- `/v1/chat/completions` for conversational AI

### 4. Model Discovery

Implement runtime model discovery via `/image/models` and `/v1/models` to allow users to select available models.

### 5. Configuration

Add configuration for:
- Default model preferences
- Image dimensions presets
- Quality settings
- API key management (user-provided or BYOP)

---

## Pricing Notes

- All responses include pricing information in the model metadata
- Currency is `pollen` (Pollinations' internal currency)
- BYOP model means users pay directly, no cost to app developers

---

## References

- **API Documentation:** https://enter.pollinations.ai/api/docs
- **Dashboard (API Keys):** https://enter.pollinations.ai
- **OpenAPI Schema:** Available via the docs page
- **BYOP Implementation:** https://github.com/pollinations/pollinations/blob/main/BRING_YOUR_OWN_POLLEN.md