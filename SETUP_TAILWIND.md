# How to Add Tailwind CSS Later

## Current Setup
Your project is currently using simple CSS for styling. To add Tailwind CSS later, follow these steps:

## Step 1: Install Tailwind Dependencies
```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npm install framer-motion
```

## Step 2: Replace Package.json
```bash
# Backup current package.json
cp package.json package-simple.json

# Use the Tailwind version
cp package-tailwind.json package.json

# Install dependencies
npm install
```

## Step 3: Update CSS
```bash
# Backup current CSS
cp src/index.css src/index-simple.css

# Use Tailwind CSS
cp src/index-tailwind.css src/index.css
```

## Step 4: Update App.tsx (Optional)
If you want to use Tailwind classes, you can update your components to use Tailwind classes instead of the current CSS classes.

## Step 5: Test
```bash
npm run dev
```

## Reverting Back to Simple CSS
If you want to go back to simple CSS:
```bash
# Restore simple package.json
cp package-simple.json package.json

# Restore simple CSS
cp src/index-simple.css src/index.css

# Reinstall dependencies
npm install
```

## Files Created for Easy Switching:
- `package-tailwind.json` - Package.json with Tailwind dependencies
- `src/index-tailwind.css` - CSS file with Tailwind imports
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration

Your current setup works perfectly without Tailwind, and you can easily add it later when needed!
