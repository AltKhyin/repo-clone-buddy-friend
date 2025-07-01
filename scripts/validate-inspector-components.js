#!/usr/bin/env node

// ABOUTME: Pre-commit validation script to catch inspector component issues before they reach runtime

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Validation script for inspector components
 * Catches common issues that cause runtime errors
 */

console.log('🔍 Validating Inspector Components...\n');

let hasErrors = false;

// 1. Validate that all lucide-react icons used in components are imported
function validateLucideImports() {
  console.log('📦 Checking lucide-react imports...');

  const inspectorFiles = glob.sync('src/components/editor/inspector/*.tsx');
  const commonIcons = [
    'AlignLeft',
    'AlignCenter',
    'AlignRight',
    'AlignJustify',
    'Heading1',
    'Heading2',
    'Heading3',
    'Heading4',
    'Type',
    'Palette',
    'Settings',
    'Eye',
    'EyeOff',
  ];

  inspectorFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const usedIcons = [];
    const importedIcons = [];

    // Find all icon usages (e.g., <AlignLeft>, {AlignLeft})
    commonIcons.forEach(icon => {
      if (
        content.includes(`<${icon}`) ||
        content.includes(`{${icon}`) ||
        content.includes(`icon: ${icon}`)
      ) {
        usedIcons.push(icon);
      }
    });

    // Find imported icons from lucide-react
    const lucideImportMatch = content.match(/from ['"]lucide-react['"];?\s*$/m);
    if (lucideImportMatch) {
      const importSection = content.substring(
        content.lastIndexOf('import', lucideImportMatch.index),
        lucideImportMatch.index + lucideImportMatch[0].length
      );

      commonIcons.forEach(icon => {
        if (importSection.includes(icon)) {
          importedIcons.push(icon);
        }
      });
    }

    // Check for missing imports
    const missingImports = usedIcons.filter(icon => !importedIcons.includes(icon));

    if (missingImports.length > 0) {
      console.error(`❌ ${file}: Missing lucide-react imports: ${missingImports.join(', ')}`);
      hasErrors = true;
    } else if (usedIcons.length > 0) {
      console.log(`✅ ${path.basename(file)}: All lucide icons properly imported`);
    }
  });
}

// 2. Validate that all UI components used are imported
function validateUIImports() {
  console.log('\n🎨 Checking UI component imports...');

  const inspectorFiles = glob.sync('src/components/editor/inspector/*.tsx');
  const uiComponents = [
    'Select',
    'SelectContent',
    'SelectItem',
    'SelectTrigger',
    'SelectValue',
    'Dialog',
    'DialogContent',
    'DialogHeader',
    'DialogTitle',
    'Popover',
    'PopoverContent',
    'PopoverTrigger',
  ];

  inspectorFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const usedComponents = [];
    const importedComponents = [];

    // Find all UI component usages
    uiComponents.forEach(component => {
      if (content.includes(`<${component}`) || content.includes(`{${component}`)) {
        usedComponents.push(component);
      }
    });

    // Find imported UI components
    const uiImportMatch = content.match(/from ['"]@\/components\/ui\/[^'"]+['"];?\s*$/gm);
    if (uiImportMatch) {
      uiImportMatch.forEach(importLine => {
        const importSection = content.substring(
          content.lastIndexOf('import', content.indexOf(importLine)),
          content.indexOf(importLine) + importLine.length
        );

        uiComponents.forEach(component => {
          if (importSection.includes(component)) {
            importedComponents.push(component);
          }
        });
      });
    }

    // Check for missing imports
    const missingImports = usedComponents.filter(
      component => !importedComponents.includes(component)
    );

    if (missingImports.length > 0) {
      console.error(`❌ ${file}: Missing UI component imports: ${missingImports.join(', ')}`);
      hasErrors = true;
    } else if (usedComponents.length > 0) {
      console.log(`✅ ${path.basename(file)}: All UI components properly imported`);
    }
  });
}

// 3. Validate that inspector components get data internally
function validateDataAccess() {
  console.log('\n💾 Checking data access patterns...');

  const inspectorFiles = glob.sync('src/components/editor/inspector/*Inspector.tsx');

  inspectorFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);

    // Check if component props include 'data' parameter
    const propsMatch = content.match(/interface\s+\w+Props\s*{([^}]+)}/);
    if (propsMatch) {
      const propsContent = propsMatch[1];

      if (propsContent.includes('data:')) {
        console.warn(
          `⚠️  ${fileName}: Component receives 'data' as prop. Consider getting data internally via useEditorStore.`
        );
      }
    }

    // Check if component gets data from useEditorStore
    if (content.includes('useEditorStore') && content.includes('nodes.find')) {
      console.log(`✅ ${fileName}: Gets data internally via useEditorStore`);
    } else if (content.includes('useEditorStore')) {
      console.warn(`⚠️  ${fileName}: Uses useEditorStore but might not get node data properly`);
    }
  });
}

// 4. Validate color input safety
function validateColorInputs() {
  console.log('\n🎨 Checking color input safety...');

  const files = glob.sync('src/components/editor/inspector/**/*.tsx');

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);

    // Look for HTML color inputs
    const colorInputMatches = content.match(/type=["']color["'][^>]*value=\{([^}]+)\}/g);

    if (colorInputMatches) {
      colorInputMatches.forEach(match => {
        // Check if the value could be "transparent" without proper handling
        if (match.includes('transparent') && !match.includes('!==') && !match.includes('?')) {
          console.error(`❌ ${fileName}: Color input may receive "transparent" value: ${match}`);
          hasErrors = true;
        } else {
          console.log(`✅ ${fileName}: Color input properly handles invalid values`);
        }
      });
    }
  });
}

// Run all validations
validateLucideImports();
validateUIImports();
validateDataAccess();
validateColorInputs();

// Summary
console.log('\n📊 Validation Summary:');
if (hasErrors) {
  console.error('❌ Validation failed! Please fix the errors above before committing.');
  process.exit(1);
} else {
  console.log('✅ All inspector components passed validation!');
  process.exit(0);
}
