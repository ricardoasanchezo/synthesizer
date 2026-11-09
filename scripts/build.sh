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

echo "=== Build Complete! ==="
