const fs = require('fs');
const path = require('path');

// Create a simple colored square PNG of specific size
function createColoredPNG(size) {
    // PNG file header and chunks for a simple cyan square
    const width = size;
    const height = size;
    
    // PNG signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    
    // IHDR chunk (image header)
    const ihdr = Buffer.alloc(25);
    ihdr.writeUInt32BE(13, 0); // Length
    ihdr.write('IHDR', 4);
    ihdr.writeUInt32BE(width, 8);
    ihdr.writeUInt32BE(height, 12);
    ihdr[16] = 8; // Bit depth
    ihdr[17] = 6; // Color type (RGBA)
    ihdr[18] = 0; // Compression
    ihdr[19] = 0; // Filter
    ihdr[20] = 0; // Interlace
    
    // Calculate CRC for IHDR
    const crc32 = require('buffer-crc32');
    const ihdrCrc = crc32(ihdr.slice(4, 21));
    ihdr.writeUInt32BE(ihdrCrc.readUInt32BE(0), 21);
    
    // Create image data (cyan with some transparency)
    const pixels = Buffer.alloc(width * height * 4);
    for (let i = 0; i < width * height; i++) {
        pixels[i * 4] = 6;      // R
        pixels[i * 4 + 1] = 182; // G  
        pixels[i * 4 + 2] = 212; // B (cyan color #06b6d4)
        pixels[i * 4 + 3] = 255; // A (fully opaque)
    }
    
    // Compress with zlib
    const zlib = require('zlib');
    const compressed = zlib.deflateSync(pixels);
    
    // IDAT chunk (image data)
    const idat = Buffer.alloc(compressed.length + 12);
    idat.writeUInt32BE(compressed.length, 0);
    idat.write('IDAT', 4);
    compressed.copy(idat, 8);
    const idatCrc = crc32(idat.slice(4, 8 + compressed.length));
    idat.writeUInt32BE(idatCrc.readUInt32BE(0), 8 + compressed.length);
    
    // IEND chunk (end marker)
    const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
    
    // Combine all chunks
    return Buffer.concat([signature, ihdr, idat, iend]);
}

// Fallback: Use base64 encoded minimal icons if buffer-crc32 is not available
try {
    require('buffer-crc32');
    
    // Create proper sized icons
    const icon192 = createColoredPNG(192);
    const icon512 = createColoredPNG(512);
    
    fs.writeFileSync(path.join(__dirname, 'public', 'icon-192.png'), icon192);
    fs.writeFileSync(path.join(__dirname, 'public', 'icon-512.png'), icon512);
    
    console.log('✓ Created icon-192.png (192x192)');
    console.log('✓ Created icon-512.png (512x512)');
} catch (e) {
    // Fallback: create simple valid PNG files
    console.log('Using fallback method to create icons...');
    
    // Minimal valid 192x192 cyan PNG (base64)
    const png192 = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAABmJLR0QA/wD/AP+gvaeTAAABNklEQVR42u3RAQ0AAAgDIN8/9K3hAlNKE0gggQQSSCCBBBJIIIEEEkgggQQSSCCBBBJIIIEEEkgggQQSSCCBBBJIIIEEEkgggQQSSCCBBBJIIIEEEkgggQQSSCCBBBJIIIEEEkgggQQSSCCBBBJIIIEEEkgggQQSSCCBBBJIIIEEEkgggQQSSCCBBBJIIIEEEkgggQQSSCCBBBJIIIEEEkgggQQSSCCBBBJIIIEEEkgggQQSSCCBBBJIIIEEEkgggQQSSCCBBBJIIIEEEkgggQQSSCCBBBJIIIEEEkgggQQSSCCBBBJIIIEEEkgggQQSSCCBBBJIIIEEEkgggQQSSCCBBBJIIIEEEkgggQQSSCCBBBJIIIEEEkgggQQSSCCBBBJIIIEEEkgggQQSSCCBBBLoAT0AAP//cWcCfgAAAABJRU5ErkJggg==',
        'base64'
    );
    
    // Minimal valid 512x512 cyan PNG (base64) - using same small image
    const png512 = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAABmJLR0QA/wD/AP+gvaeTAAABRklEQVR42u3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIC3AQ0AAf9YC58AAAAASUVORK5CYII=',
        'base64'
    );
    
    fs.writeFileSync(path.join(__dirname, 'public', 'icon-192.png'), png192);
    fs.writeFileSync(path.join(__dirname, 'public', 'icon-512.png'), png512);
    
    console.log('✓ Created icon-192.png (fallback)');
    console.log('✓ Created icon-512.png (fallback)');
}

console.log('Icons generated successfully!');