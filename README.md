# DietOS - Personal Meal Planning System

A modern, customizable meal planning application built with Next.js, React, and TypeScript. Plan your weekly meals, track nutritional targets, manage your dish library, and export your meal plan to your calendar.

## Features

- 📅 **Weekly Meal Planning** - Plan breakfast, lunch, snacks, and dinner for the entire week
- 📊 **Nutritional Tracking** - Track calories, protein, carbs, and fat for each dish
- 🍽️ **Dish Library** - Build and manage your personal collection of dishes with ingredients and cooking steps
- 🛒 **Grocery Lists** - Automatically generate shopping lists from your meal plan
- ⚙️ **Customizable Settings** - Set meal times and nutritional targets
- 📱 **Calendar Export** - Export your meal plan to Google Calendar or Apple Calendar (.ics format)
- 💾 **Data Management** - Import/export your meal plan data as JSON
- 🌓 **Dark/Light Mode** - Beautiful UI with theme support

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm**, **yarn**, or **pnpm** package manager

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd DietOS
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Using yarn:
```bash
yarn install
```

Using pnpm:
```bash
pnpm install
```

### 3. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

### 4. Build for Production

```bash
npm run build
npm start
```

## Customization Guide

### Customizing Your Meal Plan

#### 1. Edit Default Meal Times

Navigate to the **Settings** tab and modify the default meal times:
- Breakfast (default: 08:00)
- Lunch (default: 13:00)
- Snack (default: 16:00)
- Dinner (default: 20:00)

#### 2. Update Nutritional Targets

Edit `lib/data.json` to change your daily targets:
```json
"targets": {
  "calories": 1850,
  "protein": 180
}
```

#### 3. Add Your Own Dishes

You can add dishes in two ways:

**Option A: Using the UI**
1. Go to the **Dishes** tab
2. Click "Add Dish"
3. Fill in the dish details:
   - Name
   - Meal type (breakfast/lunch/snack/dinner)
   - Prep time (minutes)
   - Nutritional values (calories, protein, carbs, fat)
   - Tags (e.g., "high-protein", "low-carb", "no-cook")
   - Ingredients list
   - Cooking steps

**Option B: Edit `lib/data.json` directly**
1. Open `lib/data.json`
2. Add a new dish object to the `dishes` array:
```json
{
  "id": "D25",
  "name": "Your Dish Name",
  "meal": "breakfast",
  "prepTime": 15,
  "calories": 400,
  "protein": 30,
  "carbs": 25,
  "fat": 15,
  "tags": ["high-protein"],
  "ingredients": ["Ingredient 1", "Ingredient 2"],
  "steps": ["Step 1", "Step 2"]
}
```
3. Add any new ingredients to the `ingredientsIndex` array

#### 4. Customize Your Weekly Plan

**Using the UI:**
1. Go to the **Week** tab
2. Click on any meal slot
3. Select a dish from your library

**Editing `lib/data.json` directly:**
Modify the `weeklyPlan` object:
```json
"weeklyPlan": {
  "Monday": {
    "breakfast": "D1",
    "lunch": "D5",
    "snack": "D10",
    "dinner": "D14"
  },
  // ... other days
}
```

#### 5. Import/Export Your Data

**Export:**
1. Go to **Settings** tab
2. Click "Export JSON"
3. Save your meal plan data

**Import:**
1. Go to **Settings** tab
2. Click "Import JSON"
3. Choose to either:
   - **Overwrite**: Replace all current data
   - **Merge**: Combine with existing dishes

#### 6. Export to Calendar

1. Go to **Settings** tab
2. Click "Export Calendar (.ics)"
3. Select which days to export
4. Import the downloaded file into Google Calendar, Apple Calendar, or any calendar app

### Advanced Customization

#### Modify the Data Structure

The app uses a JSON-based state stored in `lib/data.json`. The structure follows this schema:

```typescript
{
  meta: {
    version: string
    lastUpdated: string
  }
  settings: {
    defaultMealTimes: {
      breakfast: string
      lunch: string
      snack: string
      dinner: string
    }
    targets: {
      calories: number
      protein: number
    }
  }
  weeklyPlan: {
    [day: string]: {
      breakfast: string  // dish ID
      lunch: string
      snack: string
      dinner: string
    }
  }
  dishes: Array<{
    id: string
    name: string
    meal: "breakfast" | "lunch" | "snack" | "dinner"
    prepTime: number
    calories: number
    protein: number
    carbs: number
    fat: number
    tags: string[]
    ingredients: string[]
    steps: string[]
    disabled?: boolean
  }>
  ingredientsIndex: string[]
}
```

#### Customize Styling

The app uses Tailwind CSS. Modify styles in:
- `app/globals.css` - Global styles
- Component files in `components/` - Component-specific styles

#### Change App Name/Branding

1. Update `app/layout.tsx` for the app title
2. Replace logo files in `public/` directory
3. Update `public/manifest.json` for PWA metadata

## ChatGPT Prompts for Building Your Diet Chart

Use these prompts with ChatGPT to generate a personalized meal plan that you can then import into DietOS.

### Prompt 1: Generate Complete Weekly Meal Plan

```
I need a weekly meal plan for [your goal: e.g., muscle gain, weight loss, maintenance] with the following requirements:

- Daily calorie target: [X] calories
- Daily protein target: [X] grams
- Meal times: Breakfast at [time], Lunch at [time], Snack at [time], Dinner at [time]
- Dietary restrictions: [list any allergies, preferences, or restrictions]
- Cooking skill level: [beginner/intermediate/advanced]
- Meal prep preference: [batch cooking preferred / prefer quick meals / mix of both]
- Cuisine preferences: [e.g., Indian, Mediterranean, Asian, etc.]

Please provide:
1. 7 breakfast options
2. 7 lunch options
3. 7 snack options
4. 7 dinner options
5. For each dish, include:
   - Name
   - Prep time (minutes)
   - Calories
   - Protein (grams)
   - Carbs (grams)
   - Fat (grams)
   - Ingredients list
   - Simple cooking steps (3-5 steps)
   - Tags (e.g., "high-protein", "low-carb", "no-cook", "batch-cook")

Format the output as a JSON array that I can import into my meal planning app.
```

### Prompt 2: Generate Dishes for Specific Meal Type

```
Generate [X] [breakfast/lunch/snack/dinner] options for my meal plan with these requirements:

- Target calories per meal: [X] calories
- Target protein per meal: [X] grams
- Dietary restrictions: [list]
- Prep time: Maximum [X] minutes
- Cuisine style: [preference]

For each dish, provide:
- Name
- Prep time
- Nutritional breakdown (calories, protein, carbs, fat)
- Ingredients list
- Cooking steps
- Tags

Format as JSON array.
```

### Prompt 3: Create Meal Plan Based on Existing Dishes

```
I have the following dishes in my meal plan:
[List your current dishes with their nutritional info]

Create a balanced weekly meal plan using these dishes that:
- Meets my daily calorie target of [X] calories
- Meets my daily protein target of [X] grams
- Provides variety (doesn't repeat the same dish too often)
- Balances macros across the week

Provide the weekly plan in this format:
Monday: Breakfast=[dish name], Lunch=[dish name], Snack=[dish name], Dinner=[dish name]
[Repeat for all 7 days]
```

### Prompt 4: Optimize Meal Plan for Specific Goals

```
Optimize my current meal plan for [goal: e.g., cutting, bulking, recomp]:

Current weekly plan:
[Paste your current weekly plan]

Current daily targets:
- Calories: [X]
- Protein: [X]g

Goals:
- [Specific goal, e.g., lose 0.5kg per week, gain 0.25kg per week]
- [Any other constraints]

Suggest:
1. Adjusted daily targets
2. Modified weekly plan using my existing dishes
3. New dishes to add if needed

Format suggestions as JSON compatible with my meal planning app.
```

### Prompt 5: Generate Batch Cooking Meal Prep Plan

```
Create a batch cooking meal prep plan for the week with:

- Total meals to prep: [X] meals
- Storage: [refrigerator/freezer]
- Reheating method: [microwave/stovetop/oven]
- Daily calorie target: [X]
- Daily protein target: [X]g

Provide:
1. List of dishes to batch cook
2. Shopping list organized by category
3. Prep schedule (what to cook on which day)
4. Storage instructions
5. Reheating instructions

Format dishes as JSON with all nutritional information.
```

### Prompt 6: Create High-Protein Meal Plan

```
I need a high-protein meal plan with:
- Daily protein target: [X] grams (minimum)
- Daily calorie target: [X] calories
- Protein distribution: [e.g., 30g per meal minimum]
- Meal times: [list your meal times]
- Dietary restrictions: [list]

Generate:
- 7 breakfasts (each with at least [X]g protein)
- 7 lunches (each with at least [X]g protein)
- 7 snacks (each with at least [X]g protein)
- 7 dinners (each with at least [X]g protein)

Include full nutritional breakdown and cooking instructions. Format as JSON.
```

### Prompt 7: Generate Vegetarian/Vegan Meal Plan

```
Create a [vegetarian/vegan] meal plan with:
- Daily calories: [X]
- Daily protein: [X]g
- Meal times: [list]
- Additional requirements: [e.g., no soy, gluten-free, etc.]

Provide 28 dishes total (7 breakfasts, 7 lunches, 7 snacks, 7 dinners) with:
- Complete nutritional information
- Ingredients list
- Cooking steps
- Tags

Format as JSON array ready for import.
```

### Example: Complete Prompt for Muscle Gain

```
I need a weekly meal plan for muscle gain with the following requirements:

- Daily calorie target: 2500 calories
- Daily protein target: 180 grams
- Meal times: Breakfast at 08:00, Lunch at 13:00, Snack at 16:00, Dinner at 20:00
- Dietary restrictions: No shellfish, prefer Indian cuisine
- Cooking skill level: Intermediate
- Meal prep preference: Mix of batch cooking and quick meals

Please provide:
1. 7 breakfast options
2. 7 lunch options
3. 7 snack options
4. 7 dinner options
5. For each dish, include:
   - Name
   - Prep time (minutes)
   - Calories
   - Protein (grams)
   - Carbs (grams)
   - Fat (grams)
   - Ingredients list
   - Simple cooking steps (3-5 steps)
   - Tags (e.g., "high-protein", "low-carb", "no-cook", "batch-cook")

Format the output as a JSON array matching this structure:
[
  {
    "id": "D1",
    "name": "Dish Name",
    "meal": "breakfast",
    "prepTime": 15,
    "calories": 450,
    "protein": 30,
    "carbs": 25,
    "fat": 15,
    "tags": ["high-protein"],
    "ingredients": ["Ingredient 1", "Ingredient 2"],
    "steps": ["Step 1", "Step 2", "Step 3"]
  }
]
```

## Converting ChatGPT Output to DietOS Format

After getting output from ChatGPT, you'll need to:

1. **Assign unique IDs** to each dish (e.g., D1, D2, D3...)
2. **Create the weekly plan** mapping days to dish IDs
3. **Extract ingredients** to create the `ingredientsIndex` array
4. **Update `lib/data.json`** or use the Import JSON feature

### Quick Conversion Script

You can use this structure to manually convert ChatGPT's output:

```json
{
  "meta": {
    "version": "1.0.0",
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  },
  "settings": {
    "defaultMealTimes": {
      "breakfast": "08:00",
      "lunch": "13:00",
      "snack": "16:00",
      "dinner": "20:00"
    },
    "targets": {
      "calories": 2500,
      "protein": 180
    }
  },
  "weeklyPlan": {
    "Monday": {
      "breakfast": "D1",
      "lunch": "D8",
      "snack": "D15",
      "dinner": "D22"
    }
    // ... add other days
  },
  "dishes": [
    // Paste ChatGPT's dish array here
  ],
  "ingredientsIndex": [
    // Extract unique ingredients from all dishes
  ]
}
```

## Project Structure

```
DietOS/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main app page
├── components/            # React components
│   ├── layout.tsx         # Main layout with navigation
│   ├── splash-screen.tsx  # Splash screen component
│   ├── theme-provider.tsx # Theme management
│   ├── ui/                # UI components (shadcn/ui)
│   └── views/             # View components
│       ├── today.tsx      # Today's meals view
│       ├── week.tsx       # Weekly plan view
│       ├── dishes.tsx     # Dish library view
│       ├── groceries.tsx  # Grocery list view
│       └── settings.tsx   # Settings view
├── hooks/                 # Custom React hooks
│   ├── use-dietos.ts      # Main app state hook
│   └── use-toast.ts       # Toast notifications
├── lib/                   # Utility libraries
│   ├── data.json          # Default meal plan data
│   ├── dietos-state.ts    # TypeScript types
│   ├── storage.ts         # Local storage utilities
│   ├── validation.ts      # Data validation
│   └── utils.ts           # Helper functions
└── public/                # Static assets
```

## Technologies Used

- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible component primitives
- **Zod** - Schema validation
- **date-fns** - Date utilities
- **Local Storage** - Data persistence

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Data Persistence

The app uses browser local storage to persist your meal plan data. Your changes are automatically saved as you use the app.

## Troubleshooting

### Data Not Saving
- Check browser console for errors
- Ensure local storage is enabled in your browser
- Try clearing browser cache and reloading

### Import Not Working
- Verify JSON structure matches the expected format
- Check that all required fields are present
- Use the "Show Raw JSON" feature in Settings to validate structure

### Calendar Export Issues
- Ensure you've selected at least one day to export
- Check that dishes are assigned to all selected meals
- Verify the .ics file opens in your calendar app

## Contributing

This is a personal project, but suggestions and improvements are welcome!

## License

Private project - All rights reserved

---

**Built with ❤️ for efficient meal planning**
