#!/bin/bash

# Test script for M4A support in Goldfish app
# This script verifies that m4a files can be processed correctly

echo "🐠 Goldfish M4A Support Test"
echo "=============================="

# Check if ffmpeg is available
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg is not installed. Please install it to test audio conversion."
    exit 1
fi

# Create a test directory
mkdir -p test_files

echo "✅ ffmpeg is available"

# Check if there are any m4a files in the current directory
count_m4a=$(find . -maxdepth 1 -name "*.m4a" | wc -l)

if [ $count_m4a -eq 0 ]; then
    echo "ℹ️  No .m4a files found in current directory"
    echo "📝 To test M4A support:"
    echo "   1. Record a voice memo on your iOS device"
    echo "   2. Transfer it to your computer (AirDrop, iCloud, etc.)"
    echo "   3. Place the .m4a file in this directory"
    echo "   4. Run this script again"
    echo ""
    echo "🔧 Alternatively, you can create a test m4a file with:"
    echo "   ffmpeg -f lavfi -i 'sine=frequency=1000:duration=5' -c:a aac test_files/test_tone.m4a"
    echo ""
    
    # Create a test tone if the user wants
    read -p "Would you like to create a test audio file? (y/n): " create_test
    if [[ $create_test == "y" || $create_test == "Y" ]]; then
        echo "🎵 Creating test audio files..."
        
        # Create a 5-second sine wave in m4a format
        ffmpeg -f lavfi -i "sine=frequency=1000:duration=5" -c:a aac test_files/test_tone.m4a -y
        
        # Create a 5-second sine wave with speech-like metadata
        ffmpeg -f lavfi -i "sine=frequency=440:duration=3" -metadata title="Test Goldfish Moment" -metadata artist="Test" -c:a aac test_files/test_speech.m4a -y
        
        echo "✅ Created test files:"
        ls -la test_files/
        
        count_m4a=2
    fi
fi

if [ $count_m4a -gt 0 ]; then
    echo ""
    echo "🔍 Found $count_m4a .m4a file(s):"
    find . -maxdepth 1 -name "*.m4a" -exec echo "   {}" \;
    
    echo ""
    echo "🧪 Testing file information:"
    for file in *.m4a; do
        if [ -f "$file" ]; then
            echo "   File: $file"
            echo "   Size: $(du -h "$file" | cut -f1)"
            echo "   Duration: $(ffmpeg -i "$file" 2>&1 | grep Duration | cut -d' ' -f4 | sed 's/,//')"
            echo "   Audio Codec: $(ffmpeg -i "$file" 2>&1 | grep Stream | grep Audio | head -1 | sed 's/.*Audio: //; s/,.*//')"
            echo ""
        fi
    done
    
    echo "🚀 Ready to test with Goldfish app!"
    echo "   1. Start your Goldfish app: npm start"
    echo "   2. Upload one of the m4a files above"
    echo "   3. Verify that triggers are detected and clips are generated"
    echo "   4. Download and play the generated mp3 clips"
    echo ""
    echo "💡 Tips for testing:"
    echo "   - Use files with clear speech for best transcription results"
    echo "   - Include trigger words like 'keeper', 'clip it', 'that's the one'"
    echo "   - Test both short (under 1 minute) and longer files"
fi

echo ""
echo "✨ Test complete!"