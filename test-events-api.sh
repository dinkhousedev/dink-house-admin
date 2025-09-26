#!/bin/bash

# Events API Test Script
# Run with: bash test-events-api.sh

API_BASE="http://localhost:3005/api/events"
CONTENT_TYPE="Content-Type: application/json"

echo "================================"
echo "Testing Events API Endpoints"
echo "================================"
echo ""

# Test 1: GET all events
echo "1. GET all events:"
echo "Command: curl -X GET \"$API_BASE\" -H \"$CONTENT_TYPE\""
curl -X GET "$API_BASE" -H "$CONTENT_TYPE" -w "\nHTTP Status: %{http_code}\n" 2>/dev/null | tail -n 1
echo ""

# Test 2: GET events with date filters
echo "2. GET events with date filters (2025):"
echo "Command: curl -X GET \"$API_BASE?startDate=2025-01-01&endDate=2025-12-31\" -H \"$CONTENT_TYPE\""
curl -X GET "$API_BASE?startDate=2025-01-01&endDate=2025-12-31" -H "$CONTENT_TYPE" -w "\nHTTP Status: %{http_code}\n" 2>/dev/null | tail -n 1
echo ""

# Test 3: POST create new event
echo "3. POST create new event (Scramble):"
cat << 'EOF'
Command: curl -X POST "$API_BASE" -H "$CONTENT_TYPE" -d '{
  "title": "Friday Night Scramble",
  "description": "Mixed skill level scramble event",
  "event_type": "scramble",
  "start_time": "2025-02-07T18:00:00Z",
  "end_time": "2025-02-07T20:00:00Z",
  "court_ids": [],
  "max_capacity": 16,
  "min_capacity": 8,
  "skill_levels": ["3.0", "3.5", "4.0"],
  "member_only": false,
  "price_member": 15,
  "price_guest": 25,
  "equipment_provided": true,
  "special_instructions": "Bring water and court shoes"
}'
EOF
curl -X POST "$API_BASE" \
  -H "$CONTENT_TYPE" \
  -d '{
    "title": "Friday Night Scramble",
    "description": "Mixed skill level scramble event",
    "event_type": "scramble",
    "start_time": "2025-02-07T18:00:00Z",
    "end_time": "2025-02-07T20:00:00Z",
    "court_ids": [],
    "max_capacity": 16,
    "min_capacity": 8,
    "skill_levels": ["3.0", "3.5", "4.0"],
    "member_only": false,
    "price_member": 15,
    "price_guest": 25,
    "equipment_provided": true,
    "special_instructions": "Bring water and court shoes"
  }' -w "\nHTTP Status: %{http_code}\n" 2>/dev/null | tail -n 1
echo ""

# Test 4: POST create tournament
echo "4. POST create tournament event:"
cat << 'EOF'
Command: curl -X POST "$API_BASE" -H "$CONTENT_TYPE" -d '{
  "title": "Spring Championship Tournament",
  "description": "Annual spring tournament for all skill levels",
  "event_type": "tournament",
  "start_time": "2025-03-15T08:00:00Z",
  "end_time": "2025-03-15T17:00:00Z",
  "court_ids": [],
  "max_capacity": 64,
  "min_capacity": 16,
  "skill_levels": ["2.5", "3.0", "3.5", "4.0", "4.5", "5.0"],
  "member_only": false,
  "price_member": 45,
  "price_guest": 65,
  "equipment_provided": false,
  "special_instructions": "Check-in starts at 7:30 AM"
}'
EOF
curl -X POST "$API_BASE" \
  -H "$CONTENT_TYPE" \
  -d '{
    "title": "Spring Championship Tournament",
    "description": "Annual spring tournament for all skill levels",
    "event_type": "tournament",
    "start_time": "2025-03-15T08:00:00Z",
    "end_time": "2025-03-15T17:00:00Z",
    "court_ids": [],
    "max_capacity": 64,
    "min_capacity": 16,
    "skill_levels": ["2.5", "3.0", "3.5", "4.0", "4.5", "5.0"],
    "member_only": false,
    "price_member": 45,
    "price_guest": 65,
    "equipment_provided": false,
    "special_instructions": "Check-in starts at 7:30 AM"
  }' -w "\nHTTP Status: %{http_code}\n" 2>/dev/null | tail -n 1
echo ""

# Test 5: GET single event (use a test ID)
EVENT_ID="550e8400-e29b-41d4-a716-446655440000"  # Example UUID
echo "5. GET single event by ID:"
echo "Command: curl -X GET \"$API_BASE/$EVENT_ID\" -H \"$CONTENT_TYPE\""
curl -X GET "$API_BASE/$EVENT_ID" -H "$CONTENT_TYPE" -w "\nHTTP Status: %{http_code}\n" 2>/dev/null | tail -n 1
echo ""

# Test 6: PUT update event
echo "6. PUT update event:"
cat << 'EOF'
Command: curl -X PUT "$API_BASE/$EVENT_ID" -H "$CONTENT_TYPE" -d '{
  "title": "Updated Friday Night Scramble",
  "max_capacity": 20,
  "price_member": 20,
  "price_guest": 30
}'
EOF
curl -X PUT "$API_BASE/$EVENT_ID" \
  -H "$CONTENT_TYPE" \
  -d '{
    "title": "Updated Friday Night Scramble",
    "max_capacity": 20,
    "price_member": 20,
    "price_guest": 30
  }' -w "\nHTTP Status: %{http_code}\n" 2>/dev/null | tail -n 1
echo ""

# Test 7: DELETE event (soft delete/cancel)
echo "7. DELETE event (soft delete/cancel with reason):"
echo "Command: curl -X DELETE \"$API_BASE/$EVENT_ID?cancel=true&reason=Weather%20conditions\" -H \"$CONTENT_TYPE\""
curl -X DELETE "$API_BASE/$EVENT_ID?cancel=true&reason=Weather%20conditions" -H "$CONTENT_TYPE" -w "\nHTTP Status: %{http_code}\n" 2>/dev/null | tail -n 1
echo ""

# Test 8: DELETE event (hard delete)
echo "8. DELETE event (hard delete):"
echo "Command: curl -X DELETE \"$API_BASE/$EVENT_ID\" -H \"$CONTENT_TYPE\""
curl -X DELETE "$API_BASE/$EVENT_ID" -H "$CONTENT_TYPE" -w "\nHTTP Status: %{http_code}\n" 2>/dev/null | tail -n 1
echo ""

echo "================================"
echo "Additional Test Commands:"
echo "================================"
echo ""
echo "# Test with specific date range:"
echo "curl -X GET \"$API_BASE?startDate=2025-02-01&endDate=2025-02-28\" -H \"$CONTENT_TYPE\" | jq '.'"
echo ""
echo "# Create an open play event:"
cat << 'EOF'
curl -X POST "$API_BASE" -H "$CONTENT_TYPE" -d '{
  "title": "Monday Morning Open Play",
  "event_type": "open_play",
  "start_time": "2025-02-03T09:00:00Z",
  "end_time": "2025-02-03T12:00:00Z",
  "court_ids": [],
  "max_capacity": 24,
  "min_capacity": 4,
  "skill_levels": ["2.0", "2.5", "3.0", "3.5"],
  "member_only": true,
  "price_member": 5,
  "price_guest": 15,
  "equipment_provided": true
}' | jq '.'
EOF
echo ""
echo "# Create a clinic event:"
cat << 'EOF'
curl -X POST "$API_BASE" -H "$CONTENT_TYPE" -d '{
  "title": "Beginner Pickleball Clinic",
  "event_type": "clinic",
  "start_time": "2025-02-08T10:00:00Z",
  "end_time": "2025-02-08T11:30:00Z",
  "court_ids": [],
  "max_capacity": 12,
  "min_capacity": 4,
  "skill_levels": ["2.0", "2.5"],
  "member_only": false,
  "price_member": 25,
  "price_guest": 35,
  "equipment_provided": true,
  "special_instructions": "No experience necessary"
}' | jq '.'
EOF
echo ""
echo "================================"
echo "Test completed!"
echo "================================"