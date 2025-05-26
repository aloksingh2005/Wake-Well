const fs = require('fs');
const path = require('path');

// Common head content with theme support
const commonHead = `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WakeWell - Smart Alarm Clock</title>
    <link rel="stylesheet" href="../assets/css/main.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="manifest" href="../manifest.json">
    <link rel="apple-touch-icon" href="../assets/icons/icon-192x192.png">
    <meta name="theme-color" content="#4299e1">
    <script type="module" src="../assets/js/components/SharedHeader.js"></script>
`;

// Common body start
const bodyStart = `
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-spinner"></div>
    </div>
    
    <div class="toast-container" id="toastContainer"></div>
`;

// Common scripts
const commonScripts = `
    <script type="module" src="../assets/js/app.js"></script>
`;

// List of pages to update
const pages = [
    'alarm.html',
    'reports.html',
    'settings.html',
    'tracking.html'
];

// Process each page
pages.forEach(page => {
    const filePath = path.join(__dirname, 'pages', page);
    
    try {
        // Read the existing content
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Extract the main content (between <main> tags)
        const mainContentMatch = content.match(/<main[\s\S]*?<\/main>/i);
        const mainContent = mainContentMatch ? mainContentMatch[0] : '<main>No content</main>';
        
        // Create the new HTML structure
        const newContent = `<!DOCTYPE html>
<html lang="en">
<head>
${commonHead}
</head>
<body>
${bodyStart}
${mainContent}
${commonScripts}
</body>
</html>`;
        
        // Write the updated content back to the file
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated ${page} successfully`);
    } catch (error) {
        console.error(`Error updating ${page}:`, error);
    }
});

console.log('All pages have been updated with the new theme system!');
