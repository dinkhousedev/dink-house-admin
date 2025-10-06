"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input, Textarea } from "@heroui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { Icon } from "@iconify/react";

// ============================================================================
// TYPES
// ============================================================================

interface Email {
  id: string;
  subject: string;
  html_content: string;
  text_content: string;
  status: "draft" | "reviewed" | "scheduled" | "sending" | "sent" | "failed";
  created_at: string;
  sent_at?: string;
  source_prompt?: string;
}

interface CampaignOverview {
  totalCampaigns: number;
  totalRecipients: number;
  totalOpens: number;
  totalClicks: number;
  avgOpenRate: number;
  avgClickRate: number;
  activeSubscribers: number;
}

interface EmailAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalFailed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

interface TopPerformer {
  id: string;
  subject: string;
  sent_at: string;
  opens: number;
  clicks: number;
  open_rate: number;
  click_rate: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EmailCampaignsPage() {
  // State
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Analytics state
  const [campaignOverview, setCampaignOverview] =
    useState<CampaignOverview | null>(null);
  const [emailAnalytics, setEmailAnalytics] = useState<EmailAnalytics | null>(
    null
  );
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);

  // Generation state
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [generationTone, setGenerationTone] = useState("enthusiastic");
  const [generationLoading, setGenerationLoading] = useState(false);

  // Edit state
  const [editSubject, setEditSubject] = useState("");
  const [editHtmlContent, setEditHtmlContent] = useState("");
  const [editTextContent, setEditTextContent] = useState("");

  // Modals
  const {
    isOpen: isPreviewOpen,
    onOpen: onPreviewOpen,
    onClose: onPreviewClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isSendOpen,
    onOpen: onSendOpen,
    onClose: onSendClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isGenerateOpen,
    onOpen: onGenerateOpen,
    onClose: onGenerateClose,
  } = useDisclosure();

  const itemsPerPage = 10;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        status: statusFilter,
        search: searchQuery,
      });

      const response = await fetch(`/api/marketing/emails?${params}`);
      const data = await response.json();

      if (data.success) {
        setEmails(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchQuery]);

  const fetchCampaignOverview = useCallback(async () => {
    try {
      const response = await fetch("/api/marketing/analytics/overview");
      const data = await response.json();
      if (data.success) {
        setCampaignOverview(data.data);
      }
    } catch (error) {
      console.error("Error fetching campaign overview:", error);
    }
  }, []);

  const fetchEmailAnalytics = useCallback(async () => {
    try {
      const response = await fetch("/api/marketing/analytics/emails");
      const data = await response.json();
      if (data.success) {
        setEmailAnalytics(data.data.aggregateStats);
      }
    } catch (error) {
      console.error("Error fetching email analytics:", error);
    }
  }, []);

  const fetchTopPerformers = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/marketing/analytics/top-performers?limit=5"
      );
      const data = await response.json();
      if (data.success) {
        setTopPerformers(data.data);
      }
    } catch (error) {
      console.error("Error fetching top performers:", error);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  useEffect(() => {
    fetchCampaignOverview();
    fetchEmailAnalytics();
    fetchTopPerformers();
  }, [fetchCampaignOverview, fetchEmailAnalytics, fetchTopPerformers]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const handleGenerateEmail = async () => {
    try {
      setGenerationLoading(true);
      const response = await fetch("/api/marketing/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: generationPrompt,
          tone: generationTone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGenerationPrompt("");
        onGenerateClose();
        fetchEmails();
        alert("Email generated successfully!");
      } else {
        alert("Failed to generate email: " + data.error);
      }
    } catch (error) {
      console.error("Error generating email:", error);
      alert("Failed to generate email");
    } finally {
      setGenerationLoading(false);
    }
  };

  const handlePreview = async (email: Email) => {
    setSelectedEmail(email);
    onPreviewOpen();
  };

  const handleEdit = (email: Email) => {
    setSelectedEmail(email);
    setEditSubject(email.subject);
    setEditHtmlContent(email.html_content);
    setEditTextContent(email.text_content);
    onEditOpen();
  };

  const handleSaveEdit = async () => {
    if (!selectedEmail) return;

    try {
      const response = await fetch(`/api/marketing/emails/${selectedEmail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: editSubject,
          html_content: editHtmlContent,
          text_content: editTextContent,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onEditClose();
        fetchEmails();
        alert("Email updated successfully!");
      } else {
        alert("Failed to update email: " + data.error);
      }
    } catch (error) {
      console.error("Error updating email:", error);
      alert("Failed to update email");
    }
  };

  const handleDelete = (email: Email) => {
    setSelectedEmail(email);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (!selectedEmail) return;

    try {
      const response = await fetch(`/api/marketing/emails/${selectedEmail.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        onDeleteClose();
        fetchEmails();
        alert("Email deleted successfully!");
      } else {
        alert("Failed to delete email: " + data.error);
      }
    } catch (error) {
      console.error("Error deleting email:", error);
      alert("Failed to delete email");
    }
  };

  const handleSend = (email: Email) => {
    setSelectedEmail(email);
    onSendOpen();
  };

  const confirmSend = async () => {
    if (!selectedEmail) return;

    try {
      const response = await fetch(
        `/api/marketing/emails/${selectedEmail.id}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (data.success) {
        onSendClose();
        fetchEmails();
        alert(data.message);
      } else {
        alert("Failed to send email: " + data.error);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email");
    }
  };

  // ============================================================================
  // FORMATTERS
  // ============================================================================

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "default";
      case "reviewed":
        return "primary";
      case "sending":
        return "warning";
      case "sent":
        return "success";
      case "failed":
        return "danger";
      default:
        return "default";
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-1 flex-col gap-6 2xl:gap-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dink-white">
            Email Campaigns
          </h1>
          <p className="text-sm text-default-500">
            AI-powered email marketing with SendGrid analytics
          </p>
        </div>
        <Button
          className="min-w-[180px]"
          color="primary"
          radius="lg"
          size="lg"
          startContent={<Icon icon="solar:magic-stick-3-linear" width={20} />}
          onPress={onGenerateOpen}
        >
          Generate Email
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Campaign Overview */}
        <Card
          className="border border-dink-gray/70 bg-black/40"
          radius="lg"
          shadow="lg"
        >
          <CardBody className="gap-4">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-[#141414] p-3">
                <Icon
                  className="text-dink-lime"
                  icon="solar:mailbox-linear"
                  width={22}
                />
              </div>
              <Chip color="primary" size="sm" variant="flat">
                {campaignOverview?.totalCampaigns || 0} sent
              </Chip>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-default-500">
                Campaign Overview
              </p>
              <p className="text-2xl font-semibold text-dink-white">
                {campaignOverview?.avgOpenRate.toFixed(1) || "0.0"}%
              </p>
              <p className="text-xs text-dink-lime">Average open rate</p>
            </div>
          </CardBody>
        </Card>

        {/* Email Analytics */}
        <Card
          className="border border-dink-gray/70 bg-black/40"
          radius="lg"
          shadow="lg"
        >
          <CardBody className="gap-4">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-[#141414] p-3">
                <Icon
                  className="text-dink-lime"
                  icon="solar:chart-2-linear"
                  width={22}
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-default-500">
                Email Analytics
              </p>
              <p className="text-2xl font-semibold text-dink-white">
                {emailAnalytics?.deliveryRate.toFixed(1) || "0.0"}%
              </p>
              <p className="text-xs text-default-400">
                {emailAnalytics?.totalSent.toLocaleString() || 0} emails sent
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Engagement */}
        <Card
          className="border border-dink-gray/70 bg-black/40"
          radius="lg"
          shadow="lg"
        >
          <CardBody className="gap-4">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-[#141414] p-3">
                <Icon
                  className="text-dink-lime"
                  icon="solar:cursor-square-linear"
                  width={22}
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-default-500">
                Click Rate
              </p>
              <p className="text-2xl font-semibold text-dink-white">
                {emailAnalytics?.clickRate.toFixed(1) || "0.0"}%
              </p>
              <p className="text-xs text-default-400">
                {emailAnalytics?.totalClicked.toLocaleString() || 0} clicks
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Subscribers */}
        <Card
          className="border border-dink-gray/70 bg-black/40"
          radius="lg"
          shadow="lg"
        >
          <CardBody className="gap-4">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-[#141414] p-3">
                <Icon
                  className="text-dink-lime"
                  icon="solar:users-group-rounded-linear"
                  width={22}
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-default-500">
                Active Subscribers
              </p>
              <p className="text-2xl font-semibold text-dink-white">
                {campaignOverview?.activeSubscribers.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-dink-lime">verified & active</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <Card
          className="border border-dink-gray/80 bg-[#0C0C0C]/90"
          radius="lg"
        >
          <CardHeader>
            <div>
              <p className="text-athletic text-xs text-default-500">
                Best Performing
              </p>
              <h2 className="text-xl font-semibold text-dink-white">
                Top Email Campaigns
              </h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {topPerformers.map((performer) => (
                <div
                  key={performer.id}
                  className="flex items-center justify-between rounded-lg border border-dink-gray/60 bg-black/30 p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium text-dink-white">
                      {performer.subject}
                    </p>
                    <p className="text-xs text-default-400">
                      {formatDate(performer.sent_at)}
                    </p>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-dink-lime">
                        {performer.open_rate}%
                      </p>
                      <p className="text-xs text-default-500">Opens</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-dink-lime">
                        {performer.click_rate}%
                      </p>
                      <p className="text-xs text-default-500">Clicks</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Emails Table */}
      <Card
        className="border border-dink-gray/80 bg-[#0C0C0C]/90"
        radius="lg"
      >
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-athletic text-xs text-default-500">
              Email Management
            </p>
            <h2 className="text-xl font-semibold text-dink-white">
              All Campaigns
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              classNames={{
                inputWrapper:
                  "border border-dink-gray/60 bg-black/30 data-[hover=true]:bg-black/40",
              }}
              placeholder="Search by subject..."
              startContent={
                <Icon
                  className="text-default-500"
                  icon="solar:magnifer-linear"
                  width={18}
                />
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select
              className="min-w-[150px]"
              classNames={{
                trigger:
                  "border border-dink-gray/60 bg-black/30 data-[hover=true]:bg-black/40",
              }}
              placeholder="Filter by status"
              selectedKeys={[statusFilter]}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <SelectItem key="all">
                All Status
              </SelectItem>
              <SelectItem key="draft">
                Draft
              </SelectItem>
              <SelectItem key="sent">
                Sent
              </SelectItem>
              <SelectItem key="sending">
                Sending
              </SelectItem>
              <SelectItem key="failed">
                Failed
              </SelectItem>
            </Select>
          </div>
        </CardHeader>
        <CardBody>
          <Table
            aria-label="Email campaigns table"
            classNames={{
              wrapper: "bg-transparent shadow-none",
              th: "bg-[#141414] text-default-500 text-xs uppercase tracking-wider",
              td: "text-sm",
            }}
            isStriped
          >
            <TableHeader>
              <TableColumn>SUBJECT</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>CREATED</TableColumn>
              <TableColumn>SENT</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={
                loading ? "Loading emails..." : "No campaigns found"
              }
              items={emails}
            >
              {(email) => (
                <TableRow key={email.id}>
                  <TableCell className="font-medium text-dink-white">
                    {email.subject}
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(email.status)}
                      size="sm"
                      variant="flat"
                    >
                      {email.status}
                    </Chip>
                  </TableCell>
                  <TableCell className="text-default-400">
                    {formatDate(email.created_at)}
                  </TableCell>
                  <TableCell className="text-default-400">
                    {email.sent_at ? formatDate(email.sent_at) : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handlePreview(email)}
                      >
                        <Icon
                          className="text-default-500"
                          icon="solar:eye-linear"
                          width={18}
                        />
                      </Button>
                      {["draft", "failed"].includes(email.status) && (
                        <>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleEdit(email)}
                          >
                            <Icon
                              className="text-primary"
                              icon="solar:pen-linear"
                              width={18}
                            />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleSend(email)}
                          >
                            <Icon
                              className="text-success"
                              icon="solar:plain-2-linear"
                              width={18}
                            />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleDelete(email)}
                          >
                            <Icon
                              className="text-danger"
                              icon="solar:trash-bin-trash-linear"
                              width={18}
                            />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                classNames={{
                  cursor: "bg-dink-gradient text-dink-black",
                }}
                page={currentPage}
                showControls
                total={totalPages}
                onChange={setCurrentPage}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* ========================================================================
          MODALS
          ======================================================================== */}

      {/* Generate Email Modal */}
      <Modal
        isOpen={isGenerateOpen}
        size="2xl"
        onClose={onGenerateClose}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Icon
                className="text-dink-lime"
                icon="solar:magic-stick-3-linear"
                width={24}
              />
              <span>Generate AI Email</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Textarea
                label="Email Prompt"
                labelPlacement="outside"
                placeholder="e.g., Write a weekly pickleball tips email about improving serves"
                value={generationPrompt}
                onChange={(e) => setGenerationPrompt(e.target.value)}
              />
              <Select
                label="Tone"
                labelPlacement="outside"
                placeholder="Select tone"
                selectedKeys={[generationTone]}
                onChange={(e) => setGenerationTone(e.target.value)}
              >
                <SelectItem key="enthusiastic">
                  Enthusiastic
                </SelectItem>
                <SelectItem key="professional">
                  Professional
                </SelectItem>
                <SelectItem key="casual">
                  Casual
                </SelectItem>
                <SelectItem key="motivational">
                  Motivational
                </SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onGenerateClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              isLoading={generationLoading}
              onPress={handleGenerateEmail}
            >
              Generate
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        size="4xl"
        onClose={onPreviewClose}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Icon
                className="text-dink-lime"
                icon="solar:eye-linear"
                width={24}
              />
              <span>Email Preview</span>
            </div>
          </ModalHeader>
          <ModalBody>
            {selectedEmail && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-default-500">
                    Subject:
                  </p>
                  <p className="text-lg text-dink-white">
                    {selectedEmail.subject}
                  </p>
                </div>
                <div className="h-[600px] overflow-auto rounded-lg border border-dink-gray/60 bg-white">
                  <iframe
                    className="h-full w-full"
                    srcDoc={selectedEmail.html_content}
                    title="Email Preview"
                  />
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onPreviewClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        size="4xl"
        onClose={onEditClose}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Icon
                className="text-dink-lime"
                icon="solar:pen-linear"
                width={24}
              />
              <span>Edit Email</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Subject"
                labelPlacement="outside"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
              />
              <Textarea
                label="HTML Content"
                labelPlacement="outside"
                minRows={10}
                value={editHtmlContent}
                onChange={(e) => setEditHtmlContent(e.target.value)}
              />
              <Textarea
                label="Text Content"
                labelPlacement="outside"
                minRows={5}
                value={editTextContent}
                onChange={(e) => setEditTextContent(e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onEditClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSaveEdit}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Send Confirmation Modal */}
      <Modal isOpen={isSendOpen} onClose={onSendClose}>
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Icon
                className="text-success"
                icon="solar:plain-2-linear"
                width={24}
              />
              <span>Send Email Campaign</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-default-400">
              Are you sure you want to send this email to{" "}
              <strong className="text-dink-lime">
                {campaignOverview?.activeSubscribers.toLocaleString()}
              </strong>{" "}
              active subscribers?
            </p>
            {selectedEmail && (
              <div className="mt-4 rounded-lg border border-dink-gray/60 bg-black/30 p-4">
                <p className="text-sm font-semibold text-default-500">
                  Subject:
                </p>
                <p className="text-dink-white">{selectedEmail.subject}</p>
              </div>
            )}
            <p className="text-xs text-default-500">
              Each email will be personalized with the subscriber&apos;s first
              name.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onSendClose}>
              Cancel
            </Button>
            <Button color="success" onPress={confirmSend}>
              Send Now
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Icon
                className="text-danger"
                icon="solar:trash-bin-trash-linear"
                width={24}
              />
              <span>Delete Email</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-default-400">
              Are you sure you want to delete this email? This action cannot be
              undone.
            </p>
            {selectedEmail && (
              <div className="mt-4 rounded-lg border border-danger/60 bg-danger/10 p-4">
                <p className="text-sm font-semibold text-default-500">
                  Subject:
                </p>
                <p className="text-dink-white">{selectedEmail.subject}</p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteClose}>
              Cancel
            </Button>
            <Button color="danger" onPress={confirmDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
