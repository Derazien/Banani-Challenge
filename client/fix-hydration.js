/**
 * This script helps identify and fix common hydration issues in Next.js applications
 * To use: Run this with "node fix-hydration.js" from the command line
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define common patterns that cause hydration issues
const whitespaceInHtmlPattern = /<html[^>]*>\s+/g;
const conditionalRenderPattern = /{\s*mounted\s*\?\s*\(/g;
const windowCheckPattern = /typeof\s+window\s*!==\s*(['"])undefined\1/g;

// Helper function to clean up whitespace in layout files
function fixWhitespaceInLayouts(filePath) {
  console.log(`Checking ${filePath} for whitespace issues...`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix whitespace between HTML tags
  let newContent = content.replace(/<([a-z]+)[^>]*>\s+<\/\1>/g, '<$1></$1>');
  
  // Fix whitespace around HTML tag
  newContent = newContent.replace(/<html([^>]*)>\s+/g, '<html$1>');
  
  // Remove comments in JSX that might cause whitespace issues
  newContent = newContent.replace(/{\/\*.*?\*\/}/g, '');
  
  if (content !== newContent) {
    console.log(`✅ Fixed whitespace issues in ${filePath}`);
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }
  
  console.log(`✓ No whitespace issues found in ${filePath}`);
  return false;
}

// Help fix conditional rendering that can cause hydration issues
function fixConditionalRendering(filePath) {
  console.log(`Checking ${filePath} for conditional rendering issues...`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if file has "mounted" state for client-side only rendering
  if (content.includes('useState(false)') && 
      content.includes('setMounted(true)') && 
      conditionalRenderPattern.test(content)) {
    
    console.log(`⚠️ File ${filePath} uses mounted state for conditional rendering.`);
    console.log(`   This is generally good, but ensure the component returns null until mounted.`);
    console.log(`   Example: if (!mounted) return null;`);
    
    // Check if the component already has the guard
    if (!content.includes('if (!mounted) return null')) {
      console.log(`   Consider adding "if (!mounted) return null;" before the render return.`);
    } else {
      console.log(`   ✓ Component already has mounted guard.`);
    }
    
    return true;
  }
  
  return false;
}

// Main function to analyze the codebase
async function analyzeCodebase() {
  console.log('🔍 Starting hydration issue analysis...');
  
  // Find all layout files
  const layoutFiles = glob.sync('src/app/**/layout.tsx', { cwd: './' });
  let fixedIssues = false;
  
  // Check layouts for whitespace issues
  for (const file of layoutFiles) {
    const fixed = fixWhitespaceInLayouts(file);
    fixedIssues = fixedIssues || fixed;
  }
  
  // Find all client components
  const clientFiles = glob.sync('src/components/**/*.tsx', { cwd: './' });
  
  // Check client components for conditional rendering issues
  for (const file of clientFiles) {
    // Only check files with 'use client' directive
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes("'use client'")) {
      const found = fixConditionalRendering(file);
      fixedIssues = fixedIssues || found;
    }
  }
  
  // Final recommendations
  console.log('\n📋 Recommendations to fix hydration issues:');
  console.log('1. Ensure client components that use useEffect/useState return null on first render');
  console.log('2. Remove all comments from JSX in layout files');
  console.log('3. Ensure no whitespace text nodes are children of <html> tag');
  console.log('4. Add "use client" directive to any component that uses browser APIs');
  console.log('5. Use next/dynamic with { ssr: false } for components that should only render client-side');
  console.log('\nNote: You should restart your Next.js dev server after making these changes.');
  
  if (fixedIssues) {
    console.log('\n✅ Some issues were automatically fixed. Restart your dev server to see changes.');
  } else {
    console.log('\n✓ No automatically fixable issues were found.');
  }
}

// Run the analysis
analyzeCodebase().catch(console.error); 