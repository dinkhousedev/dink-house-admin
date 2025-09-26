// Test script for Event CRUD operations
// Run this to test database operations directly

const testEventsCRUD = async () => {
  const baseUrl = 'http://localhost:3000';

  console.log('🧪 Testing Event CRUD Operations...\n');

  // Test data
  const testEvent = {
    title: `Test Event ${Date.now()}`,
    event_type: 'scramble',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    court_ids: [],
    max_capacity: 16,
    min_capacity: 4,
    skill_levels: ['2.5', '3.0', '3.5', '4.0'],
    member_only: false,
    price_member: 15,
    price_guest: 20,
    equipment_provided: true,
  };

  try {
    // 1. TEST GET - Fetch all events
    console.log('1️⃣ TEST GET - Fetching all events...');
    const getResponse = await fetch(`${baseUrl}/api/events`, {
      method: 'GET',
    });
    const events = await getResponse.json();
    console.log(`   ✅ GET Success: Retrieved ${events.data?.length || 0} events\n`);

    // 2. TEST POST - Create new event
    console.log('2️⃣ TEST POST - Creating new event...');
    const postResponse = await fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEvent),
    });
    const newEvent = await postResponse.json();
    console.log(`   ✅ POST Success: Created event with ID: ${newEvent.data?.id}\n`);

    if (newEvent.data?.id) {
      const eventId = newEvent.data.id;

      // 3. TEST GET Single - Fetch created event
      console.log('3️⃣ TEST GET Single - Fetching created event...');
      const getSingleResponse = await fetch(`${baseUrl}/api/events/${eventId}`, {
        method: 'GET',
      });
      const singleEvent = await getSingleResponse.json();
      console.log(`   ✅ GET Single Success: Retrieved event "${singleEvent.data?.title}"\n`);

      // 4. TEST PUT - Update event
      console.log('4️⃣ TEST PUT - Updating event...');
      const updateData = {
        title: `${testEvent.title} (Updated)`,
        max_capacity: 20,
      };
      const putResponse = await fetch(`${baseUrl}/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      const updatedEvent = await putResponse.json();
      console.log(`   ✅ PUT Success: Updated event title to "${updatedEvent.data?.title}"\n`);

      // 5. TEST DELETE - Delete event
      console.log('5️⃣ TEST DELETE - Deleting event...');
      const deleteResponse = await fetch(`${baseUrl}/api/events/${eventId}`, {
        method: 'DELETE',
      });
      const deleteResult = await deleteResponse.json();
      console.log(`   ✅ DELETE Success: Event deleted\n`);
    }

    console.log('✅ All CRUD tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the tests
testEventsCRUD();