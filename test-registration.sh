#!/bin/bash

# Test AXIS6 registration with email
echo "🧪 Testing AXIS6 Registration with Email..."

TIMESTAMP=$(date +%s)
EMAIL="testuser${TIMESTAMP}@axis6demo.com"
NAME="Test User Demo"
PASSWORD="MyStrongPassword2024!"

echo "📧 Email: $EMAIL"
echo "👤 Name: $NAME"

curl -s -X POST http://localhost:6789/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"name\": \"$NAME\"
  }" | jq

echo -e "\n✅ Check your email inbox and server logs!"