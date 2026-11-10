#!/usr/bin/env sh
set -e

echo "=== Building Rust WASM Backend ==="
cd backend
cargo build --target wasm32-unknown-unknown --lib
cd ..

echo "=== Building TypeScript Frontend ==="
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
npx tsc
cd ..

echo "=== Copying WASM binary to frontend ==="
mkdir -p frontend/dist
cp backend/target/wasm32-unknown-unknown/debug/synthesizer.wasm frontend/dist/synthesizer.wasm

echo "=== Build Complete! ==="
