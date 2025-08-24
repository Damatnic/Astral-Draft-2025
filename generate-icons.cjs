const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Dark background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Draw a stylized "A" for Astral
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = size * 0.08;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw the A shape
    const centerX = size / 2;
    const topY = size * 0.2;
    const bottomY = size * 0.8;
    const width = size * 0.4;
    
    ctx.beginPath();
    // Left side of A
    ctx.moveTo(centerX - width/2, bottomY);
    ctx.lineTo(centerX, topY);
    // Right side of A
    ctx.lineTo(centerX + width/2, bottomY);
    // Crossbar
    ctx.moveTo(centerX - width/4, (topY + bottomY) / 2);
    ctx.lineTo(centerX + width/4, (topY + bottomY) / 2);
    ctx.stroke();
    
    // Add a subtle glow effect
    ctx.shadowBlur = size * 0.05;
    ctx.shadowColor = '#06b6d4';
    ctx.stroke();
    
    // Add stars around the A
    ctx.fillStyle = '#06b6d4';
    ctx.shadowBlur = 0;
    
    function drawStar(x, y, radius) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 144 - 90) * Math.PI / 180;
            const innerAngle = ((i * 144 + 36) - 90) * Math.PI / 180;
            if (i === 0) {
                ctx.moveTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
            } else {
                ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
            }
            ctx.lineTo(x + Math.cos(innerAngle) * radius * 0.4, y + Math.sin(innerAngle) * radius * 0.4);
        }
        ctx.closePath();
        ctx.fill();
    }
    
    // Draw small stars
    drawStar(size * 0.15, size * 0.15, size * 0.03);
    drawStar(size * 0.85, size * 0.15, size * 0.03);
    drawStar(size * 0.15, size * 0.85, size * 0.03);
    drawStar(size * 0.85, size * 0.85, size * 0.03);
    
    return canvas.toBuffer('image/png');
}

// Generate and save icons
try {
    fs.writeFileSync('./public/icon-192.png', createIcon(192));
    console.log('✓ Created icon-192.png');
    
    fs.writeFileSync('./public/icon-512.png', createIcon(512));
    console.log('✓ Created icon-512.png');
    
    console.log('Icons generated successfully!');
} catch (error) {
    console.error('Error generating icons:', error);
    
    // Fallback: create simple placeholder files
    console.log('Creating placeholder icons...');
    
    // Create a simple 1x1 transparent PNG as placeholder
    const placeholder = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    fs.writeFileSync('./public/icon-192.png', placeholder);
    fs.writeFileSync('./public/icon-512.png', placeholder);
    console.log('✓ Created placeholder icons');
}