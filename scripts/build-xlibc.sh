#!/bin/bash

# Define paths relative to the script location
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LIB_DIR="$DIR/../lib"
BIN_DIR="$DIR/../bin"

# Create bin directory if it does not exist
mkdir -p "$BIN_DIR"

echo "Building xlibc binaries for all platforms..."

# Define targets: OS ARCH NODE_ARCH EXT
TARGETS=(
    "linux amd64 x64 "
    "linux arm64 arm64 "
    "darwin amd64 x64 "
    "darwin arm64 arm64 "
    "windows amd64 x64 .exe"
)

# Navigate to the lib directory containing main.go
cd "$LIB_DIR" || {
    echo "Failed to navigate to $LIB_DIR"
    exit 1
}

# Iterate over each target
for target in "${TARGETS[@]}"; do
    # Read space-separated values
    read -r os arch nodeArch ext <<< "$target"
    
    osName=$os
    if [ "$osName" = "windows" ]; then
        osName="win32"
    fi
    
    binName="xlibc-${osName}-${nodeArch}${ext}"
    outPath="$BIN_DIR/$binName"
    
    echo "Compiling for $os/$arch -> $binName"
    
    GOOS=$os GOARCH=$arch go build -o "$outPath" main.go || {
        echo "Failed to compile $binName"
        exit 1
    }
done

echo -e "\nAll xlibc builds complete."
