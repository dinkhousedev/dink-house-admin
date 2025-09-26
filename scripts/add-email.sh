#!/bin/bash

# Script to add an allowed email via curl
# Usage: ./add-email.sh <email> [first_name] [last_name] [role]

EMAIL=${1:-"tim.carrender@gmail.com"}
FIRST_NAME=${2:-"Tim"}
LAST_NAME=${3:-"Carrender"}
ROLE=${4:-"admin"}

# API endpoint
API_URL="http://localhost:3000/api/allowed-emails"

# Add email using curl
echo "Adding email: $EMAIL"
echo "Name: $FIRST_NAME $LAST_NAME"
echo "Role: $ROLE"
echo "---"

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$EMAIL'",
    "first_name": "'$FIRST_NAME'",
    "last_name": "'$LAST_NAME'",
    "role": "'$ROLE'"
  }' | jq '.'

echo ""
echo "---"
echo "Done!"