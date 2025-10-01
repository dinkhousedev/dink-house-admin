"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Pagination,
  Input,
  Select,
  SelectItem,
  Textarea,
  Card,
  CardBody,
  Spinner,
  Badge
} from "@heroui/react";
import { format } from "date-fns";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ContactInquiry {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  status: "new" | "in_progress" | "responded" | "resolved" | "closed" | "spam";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  responded_at?: string;
  assigned_to?: string;
  source?: string;
}

interface ContactResponse {
  id: string;
  inquiry_id: string;
  response_type: "email" | "phone" | "internal_note";
  subject?: string;
  message: string;
  created_at: string;
  responder_name?: string;
}

const statusColorMap = {
  new: "warning",
  in_progress: "primary",
  responded: "secondary",
  resolved: "success",
  closed: "default",
  spam: "danger"
} as const;

const priorityColorMap = {
  low: "default",
  medium: "primary",
  high: "warning",
  urgent: "danger"
} as const;

export default function ContactInquiriesTable() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [responses, setResponses] = useState<ContactResponse[]>([]);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [responseText, setResponseText] = useState("");
  const [updating, setUpdating] = useState(false);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const itemsPerPage = 10;

  // Fetch inquiries
  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, searchTerm]);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("contact_inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (searchTerm) {
        query = query.or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setInquiries(data || []);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch responses for selected inquiry
  const fetchResponses = async (inquiryId: string) => {
    try {
      const { data, error } = await supabase
        .from("contact_responses")
        .select("*")
        .eq("inquiry_id", inquiryId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error("Error fetching responses:", error);
    }
  };

  // View inquiry details
  const handleViewInquiry = async (inquiry: ContactInquiry) => {
    setSelectedInquiry(inquiry);
    await fetchResponses(inquiry.id);
    onOpen();
  };

  // Update inquiry status
  const handleStatusUpdate = async (inquiryId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "responded") {
        updateData.responded_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("contact_inquiries")
        .update(updateData)
        .eq("id", inquiryId);

      if (error) throw error;

      await fetchInquiries();
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry({ ...selectedInquiry, status: newStatus as any });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(false);
    }
  };

  // Send response
  const handleSendResponse = async () => {
    if (!selectedInquiry || !responseText.trim()) return;

    setUpdating(true);
    try {
      // Save response to database
      const { error: responseError } = await supabase
        .from("contact_responses")
        .insert({
          inquiry_id: selectedInquiry.id,
          response_type: "email",
          message: responseText,
          subject: `Re: ${selectedInquiry.subject || "Your inquiry"}`
        });

      if (responseError) throw responseError;

      // Update inquiry status
      await handleStatusUpdate(selectedInquiry.id, "responded");

      // Send email via API
      const response = await fetch("/api/send-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedInquiry.email,
          subject: `Re: ${selectedInquiry.subject || "Your inquiry"}`,
          message: responseText,
          inquiryId: selectedInquiry.id
        })
      });

      if (!response.ok) throw new Error("Failed to send email");

      // Refresh responses
      await fetchResponses(selectedInquiry.id);
      setResponseText("");
    } catch (error) {
      console.error("Error sending response:", error);
    } finally {
      setUpdating(false);
    }
  };

  // Paginated data
  const paginatedInquiries = inquiries.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(inquiries.length / itemsPerPage);

  return (
    <div className="w-full">
      {/* Header and Filters */}
      <div className="mb-6 flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Contact Inquiries</h2>

        <div className="flex gap-4">
          <Input
            placeholder="Search inquiries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />

          <Select
            label="Status Filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="max-w-xs"
          >
            <SelectItem key="all">All Status</SelectItem>
            <SelectItem key="new">New</SelectItem>
            <SelectItem key="in_progress">In Progress</SelectItem>
            <SelectItem key="responded">Responded</SelectItem>
            <SelectItem key="resolved">Resolved</SelectItem>
            <SelectItem key="closed">Closed</SelectItem>
            <SelectItem key="spam">Spam</SelectItem>
          </Select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center p-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <Table aria-label="Contact inquiries table">
            <TableHeader>
              <TableColumn>NAME</TableColumn>
              <TableColumn>EMAIL</TableColumn>
              <TableColumn>SUBJECT</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>PRIORITY</TableColumn>
              <TableColumn>DATE</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {paginatedInquiries.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {inquiry.first_name} {inquiry.last_name}
                      </div>
                      {inquiry.company && (
                        <div className="text-sm text-gray-500">{inquiry.company}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{inquiry.email}</TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {inquiry.subject || "No subject"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={statusColorMap[inquiry.status]}
                      size="sm"
                      variant="flat"
                    >
                      {inquiry.status.replace("_", " ")}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={priorityColorMap[inquiry.priority]}
                      size="sm"
                      variant="dot"
                    >
                      {inquiry.priority}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {format(new Date(inquiry.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => handleViewInquiry(inquiry)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                total={totalPages}
                page={page}
                onChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Contact Inquiry Details
                {selectedInquiry?.status === "new" && (
                  <Badge color="warning" size="sm">New</Badge>
                )}
              </ModalHeader>
              <ModalBody>
                {selectedInquiry && (
                  <div className="space-y-6">
                    {/* Contact Info */}
                    <Card>
                      <CardBody>
                        <h4 className="font-semibold mb-3">Contact Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-medium">
                              {selectedInquiry.first_name} {selectedInquiry.last_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{selectedInquiry.email}</p>
                          </div>
                          {selectedInquiry.phone && (
                            <div>
                              <p className="text-sm text-gray-500">Phone</p>
                              <p className="font-medium">{selectedInquiry.phone}</p>
                            </div>
                          )}
                          {selectedInquiry.company && (
                            <div>
                              <p className="text-sm text-gray-500">Company</p>
                              <p className="font-medium">{selectedInquiry.company}</p>
                            </div>
                          )}
                        </div>
                      </CardBody>
                    </Card>

                    {/* Message */}
                    <Card>
                      <CardBody>
                        <h4 className="font-semibold mb-3">Message</h4>
                        {selectedInquiry.subject && (
                          <p className="font-medium mb-2">Subject: {selectedInquiry.subject}</p>
                        )}
                        <p className="whitespace-pre-wrap">{selectedInquiry.message}</p>
                        <div className="mt-4 flex gap-4 text-sm text-gray-500">
                          <span>Received: {format(new Date(selectedInquiry.created_at), "PPp")}</span>
                          {selectedInquiry.source && <span>Source: {selectedInquiry.source}</span>}
                        </div>
                      </CardBody>
                    </Card>

                    {/* Status Update */}
                    <Card>
                      <CardBody>
                        <h4 className="font-semibold mb-3">Status Management</h4>
                        <div className="flex gap-2">
                          <Select
                            label="Update Status"
                            value={selectedInquiry.status}
                            onChange={(e) => handleStatusUpdate(selectedInquiry.id, e.target.value)}
                            className="max-w-xs"
                            isDisabled={updating}
                          >
                            <SelectItem key="new">New</SelectItem>
                            <SelectItem key="in_progress">In Progress</SelectItem>
                            <SelectItem key="responded">Responded</SelectItem>
                            <SelectItem key="resolved">Resolved</SelectItem>
                            <SelectItem key="closed">Closed</SelectItem>
                            <SelectItem key="spam">Spam</SelectItem>
                          </Select>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Response Section */}
                    <Card>
                      <CardBody>
                        <h4 className="font-semibold mb-3">Send Response</h4>
                        <Textarea
                          label="Response Message"
                          placeholder="Type your response here..."
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          minRows={4}
                          className="mb-3"
                        />
                        <Button
                          color="primary"
                          onPress={handleSendResponse}
                          isLoading={updating}
                          isDisabled={!responseText.trim()}
                        >
                          Send Email Response
                        </Button>
                      </CardBody>
                    </Card>

                    {/* Previous Responses */}
                    {responses.length > 0 && (
                      <Card>
                        <CardBody>
                          <h4 className="font-semibold mb-3">Response History</h4>
                          <div className="space-y-3">
                            {responses.map((response) => (
                              <div key={response.id} className="border-l-2 border-gray-200 pl-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm text-gray-500">
                                      {response.response_type} • {format(new Date(response.created_at), "PPp")}
                                    </p>
                                    {response.subject && (
                                      <p className="font-medium">{response.subject}</p>
                                    )}
                                    <p className="mt-2 whitespace-pre-wrap">{response.message}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardBody>
                      </Card>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}