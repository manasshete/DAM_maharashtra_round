import fs from 'fs';
import path from 'path';

// Parse evaluation data
const heldOutDataPath = path.join(process.cwd(), 'data', 'eval', 'held-out.jsonl');
const modelPath = path.join(process.cwd(), 'data', 'eval', 'misconception_model_v1.json');

import { NaiveBayesClassifier } from '../lib/diagnosis/model/classifier';
import { extractFeatures } from '../lib/evidence/extractor';
import { M02_QUESTION } from '../data/questions/M02';

async function generate() {
    const lines = fs.readFileSync(heldOutDataPath, 'utf8').split('\n').filter(l => l.trim() !== '');
    
    const classifier = new NaiveBayesClassifier();
    const modelData = fs.readFileSync(modelPath, 'utf8');
    classifier.load(modelData);
    
    const classes = [
        "M01", "M02", "M03", 
        "SYNTAX_ERROR", "RUNTIME_ERROR", 
        "CARELESS_ERROR", "CAREFUL_CORRECT", "OTHER_UNKNOWN"
    ];
    
    const matrix: Record<string, Record<string, number>> = {};
    classes.forEach(c1 => {
        matrix[c1] = {};
        classes.forEach(c2 => {
            matrix[c1][c2] = 0;
        });
    });
    
    for (const line of lines) {
        const item = JSON.parse(line);
        const actual = item.label;
        const features = item.features;
        const prediction = classifier.predict(features);
        const predicted = prediction.prediction;
        if (matrix[actual] && matrix[actual][predicted] !== undefined) {
            matrix[actual][predicted]++;
        }
    }
    
    // Generate SVG
    const cellSize = 50;
    const paddingLeft = 150;
    const paddingTop = 150;
    const width = paddingLeft + classes.length * cellSize + 20;
    const height = paddingTop + classes.length * cellSize + 20;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">\n`;
    svg += `  <text x="${width/2}" y="30" fill="#c9d1d9" font-size="20" font-weight="bold" text-anchor="middle">Naive Bayes Confusion Matrix</text>\n`;
    
    // Y axis label
    svg += `  <text x="20" y="${paddingTop + (classes.length * cellSize)/2}" fill="#8b949e" font-size="14" font-weight="bold" transform="rotate(-90, 20, ${paddingTop + (classes.length * cellSize)/2})" text-anchor="middle">True Class</text>\n`;
    
    // X axis label
    svg += `  <text x="${paddingLeft + (classes.length * cellSize)/2}" y="${height - 10}" fill="#8b949e" font-size="14" font-weight="bold" text-anchor="middle">Predicted Class</text>\n`;
    
    // Draw cells
    let maxVal = 0;
    classes.forEach(c1 => {
        classes.forEach(c2 => {
            if (matrix[c1][c2] > maxVal) maxVal = matrix[c1][c2];
        });
    });
    
    classes.forEach((actual, i) => {
        // Row labels
        svg += `  <text x="${paddingLeft - 10}" y="${paddingTop + i*cellSize + cellSize/2 + 5}" fill="#c9d1d9" font-size="12" text-anchor="end">${actual}</text>\n`;
        
        classes.forEach((predicted, j) => {
            // Column labels (rotated)
            if (i === 0) {
                svg += `  <text x="${paddingLeft + j*cellSize + cellSize/2}" y="${paddingTop - 10}" fill="#c9d1d9" font-size="12" transform="rotate(-45, ${paddingLeft + j*cellSize + cellSize/2}, ${paddingTop - 10})" text-anchor="start">${predicted}</text>\n`;
            }
            
            const val = matrix[actual][predicted];
            let color = "#161b22";
            if (val > 0) {
                const intensity = 0.2 + (val / maxVal) * 0.8;
                if (actual === predicted) {
                    color = `rgba(46, 160, 67, ${intensity})`; // Green for correct
                } else {
                    color = `rgba(248, 81, 73, ${intensity})`; // Red for wrong
                }
            }
            
            svg += `  <rect x="${paddingLeft + j*cellSize}" y="${paddingTop + i*cellSize}" width="${cellSize-2}" height="${cellSize-2}" fill="${color}" rx="4" />\n`;
            
            if (val > 0) {
                svg += `  <text x="${paddingLeft + j*cellSize + cellSize/2}" y="${paddingTop + i*cellSize + cellSize/2 + 5}" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">${val}</text>\n`;
            }
        });
    });
    
    svg += `</svg>`;
    
    fs.mkdirSync(path.join(process.cwd(), 'docs', 'assets'), { recursive: true });
    fs.writeFileSync(path.join(process.cwd(), 'docs', 'assets', 'confusion_matrix.svg'), svg);
    console.log("Confusion matrix SVG generated at docs/assets/confusion_matrix.svg");
}

generate();
