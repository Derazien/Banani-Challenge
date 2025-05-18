#!/bin/bash
set -e

echo "Starting Banani Challenge App..."

# Install dependencies if needed
for dir in backend client; do
  if [ ! -d "$dir/node_modules" ]; then
    echo "Installing dependencies in $dir..."
    (cd $dir && npm install)
  else
    echo "Dependencies already installed in $dir."
  fi
done

# Build backend
cd backend
npm run build
cd ..

# Start backend
(cd backend && npm run dev &)
BACKEND_PID=$!

# Start client
(cd client && npm run dev &)
CLIENT_PID=$!

trap 'kill $BACKEND_PID $CLIENT_PID' EXIT

wait 