# AI Skill Extractor

A single-page web application that analyzes job descriptions and extracts structured skill matrices with AI-powered or deterministic parsing.

## 📋 Summary

AI Skill Extractor transforms raw job descriptions into structured JSON data containing:
- Job title and seniority level
- Categorized technical skills (frontend, backend, DevOps, Web3, other)
- Must-have and nice-to-have requirements
- Salary information (if available)
- A concise summary (≤300 characters)

The app works **with or without** an OpenAI API key:
- **With API key**: Uses GPT-4o-mini for intelligent extraction
- **Without API key**: Falls back to deterministic regex-based parsing

## 🚀 Features

- 🤖 AI-powered extraction (optional, requires OpenAI API key)
- 🔍 Fallback deterministic parser (works offline)
- ✅ Zod schema validation for type-safe outputs
- 🎨 Modern, responsive UI with Tailwind CSS
- 📋 Copy-to-clipboard functionality for JSON results
- 🔄 Automatic retry logic with validation feedback
- ⚡ Built with Next.js 16 and React 19

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **AI**: OpenAI GPT-4o-mini (optional)
- **Runtime**: Node.js

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-skill-extractor
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file (optional, for AI features):
```env
OPENAI_API_KEY=your_openai_api_key_here
```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

### Example Output

```json
{
  "title": "Senior Frontend Developer",
  "seniority": "senior",
  "skills": {
    "frontend": ["react", "next", "typescript"],
    "backend": [],
    "devops": ["docker"],
    "web3": [],
    "other": ["tailwind"]
  },
  "mustHave": ["5+ years React experience"],
  "niceToHave": ["Web3 knowledge"],
  "salary": {
    "currency": "USD",
    "min": 120000,
    "max": 180000
  },
  "summary": "Senior role: Senior Frontend Developer. Key skills include frontend (react, next, typescript), devops (docker). Advertised salary in USD: 120000-180000."
}
```

## 📁 Project Structure

```
ai-skill-extractor/
├── app/
│   ├── api/
│   │   └── extract/
│   │       └── route.ts       # API endpoint for extraction
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Main UI component
│   └── globals.css            # Global styles
├── components/
│   ├── ErrorToast.tsx         # Error display component
│   └── ResultPanel.tsx        # Results display component
├── lib/
│   ├── ai.ts                  # OpenAI integration
│   ├── extractor.ts           # Fallback deterministic parser
│   └── schema.ts              # Zod schema definitions
└── package.json
```

## 🔧 How It Works

1. **User submits job description** via the UI
2. **API route** (`/api/extract`) processes the request:
   - If `OPENAI_API_KEY` exists: Attempts AI extraction
   - If AI fails or key missing: Falls back to deterministic parser
3. **Validation**: All outputs are validated against Zod schema
4. **Response**: Returns structured JSON + summary or error message

### AI Extraction
- Uses GPT-4o-mini with structured JSON output
- Includes explicit schema instructions in the prompt
- Retries once with validation error feedback if first attempt fails

### Fallback Parser
- Regex-based pattern matching
- Keyword dictionaries for skill categorization
- Salary parsing with currency detection
- Bullet point extraction for requirements
