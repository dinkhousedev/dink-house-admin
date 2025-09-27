"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Icon } from "@iconify/react";

import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  cancelEvent,
  getCourts,
  getEventTemplates,
} from "../actions";

import {
  Event,
  EventFormData,
  Court,
  EventTemplate,
  EventType,
} from "@/types/events";

export default function EventsCRUDTestPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<EventFormData>({
    title: "Test Event",
    event_type: "scramble",
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
    court_ids: [],
    max_capacity: 16,
    min_capacity: 4,
    skill_levels: ["2.5", "3.0", "3.5", "4.0"],
    member_only: false,
    price_member: 15,
    price_guest: 20,
    equipment_provided: true,
  });

  // Load initial data
  useEffect(() => {
    loadCourts();
    loadTemplates();
    testGetEvents();
  }, []);

  const addTestResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${result}`,
    ]);
  };

  // GET: Load courts
  const loadCourts = async () => {
    const result = await getCourts();

    if (result.success) {
      setCourts(result.data || []);
      addTestResult(`✅ GET Courts: Loaded ${result.data?.length} courts`);
    } else {
      addTestResult(`❌ GET Courts: ${result.error}`);
    }
  };

  // GET: Load templates
  const loadTemplates = async () => {
    const result = await getEventTemplates();

    if (result.success) {
      setTemplates(result.data || []);
      addTestResult(
        `✅ GET Templates: Loaded ${result.data?.length} templates`,
      );
    } else {
      addTestResult(`❌ GET Templates: ${result.error}`);
    }
  };

  // GET: Test fetching all events
  const testGetEvents = async () => {
    setLoading(true);
    addTestResult("🔄 Testing GET all events...");

    const result = await getEvents();

    if (result.success) {
      setEvents(result.data || []);
      addTestResult(
        `✅ GET Events: Retrieved ${result.data?.length || 0} events`,
      );
    } else {
      addTestResult(`❌ GET Events: ${result.error}`);
    }

    setLoading(false);
  };

  // GET: Test fetching single event
  const testGetSingleEvent = async (eventId: string) => {
    setLoading(true);
    addTestResult(`🔄 Testing GET single event: ${eventId}...`);

    const result = await getEvent(eventId);

    if (result.success) {
      setSelectedEvent(result.data);
      addTestResult(`✅ GET Event: Retrieved event "${result.data?.title}"`);
    } else {
      addTestResult(`❌ GET Event: ${result.error}`);
    }

    setLoading(false);
  };

  // POST: Test creating event
  const testCreateEvent = async () => {
    setLoading(true);
    addTestResult("🔄 Testing POST create event...");

    // Add courts to the event
    const eventData = {
      ...formData,
      title: `Test Event ${Date.now()}`,
      court_ids: courts.slice(0, 2).map((c) => c.id), // Use first 2 courts
    };

    const result = await createEvent(eventData);

    if (result.success) {
      addTestResult(
        `✅ POST Event: Created event "${result.data?.title}" with ID: ${result.data?.id}`,
      );
      await testGetEvents(); // Refresh list
    } else {
      addTestResult(`❌ POST Event: ${result.error}`);
    }

    setLoading(false);
    setIsCreateModalOpen(false);
  };

  // PUT: Test updating event
  const testUpdateEvent = async () => {
    if (!selectedEvent) return;

    setLoading(true);
    addTestResult(`🔄 Testing PUT update event: ${selectedEvent.id}...`);

    const updates: Partial<EventFormData> = {
      title: `${selectedEvent.title} (Updated)`,
      max_capacity: selectedEvent.max_capacity + 4,
      price_member: selectedEvent.price_member + 5,
    };

    const result = await updateEvent(selectedEvent.id, updates);

    if (result.success) {
      addTestResult(`✅ PUT Event: Updated event "${result.data?.title}"`);
      await testGetEvents(); // Refresh list
    } else {
      addTestResult(`❌ PUT Event: ${result.error}`);
    }

    setLoading(false);
    setIsEditModalOpen(false);
  };

  // DELETE: Test deleting event
  const testDeleteEvent = async (eventId: string) => {
    setLoading(true);
    addTestResult(`🔄 Testing DELETE event: ${eventId}...`);

    const result = await deleteEvent(eventId);

    if (result.success) {
      addTestResult(`✅ DELETE Event: Deleted event ${eventId}`);
      await testGetEvents(); // Refresh list
    } else {
      addTestResult(`❌ DELETE Event: ${result.error}`);
    }

    setLoading(false);
  };

  // Soft DELETE: Test cancelling event
  const testCancelEvent = async (eventId: string) => {
    setLoading(true);
    addTestResult(`🔄 Testing CANCEL (soft delete) event: ${eventId}...`);

    const result = await cancelEvent(eventId, "Test cancellation");

    if (result.success) {
      addTestResult(`✅ CANCEL Event: Cancelled event "${result.data?.title}"`);
      await testGetEvents(); // Refresh list
    } else {
      addTestResult(`❌ CANCEL Event: ${result.error}`);
    }

    setLoading(false);
  };

  // Run all tests
  const runAllTests = async () => {
    setTestResults([]);
    addTestResult("🚀 Starting CRUD tests...");

    // Test GET
    await testGetEvents();

    // Test POST
    const createResult = await createEvent({
      ...formData,
      title: `Automated Test ${Date.now()}`,
      court_ids: courts.slice(0, 1).map((c) => c.id),
    });

    if (createResult.success && createResult.data) {
      addTestResult(
        `✅ POST: Created test event with ID: ${createResult.data.id}`,
      );

      // Test GET single
      await testGetSingleEvent(createResult.data.id);

      // Test PUT
      const updateResult = await updateEvent(createResult.data.id, {
        title: `${createResult.data.title} (Auto-Updated)`,
      });

      if (updateResult.success) {
        addTestResult(`✅ PUT: Updated test event`);
      }

      // Test DELETE
      await testDeleteEvent(createResult.data.id);
    }

    addTestResult("✅ All tests completed!");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card className="border border-dink-gray bg-black/40">
        <CardHeader>
          <h1 className="text-2xl font-bold text-dink-white">
            Event CRUD Operations Test
          </h1>
        </CardHeader>

        <CardBody className="space-y-6">
          {/* Control Panel */}
          <div className="flex gap-2 flex-wrap">
            <Button
              color="primary"
              isLoading={loading}
              startContent={<Icon icon="solar:play-linear" />}
              onPress={runAllTests}
            >
              Run All Tests
            </Button>
            <Button
              startContent={<Icon icon="solar:refresh-linear" />}
              variant="flat"
              onPress={testGetEvents}
            >
              GET All
            </Button>
            <Button
              color="success"
              startContent={<Icon icon="solar:add-circle-linear" />}
              variant="flat"
              onPress={() => setIsCreateModalOpen(true)}
            >
              POST (Create)
            </Button>
            <Button variant="flat" onPress={() => setTestResults([])}>
              Clear Logs
            </Button>
          </div>

          <Divider />

          {/* Events List */}
          <div>
            <h2 className="text-lg font-semibold text-dink-white mb-3">
              Events ({events.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-auto">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className="bg-black/20 border border-dink-gray/30"
                >
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-dink-white">
                          {event.title}
                        </h3>
                        <div className="flex gap-2 mt-1">
                          <Chip color="primary" size="sm">
                            {event.event_type}
                          </Chip>
                          <Chip size="sm" variant="flat">
                            {new Date(event.start_time).toLocaleDateString()}
                          </Chip>
                          <Chip size="sm" variant="flat">
                            {event.current_registrations || 0}/
                            {event.max_capacity}
                          </Chip>
                          {event.is_cancelled && (
                            <Chip color="danger" size="sm">
                              Cancelled
                            </Chip>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => testGetSingleEvent(event.id)}
                        >
                          GET
                        </Button>
                        <Button
                          color="warning"
                          size="sm"
                          variant="flat"
                          onPress={() => {
                            setSelectedEvent(event);
                            setIsEditModalOpen(true);
                          }}
                        >
                          PUT
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => testCancelEvent(event.id)}
                        >
                          Cancel
                        </Button>
                        <Button
                          color="danger"
                          size="sm"
                          variant="flat"
                          onPress={() => testDeleteEvent(event.id)}
                        >
                          DELETE
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>

          <Divider />

          {/* Test Results Log */}
          <div>
            <h2 className="text-lg font-semibold text-dink-white mb-3">
              Test Results Log
            </h2>
            <Card className="bg-black/60 border border-dink-gray/30">
              <CardBody>
                <div className="font-mono text-xs space-y-1 max-h-64 overflow-auto">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-default-500">
                      {result}
                    </div>
                  ))}
                  {testResults.length === 0 && (
                    <div className="text-default-400">
                      No tests run yet. Click "Run All Tests" to start.
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Selected Event Details */}
          {selectedEvent && (
            <>
              <Divider />
              <div>
                <h2 className="text-lg font-semibold text-dink-white mb-3">
                  Selected Event Details
                </h2>
                <Card className="bg-black/20 border border-dink-lime/30">
                  <CardBody>
                    <pre className="text-xs text-default-500 overflow-auto">
                      {JSON.stringify(selectedEvent, null, 2)}
                    </pre>
                  </CardBody>
                </Card>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        size="2xl"
        onClose={() => setIsCreateModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader>Create New Event (POST)</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Title"
                value={formData.title}
                onValueChange={(value) =>
                  setFormData({ ...formData, title: value })
                }
              />
              <Select
                label="Event Type"
                selectedKeys={[formData.event_type]}
                onSelectionChange={(keys) =>
                  setFormData({
                    ...formData,
                    event_type: Array.from(keys)[0] as EventType,
                  })
                }
              >
                <SelectItem key="scramble">Scramble</SelectItem>
                <SelectItem key="dupr">DUPR</SelectItem>
                <SelectItem key="open_play">Open Play</SelectItem>
                <SelectItem key="tournament">Tournament</SelectItem>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Max Capacity"
                  type="number"
                  value={formData.max_capacity.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      max_capacity: parseInt(value) || 16,
                    })
                  }
                />
                <Input
                  label="Min Capacity"
                  type="number"
                  value={formData.min_capacity.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      min_capacity: parseInt(value) || 4,
                    })
                  }
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={testCreateEvent}>
              Create Event
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        size="2xl"
        onClose={() => setIsEditModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader>Update Event (PUT)</ModalHeader>
          <ModalBody>
            {selectedEvent && (
              <div className="space-y-4">
                <Input
                  defaultValue={selectedEvent.title}
                  label="Title"
                  onValueChange={(value) =>
                    setSelectedEvent({ ...selectedEvent, title: value })
                  }
                />
                <Input
                  defaultValue={selectedEvent.max_capacity.toString()}
                  label="Max Capacity"
                  type="number"
                  onValueChange={(value) =>
                    setSelectedEvent({
                      ...selectedEvent,
                      max_capacity: parseInt(value) || 16,
                    })
                  }
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={testUpdateEvent}>
              Update Event
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
