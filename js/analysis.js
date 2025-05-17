// Read and parse both CSV files
// Import PapaParse
import Papa from 'papaparse';
import fs from 'fs/promises'; // Import the promises-based fs module

async function categorizeWords() {
  try {
    const plusFileContent = await fs.readFile('plus_product_data_mango 2.csv', { encoding: 'utf8' });
    const regularFileContent = await fs.readFile('regular_product_data_mango 2.csv', { encoding: 'utf8' });

    // ... the rest of your code remains largely the same ...
async function categorizeWords() {
  try {
    const plusFileContent = await window.fs.readFile('plus_product_data_mango 2.csv', { encoding: 'utf8' });
    const regularFileContent = await window.fs.readFile('regular_product_data_mango 2.csv', { encoding: 'utf8' });
    
    
    
    // Parse both files
    const plusData = Papa.parse(plusFileContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });
    
    const regularData = Papa.parse(regularFileContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });
    
    // Extract descriptions from both datasets
    const plusDescriptions = plusData.data.map(item => item.Description || '');
    const regularDescriptions = regularData.data.map(item => item.Description || '');
    
    // Process descriptions to get all unique words
    function getUniqueWords(descriptions) {
      // Combine all descriptions into one string, convert to lowercase
      const allText = descriptions.join(' ').toLowerCase();
      
      // Clean the text and split into words
      const words = allText.replace(/[^\w\s]/g, '').split(/\s+/);
      
      // Filter out very short words, numbers, and common stop words
      const stopWords = new Set([
        'the', 'and', 'for', 'with', 'this', 'that', 'are', 'from', 'has', 'have', 
        'its', 'was', 'were', 'will', 'not', 'but', 'what', 'all', 'can', 'only'
      ]);
      
      return [...new Set(words.filter(word => 
        word.length > 2 && isNaN(word) && !stopWords.has(word)
      ))];
    }
    
    // Get all unique words from both datasets
    const plusUniqueWords = getUniqueWords(plusDescriptions);
    const regularUniqueWords = getUniqueWords(regularDescriptions);
    const allUniqueWords = [...new Set([...plusUniqueWords, ...regularUniqueWords])];
    
    console.log(`Total unique words across both datasets: ${allUniqueWords.length}`);
    
    // Define word categories based on domain knowledge
    const wordCategories = {
      'Silhouette': [
        'straight', 'aline', 'a-line', 'fit', 'fitted', 'flare', 'flared', 'slim', 
        'flowing', 'drape', 'draped', 'loose', 'ruching', 'gathered', 'wrap', 'bodycon', 
        'oversized', 'pleated', 'pencil', 'relaxed', 'shift', 'tight'
      ],
      'Length': [
        'short', 'midi', 'mini', 'maxi', 'long', 'crop', 'cropped', 'knee', 'ankle', 'floor'
      ],
      'Neckline': [
        'neck', 'vneck', 'v-neck', 'round', 'collar', 'scoop', 'halter', 'turtleneck', 
        'cowl', 'crew', 'square', 'sweetheart', 'off-shoulder', 'boat'
      ],
      'Sleeves': [
        'sleeve', 'sleeves', 'sleeveless', 'short-sleeve', 'long-sleeve', 'cap', 
        'capped', 'puff', 'bell', 'batwing', 'dolman', 'raglan'
      ],
      'Accessories': [
        'belt', 'belted', 'pocket', 'pockets', 'drawstring', 'button', 'buttons', 
        'zipper', 'tie', 'tied', 'buckle'
      ],
      'Fabric': [
        'fabric', 'cotton', 'denim', 'linen', 'knit', 'knitted', 'woven', 'leather', 
        'silk', 'satin', 'polyester', 'stretch', 'lightweight', 'heavy'
      ],
      'Design Elements': [
        'print', 'pattern', 'solid', 'striped', 'stripes', 'checkered', 'check', 
        'embroidered', 'embroidery', 'ruffle', 'ruffled', 'sequin', 'beaded', 'lace',
        'detail', 'contrast', 'panel', 'layered', 'texture'
      ],
      'Closures': [
        'closure', 'zip', 'button', 'fastening', 'snap', 'hook', 'drawstring', 'velcro'
      ]
    };
    
    // Function to count word frequencies in each category
    function countCategoryFrequencies(descriptions, categories) {
      // Get word frequencies
      const allText = descriptions.join(' ').toLowerCase();
      const words = allText.replace(/[^\w\s]/g, '').split(/\s+/);
      const wordFreq = {};
      
      words.forEach(word => {
        if (word.length > 2 && isNaN(word)) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });
      
      // Count frequencies by category
      const categoryFreqs = {};
      
      for (const [category, categoryWords] of Object.entries(categories)) {
        categoryFreqs[category] = categoryWords.map(word => ({
          word,
          frequency: wordFreq[word] || 0
        })).sort((a, b) => b.frequency - a.frequency);
      }
      
      return categoryFreqs;
    }
    
    // Count frequencies for both datasets
    const plusCategoryFreqs = countCategoryFrequencies(plusDescriptions, wordCategories);
    const regularCategoryFreqs = countCategoryFrequencies(regularDescriptions, wordCategories);
    
    // Generate comparison data for each category
    const categoryComparisonData = {};
    
    for (const category in wordCategories) {
      categoryComparisonData[category] = wordCategories[category].map(word => {
        const plusFreq = (plusCategoryFreqs[category].find(item => item.word === word) || {}).frequency || 0;
        const regularFreq = (regularCategoryFreqs[category].find(item => item.word === word) || {}).frequency || 0;
        
        return {
          word,
          plus: plusFreq,
          regular: regularFreq,
          // Calculate normalized frequencies (per item)
          plusNormalized: plusFreq / plusData.data.length,
          regularNormalized: regularFreq / regularData.data.length,
          // Calculate difference in normalized frequencies
          difference: (plusFreq / plusData.data.length) - (regularFreq / regularData.data.length)
        };
      }).filter(item => item.plus > 0 || item.regular > 0) // Only include words that appear in at least one dataset
       .sort((a, b) => (b.plus + b.regular) - (a.plus + a.regular)); // Sort by total frequency
    }
    
    // Print samples from each category
    for (const category in categoryComparisonData) {
      console.log(`\n${category} category - top terms:`);
      const topTerms = categoryComparisonData[category].slice(0, 5);
      console.log(topTerms);
    }
    
    console.log("\nCategories with the most terms:");
    for (const category in categoryComparisonData) {
      console.log(`- ${category}: ${categoryComparisonData[category].length} terms`);
    }
    
    return {
      categories: Object.keys(wordCategories),
      comparisonData: categoryComparisonData,
      itemCounts: {
        plus: plusData.data.length,
        regular: regularData.data.length
      }
    };
  } catch (error) {
    console.error("Error processing CSV files:", error);
    return null;
  }
}

// Execute the analysis
const categorizedData = await categorizeWords();
console.log("Data categorization complete");